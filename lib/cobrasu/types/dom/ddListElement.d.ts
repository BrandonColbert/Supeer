import UIElement from "./uiElement.js";
import Dispatcher from "../dispatcher.js";
/**
 * A list with children that can be reordered through drag and drop
 */
export declare class DDListElement extends UIElement {
    #private;
    private static image;
    readonly events: Dispatcher<DDListElement.Events>;
    /** Used to acquire data from drops */
    dataBind: (index: number) => any;
    private activeElement;
    private moveCancel;
    constructor();
    get id(): string;
    protected attached(): void;
    protected detached(): void;
    protected onChildAttached(node: Node): void;
    protected onChildDetached(node: Node): void;
    private include;
    private exclude;
    private onChildDrag;
    private onDropIntoChild;
    private onChildDragEnter;
    private onChildDragEnd;
    private onChildDragOver;
    private static underview;
    private static overview;
}
export declare namespace DDListElement {
    interface Events {
        reorder: Events.Reorder;
        drop: Events.Drop;
        transfer: Events.Transfer;
    }
    namespace Events {
        interface Reorder {
            /** Starting index of the reordered element */
            from: number;
            /** Ending index of the reordered element */
            to: number;
            /** Cancels the element being reordered */
            cancel(): void;
        }
        interface Drop {
            /** Index for the element to be placed */
            index: number;
            /** Dropped data */
            data: any;
            /** Stops the drop and prevents a transfer event */
            cancel(): void;
        }
        interface Transfer {
            /** Index of the element being transferred */
            index: number;
            /** List which the element was transferred to */
            target: DDListElement;
        }
    }
}
export default DDListElement;
