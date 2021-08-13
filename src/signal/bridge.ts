import websocket from "websocket"
import http from "http"
import Courier from "../couriers/courier.js"
import Eventual from "../utils/eventual.js"
import Supeer from "../supeer.js"
import promisify from "../utils/promisify.js"

const {server: WebSocketServer} = websocket

/**
 * Enables a browser to use couriers through WebSocket
 */
export default class Bridge implements Eventual {
	private static localhostUrls: Set<string> = new Set(["localhost", "127.0.0.1", ""])
	private server: http.Server
	private connectionReady: Promise<void>

	/**
	 * @param courier Courier to provide access to
	 * @param port Port to host the bridge on
	 */
	public constructor(courier: Courier, port: number) {
		this.server = http.createServer()

		//Create the server that the browser will connect to
		let wsServer = new WebSocketServer({httpServer: this.server})

		wsServer.on("request", request => {
			let url = new URL(request.origin)

			//Accept requests only from the same device
			if(!Bridge.localhostUrls.has(url.hostname)) {
				request.reject()

				Supeer.console(this).log(`Rejected connection from '${request.origin}'`)

				return
			}

			let connection = request.accept(null, request.origin)

			//Broadcast any messages from the browser on the courier
			connection.on("message", message => {
				let data: string

				switch(message.type) {
					case "utf8":
						data = message.utf8Data
						break
					case "binary":
						data = message.binaryData.toString("utf8")
						break
				}

				try {
					let info = JSON.parse(data)
					courier.broadcast(info)
				} catch(e) {
					console.error(e)
					Supeer.console(this).error(`Received invalid JSON from '${request.origin}'\n${data}`)

					connection.close()
				}
			})

			//Send any broadcasted messages to the browser
			let callback = courier.listen((id: string, data: any) => {
				connection.sendUTF(JSON.stringify({id: id, data: data}))
				return true
			})

			//Remove broadcast listener associoated with the browser when it disconnects
			connection.on("close", () => {
				courier.forget(callback)

				Supeer.console(this).log(`Disconnected ${request.origin}`)
			})

			Supeer.console(this).log(`Connected '${request.origin}'`)
		})

		this.connectionReady = promisify<[number, () => void]>(this.server, this.server.listen, port).then(() => {
			Supeer.console(this).log("Started!")
		})
	}

	public async ready(): Promise<void> {
		await this.connectionReady
	}

	public discard(): void {
		Supeer.console(this).log("Stopping...")

		this.server.close()
	}

	public toString(): string {
		if(!this.server)
			return "*Bridge"

		let address = this.server.address()

		switch(typeof address) {
			case "string":
				return `Bridge[addr=${address}]`
			default:
				let {port} = address
				return `Bridge[port=${port}]`
		}
	}
}