import net from "net"
import http from "http"
import stream from "stream"
import {v4 as uuid} from "uuid"
import Courier from "../couriers/courier.js"
import Host from "../peers/host.js"
import Lobby from "./lobby.js"
import Guest from "../peers/guest.js"
import Discardable from "../utils/discardable.js"
import Eventual from "../utils/eventual.js"
import Supeer from "../supeer.js"
import promisify from "../utils/promisify.js"

export class Proxy {
	public static readonly localhostAddress: string = "127.0.0.1"

	/**
	 * @returns The external IPv4 address of this device
	 */
	public static getExternalAddress(): Promise<string> {
		let options = {
			host: "ipv4bot.whatismyipaddress.com",
			port: 80,
			path: "/"
		}

		return new Promise((resolve, reject) => {
			let request = http.get(options, res => {
				res.on("data", chunk => resolve(chunk))
			})
			
			request.on("error", err => reject(err.message))
		})
	}
}

export namespace Proxy {
	/**
	 * Contains the address and port of a connection
	 */
	export interface SocketAddress {
		address: string
		port: number
	}

	/**
	 * Enables socket IO customization
	 */
	export abstract class Connection implements Discardable {
		public readonly id: string
		public readonly socket: net.Socket

		public constructor(id: string, socket: net.Socket) {
			this.id = id
			this.socket = socket

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
		}

		public discard(): void {
			this.socket.destroy()
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
	}

	/**
	 * Uses WebRTC to act as a proxy for local server connected to clusters of remote clients
	 */
	export class Server implements Eventual {
		public readonly port: number
		public readonly host: Host
		private readonly clusters: Map<string, Map<string, Server.Connection>>
		private readonly setupPromise: Promise<void>
		private lobby: Lobby

		/**
		 * @param courier Courier to connect peers with
		 * @param port Port which the local server is running on
		 */
		public constructor(courier: Courier, port: number) {
			this.host = new Host()
			this.port = port
			this.clusters = new Map()

			this.setupPromise = new Promise<void>(async r => {
				//Create a lobby listening for requests to this device's external ip and specified proxy port
				this.lobby = new Lobby(courier, this.host, `${await Proxy.getExternalAddress()}:${port}`)

				this.host.events.on("connect", e => {
					//Since each guest is a remote client proxy enabling multiple connections, register a connected guest as a cluster of connections
					let connections = new Map<string, Server.Connection>()
					this.clusters.set(e.id, connections)

					Supeer.console(this).log(`Connected cluster '${e.id}'`)
				})
	
				this.host.events.on("disconnect", e => {
					//Remove all the connections associated with the guest on a disconnect event
					let connections = this.clusters.get(e.id)

					for(let connection of connections.values())
						connection.discard()

					connections.clear()
					this.clusters.delete(e.id)

					Supeer.console(this).log(`Disconnected cluster '${e.id}'`)
				})
	
				this.host.events.on("recieve", e => {
					//Determine which connection on the client the message is being sent from and get its data
					let info: {id: string, data: number[]}

					try {
						info = JSON.parse(e.message)
					} catch(err) {
						console.error(err)
						Supeer.console(this).error(`Received invalid JSON from cluster '${e.id}'\n${e.message}`)
	
						this.host.disconnect(e.id)
						return
					}

					//Create a buffer from the data
					let buffer = Buffer.from(info.data)

					//Get the connection from the guest cluster
					let connections = this.clusters.get(e.id)
					let connection = connections.get(info.id)

					if(!connection) {
						//Since the connection does not exist, create a new connection to the locally hosted server that the proxy will manage
						let socket = net.createConnection({
							host: Proxy.localhostAddress,
							port: this.port
						})

						connection = new Server.Connection(this.host, socket, {
							guestId: e.id,
							connectionId: info.id
						})

						connection.socket.on("close", () => {
							connection.discard()
							connections.delete(info.id)

							Supeer.console(this).log(`Disconnected client '${info.id}' on cluster '${e.id}'`)
						})

						connections.set(info.id, connection)

						Supeer.console(this).log(`Connected client '${info.id}' on cluster '${e.id}'`)
					}

					//Read the incoming message to the associated socket using its proxy connection
					connection.read(buffer)
				})

				Supeer.console(this).log(`Started for local server '${this.lobby.code}'`)
				r()
			})
		}

