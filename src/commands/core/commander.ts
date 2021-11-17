import CommandParameter from "./commandParameter.js"
import Command from "./command.js"
import ParameterError from "./parameterError.js"

type Constructor<T> = new() => T

export class Commander extends Command {
	public readonly name: string = "commander"

	public constructor(...commands: Constructor<Command>[]) {
		super()
		this.add(new CommandParameter({commands: commands}))
	}

	public get description(): string {
		return "Execute a command... How did you even access this?"
	}

	/**
	 * Run the given commands sequentially
	 * @param commands Commands to run
	 */
	public async run(...commands: string[]): Promise<void>

	/**
	 * Run the given commands sequentially
	 * @param options Options for running the commands
	 * @param commands Commands to run
	 */
	public async run(options: Commander.Run.Options, ...commands: string[]): Promise<void>

	public async run(...par1: any[]): Promise<void> {
		let options: Commander.Run.Options
		let commands: string[]

		switch(par1.length) {
			case 0:
				options = {}
				commands = []
				break
			default:
				switch(typeof par1[0]) {
					case "string":
						options = {}
						commands = par1
						break
					default:
						options = par1[0]
						commands = par1.slice(1)
						break
				}
				break
		}

		options.echo ??= false
		options.stopOnError ??= true

		for(let command of commands) {
			try {
				if(options.echo)
					console.log(command)

				await this.execute(command.split(/\s+/g))
			} catch(err) {
				console.error(err)

				if(options.stopOnError)
					break
			}
		}
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

export namespace Commander {
	export namespace Run {
		export interface Options {
			/**
			 * If true, commands will stop being executed when an error is encountered
			 * 
			 * If false, errors will not prevent additional commands from running
			 * 
			 * (Defaults to true)
			 */
			stopOnError?: boolean

			/**
			 * Whether to show the input used for each command before running it
			 * 
			 * (Defaults to false)
			 */
			echo?: boolean
		}
	}
}

export default Commander