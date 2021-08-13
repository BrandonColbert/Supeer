import Discardable from "./discardable.js"

type MaybePromise<T> = T | Promise<T>

/**
 * @param items Objects using resources
 * @param action Action to complete before discarding the objects
 */
export default function using<T extends Discardable[]>(...items: T): (action: (...value: T) => MaybePromise<void>) => MaybePromise<void> {
	function discard() {
		for(let item of items)
			item.discard()
	}

	return action => {
		let result = action(...items)

		//Check if the item usage was a promise
		if(result instanceof Promise)
			return result.then(discard) //Discard after promise is resolved

		discard() //Discard immediately
		return undefined
	}
}