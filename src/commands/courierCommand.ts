import Command from "./core/command.js"
import Courier from "../couriers/courier.js"
import DiscordCourier from "../couriers/discordCourier.js"
import LocalCourier from "../couriers/localCourier.js"
import ServerCourier from "../couriers/signalCourier.js"
import CommandParameter from "./core/commandParameter.js"
import ObjectParameter from "./core/objectParameter.js"
import Pool from "./core/pool.js"

export default class CourierCommand extends Command {
	public readonly name: string = "courier"

	public constructor() {
		super()
		this.add(new CommandParameter({
			description: "Courier type",
			commands: [
				DiscordCommand,
				LocalCommand,
				SignalCommand
			]
		}))
	}

	public get description(): string {
		return "Creates a courier."
	}

	public async execute(args: string[], options: Record<string, any>): Promise<void> {
		let command: Command
		[command] = this.take(args)

		if(!command)
			return

		await command.execute(args, options)

		let courier = options["courier"] as Courier
		await courier.ready()

		Pool.set(options["name"], courier)
	}
}

class DiscordCommand extends Command {
	public readonly name: string = "discord"

	public constructor() {
		super()
		this.add(new ObjectParameter({name: "token", type: String, description: "Bot token"}))
		this.add(new ObjectParameter({name: "channel", type: String, description: "Text channel id"}))
	}

	public get description(): string {
		return "Uses a Discord bot on a text channel."
	}

	public async execute(args: string[], options: Record<string, any>): Promise<void> {
		let token: string
		let channel: string
		[token, channel] = this.take(args)

		options["courier"] = new DiscordCourier(token, channel)
	}
}

class SignalCommand extends Command {
	public readonly name: string = "signal"

	public constructor() {
		super()
		this.add(new ObjectParameter({name: "hostname", type: String, description: "Address of the signal server"}))
		this.add(new ObjectParameter({name: "port", type: Number, description: "Port the server is on"}))
	}

	public get description(): string {
		return "Uses a signaling server at the socket address."
	}

	public async execute(args: string[], options: Record<string, any>): Promise<void> {
		let hostname: string
		let port: number
		[hostname, port] = this.take(args)

		options["courier"] = new ServerCourier(hostname, port)
	}
}

class LocalCommand extends Command {
	public readonly name: string = "local"

	public get description(): string {
		return "Uses events in the current session."
	}

	public async execute(args: string[], options: Record<string, any>): Promise<void> {
		options["courier"] = new LocalCourier()
	}
}