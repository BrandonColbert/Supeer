/**
 * Used to write a string in smaller chunks which are composed on the receiving end
 */
export class Buffered {
	/**
	 * @param msg Message to write in separate chunks
	 * @param senders Method used to send a single message
	 * @param chunkSize Amount of bytes to separate each chunk into
	 */
	public static write(msg: string, senders: Buffered.Send | Buffered.Send[], chunkSize: number = 64 * 4 * 4): void {
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
			let data = JSON.stringify({
				size: buffer.length,
				offset: start,
				data: [...buffer.slice(start, end ?? (start + chunkSize))]
			})

			for(let fn of senders as Buffered.Send[])
				fn(data)
		}

		//Convert the message into a buffer and determine chunks required
		let buffer = Buffer.from(msg)
		let chunks = Math.ceil(buffer.length / chunkSize)

		//Send each chunk sequentially
		for(let i = 0; i < chunks - 1; i++)
			send(buffer, i * chunkSize)

		send(buffer, (chunks - 1) * chunkSize, msg.length)
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
		private chunkAccumulator: string
		private messageBuffer: Buffer

		/**
		 * @param sender Each composed message is passed to this callback
		 */
		public constructor(listener: Listener) {
			this.listener = listener
			this.chunkAccumulator = ""
		}

		/**
		 * Reads single or multiple, partial or complete chunks of a message
		 * @param chunks Message chunk
		 */
		public read(chunks: string | Buffer): void {
			this.chunkAccumulator += chunks.toString()

			for(let chunk of [...this.chunkAccumulator.matchAll(/{.*?}/g)].map(group => group[0])) {
				//Consume the chunk from the accumulator
				this.chunkAccumulator = this.chunkAccumulator.substring(chunk.length)

				//Convert to info describing the chunk
				let info: {size: number, offset: number, data: number[]} = JSON.parse(chunk)

				//If the offset is zero, a new message is being sent
				if(info.offset == 0)
					this.messageBuffer = Buffer.alloc(info.size)

				//Create a buffer for the chunk and copy it into the composite message buffer
				let db = Buffer.from(info.data)
				db.copy(this.messageBuffer, info.offset)

				//Check if the chunk completed the message
				if(info.offset + db.length != info.size)
					return

				//Send the composed message and release the buffer
				this.listener(this.messageBuffer.toString())
				this.messageBuffer = null
			}

			if(this.chunkAccumulator.length > 0 && this.chunkAccumulator[0] != "{")
				throw new Error(`Invalid chunkstate '${this.chunkAccumulator[0]}'`)
		}
	}
}

export default Buffered