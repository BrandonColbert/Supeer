import http from "http"
import websocket from "websocket"
import {Dispatcher, promisify} from "../../lib/cobrasu/core.js"
import Courier from "../couriers/courier.js"
import Eventual from "../utils/eventual.js"
import Supeer from "../supeer.js"
import Discardable from "../utils/discardable"

/**
 * Enables a browser to use couriers through WebSocket
 */
export class Bridge implements Eventual {
	private static localhostUrls: Set<string> = new Set(["localhost", "127.0.0.1", ""])

	public readonly events: Dispatcher<Eventual.Events> = new Dispatcher("discard", "ready")
	public readonly port: number
	private readonly connections: Set<Bridge.Connection> = new Set()
	private readonly courier: Courier
	private server: http.Server
	private webSocketServer: websocket.server
	readonly #ready: Promise<void>

	/**
	 * @param courier Courier to provide access to
	 * @param port Port to host the bridge on
	 */
	public constructor(courier: Courier, port: number) {
		this.courier = courier
		this.port = port
		this.server = http.createServer()
		this.webSocketServer = new websocket.server({httpServer: this.server})

		//Register events
		this.courier.events.on("discard", this.#onCourierDiscard)
		this.courier.events.on("receive", this.#onCourierReceive)
		this.webSocketServer.on("request", this.#onServerRequest)

		this.#ready = this.setup()
	}

	public async ready(): Promise<void> {
		await this.#ready
	}

	public discard(): void {
		Supeer.console(this).log("Stopping...")

		//Remove event listeners
		this.courier.events.forget("discard", this.#onCourierDiscard)
		this.courier.events.forget("receive", this.#onCourierReceive)
		this.webSocketServer.removeListener("request", this.#onServerRequest)

		//Notify discard
		this.events.fire("discard")

		//Stop websocket server
		this.webSocketServer.shutDown()
		this.webSocketServer = null

		//Stop http server
		this.server.close()
		this.server = null
	}

	public toString(): string {
		if(!this.server)
			return "*Bridge"

		return `Bridge[port=${this.port}]`
	}

	private async setup(): Promise<void> {
		//Wait for server to activate
		await promisify<[number, () => void]>(this.server, this.server.listen, this.port)

		Supeer.console(this).log("Started!")

		//Notify ready
		this.events.fire("ready")
	}

	#onCourierDiscard = (e: Courier.Events["discard"]): void => this.discard()

	#onCourierReceive = (e: Courier.Events["receive"]): void => {
		let data = JSON.stringify({id: e.id, data: e.data})

		//Send any broadcasted messages to the browser connections
		for(let connection of this.connections)
			connection.value.sendUTF(data)
	}

	#onServerRequest = (request: websocket.request): void => {
		let url = new URL(request.origin)

		//Accept requests only from the same device
		if(!Bridge.localhostUrls.has(url.hostname)) {
			Supeer.console(this).log(`Rejecting connection from '${request.origin}'`)

			request.reject()
			return
		}

		let connection = new Bridge.Connection(this.courier, request.accept(null, request.origin))

		connection.events.on("discard", () => {
			Supeer.console(this).log(`Disconnecting '${connection}'`)
			this.connections.delete(connection)
		})

		this.connections.add(connection)
		Supeer.console(this).log(`Connected '${connection}'`)
	}
}

export namespace Bridge {
	export class Connection implements Discardable {
		public readonly events: Dispatcher<Discardable.Events> = new Dispatcher("discard")
		private readonly courier: Courier
		#connection: websocket.connection

		public constructor(courier: Courier, value: websocket.connection) {
			this.courier = courier
			this.#connection = value

			//Register event listeners
			value.on("close", this.#onClose)
			value.on("message", this.#onMessage)
		}

		public get value(): websocket.connection {
			return this.#connection
		}

		public discard(): void {
			//Remove event listeners
			this.#connection.removeListener("close", this.#onClose)
			this.#connection.removeListener("message", this.#onMessage)

			//Notify discard
			this.events.fire("discard")

			//Disconnect connection
			this.#connection.close()
			this.#connection = null
		}

		#onClose = () => this.discard()

		#onMessage = (message: websocket.Message) => {
			let data: string

			switch(message.type) {
				case "utf8":
					data = message.utf8Data
					break
				case "binary":
					data = message.binaryData.toString("utf8")
					break
			}

			let info: any

			try {
				info = JSON.parse(data)
			} catch(e) {
				console.error(`Received invalid JSON from '${this}'`)
				console.error(e)

				this.discard()
				return
			}

			//Broadcast any messages from the browser on the courier
			this.courier.broadcast(info)
		}

		public toString(): string {
			return `${this.#connection.remoteAddress}`
		}
	}
}

export default Bridge