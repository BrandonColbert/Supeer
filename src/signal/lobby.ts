import Guest from "../peers/guest.js"
import Host from "../peers/host.js"
import Courier from "../couriers/courier.js"
import Eventual from "../utils/eventual.js"
import Supeer from "../supeer.js"

type Code = string | number

/**
 * Enables hosts and guests to connect directly through some medium
 */
export default class Lobby implements Eventual {
	/** Code to the lobby */
	public readonly code: Code
	private courier: Courier
	private host: Host
	private listener: (id: string, data: any) => boolean

	/**
	 * Create a new lobby
	 * @param courier Used to broadcast and recieve lobby information
	 * @param host Host instance
	 * @param code Optional lobby code
	 */
	public constructor(courier: Courier, host: Host, code?: Code) {
		this.code = code ?? Math.round(Math.random() * 99999)
		this.courier = courier
		this.host = host
		this.listener = this.courier.listen((id, data) => {
			//Listen for any incoming join requests with the same code
			if(data.type == "join" && data.code == this.code) {
				Supeer.console(this).log(`Received join request from '${id}'`)

				this.admit(id, data)
			}

			return true
		})

		Supeer.console(this).log("Opened!")
	}

	public async ready(): Promise<void> {
		await this.courier.ready()
	}

	/**
	 * Close the lobby to further connections
	 */
	public discard(): void {
		Supeer.console(this).log("Closing...")

		this.courier.forget(this.listener)
	}

	public toString(): string {
		return `Lobby[code=${this.code}]`
	}

	/**
	 * @param courier Used to broadcast and recieve lobby information
	 * @param guest Guest instance
	 * @param code Lobby code
	 * @param waitTime Time in milliseconds to wait before timing out
	 * @returns Whether the lobby could be joined
	 */
	public static async join(courier: Courier, guest: Guest, code: Code, waitTime: number = 15000): Promise<void> {
		let connectPromise = new Promise<void>((resolve, reject) => {
			let handle: NodeJS.Timer

			guest.events.once("connect", () => {
				clearInterval(handle)
				resolve()
			})
			
			handle = setTimeout(() => reject(`Request to join lobby '${code}' timed out after ${(waitTime / 1000).toFixed(2)}s`), waitTime)
		})

		await courier.ready()

		courier.listen((id, data) => {
			if(data.type == "accept" && data.id == courier.id) {
				guest.connect(
					data.response,
					candidate => courier.broadcast({
						type: "candidate",
						id: id,
						candidate: candidate
					})
				).then(result => courier.listen((id2, data2) => {
					if(id2 == id && data2.type == "candidate" && data2.id == courier.id) {
						if(Object.keys(data2.candidate).length == 0)
							return false

						result.onCandidateIn(data2.candidate)
					}

					return true
				}))

				return false
			}

			return true
		})

		courier.broadcast({
			type: "join",
			code: code,
			request: await guest.createJoinRequest()
		})

		await connectPromise
	}

	/** Performs the steps to create a WebRTC connection */
	private async admit(id: string, data: any): Promise<void> {
		let {onCandidateIn, sdp} = await this.host.connect(
			data.request,
			candidate => this.courier.broadcast({
				type: "candidate",
				id: id,
				candidate: candidate
			})
		)

		this.courier.listen((id2, data2) => {
			if(id2 == id && data2.type == "candidate" && data2.id == this.courier.id) {
				if(Object.keys(data2.candidate).length == 0)
					return false

				onCandidateIn(data2.candidate)
			}

			return true
		})

		this.courier.broadcast({
			type: "accept",
			id: id,
			response: sdp
		})
	}
}