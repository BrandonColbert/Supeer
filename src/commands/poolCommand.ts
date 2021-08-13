import Command from "./core/command.js"
import Pool from "./core/pool.js"

export default class PoolCommand extends Command {
	public name: string = "pool"

	public get description(): string {
		return "Lists the available objects in the pool."
	}

	public async execute(args: string[], options: Record<string, any>): Promise<void> {
		let objects = [...Pool]

		if(objects.length == 0) {
			console.log("No objects exist.")
			return
		}

		console.log(
			objects
				.map(key => {
					let value = Pool.get(key)
					return `${key}: ${value.hasOwnProperty("toString") ? value.toString() : value.constructor.name}`
				})
				.join("\n")
		)
	}
}