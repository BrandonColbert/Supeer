import Guest from "../peers/guest.js"
import Host from "../peers/host.js"
import Command from "./core/command.js"
import CommandParameter from "./core/commandParameter.js"
import type CreateCommand from "./createCommand.js"

export class PeerCommand extends Command {
	public readonly name: string = "peer"

	public constructor() {
		super()
		this.add(new CommandParameter({
			description: "Peer type",
			commands: [PeerCommand.HostCommand, PeerCommand.GuestCommand]
		}))
	}

	public get description(): string {
		return "Creates a peer."
	}

	public async execute(args: string[], options: CreateCommand.Options): Promise<void> {
		let command: Command
		[command] = this.take(args)

		await command.execute(args, options)
	}
}

export namespace PeerCommand {
	export class HostCommand extends Command {
		public readonly name: string = "host"
	
		public get description(): string {
			return "Creates a host instance."
		}
	
		public async execute(args: string[], options: CreateCommand.Options): Promise<void> {
			options.created = new Host()
		}
	}
	
	export class GuestCommand extends Command {
		public readonly name: string = "guest"
	
		public get description(): string { 
			return "Creates a guest instance."
		}
	
		public async execute(args: string[], options: CreateCommand.Options): Promise<void> {
			options.created = new Guest()
		}
	}
}


export default PeerCommand