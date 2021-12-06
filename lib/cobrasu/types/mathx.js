"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.range = exports.argmin = exports.argmax = void 0;
/**
 * Index of the maximum number
 * @param values Numbers to compare
 * @returns The index of the largest number or -1 if the array is empty
 */
function argmax(...values) {
    if (values.length == 0)
        return -1;
    let tv = values[0];
    let ti = 0;
    values.slice(1).forEach((v, i) => {
        if (v > tv) {
            tv = v;
            ti = i + 1;
        }
    });
    return ti;
}
exports.argmax = argmax;
/**
 * Index of the minimum number
 * @param values Numbers to compare
 * @returns The index of the smallest number or -1 if the array is empty
 */
function argmin(...values) {
    if (values.length == 0)
        return -1;
    let tv = values[0];
    let ti = 0;
    values.slice(1).forEach((v, i) => {
        if (v < tv) {
            tv = v;
            ti = i + 1;
        }
    });
    return ti;
}
exports.argmin = argmin;
function range(par1, par2) {
    if (par2) {
        let lower = par1;
        let upper = par2;
        return lower + Math.random() * (upper - lower);
    }
    else if (par1) {
        let upper = par1;
        return upper * Math.random();
    }
    else
        return Math.random();
}
exports.range = range;
