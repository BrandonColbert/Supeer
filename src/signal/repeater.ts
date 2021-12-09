import net from "net"
import CoBraSU from "../../lib/cobrasu-0.1.0.js"
import Supeer from "../supeer.js"
import Eventual from "../utils/eventual.js"
import Peer from "../peers/peer.js"
import Guest from "../peers/guest.js"
import Host from "../peers/host.js"
import Buffered from "../utils/buffered.js"
import Discardable from "../utils/discardable.js"

/**
 * Allows an external application to use P2P communication through a local TCP server
 * 
 * Messages written to this server will be repeated by the bound peer to its host/guests
 */
export class Repeater implements Eventual {
	public readonly events: CoBraSU.Core.Dispatcher<Eventual.Events> = new CoBraSU.Core.Dispatcher("discard", "ready")
	public readonly port: number
	private connections: Set<Repeater.Connection> = new Set()
	private server: net.Server
	private peer: Peer
	readonly #ready: Promise<void>

	/**
	 * The port to start the local server on
	 * @param peer Enables messages sent to this peer to be repeated across all listening applications
	 * @param port Server port
	 */
	public constructor(peer: Peer, port: number) {
		this.peer = peer
		this.port = port

		//Create the server used to repeat peer events
		this.server = net.createServer()
		this.server.on("close", this.#onServerClose)
		this.server.on("connection", this.#onServerConnection)

		//Ensure the local server is active
		this.#ready = this.setup()
	}

	public async ready(): Promise<void> {
		await this.#ready
	}

	public discard(): void {
		Supeer.console(this).log("Stopping...")

		//Remove peer events
		if(this.peer instanceof Guest) {
			this.peer.events.forget("receive", this.#onGuestReceive)
			this.peer.events.forget("connect", this.#onGuestConnect)
			this.peer.events.forget("disconnect", this.#onGuestDisconect)
		} else if(this.peer instanceof Host) {
			this.peer.events.forget("receive", this.#onHostReceive)
			this.peer.events.forget("connect", this.#onHostConnect)
			this.peer.events.forget("disconnect", this.#onHostDisconect)
		}

		//Disconnect all connections
		for(let connection of [...this.connections])
			connection.discard()

		//Notify discard
		this.events.fire("discard")

		//Stop the server
		this.server.close()
		this.server = null
	}

	public toString(): string {
		if(!this.server)
			return "*Repeater"

		return `Repeater[port=${this.port}]`
	}

	private async setup(): Promise<void> {
		//Wait for the local server to turn on
		await CoBraSU.Core.promisify<[number, string, () => void]>(this.server, this.server.listen, this.port, "localhost")

		//Listen to peer events to repeat them on the local server
		if(this.peer instanceof Guest) {
			this.peer.events.on("receive", this.#onGuestReceive)
			this.peer.events.on("connect", this.#onGuestConnect)
			this.peer.events.on("disconnect", this.#onGuestDisconect)
		} else if(this.peer instanceof Host) {
			this.peer.events.on("receive", this.#onHostReceive)
			this.peer.events.on("connect", this.#onHostConnect)
			this.peer.events.on("disconnect", this.#onHostDisconect)
		}

		Supeer.console(this).log("Started!")

		//Notify ready
		this.events.fire("ready")
	}

	private send(info: {message: string, ids?: string[]}): void {
		if(this.peer instanceof Host)
			this.peer.send(info.message, info.ids)
		else
			this.peer.send(info.message)
	}

	private receive(info: {type: string, id?: string, message?: string}): void {
		for(let connection of this.connections)
			connection.socket.write(`${JSON.stringify(info)}\n`)
	}

	#onServerClose = (): void => this.discard()
	#onServerConnection = (socket: net.Socket) => {
		let connection = new Repeater.Connection(this, socket)

		connection.events.once("discard", () => {
			Supeer.console(this).log(`Disconnecting client '${connection}'`)
			this.connections.delete(connection)
		})

		this.connections.add(connection)
		Supeer.console(this).log(`Client '${connection}' connected`)
	}

	#onGuestDiscard = (e: Discardable.Events["discard"]): void => this.discard()
	#onGuestReceive = (e: Guest.Events["receive"]): void => this.receive({type: "receive", message: e.message})

	#onGuestConnect = (e: Guest.Events["connect"]): void => {
		this.receive({type: "connect"})
		Supeer.console(this).log("Peer connected")
	}

	#onGuestDisconect = (e: Guest.Events["disconnect"]): void => {
		this.receive({type: "disconnect"})
		Supeer.console(this).log("Peer disconnected")
	}

	#onHostReceive = (e: Host.Events["receive"]): void => this.receive({type: "receive", id: e.id, message: e.message})

	#onHostConnect = (e: Host.Events["connect"]): void => {
		this.receive({type: "connect", id: e.id})
		Supeer.console(this).log(`Connected peer '${e.id}'`)
	}

	#onHostDisconect = (e: Host.Events["disconnect"]): void => {
		this.receive({type: "disconnect", id: e.id})
		Supeer.console(this).log(`Disconnected peer '${e.id}'`)
	}
}

export namespace Repeater {
	export class Connection implements Discardable {
		public readonly events: CoBraSU.Core.Dispatcher<Discardable.Events> = new CoBraSU.Core.Dispatcher("discard")
		private reader: Buffered.Reader
		#socket: net.Socket

		public constructor(repeater: Repeater, socket: net.Socket) {
			this.#socket = socket
			this.reader = new Buffered.Reader(line => {
				let info: {message: string, ids?: string[]}

				try {
					info = JSON.parse(line)
				} catch(e) {
					Supeer.console().error(`Received invalid JSON from '${this}'`)
					Supeer.console().error(e)

					this.discard()
					return
				}

				repeater["send"](info)
			})

			socket.on("data", this.#onSocketData)
			socket.on("end", this.#onSocketEnd)
			socket.on("close", this.#onSocketClose)
			socket.on("error", this.#onSocketError)
		}

		public get socket(): net.Socket {
			return this.#socket
		}

		public discard(): void {
			this.#socket.on("data", this.#onSocketData)
			this.#socket.on("end", this.#onSocketEnd)
			this.#socket.on("close", this.#onSocketClose)
			this.#socket.on("error", this.#onSocketError)

			this.events.fire("discard")

			this.#socket.destroy()
			this.#socket = null
		}

		public toString(): string {
			return `${this.socket.address()}`
		}

		#onSocketData = (data: Buffer): void => this.reader.read(data)
		#onSocketEnd = (): void => this.discard()
		#onSocketClose = (hadError: boolean): void => this.discard()
		#onSocketError = (error: Error): void => {
			Supeer.console().error(error.message)
			this.discard()
		}
	}
}

export default Repeater