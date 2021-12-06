import http from "http"
import Supeer from "../supeer.js"
import _SocketAddress from "./proxy/socketAddress.js"
import _Connection from "./proxy/connection.js"
import _Server from "./proxy/server.js"
import _Client from "./proxy/client.js"

export class Proxy {
	/** IPv4 Address for Localhost */
	public static readonly localhostAddress: string = "127.0.0.1"

	/** External IPv4 Address for this machine */
	public static externalAddress: string

	/**
	 * @returns The external IPv4 address of this device
	 */
	public static async getExternalAddress(): Promise<string> {
		async function find(): Promise<boolean> {
			let config = Supeer.Config.get("settings")

			if(!config.proxy)
				return false

			//Use the specified proxy
			if(config.proxy.ipv4) {
				Proxy.externalAddress = config.proxy.ipv4
				return true
			}

			/**
			 * Grab the text at the address
			 * @param options Address info
			 */
			function fetch(options: string | http.RequestOptions | URL): Promise<string> {
				let data = ""
	
				return new Promise((resolve, reject) => {
					let request = http.request(options, res => {
						res.on("data", chunk => data += chunk)
						res.on("end", () => resolve(data))
						res.on("error", e => reject(e))
					})
	
					request.end()
				})
			}

			let ipv4Regex = /^\d+\.\d+\.\d+\.\d+$/

			//Try and get a valid IPv4 from one of the web addresses
			for(let api of [].concat(config.proxy.ipv4api)) {
				try {
					//Grab the IPv4 stated at the address
					let ip = (await fetch(api)).trim()

					//Check if the text is an actual IPv4 address
					if(ip && ipv4Regex.test(ip)) {
						Proxy.externalAddress = ip
						return true
					} else
						console.log(`${api} failed to provide IPv4`, `'${ip}'`)
				} catch(e) {
					console.error(api, e)
				}
			}

			return false
		}

		if(!Proxy.externalAddress && !(await find()))
			throw new Error(`IPv4 could not be found. Define it under proxy or provide acquisition APIs.`)

		return Proxy.externalAddress
	}
}

export namespace Proxy {
	export type SocketAddress = _SocketAddress

	export type Connection = _Connection
	export const Connection = _Connection

	export type Server = _Server
	export const Server = _Server

	export type Client = _Client
	export const Client = _Client
}

export default Proxy