"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIElement = exports.Text = exports.Dropdown = exports.DDListElement = exports.Cookies = exports.Content = exports.DOM = void 0;
const content_js_1 = __importDefault(require("./types/dom/content.js"));
exports.Content = content_js_1.default;
const cookies_js_1 = __importDefault(require("./types/dom/cookies.js"));
exports.Cookies = cookies_js_1.default;
const ddListElement_js_1 = __importDefault(require("./types/dom/ddListElement.js"));
exports.DDListElement = ddListElement_js_1.default;
const dropdown_js_1 = __importDefault(require("./types/dom/dropdown.js"));
exports.Dropdown = dropdown_js_1.default;
const text_js_1 = __importDefault(require("./types/dom/text.js"));
exports.Text = text_js_1.default;
const uiElement_js_1 = __importDefault(require("./types/dom/uiElement.js"));
exports.UIElement = uiElement_js_1.default;
var DOM;
(function (DOM) {
    DOM.Content = content_js_1.default;
    DOM.Cookies = cookies_js_1.default;
    DOM.DDListElement = ddListElement_js_1.default;
    DOM.Dropdown = dropdown_js_1.default;
    DOM.Text = text_js_1.default;
    DOM.UIElement = uiElement_js_1.default;
})(DOM = exports.DOM || (exports.DOM = {}));
exports.default = DOM;
