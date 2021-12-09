"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.CoBraSU = void 0;
var e = {
  d: (t, r) => {
    for (var a in r) e.o(r, a) && !e.o(t, a) && Object.defineProperty(t, a, {
      enumerable: !0,
      get: r[a]
    });
  },
  o: (e, t) => Object.prototype.hasOwnProperty.call(e, t),
  r: e => {
    "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, {
      value: "Module"
    }), Object.defineProperty(e, "__esModule", {
      value: !0
    });
  }
},
    t = {};
e.d(t, {
  T: () => d,
  Z: () => u
});
var r = {};
e.r(r), e.d(r, {
  argmax: () => i,
  argmin: () => l,
  range: () => c
});

class a {
  static convert(e, t) {
    let r, a, s;

    switch (!0) {
      case /^rgb/.test(e):
        [r, a, s] = e.match(/^rgb\s*\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)$/).slice(1).map(e => parseInt(e));
        break;

      case /^#/.test(e):
        [r, a, s] = e.match(/#([0-9a-fA-F][0-9a-fA-F])([0-9a-fA-F][0-9a-fA-F])([0-9a-fA-F][0-9a-fA-F])/).slice(1).map(e => parseInt(`0x${e}`));
        break;

      case /^hsl/.test(e):
        let [t, o, n] = e.match(/^hsl\s*\(\s*(\d+),\s*(\d+%),\s*(\d+%)\s*\)$/).slice(1),
            [i, l, c] = [parseFloat(t), parseFloat(o.slice(0, -1)) / 100, parseFloat(n.slice(0, -1)) / 100],
            h = (1 - Math.abs(2 * c - 1)) * l,
            f = h * (1 - Math.abs(i / 60 % 2 - 1)),
            d = c - h / 2;

        switch (!0) {
          case i < 60:
            [r, a, s] = [h, f, 0];
            break;

          case i < 120:
            [r, a, s] = [f, h, 0];
            break;

          case i < 180:
            [r, a, s] = [0, h, f];
            break;

          case i < 240:
            [r, a, s] = [0, f, h];
            break;

          case i < 300:
            [r, a, s] = [f, 0, h];
            break;

          case i < 360:
            [r, a, s] = [h, 0, f];
        }

        [r, a, s] = [Math.round(255 * (r + d)), Math.round(255 * (a + d)), Math.round(255 * (s + d))];
        break;

      default:
        throw new Error(`Unrecognized format of '${e}'`);
    }

    switch (t) {
      case "rgb":
        return `rgb(${r}, ${a}, ${s})`;

      case "hex":
        function e(e) {
          let t = e.toString(16);
          return 1 === t.length ? `0${t}` : t;
        }

        return `#${e(r)}${e(a)}${e(s)}`;

      case "hsl":
        {
          let e, t, o;
          [r, a, s] = [r / 255, a / 255, s / 255];
          let [n, i] = [Math.min(r, a, s), Math.max(r, a, s)],
              l = i - n;

          switch (o = (i + n) / 2, t = 0 == l ? 0 : l / (1 - Math.abs(2 * o - 1)), !0) {
            case 0 == l:
              e = 0;
              break;

            case i == r:
              e = (a - s) / l % 6 * 60;
              break;

            case i == a:
              e = 60 * ((s - r) / l + 2);
              break;

            case i == s:
              e = 60 * ((r - a) / l + 4);
          }

          return `hsl(${e}, ${(100 * t).toFixed(0)}%, ${(100 * o).toFixed(0)}%)`;
        }

      default:
        throw new Error(`Invalid color format '${t}'`);
    }
  }

  static *wheel(e, t = "hex") {
    for (let r = 0; r < e; r++) yield a.convert(`hsl(${r * (360 / e) % 360}, 100%, 50%)`, t);
  }

}

const s = a;

class o {
  static simplify(e) {
    return e.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  static transformToName(e) {
    return e.replace(/^[a-z]/, e => e.toUpperCase()).replace(/([a-z])([A-Z])/g, (e, ...t) => `${t[0]} ${t[1]}`);
  }

}

function n(...e) {
  let t, r, a;
  if (0 == e.length) throw new Error("Expected at least 1 parameter");

  switch (typeof e[0]) {
    case "object":
      [t, r, ...a] = e, r = r.bind(t);
      break;

    case "function":
      [r, ...a] = e;
      break;

    default:
      throw new Error(`First parameter is unexpected type '${typeof e[0]}'`);
  }

  return new Promise(e => r(...a, (...t) => e(t)));
}

function i(...e) {
  if (0 == e.length) return -1;
  let t = e[0],
      r = 0;
  return e.slice(1).forEach((e, a) => {
    e > t && (t = e, r = a + 1);
  }), r;
}

function l(...e) {
  if (0 == e.length) return -1;
  let t = e[0],
      r = 0;
  return e.slice(1).forEach((e, a) => {
    e < t && (t = e, r = a + 1);
  }), r;
}

function c(e, t) {
  if (t) {
    let r = e,
        a = t;
    return r + Math.random() * (a - r);
  }

  return e ? e * Math.random() : Math.random();
}

var h;
!function (e) {
  e.Colorizer = s, e.Dispatcher = class {
    #e;

    constructor(...e) {
      this.#e = new Map(), e && this.register(...e);
    }

    async fire(e, t) {
      await Promise.all([...this.#e.get(e.toString())].map(e => e(t)));
    }

    on(e, t) {
      return this.#e.get(e.toString()).add(t), t;
    }

    once(e, t) {
      let r;
      return r = a => {
        t(a), this.forget(e, r);
      }, this.on(e, r);
    }

    forget(e, t) {
      this.#e.get(e.toString()).delete(t);
    }

    forgetAll() {
      for (let [, e] of this.#e) e.clear();
    }

    register(...e) {
      for (let t of e) this.#e.has(t.toString()) ? console.error(`Event ${t} is already registered`) : this.#e.set(t.toString(), new Set());
    }

    unregister(...e) {
      for (let t of e) this.#e.has(t.toString()) ? this.#e.delete(t.toString()) : console.error(`Event ${t} is not registered`);
    }

  }, e.Text = o, e.promisify = n, e.MathX = r;
}(h || (h = {}));
const f = h;
var d;
!function (e) {
  e.Core = f;
}(d || (d = {}));
const u = d;
var g = t.T,
    p = t.Z;
exports.default = p;
exports.CoBraSU = g;