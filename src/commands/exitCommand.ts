import Command from "./core/command.js"

export default class ExitCommand extends Command {
	public readonly name: string = "exit"

	public get description(): string {
		return "Closes the program."
	}

	public async execute(): Promise<void> {
		process.exit()
	}
}