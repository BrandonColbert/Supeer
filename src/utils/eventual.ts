import CoBraSU from "../../lib/cobrasu-0.1.0.js"
import Deferred from "./deferred.js"
import Discardable from "./discardable.js"

/**
 * When time is required before use and the result may be discarded afterwards
 */
export interface Eventual extends Deferred, Discardable {
	readonly events: CoBraSU.Core.Dispatcher<Eventual.Events>
}

export namespace Eventual {
	export type Events = Deferred.Events & Discardable.Events
}

export default Eventual