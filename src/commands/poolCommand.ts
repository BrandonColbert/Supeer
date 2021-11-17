import Supeer from "../supeer.js"
import Command from "./core/command.js"
import CommandParameter from "./core/commandParameter.js"
import ObjectParameter from "./core/objectParameter.js"

export class PoolCommand extends Command {
	public name: string = "pool"

	public constructor() {
		super()

		this.add(new CommandParameter({
			description: "Action to take regarding the pool.",
			commands: [PoolCommand.ListCommand, PoolCommand.RemoveCommand]
		}))
	}

	public get description(): string {
		return "View processes and objects."
	}

	public async execute(args: string[], options: Command.Options): Promise<void> {
		let command: Command
		[command] = this.take(args)

		if(!command)
			return

		await command.execute(args, options)
	}
}

export namespace PoolCommand {
	export class ListCommand extends Command {
		public readonly name: string = "list"

		public get description(): string {
			return "List all objects and processes in the pool."
		}

		public async execute(): Promise<void> {
			let keys = [...Supeer.pool]
	
			if(keys.length == 0) {
				console.log("Pool is empty.")
				return
			}

			for(let key of keys) {
				let value = Supeer.pool.get(key as any)
				console.log(key, `\t${value}`)
			}
		}
	}

	export class RemoveCommand extends Command {
		public readonly name: string = "remove"

		public constructor() {
			super()
	
			this.add(new ObjectParameter({
				name: "identifier",
				type: String,
				description: "Object name or process id."
			}))
		}

		public get description(): string {
			return "Removes an object or process from the pool."
		}

		public async execute(args: string[]): Promise<void> {
			let identifier: string
			[identifier] = this.take(args)
	
			if(/^\d+$/.test(identifier)) {
				let pid = parseInt(identifier)

				if(Supeer.pool.remove(pid))
					console.log(`Removed process ${pid}`)
				else
					console.log(`Process ${pid} does not exist`)
			} else {
				let name = identifier

				if(Supeer.pool.remove(name))
					console.log(`Removed '${name}'`)
				else
					console.log(`'${name}' does not exist`)
			}
		}
	}
}

export default PoolCommand