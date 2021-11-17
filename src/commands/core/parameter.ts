export abstract class Parameter {
	public readonly description: string
	public readonly optional: boolean

	public constructor(descriptor: Parameter.Descriptor) {
		this.description = descriptor.description ?? ""
		this.optional = descriptor.optional ?? false
	}

	public abstract take(arg: string): any
}

export namespace Parameter {
	export interface Descriptor {
		description?: string
		optional?: boolean
	}
}

export default Parameter