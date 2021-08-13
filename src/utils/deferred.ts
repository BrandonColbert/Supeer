/**
 * When some setup process must be undergone asynchronously before use
 */
export default interface Deferred {
	/**
	 * Waits until setup has been completed
	 */
	ready(): Promise<void>
}