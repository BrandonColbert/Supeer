"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Cookies {
    static get(key, type, defaultValue) {
        let cookies = new Map(this);
        if (!cookies.has(key))
            return defaultValue ?? null;
        let value = cookies.get(key);
        switch (type) {
            case Object:
                return JSON.parse(value);
            case String:
                return value;
            case Number:
                return parseFloat(value);
            case Boolean:
                switch (value) {
                    case "true":
                        return true;
                    case "false":
                        return false;
                    default:
                        return null;
                }
            default:
                throw new Error(`Unable to get value for '${key}' as '${type.name}'`);
        }
    }
    static set(key, value) {
        switch (typeof value) {
            case "object":
                document.cookie = `${key}=${JSON.stringify(value)}`;
                break;
            default:
                document.cookie = `${key}=${value}`;
                break;
        }
    }
    static has(key) {
        return [...this]
            .map(([key]) => key)
            .includes(key);
    }
    static delete(key) {
        Cookies.set(key, "; expires=Thu, 01 Jan 1970 00:00:01 GMT;");
    }
    static clear() {
        for (let [key] of this)
            Cookies.delete(key);
    }
    static *[Symbol.iterator]() {
        for (let entry of document.cookie.split(";")) {
            let [key, value] = entry.split("=");
            key = key.trim();
            yield [key, value];
        }
    }
}
exports.default = Cookies;
