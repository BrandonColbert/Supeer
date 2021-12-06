"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Text related utilities
 */
class Text {
    /**
     * Simplifies a string to be searched easier
     * @param value String to be simplified
     * @returns The value as a simplified string
     */
    static simplify(value) {
        return value
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    }
    /**
     * Converts an variable-like name to a user-friendly name
     * @param value Variable-like name
     * @returns A user-friendly name
     */
    static transformToName(value) {
        return value
            .replace(/^[a-z]/, s => s.toUpperCase())
            .replace(/([a-z])([A-Z])/g, (_, ...p) => `${p[0]} ${p[1]}`);
    }
}
exports.default = Text;
