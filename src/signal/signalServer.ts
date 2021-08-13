import net from "net"
import readline from "readline"
import Supeer from "../supeer.js"
import Discardable from "../utils/discardable.js"
import Eventual from "../utils/eventual.js"
import promisify from "../utils/promisify.js"

/**
 * A signaling server that can be used by a SignalCourier
 */
export class SignalServer implements Eventual {
	private server: net.Server
	private connections: Set<SignalServer.Connection> = new Set()
	private listenPromise: Promise<void>

	public constructor(port: number) {
		this.server = net.createServer()
		this.server.on("close", () => this.discard())
		this.server.on("connection", socket => new SignalServer.Connection(this, socket))

		this.listenPromise = promisify<[number, string, () => void]>(this.server, this.server.listen, port, "localhost").then(() => {
			Supeer.console(this).log("Started!")
		})
	}

	public async ready(): Promise<void> {
		await this.listenPromise
	}

	public discard(): void {
		if(!this.server)
			return

		Supeer.console(this).log("Stopping...")

		for(let connection of [...this.connections.values()])
			connection.discard()

		this.server.close()
		this.server = null
	}

	public toString(): string {
		if(!this.server)
			return "*SignalServer"

		let address = this.server.address()

		switch(typeof address) {
			case "string":
				return `SignalServer[addr=${address}]`
			default:
				let {port} = address
				return `SignalServer[port=${port}]`
		}
	}
}

export namespace SignalServer {
	export class Connection implements Discardable {
		public readonly socket: net.Socket
		private server: SignalServer
		private reader: readline.Interface

		public constructor(server: SignalServer, socket: net.Socket) {
			this.server = server

			this.socket = socket
			this.socket.on("close", this.onClose)
			this.socket.on("error", this.onError)

			this.reader = readline.createInterface(socket)
			this.reader.on("line", this.onLine)

			let connections: Set<Connection> = server["connections"]
			connections.add(this)

			Supeer.console(this.server).log(`Connected ${this}`)
		}

		public discard(): void {
			let connections = this.server["connections"]

			if(connections.delete(this)) {
				this.reader.close()
				this.socket.destroy()

				Supeer.console(this.server).log(`Disconnected ${this}`)
			}
		}

		public toString(): string {
			let address = this.socket.remoteAddress
			let port = this.socket.remotePort

			return address && port ? `${address}:${port}` : "'unknown'"
		}

		private onLine = (input: string) => {
			try {
				JSON.parse(input)
			} catch(err) {
				console.error(err)
				Supeer.console(this.server).error(`Received invalid JSON from ${this}\n${input}`)

				this.discard()
				return
			}

			let connections = this.server["connections"]

			for(let c of connections.values())
				c.socket.write(`${input}\n`)
		}

		private onClose = (hadError: boolean): void => {
			this.discard()
		}

		private onError = (error: Error): void => {
			this.discard()
		}
	}
}

export default SignalServer