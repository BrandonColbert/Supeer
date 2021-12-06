import {v4 as uuid} from "uuid"
import {Dispatcher} from "../../lib/cobrasu/core.js"
import Guest from "../peers/guest.js"
import Host from "../peers/host.js"
import Courier from "../couriers/courier.js"
import Supeer from "../supeer.js"
import Deferred from "../utils/deferred"

/**
 * Enables hosts and guests to connect directly through some medium
 */
export default class Lobby implements Deferred {
	public readonly events: Dispatcher<Deferred.Events> = new Dispatcher("ready")

	/** Code to the lobby */
	public readonly code: string

	private readonly courier: Courier
	private readonly host: Host
	#isOpen: boolean

	/**
	 * Create a new lobby
	 * @param courier Used to broadcast and receive lobby information
	 * @param host Host instance
	 * @param code Lobby code (defaults to a random uuid)
	 */
	public constructor(courier: Courier, host: Host, code?: string) {
		this.code = code ?? uuid()
		this.courier = courier
		this.host = host
		this.#isOpen = true

		//Register event listeners
		courier.events.on("discard", this.#onCourierDiscard)
		courier.events.on("receive", this.#onCourierReceive)

		Supeer.console(this).log("Opened!")
	}

	/**
	 * Wether the lobby is open to new guests
	 */
	public get isOpen(): boolean {
		return this.#isOpen
	}

	public async ready(): Promise<void> {
		await this.courier.ready()
	}

	/**
	 * Close the lobby to further connections
	 */
	public close(): void {
		if(!this.#isOpen)
			return

		Supeer.console(this).log("Closing...")

		//Prevent new guests
		this.#isOpen = false

		//Remove event listeners
		this.courier.events.forget("discard", this.#onCourierDiscard)
		this.courier.events.forget("receive", this.#onCourierReceive)
	}

	public toString(): string {
		return `Lobby[code=${this.code}]`
	}

	/** Performs the steps to create a WebRTC connection */
	private async admit(id: string, data: any): Promise<void> {
		//Create the answer sdp
		let {onCandidateIn, sdp} = await this.host.connect(
			data.request,
			candidate => this.courier.broadcast({
				type: "candidate",
				id: id,
				candidate: candidate
			})
		)

		let listener: (e: Courier.Events["receive"]) => void

		listener = e => {
			//Collect ICE candidates until none are present
			if(e.id == id && e.data.type == "candidate" && e.data.id == this.courier.id) {
				if(Object.keys(e.data.candidate).length == 0) {
					this.courier.events.forget("receive", listener)
					return
				}

				onCandidateIn(e.data.candidate)
			}
		}

		this.courier.events.on("receive", listener)

		//Send answer sdp
		this.courier.broadcast({
			type: "accept",
			id: id,
			response: sdp
		})
	}

	#onCourierDiscard = (e: Courier.Events["discard"]): void => this.close()

	#onCourierReceive = (e: Courier.Events["receive"]): void => {
		//Check if message is a join request
		if(e.data.type != "join")
			return

		//Check for matching code
		if(e.data.code != this.code)
			return

		Supeer.console(this).log(`Received join request from '${e.id}'`)

		this.admit(e.id, e.data)
	}

	/**
	 * @param courier Used to broadcast and receive lobby information
	 * @param guest Guest instance
	 * @param code Lobby code
	 * @returns Whether the lobby could be joined
	 */
	public static async join(courier: Courier, guest: Guest, code: string): Promise<void> {
		await courier.ready()

		let listener: (e: Courier.Events["receive"]) => void

		listener = async ({id, data}) => {
			//Listen for the join request to be accepted
			if(data.type == "accept" && data.id == courier.id) {
				courier.events.forget("receive", listener)

				//Pass the answer to the guest and collect ICE candidates
				let result = await guest.connect(
					data.response,
					candidate => courier.broadcast({
						type: "candidate",
						id: id,
						candidate: candidate
					})
				)

				//Listen for ICE candidates instead now
				listener = ({id: id2, data: data2}) => {
					//Collect ICE candidates until none are present
					if(id2 == id && data2.type == "candidate" && data2.id == courier.id) {
						if(Object.keys(data2.candidate).length == 0) {
							courier.events.forget("receive", listener)
							return
						}

						result.onCandidateIn(data2.candidate)
					}
				}

				courier.events.on("receive", listener)
			}
		}
		
		courier.events.on("receive", listener)

		//Create the join request to be sent through the courier to the host
		let request = await guest.createJoinRequest()

		//Handle connection aspects for joining the lobby
		let settings = Supeer.Config.get("settings")
		let {joinInterval, joinTimeout} = settings.lobby

		let intervalHandle: NodeJS.Timer
		let timeoutHandle: NodeJS.Timer

		function clearHandles(): void {
			if(intervalHandle)
				clearInterval(intervalHandle)

			if(timeoutHandle)
				clearTimeout(timeoutHandle)
		}

		function sendJoinRequest(): void {
			Supeer.console(courier).log(`Attempting to join lobby '${code}'`)

			courier.broadcast({
				type: "join",
				code: code,
				request: request
			})
		}

		return new Promise<void>((resolve, reject) => {
			//Resolve the promise once the guest successfully connects to the host
			guest.events.once("connect", () => {
				Supeer.console(courier).log(`Joined lobby '${code}'`)

				clearHandles()
				resolve()
			})

			//Attempt to join
			sendJoinRequest()
			intervalHandle = setInterval(sendJoinRequest, joinInterval)
			timeoutHandle = joinTimeout == 0 ? null : setTimeout(() => {
				let minutes = Math.floor(joinTimeout / (60 * 1000))
				let seconds = Math.floor((joinTimeout % (60 * 1000)) / 1000)

				let time = `${seconds}s`
				time = minutes > 0 ? `${minutes}m ${time}` : time

				clearHandles()
				reject(`Lobby '${code}' timed out after ${time}`)
			}, joinTimeout)
		})
	}
}