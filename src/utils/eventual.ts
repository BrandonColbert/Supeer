import Deferred from "./deferred.js"
import Discardable from "./discardable.js"

/**
 * When time is required before use and the result may be discarded afterwards
 */
type Eventual = Deferred & Discardable
export default Eventual