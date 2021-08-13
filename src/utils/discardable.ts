/**
 * Manages some resource that may be freed
 */
export default interface Discardable {
	/**
	 * Release associated resources
	 */
	discard(): void
}