import Discardable from "./discardable.js"

export class Pool {
	private objects: Map<string, Pool.Entry> = new Map()
	private processes: Map<number, Pool.Entry> = new Map()
	private unusedIds: Set<number> = new Set()
	private nextId: number = 0

	public *[Symbol.iterator](): IterableIterator<string | number> {
		for(let category of this.objects.keys())
			yield category

		for(let pid of this.processes.keys())
			yield pid
	}

	public add<T extends Pool.Entry>(value: T): void
	public add<T extends Pool.Entry>(name: string, value: T): void
	public add<T extends Pool.Entry>(par1: string | T, par2?: T): void {
		let name: string
		let value: T

		if(par2) {
			name = par1 as string
			value = par2
		} else
			value = par1 as T

		if(name) {
			if(this.objects.has(name))
				return

			this.objects.set(name, value)
		} else {
			let id: number

			if(this.unusedIds.size == 0) {
				id = this.nextId
				++this.nextId
			} else {
				let it = this.unusedIds[Symbol.iterator]()
				let result = it.next()
				id = result.value

				this.unusedIds.delete(id)
			}

			this.processes.set(id, value)
		}
	}

	public get(pid: number): Pool.Entry
	public get(name: string): Pool.Entry
	public get(par1: number | string): Pool.Entry {
		switch(typeof par1) {
			case "string":
				let name = par1 as string
				return this.objects.get(name)
			case "number":
				let pid = par1 as number
				return this.processes.get(pid)
		}
	}

	public has(pid: number): boolean
	public has(name: string): boolean
	public has(par1: number | string): boolean {
		switch(typeof par1) {
			case "string":
				let name = par1 as string
				return this.objects.has(name)
			case "number":
				let pid = par1 as number
				return this.processes.has(pid)
		}
	}

	public remove(pid: number): boolean
	public remove(name: string): boolean
	public remove(par1: number | string): boolean {
		let value: Pool.Entry

		switch(typeof par1) {
			case "string":
				let name = par1 as string

				if(this.objects.has(name)) {
					value = this.objects.get(name)
					this.objects.delete(name)
				}
				break
			case "number":
				let pid = par1 as number

				if(this.processes.has(pid)) {
					value = this.processes.get(pid)
					this.processes.delete(pid)
					this.unusedIds.add(pid)
				}
				break
		}

		value?.discard()

		return value != null
	}

	public removeAll(): void {
		for(let value of this.objects.values())
			value.discard()

		for(let value of this.processes.values())
			value.discard()

		this.objects.clear()
		this.processes.clear()
		this.unusedIds.clear()
		this.nextId = 0
	}
}

export namespace Pool {
	export type Entry = Discardable
}

export default Pool