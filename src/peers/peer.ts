import {Dispatcher} from "../../lib/cobrasu/core.js"

export abstract class Peer {
	public abstract readonly events: Dispatcher<Peer.Events>

	/**
	 * Sends a message to connected peers
	 * @param msg Data to send
	 */
	public abstract send(msg: string): void

	/**
	 * Connects to a peer
	 * @param sdp Answer or offer sdp
	 * @param onCandidateOut Passes IceCandidates to be sent
	 * @returns IceCandidate receiver
	 */
	public abstract connect(sdp: string, onCandidateOut: Peer.CandidatePass): Promise<Peer.ConnectResult>

	/**
	 * Disconnects from associated peers
	 */
	public abstract disconnect(): void

	public toString(): string {
		return "*Peer"
	}
}

export namespace Peer {
	export type CandidatePass = (candidate: object) => void

	export interface Events {
		connect: any
		disconnect: any
		receive: any
	}

	export interface ConnectResult {
		/**
		 * Receives IceCandidates
		 */
		onCandidateIn: CandidatePass
	}
}

export default Peer