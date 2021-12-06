/** All types in array excluding last */
declare type ExcludeLast<T extends [...any, any]> = T extends [...infer A, infer _] ? A : never;
/** Last type in array */
declare type Last<T extends [...any, any]> = T extends [...infer _, infer B] ? B : never;
/** Returns void if the array is empty */
declare type VoidIfEmpty<T> = T extends [] ? void : T;
/** Funciton argumentst that include a callback function */
declare type ArgsWithCallback = [...any, (...args: any[]) => void];
/**
 * Converts a function whose parameters end in a callback into a promise
 * @param fn Function reference
 * @param args Arguments to the function excluding the callback
 */
export default function promisify<T extends ArgsWithCallback>(fn: (...args: T) => void, ...args: ExcludeLast<T>): Promise<VoidIfEmpty<Parameters<Last<T>>>>;
/**
 * Converts a function whose parameters end in a callback into a promise
 * @param target Object to bind to function as calling context
 * @param fn Function reference
 * @param args Arguments to the function excluding the callback
 */
export default function promisify<T extends ArgsWithCallback>(target: object, fn: (...args: T) => void, ...args: ExcludeLast<T>): Promise<VoidIfEmpty<Parameters<Last<T>>>>;
export {};
