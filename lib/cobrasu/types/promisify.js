"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function promisify(...pars) {
    let target;
    let fn;
    let args;
    if (pars.length == 0)
        throw new Error("Expected at least 1 parameter");
    switch (typeof pars[0]) {
        case "object":
            [target, fn, ...args] = pars;
            fn = fn.bind(target);
            break;
        case "function":
            [fn, ...args] = pars;
            break;
        default:
            throw new Error(`First parameter is unexpected type '${typeof pars[0]}'`);
    }
    return new Promise(r => fn(...args, (...callbackArgs) => r(callbackArgs)));
}
exports.default = promisify;
