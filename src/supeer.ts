import {Console} from "console"
import _Stream from "./supeer/stream.js"
import _Config from "./supeer/config.js"
import Pool from "./utils/pool.js"

// @ts-ignore
import packageFile from "../package.json"

export class Supeer {
	/**
	 * Stores objects and processes created via commands
	 */
	public static readonly pool: Pool = new Pool()

	private static loggers: WeakMap<object, Console> = new WeakMap()

	/**
	 * The current version of Supeer
	 */
	public static get version(): string {
		return packageFile?.version ?? "?"
	}

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
	export type Stream = _Stream
	export const Stream = _Stream

	export type Config = _Config
	export const Config = _Config
}

export default Supeer