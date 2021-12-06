"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Colorizer = void 0;
class Colorizer {
    /**
     * Converts CSS color text from format to another
     * @param value Color text
     * @param to Target format
     * @returns Color text in target format
     */
    static convert(value, to) {
        let r, g, b;
        switch (true) {
            case /^rgb/.test(value): // RGB
                [r, g, b] = value
                    .match(/^rgb\s*\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)$/)
                    .slice(1)
                    .map(v => parseInt(v));
                break;
            case /^#/.test(value): // Hex
                [r, g, b] = value
                    .match(/#([0-9a-fA-F][0-9a-fA-F])([0-9a-fA-F][0-9a-fA-F])([0-9a-fA-F][0-9a-fA-F])/)
                    .slice(1)
                    .map(v => parseInt(`0x${v}`));
                break;
            case /^hsl/.test(value): // HSL
                let [hue, saturation, lightness] = value
                    .match(/^hsl\s*\(\s*(\d+),\s*(\d+%),\s*(\d+%)\s*\)$/)
                    .slice(1);
                let [h, s, l] = [
                    parseFloat(hue),
                    parseFloat(saturation.slice(0, -1)) / 100,
                    parseFloat(lightness.slice(0, -1)) / 100
                ];
                let c = (1 - Math.abs(2 * l - 1)) * s;
                let x = c * (1 - Math.abs((h / 60) % 2 - 1));
                let m = l - c / 2;
                switch (true) {
                    case h < 60:
                        [r, g, b] = [c, x, 0];
                        break;
                    case h < 120:
                        [r, g, b] = [x, c, 0];
                        break;
                    case h < 180:
                        [r, g, b] = [0, c, x];
                        break;
                    case h < 240:
                        [r, g, b] = [0, x, c];
                        break;
                    case h < 300:
                        [r, g, b] = [x, 0, c];
                        break;
                    case h < 360:
                        [r, g, b] = [c, 0, x];
                        break;
                }
                [r, g, b] = [
                    Math.round((r + m) * 255),
                    Math.round((g + m) * 255),
                    Math.round((b + m) * 255)
                ];
                break;
            default:
                throw new Error(`Unrecognized format of '${value}'`);
        }
        switch (to) {
            case "rgb":
                return `rgb(${r}, ${g}, ${b})`;
            case "hex":
                function toHex(i) {
                    let v = i.toString(16);
                    switch (v.length) {
                        case 1:
                            return `0${v}`;
                        default:
                            return v;
                    }
                }
                return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
            case "hsl": {
                let h, s, l;
                [r, g, b] = [
                    r / 255,
                    g / 255,
                    b / 255
                ];
                let [cmin, cmax] = [
                    Math.min(r, g, b),
                    Math.max(r, g, b)
                ];
                let delta = cmax - cmin;
                l = (cmax + cmin) / 2;
                s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
                switch (true) {
                    case delta == 0:
                        h = 0;
                        break;
                    case cmax == r:
                        h = 60 * ((g - b) / delta % 6);
                        break;
                    case cmax == g:
                        h = 60 * ((b - r) / delta + 2);
                        break;
                    case cmax == b:
                        h = 60 * ((r - g) / delta + 4);
                        break;
                }
                return `hsl(${h}, ${(s * 100).toFixed(0)}%, ${(l * 100).toFixed(0)}%)`;
            }
            default:
                throw new Error(`Invalid color format '${to}'`);
        }
    }
    static *wheel(count, format = "hex") {
        for (let i = 0; i < count; i++)
            yield Colorizer.convert(`hsl(${i * (360 / count) % 360}, 100%, 50%)`, format);
    }
}
exports.Colorizer = Colorizer;
exports.default = Colorizer;
