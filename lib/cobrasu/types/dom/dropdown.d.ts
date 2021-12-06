/**
 * Dropdown menu
 */
export declare class Dropdown {
    #private;
    /** Element representing this dropdown */
    readonly element: HTMLElement;
    private constructor();
    /**
     * Close this menu
     */
    close(): void;
    /**
     * Displays a new dropdown menu
     * @param items Menu items
     * @param options Menu configuration options
     */
    static show(items: Dropdown.Item[], options?: Dropdown.Options): Dropdown;
}
export declare namespace Dropdown {
    /**
     * Dropdown menu item
     */
    interface Item {
        /** Text displayed in this item's section */
        text: string;
        /** Called when this item is clicked */
        callback?: (event: MouseEvent) => void;
    }
    /**
     * Alters a dropdowns appearance
     */
    interface Options {
        /** Max menu height in pixels before scrolling is enabled */
        height?: number | string;
        /** Position of the menu on the screen in pixels */
        position?: [number | string, number | string];
        /**
         * Element to display the menu under
         *
         * Has no effect if position is specified
         */
        target?: Element;
    }
}
export default Dropdown;
