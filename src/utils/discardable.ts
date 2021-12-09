import CoBraSU from "../../lib/cobrasu-0.1.0.js"

/**
 * Manages some resource that may be freed
 */
export interface Discardable {
	readonly events: CoBraSU.Core.Dispatcher<Discardable.Events>

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