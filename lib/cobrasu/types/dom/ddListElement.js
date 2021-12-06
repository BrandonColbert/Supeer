"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DDListElement = void 0;
const uiElement_js_1 = __importDefault(require("./uiElement.js"));
const dispatcher_js_1 = __importDefault(require("../dispatcher.js"));
/**
 * A list with children that can be reordered through drag and drop
 */
class DDListElement extends uiElement_js_1.default {
    static image = globalThis.Image ? new globalThis.Image() : null;
    static #nextId = 0;
    events;
    /** Used to acquire data from drops */
    dataBind;
    activeElement;
    moveCancel;
    constructor() {
        super();
        this.events = new dispatcher_js_1.default("drop", "reorder", "transfer");
    }
    get id() {
        if (!super.id)
            super.id = `ddl_${DDListElement.#nextId++}`;
        return super.id;
    }
    attached() {
        for (let child of Array.from(this.children))
            if (child instanceof HTMLElement)
                this.include(child);
    }
    detached() {
        for (let child of Array.from(this.children))
            if (child instanceof HTMLElement)
                this.exclude(child);
    }
    onChildAttached(node) {
        uiElement_js_1.default.restrict(node, HTMLElement);
        this.include(node);
    }
    onChildDetached(node) {
        this.exclude(node);
    }
    include(target) {
        target = DDListElement.underview(target);
        target.draggable = true;
        target.addEventListener("dragstart", this.onChildDrag);
        target.addEventListener("drop", this.onDropIntoChild);
        target.addEventListener("dragenter", this.onChildDragEnter);
        target.addEventListener("dragend", this.onChildDragEnd);
        target.addEventListener("dragover", this.onChildDragOver);
    }
    exclude(target) {
        target = DDListElement.underview(target);
        target.draggable = false;
        target.removeEventListener("dragstart", this.onChildDrag);
        target.removeEventListener("drop", this.onDropIntoChild);
        target.removeEventListener("dragenter", this.onChildDragEnter);
        target.removeEventListener("dragend", this.onChildDragEnd);
        target.removeEventListener("dragover", this.onChildDragOver);
    }
    onChildDrag = (event) => {
        if (!event.dataTransfer)
            return;
        event.target.classList.add("reorderTarget");
        let target = DDListElement.overview(event.target);
        let startIndex = Array.from(this.children).indexOf(target);
        this.activeElement = target;
        this.moveCancel = () => {
            let endIndex = Array.from(this.children).indexOf(target);
            let index = endIndex > startIndex ? startIndex : startIndex + 1;
            this.insertBefore(target, index < this.children.length ? this.children[index] : null);
        };
        event.dataTransfer.dropEffect = "move";
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setDragImage(DDListElement.image, 0, 0);
        event.dataTransfer.setData("text/plain", JSON.stringify({
            selector: `#${this.id}`,
            index: startIndex,
            data: this.dataBind ? this.dataBind(startIndex) : {}
        }));
    };
    onDropIntoChild = async (event) => {
        if (!event.dataTransfer)
            return;
        let info;
        try {
            info = JSON.parse(event.dataTransfer.getData("text/plain"));
        }
        catch (_) {
            return;
        }
        if (!("selector" in info
            && "index" in info
            && "data" in info))
            return;
        let sourceList = document.querySelector(info.selector);
        sourceList.activeElement = null;
        if (sourceList == this) { //Reorder within list
            let target = DDListElement.overview(event.target);
            let targetIndex = Array.from(this.children).indexOf(target);
            let sourceIndex = info.index;
            if (sourceIndex == targetIndex)
                return;
            await this.events.fire("reorder", {
                from: sourceIndex,
                to: targetIndex,
                cancel: this.moveCancel ?? (() => {
                    throw new Error("Unable to cancel move");
                })
            });
        }
        else { //Transfer to this list
            let canceled = false;
            let target = DDListElement.overview(event.target);
            let targetList = target?.parentElement;
            if (!target)
                return;
            await targetList.events.fire("drop", {
                index: Array.from(targetList.children).indexOf(target),
                data: info.data,
                cancel: () => canceled = true
            });
            if (canceled) {
                sourceList.moveCancel();
                return;
            }
            await sourceList.events.fire("transfer", {
                index: info.index,
                target: targetList
            });
        }
    };
    onChildDragEnter = (event) => {
        let children = Array.from(this.children);
        let active = DDListElement.overview(this.activeElement);
        let target = DDListElement.overview(event.target);
        let activeIndex = children.indexOf(active);
        let targetIndex = children.indexOf(target);
        if (activeIndex == targetIndex || activeIndex == -1 || targetIndex == -1)
            return;
        this.insertBefore(active, activeIndex < targetIndex ? target.nextElementSibling : target);
    };
    onChildDragEnd = (event) => {
        if (this.activeElement)
            this.moveCancel();
        this.activeElement = null;
        event.target.classList.remove("reorderTarget");
    };
    onChildDragOver = (event) => event.preventDefault();
    static underview(target) {
        switch (true) {
            case target instanceof HTMLDetailsElement:
                return target.querySelector("summary");
            default:
                return target;
        }
    }
    static overview(target) {
        if (!target)
            return null;
        if (target.parentElement instanceof DDListElement)
            return target;
        return target.closest("dd-list > *");
    }
}
exports.DDListElement = DDListElement;
DDListElement.register("dd-list");
exports.default = DDListElement;
