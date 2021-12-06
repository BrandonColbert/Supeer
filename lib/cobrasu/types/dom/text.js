"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const text_js_1 = __importDefault(require("../text.js"));
/**
 * Text related utilities
 */
class Text extends text_js_1.default {
    /**
     * Rename an object through an element's text.
     *
     * This assumes the element's text is the original value and that the text field may be modified.
     * @param value Element whose text is to be altered
     * @returns The new value or null if renaming failed
     */
    static rename(element) {
        let originalText = element.textContent;
        function complete() {
            element.contentEditable = "false";
            element.scrollLeft = 0;
        }
        return new Promise(resolve => {
            let keyListener;
            let blurListener;
            keyListener = e => {
                switch (e.code) {
                    case "Enter": //Enter
                        element.removeEventListener("blur", blurListener);
                        element.removeEventListener("keydown", keyListener);
                        element.blur();
                        complete();
                        if (!element.textContent)
                            resolve(null);
                        resolve(element.textContent);
                        break;
                    case "Escape": //Exit
                        element.blur();
                        break;
                }
            };
            blurListener = () => {
                element.removeEventListener("keydown", keyListener);
                element.textContent = originalText;
                complete();
                resolve(null);
            };
            element.addEventListener("keydown", keyListener);
            element.addEventListener("blur", blurListener, { once: true });
            element.contentEditable = "true";
            element.focus();
        });
    }
}
exports.default = Text;
