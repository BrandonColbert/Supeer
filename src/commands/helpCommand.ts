import Supeer from "../supeer.js"
import Command from "./core/command.js"
import ObjectParameter from "./core/objectParameter.js"

export default class HelpCommand extends Command {
	public readonly name: string = "help"

	public constructor() {
		super()
		this.add(new ObjectParameter({
			name: "command",
			type: String,
			description: "Command to get help for. If unspecified, a list of available commands is shown.",
			optional: true
		}))
	}

	public get description(): string {
		return "Get help for a command."
	}

	public async execute(args: string[], options: Command.Options): Promise<void> {
		let commandName: string
		[commandName] = this.take(args)

		if(commandName) {
			let command: Command
			[command] = options.commander["take"]([commandName])

			Supeer.console().log(`${command.description}\n\nUsage: ${command.help()}`)
		} else {
			Supeer.console().log(
				[...options.commander]
					.map(c => `${c.name}: ${c.description}`)
					.join("\n")
			)
		}
	}
}