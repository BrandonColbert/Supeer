"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dispatcher = void 0;
/**
 * Enables dispatching of events in a category
 */
class Dispatcher {
    #listeners;
    /**
     * @param eventsType Type containing all possible events
     */
    constructor(...events) {
        this.#listeners = new Map();
        if (!events)
            return;
        this.register(...events);
    }
    /**
     * Send out a new event
     * @param event Event type
     * @param details Event details
     */
    async fire(event, details) {
        await Promise.all([...this.#listeners.get(event.toString())].map(callback => callback(details)));
    }
    /**
     * Add an event listener
     * @param event Event to listen for
     * @param callback Listener callback
     * @returns Callback instance
     */
    on(event, callback) {
        this.#listeners.get(event.toString()).add(callback);
        return callback;
    }
    /**
     * Add an event listener that will be removed after its first call
     * @param event Event to listen for
     * @param callback Listener callback
     * @returns Callback instance
     */
    once(event, callback) {
        let cb;
        cb = details => {
            callback(details);
            this.forget(event, cb);
        };
        return this.on(event, cb);
    }
    /**
     * Remove an event listener
     * @param event Event to stop listening for
     * @param callback Listener callback
     */
    forget(event, callback) {
        this.#listeners.get(event.toString()).delete(callback);
    }
    /**
     * Remove all event listeners
     */
    forgetAll() {
        for (let [, value] of this.#listeners)
            value.clear();
    }
    /**
     * Register a new event type
     * @param event Event type
     */
    register(...event) {
        for (let e of event) {
            if (this.#listeners.has(e.toString())) {
                console.error(`Event ${e} is already registered`);
                continue;
            }
            this.#listeners.set(e.toString(), new Set());
        }
    }
    /**
     * Register an existing event type
     * @param event Event type
     */
    unregister(...event) {
        for (let e of event) {
            if (!this.#listeners.has(e.toString())) {
                console.error(`Event ${e} is not registered`);
                continue;
            }
            this.#listeners.delete(e.toString());
        }
    }
}
exports.Dispatcher = Dispatcher;
exports.default = Dispatcher;
