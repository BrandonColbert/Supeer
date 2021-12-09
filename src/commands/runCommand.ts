import Supeer from "../supeer.js"
import Discardable from "../utils/discardable.js"
import Command from "./core/command.js"
import CommandParameter from "./core/commandParameter.js"
import BridgeCommand from "./bridgeCommand.js"
import ProxyCommand from "./proxyCommand.js"
import RepeaterCommand from "./repeaterCommand.js"
import SignalServerCommand from "./signalServerCommand.js"

export class RunCommand extends Command {
	public readonly name: string = "run"

	public constructor() {
		super()

		this.add(new CommandParameter({
			description: "Type of process to run.",
			commands: [
				BridgeCommand,
				ProxyCommand,
				RepeaterCommand,
				SignalServerCommand,
			]
		}))
	}

	public get description(): string {
		return "Run a process."
	}

	public async execute(args: string[], options: RunCommand.Options): Promise<void> {
		let command: Command
		[command] = this.take(args)

		await command.execute(args, options)
		Supeer.pool.add(options.started)

		Supeer.console().log(`Started\t${options.started}`)
	}
}

export namespace RunCommand {
	export interface Options extends Command.Options {
		started: Discardable
	}
}

export default RunCommand