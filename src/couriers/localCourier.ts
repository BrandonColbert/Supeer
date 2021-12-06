import {EventEmitter} from "events"
import Supeer from "../supeer.js"
import Courier from "./courier.js"

/**
 * Creates connections through an event emitter at runtime
 */
export default class LocalCourier extends Courier {
	private static emitter: EventEmitter = new EventEmitter()
	readonly #ready: Promise<void>

	public constructor() {
		super()

		//Register event listeners
		LocalCourier.emitter.on("broadcast", this.#onBroadcast)

		this.#ready = this.setup()
	}

	public async ready(): Promise<void> {
		await this.#ready
	}

	public discard(): void {
		//Remove event listeners
		LocalCourier.emitter.removeListener("broadcast", this.#onBroadcast)

		Supeer.console(this).log("Stopping...")

		//Notify discard
		this.events.fire("discard")
	}

	public override toString(): string {
		return `LocalCourier`
	}

	protected send(msg: string): void {
		LocalCourier.emitter.emit("broadcast", msg)
	}

	private async setup(): Promise<void> {
		Supeer.console(this).log("Ready!")

		//Notify ready
		this.events.fire("ready")
	}

	#onBroadcast = (info: any) => this.receive(info)
}