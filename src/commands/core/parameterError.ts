export default class ParameterError extends Error {
	public constructor(message?: string) {
		super(message)
	}
}