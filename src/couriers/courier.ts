import {v4 as uuid} from "uuid"
import CoBraSU from "../../lib/cobrasu-0.1.0.js"
import Eventual from "../utils/eventual.js"

/**
 * Creates connections by sending and receiving broadcasted data through some medium.
 * 
 * Every courier has its own unique id when broadcasting.
 */
export abstract class Courier implements Eventual {
	public readonly events: CoBraSU.Core.Dispatcher<Courier.Events> = new CoBraSU.Core.Dispatcher(
		"discard",
		"ready",
		"receive"
	)

	/**
	 * Unique identifier of this courier on its respective medium.
	 */
	public readonly id: string = uuid()

	/**
	 * Broadcast data to all listeners
	 * @param data Data to send
	 */
	public broadcast(data: any): void {
		this.send(JSON.stringify({
			id: this.id,
			data: data
		}))
	}

	public abstract ready(): Promise<void>
	public abstract discard(): void

	protected receive(msg: string): void {
		let info: any = null

		try {
			info = JSON.parse(msg)
		} catch(e) {
			return
		}

		if(info.id == this.id)
			return

		this.events.fire("receive", {
			id: info.id,
			data: info.data
		})
	}

	protected abstract send(msg: string): void
}

export namespace Courier {
	export interface Events extends Eventual.Events {
		receive: {id: string, data: any}
	}
}

export default Courier