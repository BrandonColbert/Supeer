import CommandParameter from "./commandParameter.js"
import Command from "./command.js"
import ParameterError from "./parameterError.js"

type Constructor<T> = new() => T

export default class Commander extends Command {
	public readonly name: string = "commander"

	public constructor(...commands: Constructor<Command>[]) {
		super()
		this.add(new CommandParameter({commands: commands}))
	}

	public get description(): string {
		return "Execute a command... How did you even access this?"
	}

	public async execute(args: string[]): Promise<void> {
		try {
			let command: Command
			[command] = this.take(args)

			await command.execute(args, {commander: this})

			console.log()
		} catch(e) {
			if(e instanceof ParameterError) {
				console.log(e.message)
				console.log()
			} else
				throw e
		}
	}

	public *[Symbol.iterator](): IterableIterator<Command> {
		for(let value of [...this.getParameter<CommandParameter>(0)])
			yield value
	}
}