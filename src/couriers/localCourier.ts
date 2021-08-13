import {EventEmitter} from "events"
import Courier from "./courier.js"

/**
 * Creates connections through an event emitter at runtime
 */
export default class LocalCourier extends Courier {
	private static emitter: EventEmitter = new EventEmitter()

	public constructor() {
		super()
		LocalCourier.emitter.on("broadcast", info => this.recieve(info))
	}

	public override toString(): string {
		return `LocalCourier`
	}

	protected send(msg: string): void {
		LocalCourier.emitter.emit("broadcast", msg)
	}
}