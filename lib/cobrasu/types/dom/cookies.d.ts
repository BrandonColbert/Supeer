declare type Constructor<T> = (...args: any[]) => T;
export default class Cookies {
    static get<T = any>(key: string, type: Constructor<any>, defaultValue?: T): T;
    static set(key: string, value: any): void;
    static has(key: string): boolean;
    static delete(key: string): void;
    static clear(): void;
    static [Symbol.iterator](): IterableIterator<[string, string]>;
}
export {};
