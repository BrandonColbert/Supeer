import Command from "./core/command.js"

export default class ExitCommand extends Command {
	public name: string = "exit"

	public get description(): string {
		return "Closes the program."
	}

	public execute(args: string[], options: Record<string, any>): Promise<void> {
		process.exit()
	}
}