import net from "net"
import {v4 as uuid} from "uuid"
import CoBraSU from "../../../../lib/cobrasu-0.1.0.js"
import Guest from "../../../peers/guest.js"
import Discardable from "../../../utils/discardable.js"
import ProxyConnection from "../../proxy/connection.js"

export default class Connection extends ProxyConnection {
	public readonly events: CoBraSU.Core.Dispatcher<Discardable.Events> = new CoBraSU.Core.Dispatcher("discard")
	private readonly guest: Guest

	public constructor(guest: Guest, socket: net.Socket) {
		super(uuid(), socket)
		this.guest = guest
	}

	public override read(buffer: Buffer): void {
		this.socket.write(buffer)
	}

	public override write(buffer: Buffer): void {
		let info = {
			id: this.id,
			data: [...buffer]
		}

		this.guest.send(JSON.stringify(info))
	}
}