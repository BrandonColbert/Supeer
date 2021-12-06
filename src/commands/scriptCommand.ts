import Supeer from "../supeer.js"
import Command from "./core/command.js"
import ObjectParameter from "./core/objectParameter.js"

export default class ScriptCommand extends Command {
	public readonly name: string = "script"

	public constructor() {
		super()

		this.add(new ObjectParameter({
			name: "name",
			type: String,
			description: "Key of the script in the settings entry 'scripts'."
		}))
	}

	public get description(): string {
		return "Run a script from settings."
	}

	public async execute(args: string[], options: Command.Options): Promise<void> {
		let name: string
		[name] = this.take(args)

		let settings = Supeer.Config.get("settings")
		let commands = settings.scripts?.[name]

		if(!commands) {
			console.error(`Unable to find script '${name}'`)
			return
		}

		await options.commander.run(...commands)
	}
}