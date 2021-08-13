export abstract class Parameter {
	public readonly description: string
	public readonly optional: boolean

	public constructor({description = "", optional = false}: Parameter.Descriptor) {
		this.description = description
		this.optional = optional
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