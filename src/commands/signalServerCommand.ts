import SignalServer from "../signal/signalServer.js"
import Command from "./core/command.js"
import ObjectParameter from "./core/objectParameter.js"

export default class SignalServerCommand extends Command {
	public readonly name: string = "signal"

	public constructor() {
		super()
		this.add(new ObjectParameter({name: "port", type: Number, description: "Port to host on."}))
	}

	public get description(): string {
		return "Starts a signaling server for couriers."
	}

	public async execute(args: string[], options: Record<string, any>): Promise<void> {
		let port: number
		[port] = this.take(args)

		let server = new SignalServer(port)
		await server.ready()

		console.log(`Signaling server started on port ${port}`)
	}
}