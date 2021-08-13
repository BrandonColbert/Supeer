//@ts-ignore
import wrtc from "wrtc"

import Peer from "./peer.js"
import Dispatcher from "../utils/dispatcher.js"
import Discardable from "../utils/discardable.js"
import Supeer from "../supeer.js"
import Buffered from "../utils/buffered.js"

/**
 * Maintains a connection to a single peer
 */
export class Guest extends Peer implements Discardable {
	public readonly events: Dispatcher<Guest.Events> = new Dispatcher(
		"connect",
		"disconnect",
		"recieve"
	)

	private connection: RTCPeerConnection
	private channel: RTCDataChannel

	public constructor() {
		super()

		//Prepare for recieving
		this.connection = new wrtc.RTCPeerConnection(Supeer.Config.get<RTCConfiguration>("rtc"))
		this.connection.ondatachannel = a => {
			let reader = new Buffered.Reader(msg => this.events.fire("recieve", {message: msg}))
			a.channel.onmessage = b => reader.read(b.data)
		}

		//Prepare for sending
		this.channel = this.connection.createDataChannel("send")
		this.channel.onclose = () => this.events.fire("disconnect")
		this.channel.onopen = () => this.events.fire("connect")
	}

	public discard(): void {
		this.disconnect()
	}

	public send(msg: string): void {
		Buffered.write(msg, msg => this.channel.send(msg))
	}

	/**
	 * Create a request to connect with a host
	 * @returns The offer sdp to be sent to and used by the host for connecting
	 */
	public async createJoinRequest(): Promise<string> {
		await this.connection.setLocalDescription(await this.connection.createOffer())
		return this.connection.localDescription.sdp
	}

	/**
	 * Connects to a peer
	 * @param sdp Answer sdp
	 * @param onCandidateOut Passes IceCandidates to be sent
	 * @returns IceCandidate reciever
	 */
	public async connect(sdp: string, onCandidateOut: Peer.CandidatePass): Promise<Peer.ConnectResult> {
		this.connection.onicecandidate = e => onCandidateOut(e.candidate ?? {})
		await this.connection.setRemoteDescription({type: "answer", sdp: sdp})

		return {onCandidateIn: c => this.connection?.addIceCandidate(new wrtc.RTCIceCandidate(c))}
	}

	public disconnect(): void {
		if(this.channel.readyState == "open")
			this.channel.close()

		if(this.connection.connectionState == "connected")
			this.connection.close()

		this.channel = null
		this.connection = null
	}
}

export namespace Guest {
	export interface Events extends Peer.Events {
		connect: void
		disconnect: void
		recieve: {message: string}
	}
}

export default Guest