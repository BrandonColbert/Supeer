import Bridge from "../signal/bridge.js"
import Courier from "../couriers/courier.js"
import Command from "./core/command.js"
import ObjectParameter from "./core/objectParameter.js"
import Supeer from "../supeer.js"

export default class BridgeCommand extends Command {
	public readonly name: string = "bridge"

	public constructor() {
		super()
		this.add(new ObjectParameter({name: "courier", type: Courier, description: "Courier to create the bridge with."}))
		this.add(new ObjectParameter({name: "port", type: Number, description: "Port to host the bridge on."}))
	}

	public get description(): string {
		return "Creates a WebSocket bridge to allow a browser to use couriers for signaling."
	}

	public async execute(args: string[], options: Record<string, any>): Promise<void> {
		let courier: Courier
		let port: number
		[courier, port] = this.take(args)

		await courier.ready()
		new Bridge(courier, port)

		console.log(`Bridge to courier '${courier}' created on port ${port}`)
	}
}