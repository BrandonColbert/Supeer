import net from "net"
import CoBraSU from "../../../lib/cobrasu-0.1.0.js"
import Supeer from "../../supeer.js"
import Eventual from "../../utils/eventual.js"
import Courier from "../../couriers/courier.js"
import Guest from "../../peers/guest.js"
import Proxy from "../proxy.js"
import _Connection from "./client/connection.js"
import Lobby from "../lobby.js"

/**
 * Uses WebRTC to act as a proxy for local clients connected to a remote server
 */
export class Client implements Eventual {
	public readonly events: CoBraSU.Core.Dispatcher<Eventual.Events> = new CoBraSU.Core.Dispatcher("ready", "discard")
	public readonly port: number
	public readonly dest: Proxy.SocketAddress
	private readonly connections: Map<string, Client.Connection> = new Map()
	private readonly courier: Courier
	private server: net.Server
	private guest: Guest
	readonly #ready: Promise<void>

	/**
	 * @param courier Courier to connect peers with
	 * @param port Port to run the proxy server on
	 * @param dest Address and port of the actual server
	 */
	public constructor(courier: Courier, port: number, dest: Proxy.SocketAddress) {
		this.courier = courier
		this.port = port
		this.dest = dest

		//Register event listeners
		courier.events.on("discard", this.#onCourierDiscard)

		this.#ready = this.setup()
	}

	public async ready(): Promise<void> {
		await this.#ready
	}

	public discard(): void {
		Supeer.console(this).log("Severing...")

		//Remove event listeners
		this.courier.events.forget("discard", this.#onCourierDiscard)
		this.guest.events.forget("receive", this.#onGuestReceive)
		this.guest.events.forget("disconnect", this.#onGuestDisconnect)

		//Remove all connections
		for(let connection of [...this.connections.values()])
			connection.discard()

		//Notify discard
		this.events.fire("discard")

		//Disconnect from host
		this.guest.disconnect()
		this.guest = null

		//Destroy the local server
		this.server.close()
		this.server = null
	}

	public toString(): string {
		if(!this.server)
			return "*ProxyClient"

		let {address, port} = this.dest
		return `ProxyClient[port=${this.port}, dest=${address}:${port}]`
	}

	private async setup(): Promise<void> {
		//Prepare guest to receive remote messages
		this.guest = new Guest()
		this.guest.events.on("receive", this.#onGuestReceive)
		this.guest.events.on("disconnect", this.#onGuestDisconnect)

		//Attempt to join the remote server's lobby
		const code = `${this.dest.address}:${this.dest.port}`
		await Lobby.join(this.courier, this.guest, code)

		//Create the local server that will be bound to the remote server
		this.server = net.createServer(socket => {
			let connection = new Client.Connection(this.guest, socket)

			connection.events.once("discard", () => {
				Supeer.console(this).log(`Disconnecting '${connection}'`)

				this.connections.delete(connection.id)

				//Sending an id with no data serves to indicate disconnection
				this.guest.send(JSON.stringify({id: connection.id}))
			})

			this.connections.set(connection.id, connection)

			Supeer.console(this).log(`Connected '${connection}'`)
		})

		//Wait for the local server to activate
		await CoBraSU.Core.promisify<[number, () => void]>(this.server, this.server.listen, this.port)

		Supeer.console(this).log("Connected!")

		this.events.fire("ready")
	}

	#onCourierDiscard = () => this.discard()

	#onGuestDisconnect = (e: Guest.Events["disconnect"]): void => this.discard()

	#onGuestReceive = (e: Guest.Events["receive"]): void => {
		let info: {id: string, data: number[]}

		//Get info from message if possible
		try {
			info = JSON.parse(e.message)
		} catch(err) {
			Supeer.console(this).error(`Received invalid JSON\n${e.message}`)

			this.discard()
			return
		}

		//Convert message data to buffer
		let buffer = Buffer.from(info.data)

		//Find the target of the message if possible
		let connection = this.connections.get(info.id)

		if(!connection) {
			Supeer.console(this).error(`Received message targeting non-extant connection '${info.id}'`)

			// this.discard()
			return
		}

		//Send the message data to the target client connection
		connection.read(buffer)
	}
}

export namespace Client {
	export type Connection = _Connection
	export const Connection = _Connection
}

export default Client