import net from "net"
import CoBraSU from "../../lib/cobrasu-0.1.0.js"
import Supeer from "../supeer.js"
import Buffered from "../utils/buffered.js"
import Discardable from "../utils/discardable.js"
import Eventual from "../utils/eventual.js"

/**
 * A signaling server that can be used by a SignalCourier
 */
export class SignalServer implements Eventual {
	public readonly events: CoBraSU.Core.Dispatcher<Eventual.Events> = new CoBraSU.Core.Dispatcher("discard", "ready")
	public readonly port: number
	private connections: Set<SignalServer.Connection> = new Set()
	private server: net.Server
	readonly #ready: Promise<void>

	/**
	 * @param port Port to host the signaling server on
	 */
	public constructor(port: number) {
		this.port = port

		//Create the server
		this.server = net.createServer()
		this.server.on("close", this.#onServerClose)
		this.server.on("connection", this.#onServerConnection)

		//Ensure the server is listening
		this.#ready = this.setup()
	}

	public async ready(): Promise<void> {
		await this.#ready
	}

	public discard(): void {
		Supeer.console(this).log("Stopping...")

		//Delete event handlers
		this.server.removeListener("close", this.#onServerClose)
		this.server.removeListener("connection", this.#onServerConnection)

		//Close connections
		for(let connection of [...this.connections])
			connection.discard()

		//Notify discard
		this.events.fire("discard")

		//Close the server itself
		this.server.close()
		this.server = null
	}

	public toString(): string {
		if(!this.server)
			return "*SignalServer"

		return `SignalServer[port=${this.port}]`
	}

	private async setup(): Promise<void> {
		await CoBraSU.Core.promisify<[number, string, () => void]>(
			this.server,
			this.server.listen,
			this.port,
			""
		)

		Supeer.console(this).log("Started!")

		//Notify ready
		this.events.fire("ready")
	}

	#onServerClose = (): void => this.discard()
	#onServerConnection = (socket: net.Socket) => {
		let connection = new SignalServer.Connection(this, socket)

		connection.events.once("discard", () => {
			Supeer.console(this).log(`Disconnecting '${connection}'`)
			this.connections.delete(connection)
		})

		this.connections.add(connection)
		Supeer.console(this).log(`Connected '${connection}'`)
	}
}

export namespace SignalServer {
	/**
	 * Represents a client connected to the signal server
	 */
	export class Connection implements Discardable {
		public readonly events: CoBraSU.Core.Dispatcher<Discardable.Events>
		private server: SignalServer
		private reader: Buffered.Reader
		#socket: net.Socket

		/**
		 * @param server Signal server instance
		 * @param socket Socket for the client
		 */
		public constructor(server: SignalServer, socket: net.Socket) {
			this.events = new CoBraSU.Core.Dispatcher("discard")
			this.server = server
			this.#socket = socket
			this.reader = new Buffered.Reader(input => {
				//Ensure that data to broadcast is sent in JSON format
				try {
					JSON.parse(input)
				} catch(e) {
					//If not, disconnect the socket
					Supeer.console().error(`Received invalid JSON from '${this}'`)
					Supeer.console().error(e)
					this.discard()
	
					return
				}
	
				//Send all clients the broadcasted message
				Buffered.write(input, [...this.server["connections"]].map(c => chunk => c.socket.write(chunk)))
			})

			//Register event listeners
			this.socket.on("data", this.#onSocketData)
			this.socket.on("end", this.#onSocketEnd)
			this.socket.on("close", this.#onSocketClose)
			this.socket.on("error", this.#onSocketError)
		}

		public get socket(): net.Socket {
			return this.#socket
		}

		public discard(): void {
			//Remove event listeners
			this.socket.removeListener("data", this.#onSocketData)
			this.socket.removeListener("end", this.#onSocketEnd)
			this.socket.removeListener("close", this.#onSocketClose)
			this.socket.removeListener("error", this.#onSocketError)

			//Notify discard
			this.events.fire("discard")

			//Close the socket
			this.socket.destroy()
			this.#socket = null
		}

		public toString(): string {
			let address = this.socket.remoteAddress
			let port = this.socket.remotePort

			return (address && port) ? `${address}:${port}` : "unknown"
		}

		#onSocketData = (data: Buffer) => this.reader.read(data)
		#onSocketEnd = () => this.discard()
		#onSocketClose = (hadError: boolean) => this.discard()
		#onSocketError = (error: Error) => {
			Supeer.console().error(error.message)
			this.discard()
		}
	}
}

export default SignalServer