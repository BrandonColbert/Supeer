import Command from "./core/command.js"
import CommandParameter from "./core/commandParameter.js"
import ObjectParameter from "./core/objectParameter.js"
import Pool from "./core/pool.js"
import CourierCommand from "./courierCommand.js"
import PeerCommand from "./peerCommand.js"

export default class CreateCommand extends Command {
	public readonly name: string = "create"

	public constructor() {
		super()

		this.add(new ObjectParameter({
			name: "name",
			type: String,
			description: "Name to store the object under."
		}))

		this.add(new CommandParameter({
			description: "Type of object to create.",
			commands: [CourierCommand, PeerCommand]
		}))
	}

	public get description(): string {
		return "Create an object."
	}

	public async execute(args: string[], options: Record<string, any>): Promise<void> {
		let name: string
		let command: Command
		[name, command] = this.take(args)

		options["name"] = name
		await command.execute(args, options)

		console.log(`Created: ${Pool.get(name)}`)
	}
}