import Peer from "../peers/peer.js"
import Courier from "../couriers/courier.js"
import Command from "./core/command.js"
import Repeater from "../signal/repeater.js"
import Guest from "../peers/guest.js"
import Host from "../peers/host.js"
import Lobby from "../signal/lobby.js"
import ObjectParameter from "./core/objectParameter.js"
import CommandParameter from "./core/commandParameter.js"
import type RunCommand from "./runCommand.js"

export class RepeaterCommand extends Command {
	public readonly name: string = "repeater"

	public constructor() {
		super()
		this.add(new ObjectParameter({name: "courier", type: Courier, description: "Courier name."}))
		this.add(new ObjectParameter({name: "port", type: Number, description: "Port to host the repeater on."}))
		this.add(new CommandParameter({
			description: "Peer type.",
			commands: [RepeaterCommand.HostCommand, RepeaterCommand.GuestCommand]
		}))
	}

	public get description(): string {
		return "Allows an external application to use Peer communication through a local TCP server."
	}

	public async execute(args: string[], options: RepeaterCommand.Options): Promise<void> {
		let courier: Courier
		let port: number
		let command: Command
		[courier, port, command] = this.take(args)

		options.courier = courier
		await command.execute(args, options)

		let repeater = new Repeater(options.peer, port)
		await repeater.ready()

		options.started = repeater
	}
}

export namespace RepeaterCommand {
	export interface Options extends RunCommand.Options {
		courier: Courier
		peer: Peer
	}

	export class GuestCommand extends Command {
		public readonly name: string = "guest"

		public constructor() {
			super()
			this.add(new ObjectParameter({name: "code", type: Number, description: "Lobby code."}))
		}

		public get description(): string {
			return "Connects to a host."
		}

		public async execute(args: string[], options: RepeaterCommand.Options): Promise<void> {
			let code: string
			[code] = this.take(args)
	
			let guest = new Guest()
			options.peer = guest

			await Lobby.join(options.courier, guest, code)
		}
	}

	export class HostCommand extends Command {
		public readonly name: string = "host"

		public get description(): string {
			return "Admits guests."
		}

		public async execute(args: string[], options: RepeaterCommand.Options): Promise<void> {
			let host = new Host()
			options.peer = host

			let lobby = new Lobby(options.courier, host)
			await lobby.ready()
		}
	}
}

export default RepeaterCommand