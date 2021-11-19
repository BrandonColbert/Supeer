/**
 * Used to write a string in smaller chunks which are composed on the receiving end
 */
export class Buffered {
	public static defaultChunkSize: number = 64 * 4 * 4

	/**
	 * @param msg Message to write in separate chunks
	 * @param senders Method used to send a single message
	 * @param chunkSize Amount of bytes to separate each chunk into
	 */
	public static write(msg: string, senders: Buffered.Send | Buffered.Send[], chunkSize: number = Buffered.defaultChunkSize): void {
		//Ensure senders is an array
		if(!Array.isArray(senders))
			senders = [senders]

		/**
		 * Passes a chunk to all senders
		 * @param buffer Source buffer
		 * @param start Chunk start
		 * @param end Chunk end
		 */
		function send(buffer: Buffer, start: number, end?: number): void {
			let data = buffer.slice(start, end ?? (start + chunkSize)).toString()

			for(let fn of senders as Buffered.Send[])
				fn(data)
		}

		//Convert the message to base64, store it in a buffer, and determine chunks required
		let buffer = Buffer.from(Buffer.from(msg).toString("base64"))
		let chunks = Math.ceil(buffer.length / chunkSize)

		//Send each chunk sequentially
		for(let i = 0; i < chunks - 1; i++)
			send(buffer, i * chunkSize)

		send(buffer, (chunks - 1) * chunkSize, buffer.length)

		//Send newline character to signal end of message
		for(let send of senders as Buffered.Send[])
			send("\n")
	}
}

export namespace Buffered {
	/** Passes a message chunk */
	export type Send = (chunk: string) => void

	/** Passes a fully constructed message */
	export type Listener = (message: string) => void

	/**
	 * Creates a reader for incoming buffered writes
	 */
	export class Reader {
		private listener: Listener
		private buffer: Buffer

		/**
		 * @param sender Each composed message is passed to this callback
		 */
		public constructor(listener: Listener) {
			this.listener = listener
			this.buffer = Buffer.alloc(0)
		}

		/**
		 * Reads single or multiple, partial or complete chunks of a message
		 * @param chunks Message chunk
		 */
		public read(chunks: string | Buffer): void {
			//Convert the chunks into a string that can be scanned for newlines
			let data = chunks.toString()
			let delimiterIndex: number

			//Search for newlines that signal the end of individual message
			while((delimiterIndex = data.indexOf("\n")) != -1) {
				//Separate the newline terminated portion from the rest
				let [head, tail] = [data.slice(0, delimiterIndex), data.slice(delimiterIndex + 1)]
				data = tail

				//Use the accumulated buffer and the terminated portion of the incoming data to construct a complete message
				let msg = Buffer.from(this.buffer.toString() + head, "base64").toString()

				//Clear the buffer and send the message
				this.buffer = Buffer.alloc(0)
				this.listener(msg)
			}

			//Add any remaining (non-terminated) data to the buffer
			this.buffer = Buffer.concat([this.buffer, Buffer.from(data)])
		}
	}
}

export default Buffered