import net from "net"
import CoBraSU from "../../../../lib/cobrasu-0.1.0.js"
import Eventual from "../../../utils/eventual.js"
import Host from "../../../peers/host.js"
import ProxyConnection from "../../proxy/connection.js"

export class Connection extends ProxyConnection implements Eventual {
	public readonly events: CoBraSU.Core.Dispatcher<Eventual.Events> = new CoBraSU.Core.Dispatcher("discard", "ready")
	private readonly host: Host
	private readonly guestId: string
	readonly #ready: Promise<void>

	public constructor(host: Host, socket: net.Socket, options: Connection.Options) {
		super(options.connectionId, socket)
		this.host = host
		this.guestId = options.guestId
		this.#ready = this.setup()
	}

	public async ready(): Promise<void> {
		await this.#ready
	}

	public override read(buffer: Buffer): void {
		this.socket.write(buffer, "binary")
	}

	public override write(buffer: Buffer): void {
		let info = {
			id: this.id,
			data: [...buffer]
		}

		this.host.send(JSON.stringify(info), [this.guestId])
	}

	public override toString(): string {
		return `${this.id}@${this.guestId}`
	}

	private async setup(): Promise<void> {
		await CoBraSU.Core.promisify<[string, () => void]>(this.socket, this.socket.once, "connect")
	}
}

export namespace Connection {
	export interface Options {
		guestId: string
		connectionId: string
	}
}

export default Connection