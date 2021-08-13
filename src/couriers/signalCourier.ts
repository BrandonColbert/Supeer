import net from "net"
import readline from "readline"
import Courier from "./courier.js"

/**
 * Creates connections using a signaling server
 */
export default class SignalCourier extends Courier {
	private socket: net.Socket
	private connectPromise: Promise<void>
	private hostname: string
	private port: number

	public constructor(hostname: string, port: number) {
		super()
		this.hostname = hostname
		this.port = port
		this.socket = new net.Socket()

		let reader = readline.createInterface(this.socket)
		reader.on("line", line => this.recieve(line))

		this.socket.on("close", () => reader.close())
		this.socket.on("error", e => console.error(e.message))

		this.connectPromise = new Promise<void>(r => this.socket.connect(port, hostname, () => r()))
	}

	public override async ready(): Promise<void> {
		await super.ready()
		await this.connectPromise
	}

	public override discard(): void {
		this.socket.destroy()
		this.socket = null
	}

	public override toString(): string {
		if(!this.socket)
			return `*SignalCourier`

		return `SignalCourier[addr=${this.hostname}:${this.port}]`
	}

	protected send(msg: string): void {
		this.socket.write(`${msg}\n`)
	}
}