import Supeer from "../supeer.js"
import Command from "./core/command.js"

export default class ExitCommand extends Command {
	public name: string = "exit"

	public get description(): string {
		return "Closes the program."
	}

	public async execute(): Promise<void> {
		process.exit()
	}
}