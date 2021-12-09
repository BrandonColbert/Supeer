declare namespace CoBraSU {
	namespace Core {
		/**
		 * Converts CSS color text from format to another
		 * @param value Color text
		 * @param to Target format
		 * @returns Color text in target format
		 */
		class Colorizer {
			static convert(value: string, to: Colorizer.Format): string;
			static wheel(count: number, format?: Colorizer.Format): IterableIterator<string>;
		}

		namespace Colorizer {
			type Format = "hex" | "hsl" | "rgb";
		}

		type UnionToTuple<T extends string, U extends string[] = []> = {
			[S in T]: Exclude<T, S> extends never ? [...U, S] : UnionToTuple<Exclude<T, S>, [...U, S]>;
		}[T] & string[];

		type Keys<T extends {
			[index: string]: any;
		}> = keyof T extends string ? keyof T : never;

		/**
		 * Enables dispatching of events in a category
		 */
		class Dispatcher<Events extends Dispatcher.EventMap> {
			#private;
			/**
			 * @param eventsType Type containing all possible events
			 */
			constructor(...events: Dispatcher.EventList<Events>);
			/**
			 * Send out a new event
			 * @param event Event type
			 * @param details Event details
			 */
			fire<T extends keyof Events>(event: T, details?: Events[T]): Promise<void>;
			/**
			 * Add an event listener
			 * @param event Event to listen for
			 * @param callback Listener callback
			 * @returns Callback instance
			 */
			on<T extends keyof Events>(event: T, callback: Dispatcher.Callback<Events, T>): Dispatcher.Callback<Events, T>;
			/**
			 * Add an event listener that will be removed after its first call
			 * @param event Event to listen for
			 * @param callback Listener callback
			 * @returns Callback instance
			 */
			once<T extends keyof Events>(event: T, callback: Dispatcher.Callback<Events, T>): Dispatcher.Callback<Events, T>;
			/**
			 * Remove an event listener
			 * @param event Event to stop listening for
			 * @param callback Listener callback
			 */
			forget<T extends keyof Events>(event: T, callback: Dispatcher.Callback<Events, T>): void;
			/**
			 * Remove all event listeners
			 */
			forgetAll(): void;
			/**
			 * Register a new event type
			 * @param event Event type
			 */
			protected register<T extends keyof Events>(...event: T[]): void;
			/**
			 * Register an existing event type
			 * @param event Event type
			 */
			protected unregister<T extends keyof Events>(...event: T[]): void;
		}

		namespace Dispatcher {
			type EventMap = Record<string | number, any>;
			type EventList<Events extends EventMap> = UnionToTuple<Keys<Events>>;
			type Callback<Events extends EventMap, T extends keyof Events> = (details: Events[T]) => any | Promise<any>;
			namespace Callback {
				type Function = Callback<any, any>;
			}
		}

		/**
		 * Text related utilities
		 */
		class Text {
			/**
			 * Simplifies a string to be searched easier
			 * @param value String to be simplified
			 * @returns The value as a simplified string
			 */
			static simplify(value: string): string;
			/**
			 * Converts an variable-like name to a user-friendly name
			 * @param value Variable-like name
			 * @returns A user-friendly name
			 */
			static transformToName(value: string): string;
		}

		/** All types in array excluding last */
		type ExcludeLast<T extends [...any, any]> = T extends [...infer A, infer _] ? A : never;
		/** Last type in array */
		type Last<T extends [...any, any]> = T extends [...infer _, infer B] ? B : never;
		/** Returns void if the array is empty */
		type VoidIfEmpty<T> = T extends [] ? void : T;
		/** Funciton argumentst that include a callback function */
		type ArgsWithCallback = [...any, (...args: any[]) => void];
		/**
		 * Converts a function whose parameters end in a callback into a promise
		 * @param fn Function reference
		 * @param args Arguments to the function excluding the callback
		 */
		function promisify<T extends ArgsWithCallback>(fn: (...args: T) => void, ...args: ExcludeLast<T>): Promise<VoidIfEmpty<Parameters<Last<T>>>>;
		/**
		 * Converts a function whose parameters end in a callback into a promise
		 * @param target Object to bind to function as calling context
		 * @param fn Function reference
		 * @param args Arguments to the function excluding the callback
		 */
		function promisify<T extends ArgsWithCallback>(target: object, fn: (...args: T) => void, ...args: ExcludeLast<T>): Promise<VoidIfEmpty<Parameters<Last<T>>>>;
		
		namespace MathX {
			/**
			 * Index of the maximum number
			 * @param values Numbers to compare
			 * @returns The index of the largest number or -1 if the array is empty
			 */
			function argmax(...values: number[]): number;
			/**
			 * Index of the minimum number
			 * @param values Numbers to compare
			 * @returns The index of the smallest number or -1 if the array is empty
			 */
			function argmin(...values: number[]): number;
			/**
			 * @param lower Lower bound
			 * @param upper Upper bound
			 * @returns A random number in the given range
			 */
			function range(lower: number, upper: number): number;
			/**
			 * @param upper Upper bound
			 * @returns A random number between 0 and the upper bound
			 */
			function range(upper: number): number;
			/**
			 * @returns A random number between 0 and 1
			 */
			function range(): number;
		}
	}
}

export default CoBraSU