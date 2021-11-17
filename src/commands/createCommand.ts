import Supeer from "../supeer.js"
import Discardable from "../utils/discardable.js"
import Command from "./core/command.js"
import CommandParameter from "./core/commandParameter.js"
import ObjectParameter from "./core/objectParameter.js"
import CourierCommand from "./courierCommand.js"
import PeerCommand from "./peerCommand.js"

export class CreateCommand extends Command {
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

	public async execute(args: string[], options: CreateCommand.Options): Promise<void> {
		let name: string
		let command: Command
		[name, command] = this.take(args)

		if(/^\d+$/.test(name)) {
			console.log(`Numeric names such as '${name}' are disallowed for creation`)
			return
		}

		await command.execute(args, options)
		Supeer.pool.add(name, options.created)

		console.log(`Created\t${options.created}`)
	}
}

export namespace CreateCommand {
	export interface Options extends Command.Options {
		created: Discardable
	}
}

export default CreateCommand