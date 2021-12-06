import {Dispatcher} from "../../lib/cobrasu/core.js"

/**
 * When some setup process must be undergone asynchronously before use
 */
export interface Deferred {
	readonly events: Dispatcher<Deferred.Events>

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