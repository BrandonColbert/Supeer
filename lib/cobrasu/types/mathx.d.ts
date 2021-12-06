/**
 * Index of the maximum number
 * @param values Numbers to compare
 * @returns The index of the largest number or -1 if the array is empty
 */
export declare function argmax(...values: number[]): number;
/**
 * Index of the minimum number
 * @param values Numbers to compare
 * @returns The index of the smallest number or -1 if the array is empty
 */
export declare function argmin(...values: number[]): number;
/**
 * @param lower Lower bound
 * @param upper Upper bound
 * @returns A random number in the given range
 */
export declare function range(lower: number, upper: number): number;
/**
 * @param upper Upper bound
 * @returns A random number between 0 and the upper bound
 */
export declare function range(upper: number): number;
/**
 * @returns A random number between 0 and 1
 */
export declare function range(): number;
