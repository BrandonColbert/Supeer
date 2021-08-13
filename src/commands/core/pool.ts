export default class Pool {
	private static registry: Map<string, any> = new Map<string, any>()

	public static set(name: string, value: any): boolean {
		if(Pool.registry.has(name))
			return false

		Pool.registry.set(name, value)

		return true
	}

	public static get(name: string): any {
		if(!Pool.registry.has(name))
			return null

		return Pool.registry.get(name)
	}

	public static remove(name: string): void {
		Pool.registry.delete(name)
	}

	public static has(name: string): boolean {
		return Pool.registry.has(name)
	}

	public static *[Symbol.iterator](): IterableIterator<string> {
		for(let key of this.registry.keys())
			yield key
	}
}