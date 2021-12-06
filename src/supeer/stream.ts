import _Utils from "./stream/utils.js"
import {Writable} from "stream"

/**
 * Defines the output streams where logs should be written
 */
export class Stream {
	/** Standard output */
	public static out: Writable = process.stdout

	/** Error output */
	public static err: Writable = process.stderr
}

export namespace Stream {
	export type Utils = _Utils
	export const Utils = _Utils
}

export default Stream