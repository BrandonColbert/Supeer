import net from "net"
import Supeer from "../supeer.js"
import Buffered from "../utils/buffered.js"
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

		let reader = new Buffered.Reader(msg => this.recieve(msg))

		this.socket.on("data", data => reader.read(data))
		this.socket.on("end", () => this.discard())
		this.socket.on("close", (hadError: boolean) => this.discard())
		this.socket.on("error", (error: Error) => {
			Supeer.console(this).error(error.message)
			this.discard()
		})

		this.connectPromise = new Promise<void>(r => this.socket.connect(port, hostname, () => r()))
	}

	public override async ready(): Promise<void> {
		await super.ready()
		await this.connectPromise
	}

	public override discard(): void {
		this.socket?.destroy()
		this.socket = null
	}

	public override toString(): string {
		if(!this.socket)
			return `*SignalCourier`

		return `SignalCourier[addr=${this.hostname}:${this.port}]`
	}

	protected send(msg: string): void {
		Buffered.write(msg, chunk => this.socket.write(chunk))
	}
}