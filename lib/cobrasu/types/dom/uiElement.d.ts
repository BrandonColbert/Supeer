declare type Constructor<T> = new (...args: any[]) => T;
declare type CustomElementName = `${string}-${string}`;
declare const UIElement_base: {
    new (): HTMLElement;
    prototype: HTMLElement;
};
export default abstract class UIElement extends UIElement_base {
    private mutationObserver;
    constructor();
    /**
     * Called when connected an element
     */
    protected attached(): void;
    /**
     * Called when disconnected from an element
     */
    protected detached(): void;
    /**
     * Called when a child node is connected
     * @param node Node that was connected
     */
    protected onChildAttached(node: Node): void;
    /**
     * Called when a child node is disconnected
     * @param node Node that was disconnected
     */
    protected onChildDetached(node: Node): void;
    private connectedCallback;
    private disconnectedCallback;
    /**
     * Register a new element under a specific name
     * @param ctor Element constructor
     * @param name Custom tag name within HTML
     */
    static register<T extends UIElement>(ctor: Constructor<T>, name: CustomElementName): void;
    /**
     * Register a new element
     *
     * The element's tag name will be based on the name of its class
     * @param ctor Element constructor
     */
    static register<T extends UIElement>(ctor: Constructor<T>): void;
    /**
     * Register this UIElement derivative under a specific name
     * @param name Custom tag name within HTML
     */
    static register<T extends UIElement>(this: Constructor<T>, name: CustomElementName): void;
    /**
     * Register this UIElement derivative
     *
     * This element's tag name will be based on the name of its class
     */
    static register<T extends UIElement>(this: Constructor<T>): void;
    /**
     * Assert that the node is of the given type.
     *
     * If the assertion is false, an error will be thrown.
     * @param node Node to check
     * @param ctor Expected base type
     */
    protected static restrict<T extends Node>(node: Node, ctor: Constructor<T>): void;
}
export {};
