import {Transform, Writable} from "stream"

/**
 * Stream oriented utilities
 */
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

export default Utils