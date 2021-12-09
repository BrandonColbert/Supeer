import CoBraSU from "../../lib/cobrasu-0.1.0.js"

/**
 * When some setup process must be undergone asynchronously before use
 */
export interface Deferred {
	readonly events: CoBraSU.Core.Dispatcher<Deferred.Events>

	/**
	 * Waits until setup has been completed
	 */
	ready(): Promise<void>
}

export namespace Deferred {
	export interface Events {
		/**
		 * Called when setup has been completed
		 */
		ready: void
	}
}

export default Deferred