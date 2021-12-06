//@ts-ignore
import wrtc from "wrtc"

import {Dispatcher} from "../../lib/cobrasu/core.js"
import {v4 as uuid} from "uuid"
import Peer from "./peer.js"
import Supeer from "../supeer.js"
import Buffered from "../utils/buffered.js"

type Line = {connection: RTCPeerConnection, channel: RTCDataChannel}

/**
 * Maintains connections to multiple peers
 */
export class Host extends Peer {
	public readonly events: Dispatcher<Host.Events> = new Dispatcher(
		"connect",
		"disconnect",
		"receive"
	)

	private lines: Map<string, Line>

	public constructor() {
		super()
		this.lines = new Map()
	}

	/** List of connected guest ids */
	public get connected(): string[] {
		return [...this.lines.keys()]
	}

	/**
	 * Sends a message to the specified guests
	 * @param msg Datas to send
	 * @param ids Recipient ids or all guests if left unspecified
	 */
	public send(msg: string, ids?: string[]): void {
		Buffered.write(msg, [...(ids ?? this.lines.keys())].map(id => {
			let {channel} = this.lines.get(id)
			return msg => channel.send(msg)
		}))
	}

	/**
	 * Connects to a guest
	 * @param sdp Offer sdp created by a guest's join request
	 * @param onCandidateOut Passes IceCandidates to be sent
	 * @returns IceCandidate receiver and the answer sdp to the guest's join request
	 */
	public async connect(sdp: string, onCandidateOut: Peer.CandidatePass): Promise<Host.ConnectResult> {
		let id: string = uuid()

		let connection: RTCPeerConnection = new wrtc.RTCPeerConnection(Supeer.Config.get("rtc"))
		connection.onicecandidate = e => onCandidateOut(e.candidate ?? {})

		connection.onconnectionstatechange = e => {
			if(connection.connectionState != "closed")
				return

			this.lines.delete(id)
		}

		connection.ondatachannel = a => {
			let reader = new Buffered.Reader(msg => this.events.fire("receive", {id: id, message: msg}))
			a.channel.onmessage = b => reader.read(b.data)
		}

		let channel = connection.createDataChannel("send")
		channel.onopen = () => this.events.fire("connect", {id: id})
		channel.onclose = () => this.events.fire("disconnect", {id: id})

		this.lines.set(id, {
			connection: connection,
			channel: channel
		})

		await connection.setRemoteDescription({type: "offer", sdp: sdp})
		await connection.setLocalDescription(await connection.createAnswer())

		return {
			onCandidateIn: c => connection?.addIceCandidate(new wrtc.RTCIceCandidate(c)),
			sdp: connection.localDescription.sdp
		}
	}

	/**
	 * Disconnect a guest by id or all guests if unspecified
	 * @param id Guest id
	 */
	public disconnect(id?: string): void {
		if(id) {
			let line = this.lines.get(id)

			if(line.channel.readyState == "open")
				line.channel.close()

			if(line.connection.connectionState == "connected")
				line.connection.close()

			line.channel = null
			line.connection = null

			this.lines.delete(id)
		} else
			for(let id of this.lines.keys())
				this.disconnect(id)
	}

	public override toString(): string {
		return `Host[n=${this.lines.size}]`
	}
}

export namespace Host {
	export interface Events extends Peer.Events {
		connect: {id: string}
		disconnect: {id: string}
		receive: {id: string, message: string}
	}

	export interface ConnectResult extends Peer.ConnectResult {
		/** Answer sdp to a guest's join request */
		sdp: string
	}
}

export default Host