import Dispatcher from "../utils/dispatcher.js"

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
	 * @returns IceCandidate reciever
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
		recieve: any
	}

	export interface ConnectResult {
		/**
		 * Recieves IceCandidates
		 */
		onCandidateIn: CandidatePass
	}
}

export default Peer