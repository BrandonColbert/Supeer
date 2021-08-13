import Guest from "../peers/guest.js"
import Host from "../peers/host.js"
import Command from "./core/command.js"
import CommandParameter from "./core/commandParameter.js"
import Pool from "./core/pool.js"

export default class PeerCommand extends Command {
	public readonly name: string = "peer"

	public constructor() {
		super()
		this.add(new CommandParameter({
			description: "Peer type",
			commands: [HostCommand, GuestCommand]
		}))
	}

	public get description(): string {
		return "Creates a peer."
	}

	public async execute(args: string[], options: Record<string, any>): Promise<void> {
		let command: Command
		[command] = this.take(args)

		await command.execute(args, options)
	}
}

class HostCommand extends Command {
	public readonly name: string = "host"

	public get description(): string {
		return "Creates a host instance."
	}

	public async execute(args: string[], options: Record<string, any>): Promise<void> {
		Pool.set(options["name"], new Host())
	}
}

class GuestCommand extends Command {
	public readonly name: string = "guest"

	public get description(): string { 
		return "Creates a guest instance."
	}

	public async execute(args: string[], options: Record<string, any>): Promise<void> {
		Pool.set(options["name"], new Guest())
	}
}