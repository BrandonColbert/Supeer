/** All types in array excluding last */
type ExcludeLast<T extends [...any, any]> = T extends [...infer A, infer _] ? A : never

/** Last type in array */
type Last<T extends [...any, any]> = T extends [...infer _, infer B] ? B : never

/** Returns void if the array is empty */
type VoidIfEmpty<T> = T extends [] ? void : T

/** Funciton argumentst that include a callback function */
type ArgsWithCallback = [...any, (...args: any[]) => void]

/**
 * Converts a function whose parameters end in a callback into a promise
 * @param fn Function reference
 * @param args Arguments to the function excluding the callback
 */
export default function promisify<T extends ArgsWithCallback>(fn: (...args: T) => void, ...args: ExcludeLast<T>): Promise<VoidIfEmpty<Parameters<Last<T>>>>

/**
 * Converts a function whose parameters end in a callback into a promise
 * @param target Object to bind to function as calling context
 * @param fn Function reference
 * @param args Arguments to the function excluding the callback
 */
export default function promisify<T extends ArgsWithCallback>(target: object, fn: (...args: T) => void, ...args: ExcludeLast<T>): Promise<VoidIfEmpty<Parameters<Last<T>>>>

export default function promisify(...pars: any[]) {
	let target: object
	let fn: Function
	let args: any[]

	if(pars.length == 0)
		throw new Error("Expected at least 1 parameter")

	switch(typeof pars[0]) {
		case "object":
			[target, fn, ...args] = pars as [object, Function, any[]]
			fn = fn.bind(target)
			break
		case "function":
			[fn, ...args] = pars as [Function, any[]]
			break
		default:
			throw new Error(`First parameter is unexpected type '${typeof pars[0]}'`)
	}

	return new Promise(r => fn(...args, (...callbackArgs: any[]) => r(callbackArgs)))
}