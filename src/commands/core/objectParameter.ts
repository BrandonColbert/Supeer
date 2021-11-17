import Supeer from "../../supeer.js"
import Parameter from "./parameter.js"
import ParameterError from "./parameterError.js"

type Constructor = Function & {prototype: any}

export default class ObjectParameter extends Parameter {
	public readonly name: string
	public readonly type: Constructor

	public constructor(descriptor: ObjectParameter.Descriptor) {
		super(descriptor)
		this.name = descriptor.name
		this.type = descriptor.type
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
				if(!Supeer.pool.has(arg))
					throw new ParameterError(`Object '${arg}' could not be found in the pool`)

				let value = Supeer.pool.get(arg)

				if(!(value instanceof this.type))
					throw new ParameterError(`Expected a ${this.type.name} for parameter <${this.name}>, but '${arg}' was a ${value.constructor.name}`)

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