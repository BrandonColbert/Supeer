"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MathX = exports.DOM = exports.promisify = exports.Text = exports.Dispatcher = exports.Colorizer = exports.CoBraSU = void 0;
const colorizer_js_1 = __importDefault(require("./types/colorizer.js"));
exports.Colorizer = colorizer_js_1.default;
const dispatcher_js_1 = __importDefault(require("./types/dispatcher.js"));
exports.Dispatcher = dispatcher_js_1.default;
const text_js_1 = __importDefault(require("./types/text.js"));
exports.Text = text_js_1.default;
const promisify_js_1 = __importDefault(require("./types/promisify.js"));
exports.promisify = promisify_js_1.default;
const dom_js_1 = __importDefault(require("./dom.js"));
exports.DOM = dom_js_1.default;
const _MathX = __importStar(require("./types/mathx.js"));
exports.MathX = _MathX;
var CoBraSU;
(function (CoBraSU) {
    CoBraSU.Colorizer = colorizer_js_1.default;
    CoBraSU.Dispatcher = dispatcher_js_1.default;
    CoBraSU.Text = text_js_1.default;
    CoBraSU.promisify = promisify_js_1.default;
    CoBraSU.DOM = dom_js_1.default;
    CoBraSU.MathX = _MathX;
})(CoBraSU = exports.CoBraSU || (exports.CoBraSU = {}));
exports.default = CoBraSU;
