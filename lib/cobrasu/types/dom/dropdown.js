"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dropdown = void 0;
/**
 * Dropdown menu
 */
//TODO: Add support for multi-level dropdowns
class Dropdown {
    /** Element representing this dropdown */
    element;
    constructor() {
        this.element = document.createElement("div");
        this.element.tabIndex = -1;
        this.element.addEventListener("blur", this.#onBlur);
        window.addEventListener("keydown", this.#onKey);
    }
    /**
     * Close this menu
     */
    close() {
        window.removeEventListener("keydown", this.#onKey);
        this.element.removeEventListener("blur", this.#onBlur);
        this.element.remove();
    }
    //Allow the dropdown to be closed by pressing escape
    #onKey = (event) => {
        switch (event.code) {
            case "Escape":
                this.close();
                break;
        }
    };
    //Close the dropdown when it or its children are unfocused
    #onBlur = (event) => {
        if (event.relatedTarget == this.element)
            return;
        if (event.relatedTarget instanceof Node)
            if (event.relatedTarget?.parentNode == this.element)
                return;
        this.close();
    };
    /**
     * Displays a new dropdown menu
     * @param items Menu items
     * @param options Menu configuration options
     */
    static show(items, options = {}) {
        let dropdown = new Dropdown();
        let { element } = dropdown;
        //Display
        document.body.append(element);
        //Add items
        for (let item of items) {
            let button = document.createElement("button");
            button.textContent = item.text;
            button.addEventListener("blur", dropdown.#onBlur);
            button.addEventListener("click", event => {
                button.removeEventListener("blur", dropdown.#onBlur);
                item.callback?.(event);
                dropdown.close();
            });
            element.append(button);
        }
        //Style
        let { style } = element;
        element.classList.add("dropdown");
        if (options.height != undefined) {
            style.overflowY = "auto";
            style.maxHeight = options.height.toString();
        }
        if (options.position) {
            let [x, y] = options.position;
            style.left = x.toString();
            style.top = y.toString();
        }
        else if (options.target) {
            let [width, height] = [element.clientWidth, element.clientHeight / items.length * (items.length + 1)];
            let rect = options.target.getBoundingClientRect();
            let [left, top] = [rect.x, rect.bottom];
            let [right, bottom] = [left + width, top + height];
            let [windowWidth, windowHeight] = [window.innerWidth, window.innerHeight];
            style.left = `${(right > windowWidth ? left - width : left) + window.scrollX}px`;
            style.top = `${(bottom > windowHeight ? top - height : top) + window.scrollY}px`;
        }
        else {
            style.left = "0px";
            style.top = "0px";
        }
        //Prime for usage
        element.focus();
        return dropdown;
    }
}
exports.Dropdown = Dropdown;
exports.default = Dropdown;