		public async ready(): Promise<void> {
			await this.setupPromise
		}

		public discard(): void {
			Supeer.console(this).log(`Stopping at local server '${this.lobby.code}'...`)

			this.lobby.discard()
			this.host.discard()

			for(let connections of this.clusters.values())
				for(let connection of connections.values())
					connection.discard()

			this.clusters.clear()
		}

		public toString(): string {
			return `ServerProxy[port=${this.port}]`
		}
	}

	export namespace Server {
		export class Connection extends Proxy.Connection {
			private readonly host: Host
			private readonly guestId: string

			public constructor(host: Host, socket: net.Socket, {guestId, connectionId}: {guestId: string, connectionId: string}) {
				super(connectionId, socket)
				this.host = host
				this.guestId = guestId
			}

			public read(buffer: Buffer): void {
				this.socket.write(buffer, "binary")
			}

			public write(buffer: Buffer): void {
				let info = {
					id: this.id,
					data: [...buffer]
				}

				this.host.send(JSON.stringify(info), [this.guestId])
			}
		}
	}

	/**
	 * Uses WebRTC to act as a proxy for local clients connected to a remote server
	 */
	export class Client implements Eventual {
		public readonly port: number
		public readonly dest: SocketAddress
		public readonly guest: Guest
		private readonly connections: Map<string, Client.Connection>
		private setupPromise: Promise<void>
		#server: net.Server
	
		/**
		 * @param courier Courier to connect peers with
		 * @param port Port to run the proxy server on
		 * @param dest Address and port of the actual server
		 */
		public constructor(courier: Courier, port: number, dest: SocketAddress) {
			this.port = port
			this.dest = dest
			this.guest = new Guest()
			this.connections = new Map()

			this.guest.events.on("disconnect", () => this.discard())
			this.guest.events.on("recieve", e => {
				let info: {id: string, data: number[]}

				try {
					info = JSON.parse(e.message)
				} catch(err) {
					console.error(err)
					Supeer.console(this).error(`Received invalid JSON\n${e.message}`)

					this.discard()
					return
				}

				let buffer = Buffer.from(info.data)

				let connection = this.connections.get(info.id)
				connection?.read(buffer)
			})

			this.#server = net.createServer(async socket => {
				let connection = new Client.Connection(this.guest, socket)

				socket.on("close", () => {
					connection.discard()
					this.connections.delete(connection.id)

					Supeer.console(this).log(`Client '${connection.id}' disconnected`)
				})

				this.connections.set(connection.id, connection)

				Supeer.console(this).log(`Client '${connection.id}' connected`)
			})

			this.setupPromise = new Promise<void>(async r => {
				const code = `${dest.address}:${dest.port}`

				try {
					await Lobby.join(courier, this.guest, code)	
				} catch(err) {
					console.error(err)
					Supeer.console(this).error(`Unable to join lobby '${code}'`)

					this.#server.close()
					this.#server = null
					return
				}

				await promisify<[number, () => void]>(this.#server, this.#server.listen, port)

				Supeer.console(this).log(`Connected port '${this.port}' to '${this.dest.address}:${this.dest.port}'`)
				r()
			})
		}

		public get server(): net.Server {
			return this.#server
		}

		public async ready(): Promise<void> {
			await this.setupPromise
		}

		public discard(): void {
			if(!this.#server)
				return

			Supeer.console(this).log(`Disconnecting port '${this.port}' from '${this.dest.address}:${this.dest.port}'`)

			;[...this.connections.values()].forEach(c => c.discard())
			this.connections.clear()

			this.#server.close()
			this.#server = null
		}

		public toString(): string {
			if(!this.server)
				return "*ClientProxy"

			let {address, port} = this.dest
			return `ClientProxy[port=${this.port}, dest=${address}:${port}]`
		}
	}

	export namespace Client {
		export class Connection extends Proxy.Connection {
			private readonly guest: Guest

			public constructor(guest: Guest, socket: net.Socket) {
				super(uuid(), socket)
				this.guest = guest
			}

			public read(buffer: Buffer): void {
				this.socket.write(buffer)
			}

			public write(buffer: Buffer): void {
				let info = {
					id: this.id,
					data: [...buffer]
				}

				this.guest.send(JSON.stringify(info))
			}
		}
	}
}

export default Proxy