import Parameter from "./parameter.js"
import ParameterError from "./parameterError.js"

export default abstract class Command {
	public abstract readonly name: string
	public abstract readonly description: string
	private parameters: Parameter[] = []

	public abstract execute(args: string[], options: Record<string, any>): Promise<void>

	public help(): string {
		let pars = [this.name, ...this.parameters.map(p => `${p}`)]
			.join(" ")

		let parDescs = this.parameters
			.map(p => `\n\t${p}: ${p.description ?? p.constructor.name}`)
			.join("")

		return pars + parDescs
	}

	protected add(...parameters: Parameter[]): void {
		for(let parameter of parameters)
			this.parameters.push(parameter)
	}

	protected *take(args: string[]): IterableIterator<any> {
		let requirement = this.parameters
			.map(v => v.optional ? 0 : 1)
			.reduce((a, v) => a + v, 0)

		if(args.length < requirement)
			throw new ParameterError(this.help())

		for(let parameter of this.parameters) {
			let result = args.length > 0 ? parameter.take(args.shift()) : null

			if(result == null) {
				yield null

				if(!parameter.optional)
					break
			}

			yield result
		}
	}

	protected getParameter<T extends Parameter>(index: number): T {
		return this.parameters[index] as T
	}
}