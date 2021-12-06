import {Dispatcher} from "../../lib/cobrasu/core.js"

/**
 * Manages some resource that may be freed
 */
export interface Discardable {
	readonly events: Dispatcher<Discardable.Events>

	/**
	 * Release associated resources
	 */
	discard(): void
}

export namespace Discardable {
	export interface Events {
		/**
		 * Called when the resource is freed
		 */
		discard: void
	}
}

export default Discardable