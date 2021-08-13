import Command from "./command.js"
import Parameter from "./parameter.js"
import ParameterError from "./parameterError.js"

type Constructor<T> = new() => T

export class CommandParameter extends Parameter {
	private subcommands: Map<string, Command>

	public constructor({description = undefined, optional = undefined, commands}: CommandParameter.Descriptor) {
		super({description: description, optional: optional})
		this.subcommands = new Map<string, Command>(commands.map(cc => {
			let c = new cc()
			return [c.name, c]
		}))
	}

	public take(arg: string): any {
		if(!this.subcommands.has(arg))
			throw new ParameterError(`'${arg}' is not ${this}`)

		return this.subcommands.get(arg)
	}

	public override toString(): string {
		return `${[...this.subcommands.keys()].join("|")}${this.optional ? "?" : ""}`
	}

	public *[Symbol.iterator](): IterableIterator<Command> {
		for(let value of this.subcommands.values())
			yield value
	}
}

export namespace CommandParameter {
	export interface Descriptor extends Parameter.Descriptor {
		commands: Constructor<Command>[]
	}
}

export default CommandParameter