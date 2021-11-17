import {v4 as uuid} from "uuid"
import Eventual from "../utils/eventual.js"

type Callback = (id: Id, data: any) => boolean
type Id = string

/**
 * Creates connections by sending and receiving broadcasted data through some medium
 * 
 * Every courier has its own unique id when broadcasting
 */
export default abstract class Courier implements Eventual {
	public readonly id: Id
	protected callbacks: Set<Callback>

	public constructor() {
		this.id = uuid()
		this.callbacks = new Set()
	}

	public async ready(): Promise<void> {}

	public discard(): void {
		this.callbacks.clear()
	}

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

	/**
	 * Listen for broadcasted information
	 * @param callback Listener function
	 */
	public listen(callback: Callback): Callback {
		this.callbacks.add(callback)
		return callback
	}

	/**
	 * Stop listening with callback
	 * @param callback Callback to stop listening on
	 */
	public forget(callback: Callback): void {
		this.callbacks.delete(callback)
	}

	protected recieve(msg: string): void {
		let info: any = null

		try {
			info = JSON.parse(msg)
		} catch(e) {
			return
		}

		if(info.id == this.id)
			return

		for(let callback of this.callbacks)
			if(!callback(info.id, info.data))
				this.forget(callback)
	}

	protected abstract send(msg: string): void
}