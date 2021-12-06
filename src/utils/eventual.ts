import {Dispatcher} from "../../lib/cobrasu/core.js"
import Deferred from "./deferred.js"
import Discardable from "./discardable.js"

/**
 * When time is required before use and the result may be discarded afterwards
 */
export interface Eventual extends Deferred, Discardable {
	readonly events: Dispatcher<Eventual.Events>
}

export namespace Eventual {
	export type Events = Deferred.Events & Discardable.Events
}

export default Eventual