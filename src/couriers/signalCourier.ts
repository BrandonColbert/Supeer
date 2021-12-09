import net from "net"
import CoBraSU from "../../lib/cobrasu-0.1.0.js"
import Supeer from "../supeer.js"
import Buffered from "../utils/buffered.js"
import Courier from "./courier.js"

/**
 * Creates connections using a signaling server
 */
export default class SignalCourier extends Courier {
	private readonly port: number
	private readonly hostname: string
	private socket: net.Socket
	private reader: Buffered.Reader
	readonly #ready: Promise<void>

	public constructor(hostname: string, port: number) {
		super()
		this.hostname = hostname
		this.port = port
		this.socket = new net.Socket()
		this.reader = new Buffered.Reader(msg => this.receive(msg))

		//Register event listeners
		this.socket.on("data", this.#onSocketData)
		this.socket.on("end", this.#onSocketEnd)
		this.socket.on("close", this.#onSocketClose)
		this.socket.on("error", this.#onSocketError)
	
		this.#ready = this.setup()
	}

	public async ready(): Promise<void> {
		await this.#ready
	}

	public override discard(): void {
		//Remove event listeners
		this.socket.removeListener("data", this.#onSocketData)
		this.socket.removeListener("end", this.#onSocketEnd)
		this.socket.removeListener("close", this.#onSocketClose)
		this.socket.removeListener("error", this.#onSocketError)

		Supeer.console(this).log("Stopping...")

		//Notify discard
		this.events.fire("discard")

		//Destroy the socket
		this.socket.destroy()
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

	protected async setup(): Promise<void> {
		await CoBraSU.Core.promisify<[number, string, () => void]>(this.socket, this.socket.connect, this.port, this.hostname)

		Supeer.console(this).log("Ready!")

		//Notify ready
		this.events.fire("ready")
	}

	#onSocketData = (data: Buffer) => this.reader.read(data)
	#onSocketEnd = () => this.discard()
	#onSocketClose = (hadError: boolean) => this.discard()
	#onSocketError = (error: Error) => {
		Supeer.console(this).error(error.message)
		this.discard()
	}
}