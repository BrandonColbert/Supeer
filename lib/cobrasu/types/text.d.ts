/**
 * Text related utilities
 */
export default class Text {
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
