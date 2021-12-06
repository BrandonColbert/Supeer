export declare class Colorizer {
    /**
     * Converts CSS color text from format to another
     * @param value Color text
     * @param to Target format
     * @returns Color text in target format
     */
    static convert(value: string, to: Colorizer.Format): string;
    static wheel(count: number, format?: Colorizer.Format): IterableIterator<string>;
}
export declare namespace Colorizer {
    type Format = "hex" | "hsl" | "rgb";
}
export default Colorizer;
