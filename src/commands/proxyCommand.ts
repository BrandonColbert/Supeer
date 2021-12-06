import Command from "./core/command.js"
import ObjectParameter from "./core/objectParameter.js"
import Proxy from "../signal/proxy.js"
import CommandParameter from "./core/commandParameter.js"
import Courier from "../couriers/courier.js"
import type RunCommand from "./runCommand.js"

export class ProxyCommand extends Command {
	public readonly name: string = "proxy"

	public constructor() {
		super()

		this.add(new ObjectParameter({name: "courier", type: Courier, description: "Courier name."}))
		this.add(new CommandParameter({
			description: "Proxy type.",
			commands: [ProxyCommand.ServerProxyCommand, ProxyCommand.ClientProxyCommand]
		}))
	}

	public get description(): string {
		return "Creates a proxy."
	}

	public async execute(args: string[], options: ProxyCommand.Options): Promise<void> {
		let courier: Courier
		let command: Command
		[courier, command] = this.take(args)

		options.courier = courier
		await command.execute(args, options)
	}
}

export namespace ProxyCommand {
	export interface Options extends RunCommand.Options {
		courier: Courier
	}

	export class ServerProxyCommand extends Command {
		public readonly name: string = "server"
	
		public constructor() {
			super()
			this.add(new ObjectParameter({name: "port", type: Number, description: "Port which the local server is running on"}))
		}
	
		public get description(): string {
			return "Forwards connections to clients through a host peer."
		}
	
		public async execute(args: string[], options: ServerProxyCommand.Options): Promise<void> {
			let port: number
			[port] = this.take(args)

			let proxy = new Proxy.Server(options.courier, port)
			await proxy.ready()
	
			options.started = proxy
		}
	}

	export namespace ServerProxyCommand {
		export interface Options extends ProxyCommand.Options {
			started: Proxy.Server
		}
	}
	
	export class ClientProxyCommand extends Command {
		public readonly name: string = "client"
	
		public constructor() {
			super()
			this.add(new ObjectParameter({name: "port", type: Number, description: "Port to run the proxy server on"}))
			this.add(new ObjectParameter({name: "destAddress", type: String, description: "Address of the actual server"}))
			this.add(new ObjectParameter({name: "destPort", type: Number, description: "Port of the actual server"}))
		}
	
		public get description(): string {
			return "Forwards connections to the server through a guest peer."
		}
	
		public async execute(args: string[], options: ClientProxyCommand.Options): Promise<void> {
			let sourcePort: number
			let destAddress: string
			let destPort: number
			[sourcePort, destAddress, destPort] = this.take(args)
	
			let proxy = new Proxy.Client(options.courier, sourcePort, {address: destAddress, port: destPort})
			await proxy.ready()
	
			options.started = proxy
		}
	}

	export namespace ClientProxyCommand {
		export interface Options extends ProxyCommand.Options {
			started: Proxy.Client
		}
	}
}

export default ProxyCommand