import Parameter from "./parameter.js"
import ParameterError from "./parameterError.js"
import Pool from "./pool.js"

type Constructor = Function & {prototype: any}

export default class ObjectParameter extends Parameter {
	public readonly name: string
	public readonly type: Constructor

	public constructor({description = undefined, optional = undefined, name, type}: ObjectParameter.Descriptor) {
		super({description: description, optional})
		this.name = name
		this.type = type
	}

	public take(arg: string): any {
		switch(this.type) {
			case Boolean:
				return arg === "true"
			case Number:
				return parseFloat(arg)
			case String:
				return arg
			default:
				if(!Pool.has(arg))
					throw new ParameterError(`${this.type.name} '${this.name}' does not exist`)

				let value = Pool.get(arg)

				if(!(value instanceof this.type))
					throw new ParameterError(`Expected ${this.type.name} for '${this.name}' but got ${value.constructor.name}`)

				return value
		}
	}

	public override toString(): string {
		switch(this.type) {
			case Boolean:
			case Number:
			case String:
				return `[${this.name}${this.optional ? "?" : ""}]`
			default:
				return `<${this.name}${this.optional ? "?" : ""}>`
		}
	}
}

export namespace ObjectParameter {
	export interface Descriptor extends Parameter.Descriptor {
		name: string
		type: Constructor
	}
}