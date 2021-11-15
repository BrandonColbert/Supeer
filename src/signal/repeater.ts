import net from "net"
import Peer from "../peers/peer.js"
import Guest from "../peers/guest.js"
import Host from "../peers/host.js"
import Eventual from "../utils/eventual.js"
import Supeer from "../supeer.js"
import promisify from "../utils/promisify.js"
import Buffered from "../utils/buffered.js"

/**
 * Allows an external application to use P2P communication through a local TCP server
 * 
 * Messages written to this server will be repeated by the bound peer to its host/guests
 */
export default class Repeater implements Eventual {
	private sockets: Set<net.Socket> = new Set<net.Socket>()
	private server: net.Server
	private peer: Peer
	private connectionReady: Promise<void>

	/**
	 * The port to start the local server on
	 * @param peer Enables messages sent to this peer to be repeated across all listening applications
	 * @param port Server port
	 */
	public constructor(peer: Peer, port: number) {
		this.peer = peer
		this.server = net.createServer()

		this.server.on("close", () => this.discard())
		this.server.on("connection", socket => {
			let discard = () => {
				if(this.sockets.delete(socket))
					socket.destroy()
			}

			let reader = new Buffered.Reader(line => {
				try {
					let info = JSON.parse(line)
					this.send(info)
				} catch(err) {
					console.error(err)
					Supeer.console(this).error(`Received invalid JSON from '${socket.address()}'\n${line}`)

					socket.destroy()
				}
			})

			socket.on("data", data => reader.read(data))
			socket.on("close", () => discard())
			socket.on("end", () => discard())
			socket.on("close", (hadError: boolean) => discard())
			socket.on("error", (error: Error) => {
				Supeer.console(this).error(error.message)
				discard()
			})

			this.sockets.add(socket)
		})

		if(peer instanceof Guest) {
			peer.events.on("recieve", e => this.recieve({type: "recieve", message: e.message}))

			peer.events.on("connect", () => {
				this.recieve({type: "connect"})
				Supeer.console(this).log(`Peer connected`)
			})

			peer.events.on("disconnect", () => {
				this.recieve({type: "disconnect"})
				Supeer.console(this).log(`Peer disconnected`)
			})
		} else if(peer instanceof Host) {
			peer.events.on("recieve", e => this.recieve({type: "recieve", id: e.id, message: e.message}))

			peer.events.on("connect", e => {
				this.recieve({type: "connect", id: e.id})
				Supeer.console(this).log(`Connected peer '${e.id}'`)
			})

			peer.events.on("disconnect", e => {
				this.recieve({type: "disconnect", id: e.id})
				Supeer.console(this).log(`Disconnected peer '${e.id}'`)
			})
		}

		this.connectionReady = promisify<[number, string, () => void]>(this.server, this.server.listen, port, "localhost").then(() => {
			Supeer.console(this).log("Started!")
		})
	}

	public async ready(): Promise<void> {
		await this.connectionReady
	}

	public discard(): void {
		if(!this.server)
			return

		Supeer.console(this).log("Stopping...")

		for(let socket of this.sockets)
			socket.end()

		this.sockets.clear()

		this.server.close()
		this.server = null
	}

	public toString(): string {
		if(this.server) {
			let address = this.server.address()

			switch(typeof address) {
				case "string":
					return `Repeater[address=${address}]`
				default:
					let {port} = address
					return `Repeater[port=${port}]`
			}
		}

		return "Repeater"
	}

	private send(info: {message: string, ids?: string[]}): void {
		if(this.peer instanceof Host)
			this.peer.send(info.message, info.ids)
		else
			this.peer.send(info.message)
	}

	private recieve(info: {type: string, id?: string, message?: string}): void {
		for(let socket of this.sockets)
			socket.write(`${JSON.stringify(info)}\n`)
	}
}