import fs from "fs"
import path from "path"
import {Console} from "console"
import {Transform, Writable} from "stream"

export class Supeer {
	private static loggers: WeakMap<object, Console> = new WeakMap()

	/**
	 * @param target Object for messages to be logged under
	 * @returns A cached, object specific logger instance
	 */
	public static console<T extends object>(target: T): Console {
		//Attempt to get object logger
		let logger = this.loggers.get(target)

		if(!logger) {
			let getString = () => `\t${target}: `

			//Create a logger which prepends the object's string value
			logger = new Console(
				Supeer.Stream.Utils.prependStream(Supeer.Stream.out, getString),
				Supeer.Stream.Utils.prependStream(Supeer.Stream.err, getString)
			)

			this.loggers.set(target, logger)
		}

		return logger
	}
}

export namespace Supeer {
	/**
	 * Defines where console messages are sent
	 */
	export class Stream {
		public static out: Writable = process.stdout
		public static err: Writable = process.stderr
	}

	export namespace Stream {
		export class Utils {
			/**
			 * @param value String to add prefix to
			 * @param prefix Prefix to prepend into the value's lines
			 * @returns Value with the prefix prepended to every line
			 */
			public static prependLines(value: string, prefix: string): string {
				return value
					.split(/(.+)\r?\n/g) //Line ending in newline
					.filter(s => s.length > 0) //Which is an actual string
					.map(s => `${prefix}${s}\n`) //Prepend with thing
					.join("")
			}

			/**
			 * @param dest Stream to pipe to
			 * @param getString Returns the prefix string
			 * @returns A new stream which prepends the prefix on every line
			 */
			public static prependStream(dest: Writable, getString: () => string): Transform {
				let stream = new Transform({
					transform(chunk, encoding, callback) {
						callback(null, Utils.prependLines(chunk.toString(), getString()))
					}
				})

				stream.pipe(dest)
	
				return stream
			}
		}
	}

	export class Config {
		public static readonly path: string = "config"
		private static readonly info: Map<string, any> = new Map<string, any>()

		/**
		 * Acquires the configuration information from each file the predefined config path
		 */
		public static async populate(): Promise<void> {
			//Get all files in the config folder
			let files = await new Promise<string[]>((resolve, reject) => fs.readdir(Config.path, (err, files) => {
				if(err)
					reject(err)
				else
					resolve(files)
			}))

			//Parse all JSON files and store their content under the filename as the key
			await Promise.all(files.map(async file => {
				let data = path.parse(file)

				if(data.ext != ".json")
					return

					let content = await new Promise<string>((resolve, reject) => fs.readFile(`${Config.path}/${file}`, (err, data) => {
					if(err)
						reject(err)
					else
						resolve(data.toString())
				}))

				let key = data.name
				let value = {}

				try {
					value = JSON.parse(content)
				} catch(e) {
					console.error(e)
				}

				this.info.set(key, value)
			}))
		}

		/**
		 * @param key Config filename
		 * @returns Content of the JSON file as an object
		 */
		public static get<T = any>(key: string): T {
			return this.info.get(key)
		}

		/**
		 * @param key Config filename
		 * @returns Whether the config file exists
		 */
		public static has(key: string): boolean {
			return this.info.has(key)
		}
	}
}

export default Supeer