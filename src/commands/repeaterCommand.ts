import Peer from "../peers/peer.js"
import Courier from "../couriers/courier.js"
import Command from "./core/command.js"
import Repeater from "../signal/repeater.js"
import Guest from "../peers/guest.js"
import Host from "../peers/host.js"
import Lobby from "../signal/lobby.js"
import ObjectParameter from "./core/objectParameter.js"
import type RunCommand from "./runCommand.js"

export default class RepeaterCommand extends Command {
	public readonly name: string = "repeater"

	public constructor() {
		super()
		this.add(new ObjectParameter({name: "courier", type: Courier, description: "Courier name."}))
		this.add(new ObjectParameter({name: "port", type: Number, description: "Port to host the repeater on."}))
		this.add(new ObjectParameter({name: "peer", type: Peer, description: "Peer to provide access to."}))
		this.add(new ObjectParameter({name: "code", type: Number, optional: true, description: "The code that, if specified, causes the repeater to join as a guest. If unspecified, the repeater will act as a host and create a lobby."}))
	}

	public get description(): string {
		return "Allows an external application to use Peer communication through a local TCP server."
	}

	public async execute(args: string[], options: RunCommand.Options): Promise<void> {
		let courier: Courier
		let port: number
		let peer: Peer
		[courier, port, peer] = this.take(args)

		let repeater = new Repeater(peer, port)
		await repeater.ready()

		options.started = repeater

		if(peer instanceof Guest) {
			let code: number
			[code] = this.take(args)

			await Lobby.join(courier, peer, code)

			console.log(`Joined lobby '${code}'`)
		} else if(peer instanceof Host) {
			let lobby = new Lobby(courier, peer)
			await lobby.ready()

			console.log(`Created lobby '${lobby.code}' for repeater`)
		}
	}
}