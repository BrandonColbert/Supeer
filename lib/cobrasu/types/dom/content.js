"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Content {
    /**
     * @param path Url or local path with content
     * @returns Content at path
     */
    static async fetch(path) {
        return new Promise((resolve, reject) => {
            const request = new XMLHttpRequest();
            request.onerror = () => reject("Request encountered a network error");
            request.ontimeout = () => reject(`Request timed out after ${request.timeout}ms`);
            request.onload = () => {
                switch (request.readyState) {
                    case 4:
                        switch (request.status) {
                            case 200:
                                resolve(request.responseText);
                                break;
                            default:
                                reject(`Request status was ${request.status}`);
                                break;
                        }
                        break;
                }
            };
            request.open("GET", path, true);
            request.send();
        });
    }
}
exports.default = Content;
