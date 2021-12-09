import net from "net"
import stream from "stream"
import CoBraSU from "../../../lib/cobrasu-0.1.0.js"
import Supeer from "../../supeer.js"
import Discardable from "../../utils/discardable.js"

/**
 * Enables socket IO customization
 */
export default abstract class Connection implements Discardable {
	public abstract readonly events: CoBraSU.Core.Dispatcher<Discardable.Events>
	public readonly id: string
	#socket: net.Socket

	public constructor(id: string, socket: net.Socket) {
		this.id = id
		this.#socket = socket

		const instance = this

		//Create a custom writable stream to write outbound data for the socket
		socket.pipe(new stream.Writable({
			write(chunk: any, encoding: BufferEncoding, cb: (error?: Error | null) => void): void {
				switch(encoding as string) {
					case "buffer":
						instance.write(chunk as Buffer)
						cb()
						break
					default:
						cb(new Error(`Unable to write chunk of type '${chunk.constructor.name}'`))
						break
				}
			}
		}))

		//Register event listeners
		socket.on("end", this.#onSocketEnd)
		socket.on("close", this.#onSocketClose)
		socket.on("error", this.#onSocketError)
	}

	public get socket(): net.Socket {
		return this.#socket
	}

	public discard(): void {
		//Remove listeners
		this.socket.removeListener("end", this.#onSocketEnd)
		this.socket.removeListener("close", this.#onSocketClose)
		this.socket.removeListener("error", this.#onSocketError)

		//Notify discard
		this.events.fire("discard")

		//Destroy socket
		this.#socket.destroy()
		this.#socket = null
	}

	public toString(): string {
		return this.id
	}

	/**
	 * Reads inbound data for the socket
	 * @param buffer Data to read
	 */
	public abstract read(buffer: Buffer): void

	/**
	 * Writes outbound data for the socket
	 * @param buffer Data to write
	 */
	public abstract write(buffer: Buffer): void

	#onSocketEnd = () => this.discard()
	#onSocketClose = (hadError: boolean) => this.discard()
	#onSocketError = (error: Error) => {
		Supeer.console().error(error)

		this.discard()
	}
}