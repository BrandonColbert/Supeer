import net from "net"
import CoBraSU from "../../../lib/cobrasu-0.1.0.js"
import Courier from "../../couriers/courier.js"
import Eventual from "../../utils/eventual.js"
import Host from "../../peers/host.js"
import Supeer from "../../supeer.js"
import Lobby from "../lobby.js"
import Proxy from "../proxy.js"
import _Connection from "./server/connection.js"

/**
 * Uses WebRTC to act as a proxy for local server connected to clusters of remote clients
 */
export class Server implements Eventual {
	public readonly events: CoBraSU.Core.Dispatcher<Eventual.Events> = new CoBraSU.Core.Dispatcher("ready", "discard")
	public readonly port: number
	private readonly clusters: Map<string, Map<string, Server.Connection>> = new Map()
	private readonly courier: Courier
	private lobby: Lobby
	private host: Host
	readonly #ready: Promise<void>

	/**
	 * @param courier Courier to connect peers with
	 * @param port Port which the local server is running on
	 */
	public constructor(courier: Courier, port: number) {
		this.port = port
		this.courier = courier

		//Register event listeners
		courier.events.on("discard", this.#onCourierDiscard)

		this.#ready = this.setup()
	}

	public async ready(): Promise<void> {
		await this.#ready
	}

	public discard(): void {
		Supeer.console(this).log(`Severing from local server '${this.lobby.code}'...`)

		//Remove event listeners
		this.courier.events.forget("discard", this.#onCourierDiscard)
		this.host.events.forget("receive", this.#onHostReceive)
		this.host.events.forget("connect", this.#onHostConnect)
		this.host.events.forget("disconnect", this.#onHostDisconnect)

		//Remove all connections
		for(let connections of [...this.clusters.values()])
			for(let connection of [...connections.values()])
				connection.discard()

		this.clusters.clear()

		//Notify discard
		this.events.fire("discard")
		
		//Disconnect all guests
		this.host.disconnect()
		this.host = null
		
		//Destroy the lobby
		this.lobby.close()
		this.lobby = null
	}

	public toString(): string {
		return `ProxyServer[port=${this.port}]`
	}

	private async setup(): Promise<void> {
		let externalAddress = await Proxy.getExternalAddress()

		//Create the host and listen for events
		this.host = new Host()
		this.host.events.on("receive", this.#onHostReceive)
		this.host.events.on("connect", this.#onHostConnect)
		this.host.events.on("disconnect", this.#onHostDisconnect)

		//Create a lobby listening for requests to this device's external ip and specified proxy port
		this.lobby = new Lobby(this.courier, this.host, `${externalAddress}:${this.port}`)
		await this.lobby.ready()

		Supeer.console(this).log(`Started for local server '${this.lobby.code}'`)

		//Notify ready
		this.events.fire("ready")
	}

	#onCourierDiscard = () => this.discard()

	#onHostReceive = async (e: Host.Events["receive"]): Promise<void> => {
		//Determine which connection on the client the message is being sent from and get its data
		let info: {id: string, data?: number[]}

		try {
			info = JSON.parse(e.message)
		} catch(err) {
			Supeer.console().error(err)
			Supeer.console(this).error(`Received invalid JSON from cluster '${e.id}'\n${e.message}`)

			this.host.disconnect(e.id)
			return
		}

		//Get the connection from the guest cluster
		let connections = this.clusters.get(e.id)
		let connection = connections.get(info.id)

		//Lack of data indicates disconnection if the connection is still present
		if(!info.data) {
			connection?.discard()
			return
		}

		//Create a buffer from the data
		let buffer = Buffer.from(info.data)
	
		if(!connection) {
			//Since the connection does not exist, create a new connection to the locally hosted server that the proxy will manage
			connection = new Server.Connection(
				this.host,
				net.createConnection({
					host: Proxy.localhostAddress,
					port: this.port
				}),
				{
					guestId: e.id,
					connectionId: info.id
				}
			)

			connection.events.once("discard", () => {
				Supeer.console(this).log(`Disconnecting '${info.id}' from cluster '${e.id}'`)

				connections.delete(info.id)
			})

			connections.set(info.id, connection)
			await connection.ready()

			Supeer.console(this).log(`Connected '${info.id}' on cluster '${e.id}'`)
		}

		//Read the incoming message to the associated socket using its proxy connection
		connection.read(buffer)
	}

	#onHostConnect = (e: Host.Events["connect"]): void => {
		//Since each guest is a remote client proxy enabling multiple connections, register a connected guest as a cluster of connections
		let connections = new Map<string, Server.Connection>()
		this.clusters.set(e.id, connections)

		Supeer.console(this).log(`Connected cluster '${e.id}'`)
	}

	#onHostDisconnect = (e: Host.Events["disconnect"]): void => {
		//Remove all the connections associated with the guest on a disconnect event
		let connections = this.clusters.get(e.id)
		this.clusters.delete(e.id)

		for(let connection of [...connections.values()])
			connection.discard()

		Supeer.console(this).log(`Disconnected cluster '${e.id}'`)
	}
}

export namespace Server {
	export type Connection = _Connection
	export const Connection = _Connection
}

export default Server