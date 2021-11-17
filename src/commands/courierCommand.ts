import Command from "./core/command.js"
import Courier from "../couriers/courier.js"
import DiscordCourier from "../couriers/discordCourier.js"
import LocalCourier from "../couriers/localCourier.js"
import ServerCourier from "../couriers/signalCourier.js"
import CommandParameter from "./core/commandParameter.js"
import ObjectParameter from "./core/objectParameter.js"
import type CreateCommand from "./createCommand.js"

export class CourierCommand extends Command {
	public readonly name: string = "courier"

	public constructor() {
		super()
		this.add(new CommandParameter({
			description: "Courier type",
			commands: [
				CourierCommand.DiscordCommand,
				CourierCommand.LocalCommand,
				CourierCommand.SignalCommand
			]
		}))
	}

	public get description(): string {
		return "Creates a courier."
	}

	public async execute(args: string[], options: CourierCommand.Options): Promise<void> {
		let command: Command
		[command] = this.take(args)

		await command.execute(args, options)
		await options.created.ready()
	}
}

export namespace CourierCommand {
	export interface Options extends CreateCommand.Options {
		created: Courier
	}

	export class DiscordCommand extends Command {
		public readonly name: string = "discord"
	
		public constructor() {
			super()
			this.add(new ObjectParameter({name: "token", type: String, description: "Bot token"}))
			this.add(new ObjectParameter({name: "channel", type: String, description: "Text channel id"}))
		}
	
		public get description(): string {
			return "Uses a Discord bot on a text channel."
		}
	
		public async execute(args: string[], options: Options): Promise<void> {
			let token: string
			let channel: string
			[token, channel] = this.take(args)
	
			options.created = new DiscordCourier(token, channel)
		}
	}
	
	export class SignalCommand extends Command {
		public readonly name: string = "signal"
	
		public constructor() {
			super()
			this.add(new ObjectParameter({name: "hostname", type: String, description: "Address of the signal server"}))
			this.add(new ObjectParameter({name: "port", type: Number, description: "Port the server is on"}))
		}
	
		public get description(): string {
			return "Uses a signaling server at the socket address."
		}
	
		public async execute(args: string[], options: Options): Promise<void> {
			let hostname: string
			let port: number
			[hostname, port] = this.take(args)
	
			options.created = new ServerCourier(hostname, port)
		}
	}
	
	export class LocalCommand extends Command {
		public readonly name: string = "local"
	
		public get description(): string {
			return "Uses events in the current session."
		}
	
		public async execute(args: string[], options: Options): Promise<void> {
			options.created = new LocalCourier()
		}
	}
}

export default CourierCommand
