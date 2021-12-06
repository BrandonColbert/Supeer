import _Colorizer from "./types/colorizer.js";
import _Dispatcher from "./types/dispatcher.js";
import _Text from "./types/text.js";
import _promisify from "./types/promisify.js";
import _DOM from "./dom.js";
import * as _MathX from "./types/mathx.js";
export declare namespace CoBraSU {
    type Colorizer = _Colorizer;
    const Colorizer: typeof _Colorizer;
    type Dispatcher<Events extends _Dispatcher.EventMap> = _Dispatcher<Events>;
    const Dispatcher: typeof _Dispatcher;
    type Text = _Text;
    const Text: typeof _Text;
    const promisify: typeof _promisify;
    const DOM: typeof _DOM;
    const MathX: typeof _MathX;
}
export { _Colorizer as Colorizer, _Dispatcher as Dispatcher, _Text as Text, _promisify as promisify, _DOM as DOM, _MathX as MathX };
export default CoBraSU;
