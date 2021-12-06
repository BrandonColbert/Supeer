import Supeer from "../supeer.js"
import Command from "./core/command.js"

export default class ReloadCommand extends Command {
	public readonly name: string = "reload"

	public get description(): string {
		return "Reload all configuration files."
	}

	public async execute(): Promise<void> {
		await Supeer.Config.load()

		console.log("Reloaded config!")
	}
}