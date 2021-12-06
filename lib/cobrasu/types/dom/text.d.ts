import { default as StandardText } from "../text.js";
/**
 * Text related utilities
 */
export default class Text extends StandardText {
    /**
     * Rename an object through an element's text.
     *
     * This assumes the element's text is the original value and that the text field may be modified.
     * @param value Element whose text is to be altered
     * @returns The new value or null if renaming failed
     */
    static rename(element: HTMLElement): Promise<string>;
}
