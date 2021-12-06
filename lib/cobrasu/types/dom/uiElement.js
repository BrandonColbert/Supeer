"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UIElement extends (globalThis.HTMLElement ?? null) {
    mutationObserver;
    constructor() {
        super();
        this.mutationObserver = new MutationObserver((muts, _) => {
            for (let mutation of muts) {
                switch (mutation.type) {
                    case "childList":
                        mutation.addedNodes.forEach(n => this.onChildAttached(n));
                        mutation.removedNodes.forEach(n => this.onChildDetached(n));
                        break;
                }
            }
        });
    }
    /**
     * Called when connected an element
     */
    attached() { }
    /**
     * Called when disconnected from an element
     */
    detached() { }
    /**
     * Called when a child node is connected
     * @param node Node that was connected
     */
    onChildAttached(node) { }
    /**
     * Called when a child node is disconnected
     * @param node Node that was disconnected
     */
    onChildDetached(node) { }
    connectedCallback() {
        this.mutationObserver.observe(this, { childList: true });
        if (!this.isConnected)
            return;
        this.attached();
    }
    disconnectedCallback() {
        this.mutationObserver.disconnect();
        this.detached();
    }
    static register(par1, par2) {
        let name;
        let ctor;
        if (par1) {
            if (par2) { //Name and constructor specified
                name = par1;
                ctor = par2;
            }
            else { //Name or constructor specified
                switch (typeof par1) {
                    case "string":
                        name = par1;
                        break;
                    case "function":
                        ctor = par2;
                        break;
                }
            }
        }
        else if (par2) //Name specified, constructor implicit
            name = par2;
        if (!ctor) //Imply constructor from current class
            ctor = this;
        if (!name) { //Create tag name based on class name
            let className = ctor.name
                .replace(/Element$/, _ => "")
                .replace(/^[A-Z]/, s => s.toLowerCase())
                .replace(/[A-Z]/, s => `-${s.toLowerCase()}`);
            name = `ui-${className}`;
        }
        //Define custom element
        globalThis.customElements?.define(name, ctor);
    }
    /**
     * Assert that the node is of the given type.
     *
     * If the assertion is false, an error will be thrown.
     * @param node Node to check
     * @param ctor Expected base type
     */
    static restrict(node, ctor) {
        if (node instanceof ctor)
            return;
        if (!node)
            throw new Error(`Expected node, none provided`);
        throw new Error(`Expected type ${ctor.name}, but got type ${node.constructor.name} with ${node}`);
    }
}
exports.default = UIElement;
