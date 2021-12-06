export default class Content {
    /**
     * @param path Url or local path with content
     * @returns Content at path
     */
    static fetch(path: string): Promise<string>;
}
