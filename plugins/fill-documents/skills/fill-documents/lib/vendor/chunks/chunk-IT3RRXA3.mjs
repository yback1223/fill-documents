import { createRequire as __fillCreateRequire } from 'node:module'; const require = __fillCreateRequire(import.meta.url);
import {
  FillError,
  requireCondition
} from "./chunk-Q2WAVGBC.mjs";
import {
  __commonJS,
  __require,
  __toESM
} from "./chunk-WNYIIIUP.mjs";

// node_modules/pizzip/js/base64.js
var require_base64 = __commonJS({
  "node_modules/pizzip/js/base64.js"(exports) {
    "use strict";
    var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    exports.encode = function(input) {
      var output = "";
      var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
      var i = 0;
      while (i < input.length) {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);
        enc1 = chr1 >> 2;
        enc2 = (chr1 & 3) << 4 | chr2 >> 4;
        enc3 = (chr2 & 15) << 2 | chr3 >> 6;
        enc4 = chr3 & 63;
        if (isNaN(chr2)) {
          enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
          enc4 = 64;
        }
        output = output + _keyStr.charAt(enc1) + _keyStr.charAt(enc2) + _keyStr.charAt(enc3) + _keyStr.charAt(enc4);
      }
      return output;
    };
    exports.decode = function(input) {
      var output = "";
      var chr1, chr2, chr3;
      var enc1, enc2, enc3, enc4;
      var i = 0;
      input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
      while (i < input.length) {
        enc1 = _keyStr.indexOf(input.charAt(i++));
        enc2 = _keyStr.indexOf(input.charAt(i++));
        enc3 = _keyStr.indexOf(input.charAt(i++));
        enc4 = _keyStr.indexOf(input.charAt(i++));
        chr1 = enc1 << 2 | enc2 >> 4;
        chr2 = (enc2 & 15) << 4 | enc3 >> 2;
        chr3 = (enc3 & 3) << 6 | enc4;
        output += String.fromCharCode(chr1);
        if (enc3 !== 64) {
          output += String.fromCharCode(chr2);
        }
        if (enc4 !== 64) {
          output += String.fromCharCode(chr3);
        }
      }
      return output;
    };
  }
});

// node_modules/pizzip/js/chunk-size.js
var require_chunk_size = __commonJS({
  "node_modules/pizzip/js/chunk-size.js"(exports, module) {
    "use strict";
    module.exports = function chunkSize(value) {
      var fallback = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1024 * 1024;
      var size = value === void 0 ? fallback : value;
      if (!Number.isSafeInteger(size) || size < 64 || size > 2147483647) {
        throw new RangeError("chunkSize must be an integer between 64 and 2147483647 bytes");
      }
      return size;
    };
  }
});

// node_modules/pizzip/js/support.js
var require_support = __commonJS({
  "node_modules/pizzip/js/support.js"(exports) {
    "use strict";
    exports.base64 = true;
    exports.array = true;
    exports.string = true;
    exports.arraybuffer = typeof ArrayBuffer !== "undefined" && typeof Uint8Array !== "undefined";
    exports.nodebuffer = typeof Buffer !== "undefined";
    exports.uint8array = typeof Uint8Array !== "undefined";
    if (typeof ArrayBuffer === "undefined") {
      exports.blob = false;
    } else {
      buffer = new ArrayBuffer(0);
      try {
        exports.blob = new Blob([buffer], {
          type: "application/zip"
        }).size === 0;
      } catch (_unused) {
        try {
          Builder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
          builder = new Builder();
          builder.append(buffer);
          exports.blob = builder.getBlob("application/zip").size === 0;
        } catch (_unused2) {
          exports.blob = false;
        }
      }
    }
    var buffer;
    var Builder;
    var builder;
  }
});

// node_modules/pizzip/node_modules/pako/dist/pako.es5.min.js
var require_pako_es5_min = __commonJS({
  "node_modules/pizzip/node_modules/pako/dist/pako.es5.min.js"(exports, module) {
    !(function(t, e) {
      "object" == typeof exports && "undefined" != typeof module ? e(exports) : "function" == typeof define && define.amd ? define(["exports"], e) : e((t = "undefined" != typeof globalThis ? globalThis : t || self).pako = {});
    })(exports, (function(t) {
      "use strict";
      function e(t2) {
        for (var e2 = t2.length; --e2 >= 0; ) t2[e2] = 0;
      }
      var a = 256, n = 286, i = 30, r = 15, s = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]), o = new Uint8Array([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]), l = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7]), h = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), d = new Array(576);
      e(d);
      var _ = new Array(60);
      e(_);
      var f = new Array(512);
      e(f);
      var u = new Array(256);
      e(u);
      var c = new Array(29);
      e(c);
      var w, m, b, g = new Array(i);
      function p(t2, e2, a2, n2, i2) {
        this.static_tree = t2, this.extra_bits = e2, this.extra_base = a2, this.elems = n2, this.max_length = i2, this.has_stree = t2 && t2.length;
      }
      function v(t2, e2) {
        this.dyn_tree = t2, this.max_code = 0, this.stat_desc = e2;
      }
      e(g);
      var k = function(t2) {
        return t2 < 256 ? f[t2] : f[256 + (t2 >>> 7)];
      }, y = function(t2, e2) {
        t2.pending_buf[t2.pending++] = 255 & e2, t2.pending_buf[t2.pending++] = e2 >>> 8 & 255;
      }, x = function(t2, e2, a2) {
        t2.bi_valid > 16 - a2 ? (t2.bi_buf |= e2 << t2.bi_valid & 65535, y(t2, t2.bi_buf), t2.bi_buf = e2 >> 16 - t2.bi_valid, t2.bi_valid += a2 - 16) : (t2.bi_buf |= e2 << t2.bi_valid & 65535, t2.bi_valid += a2);
      }, z = function(t2, e2, a2) {
        x(t2, a2[2 * e2], a2[2 * e2 + 1]);
      }, A = function(t2, e2) {
        var a2 = 0;
        do {
          a2 |= 1 & t2, t2 >>>= 1, a2 <<= 1;
        } while (--e2 > 0);
        return a2 >>> 1;
      }, E = function(t2, e2, a2) {
        var n2, i2, s2 = new Array(16), o2 = 0;
        for (n2 = 1; n2 <= r; n2++) o2 = o2 + a2[n2 - 1] << 1, s2[n2] = o2;
        for (i2 = 0; i2 <= e2; i2++) {
          var l2 = t2[2 * i2 + 1];
          0 !== l2 && (t2[2 * i2] = A(s2[l2]++, l2));
        }
      }, R = function(t2) {
        var e2;
        for (e2 = 0; e2 < n; e2++) t2.dyn_ltree[2 * e2] = 0;
        for (e2 = 0; e2 < i; e2++) t2.dyn_dtree[2 * e2] = 0;
        for (e2 = 0; e2 < 19; e2++) t2.bl_tree[2 * e2] = 0;
        t2.dyn_ltree[512] = 1, t2.opt_len = t2.static_len = 0, t2.sym_next = t2.matches = 0;
      }, Z = function(t2) {
        t2.bi_valid > 8 ? y(t2, t2.bi_buf) : t2.bi_valid > 0 && (t2.pending_buf[t2.pending++] = t2.bi_buf), t2.bi_buf = 0, t2.bi_valid = 0;
      }, S = function(t2, e2, a2, n2) {
        var i2 = 2 * e2, r2 = 2 * a2;
        return t2[i2] < t2[r2] || t2[i2] === t2[r2] && n2[e2] <= n2[a2];
      }, U = function(t2, e2, a2) {
        for (var n2 = t2.heap[a2], i2 = a2 << 1; i2 <= t2.heap_len && (i2 < t2.heap_len && S(e2, t2.heap[i2 + 1], t2.heap[i2], t2.depth) && i2++, !S(e2, n2, t2.heap[i2], t2.depth)); ) t2.heap[a2] = t2.heap[i2], a2 = i2, i2 <<= 1;
        t2.heap[a2] = n2;
      }, D = function(t2, e2, n2) {
        var i2, r2, l2, h2, d2 = 0;
        if (0 !== t2.sym_next) do {
          i2 = 255 & t2.pending_buf[t2.sym_buf + d2++], i2 += (255 & t2.pending_buf[t2.sym_buf + d2++]) << 8, r2 = t2.pending_buf[t2.sym_buf + d2++], 0 === i2 ? z(t2, r2, e2) : (l2 = u[r2], z(t2, l2 + a + 1, e2), 0 !== (h2 = s[l2]) && (r2 -= c[l2], x(t2, r2, h2)), i2--, l2 = k(i2), z(t2, l2, n2), 0 !== (h2 = o[l2]) && (i2 -= g[l2], x(t2, i2, h2)));
        } while (d2 < t2.sym_next);
        z(t2, 256, e2);
      }, T = function(t2, e2) {
        var a2, n2, i2, s2 = e2.dyn_tree, o2 = e2.stat_desc.static_tree, l2 = e2.stat_desc.has_stree, h2 = e2.stat_desc.elems, d2 = -1;
        for (t2.heap_len = 0, t2.heap_max = 573, a2 = 0; a2 < h2; a2++) 0 !== s2[2 * a2] ? (t2.heap[++t2.heap_len] = d2 = a2, t2.depth[a2] = 0) : s2[2 * a2 + 1] = 0;
        for (; t2.heap_len < 2; ) s2[2 * (i2 = t2.heap[++t2.heap_len] = d2 < 2 ? ++d2 : 0)] = 1, t2.depth[i2] = 0, t2.opt_len--, l2 && (t2.static_len -= o2[2 * i2 + 1]);
        for (e2.max_code = d2, a2 = t2.heap_len >> 1; a2 >= 1; a2--) U(t2, s2, a2);
        i2 = h2;
        do {
          a2 = t2.heap[1], t2.heap[1] = t2.heap[t2.heap_len--], U(t2, s2, 1), n2 = t2.heap[1], t2.heap[--t2.heap_max] = a2, t2.heap[--t2.heap_max] = n2, s2[2 * i2] = s2[2 * a2] + s2[2 * n2], t2.depth[i2] = (t2.depth[a2] >= t2.depth[n2] ? t2.depth[a2] : t2.depth[n2]) + 1, s2[2 * a2 + 1] = s2[2 * n2 + 1] = i2, t2.heap[1] = i2++, U(t2, s2, 1);
        } while (t2.heap_len >= 2);
        t2.heap[--t2.heap_max] = t2.heap[1], (function(t3, e3) {
          var a3, n3, i3, s3, o3, l3, h3 = e3.dyn_tree, d3 = e3.max_code, _2 = e3.stat_desc.static_tree, f2 = e3.stat_desc.has_stree, u2 = e3.stat_desc.extra_bits, c2 = e3.stat_desc.extra_base, w2 = e3.stat_desc.max_length, m2 = 0;
          for (s3 = 0; s3 <= r; s3++) t3.bl_count[s3] = 0;
          for (h3[2 * t3.heap[t3.heap_max] + 1] = 0, a3 = t3.heap_max + 1; a3 < 573; a3++) (s3 = h3[2 * h3[2 * (n3 = t3.heap[a3]) + 1] + 1] + 1) > w2 && (s3 = w2, m2++), h3[2 * n3 + 1] = s3, n3 > d3 || (t3.bl_count[s3]++, o3 = 0, n3 >= c2 && (o3 = u2[n3 - c2]), l3 = h3[2 * n3], t3.opt_len += l3 * (s3 + o3), f2 && (t3.static_len += l3 * (_2[2 * n3 + 1] + o3)));
          if (0 !== m2) {
            do {
              for (s3 = w2 - 1; 0 === t3.bl_count[s3]; ) s3--;
              t3.bl_count[s3]--, t3.bl_count[s3 + 1] += 2, t3.bl_count[w2]--, m2 -= 2;
            } while (m2 > 0);
            for (s3 = w2; 0 !== s3; s3--) for (n3 = t3.bl_count[s3]; 0 !== n3; ) (i3 = t3.heap[--a3]) > d3 || (h3[2 * i3 + 1] !== s3 && (t3.opt_len += (s3 - h3[2 * i3 + 1]) * h3[2 * i3], h3[2 * i3 + 1] = s3), n3--);
          }
        })(t2, e2), E(s2, d2, t2.bl_count);
      }, O = function(t2, e2, a2) {
        var n2, i2, r2 = -1, s2 = e2[1], o2 = 0, l2 = 7, h2 = 4;
        for (0 === s2 && (l2 = 138, h2 = 3), e2[2 * (a2 + 1) + 1] = 65535, n2 = 0; n2 <= a2; n2++) i2 = s2, s2 = e2[2 * (n2 + 1) + 1], ++o2 < l2 && i2 === s2 || (o2 < h2 ? t2.bl_tree[2 * i2] += o2 : 0 !== i2 ? (i2 !== r2 && t2.bl_tree[2 * i2]++, t2.bl_tree[32]++) : o2 <= 10 ? t2.bl_tree[34]++ : t2.bl_tree[36]++, o2 = 0, r2 = i2, 0 === s2 ? (l2 = 138, h2 = 3) : i2 === s2 ? (l2 = 6, h2 = 3) : (l2 = 7, h2 = 4));
      }, F = function(t2, e2, a2) {
        var n2, i2, r2 = -1, s2 = e2[1], o2 = 0, l2 = 7, h2 = 4;
        for (0 === s2 && (l2 = 138, h2 = 3), n2 = 0; n2 <= a2; n2++) if (i2 = s2, s2 = e2[2 * (n2 + 1) + 1], !(++o2 < l2 && i2 === s2)) {
          if (o2 < h2) do {
            z(t2, i2, t2.bl_tree);
          } while (0 != --o2);
          else 0 !== i2 ? (i2 !== r2 && (z(t2, i2, t2.bl_tree), o2--), z(t2, 16, t2.bl_tree), x(t2, o2 - 3, 2)) : o2 <= 10 ? (z(t2, 17, t2.bl_tree), x(t2, o2 - 3, 3)) : (z(t2, 18, t2.bl_tree), x(t2, o2 - 11, 7));
          o2 = 0, r2 = i2, 0 === s2 ? (l2 = 138, h2 = 3) : i2 === s2 ? (l2 = 6, h2 = 3) : (l2 = 7, h2 = 4);
        }
      }, I = false, L = function(t2, e2, a2, n2) {
        x(t2, 0 + (n2 ? 1 : 0), 3), Z(t2), y(t2, a2), y(t2, ~a2), a2 && t2.pending_buf.set(t2.window.subarray(e2, e2 + a2), t2.pending), t2.pending += a2;
      }, N = function(t2, e2, n2, i2) {
        var r2, s2, o2 = 0;
        t2.level > 0 ? (2 === t2.strm.data_type && (t2.strm.data_type = (function(t3) {
          var e3, n3 = 4093624447;
          for (e3 = 0; e3 <= 31; e3++, n3 >>>= 1) if (1 & n3 && 0 !== t3.dyn_ltree[2 * e3]) return 0;
          if (0 !== t3.dyn_ltree[18] || 0 !== t3.dyn_ltree[20] || 0 !== t3.dyn_ltree[26]) return 1;
          for (e3 = 32; e3 < a; e3++) if (0 !== t3.dyn_ltree[2 * e3]) return 1;
          return 0;
        })(t2)), T(t2, t2.l_desc), T(t2, t2.d_desc), o2 = (function(t3) {
          var e3;
          for (O(t3, t3.dyn_ltree, t3.l_desc.max_code), O(t3, t3.dyn_dtree, t3.d_desc.max_code), T(t3, t3.bl_desc), e3 = 18; e3 >= 3 && 0 === t3.bl_tree[2 * h[e3] + 1]; e3--) ;
          return t3.opt_len += 3 * (e3 + 1) + 5 + 5 + 4, e3;
        })(t2), r2 = t2.opt_len + 3 + 7 >>> 3, (s2 = t2.static_len + 3 + 7 >>> 3) <= r2 && (r2 = s2)) : r2 = s2 = n2 + 5, n2 + 4 <= r2 && -1 !== e2 ? L(t2, e2, n2, i2) : 4 === t2.strategy || s2 === r2 ? (x(t2, 2 + (i2 ? 1 : 0), 3), D(t2, d, _)) : (x(t2, 4 + (i2 ? 1 : 0), 3), (function(t3, e3, a2, n3) {
          var i3;
          for (x(t3, e3 - 257, 5), x(t3, a2 - 1, 5), x(t3, n3 - 4, 4), i3 = 0; i3 < n3; i3++) x(t3, t3.bl_tree[2 * h[i3] + 1], 3);
          F(t3, t3.dyn_ltree, e3 - 1), F(t3, t3.dyn_dtree, a2 - 1);
        })(t2, t2.l_desc.max_code + 1, t2.d_desc.max_code + 1, o2 + 1), D(t2, t2.dyn_ltree, t2.dyn_dtree)), R(t2), i2 && Z(t2);
      }, B = { _tr_init: function(t2) {
        I || (!(function() {
          var t3, e2, a2, h2, v2, k2 = new Array(16);
          for (a2 = 0, h2 = 0; h2 < 28; h2++) for (c[h2] = a2, t3 = 0; t3 < 1 << s[h2]; t3++) u[a2++] = h2;
          for (u[a2 - 1] = h2, v2 = 0, h2 = 0; h2 < 16; h2++) for (g[h2] = v2, t3 = 0; t3 < 1 << o[h2]; t3++) f[v2++] = h2;
          for (v2 >>= 7; h2 < i; h2++) for (g[h2] = v2 << 7, t3 = 0; t3 < 1 << o[h2] - 7; t3++) f[256 + v2++] = h2;
          for (e2 = 0; e2 <= r; e2++) k2[e2] = 0;
          for (t3 = 0; t3 <= 143; ) d[2 * t3 + 1] = 8, t3++, k2[8]++;
          for (; t3 <= 255; ) d[2 * t3 + 1] = 9, t3++, k2[9]++;
          for (; t3 <= 279; ) d[2 * t3 + 1] = 7, t3++, k2[7]++;
          for (; t3 <= 287; ) d[2 * t3 + 1] = 8, t3++, k2[8]++;
          for (E(d, 287, k2), t3 = 0; t3 < i; t3++) _[2 * t3 + 1] = 5, _[2 * t3] = A(t3, 5);
          w = new p(d, s, 257, n, r), m = new p(_, o, 0, i, r), b = new p(new Array(0), l, 0, 19, 7);
        })(), I = true), t2.l_desc = new v(t2.dyn_ltree, w), t2.d_desc = new v(t2.dyn_dtree, m), t2.bl_desc = new v(t2.bl_tree, b), t2.bi_buf = 0, t2.bi_valid = 0, R(t2);
      }, _tr_stored_block: L, _tr_flush_block: N, _tr_tally: function(t2, e2, n2) {
        return t2.pending_buf[t2.sym_buf + t2.sym_next++] = e2, t2.pending_buf[t2.sym_buf + t2.sym_next++] = e2 >> 8, t2.pending_buf[t2.sym_buf + t2.sym_next++] = n2, 0 === e2 ? t2.dyn_ltree[2 * n2]++ : (t2.matches++, e2--, t2.dyn_ltree[2 * (u[n2] + a + 1)]++, t2.dyn_dtree[2 * k(e2)]++), t2.sym_next === t2.sym_end;
      }, _tr_align: function(t2) {
        x(t2, 2, 3), z(t2, 256, d), (function(t3) {
          16 === t3.bi_valid ? (y(t3, t3.bi_buf), t3.bi_buf = 0, t3.bi_valid = 0) : t3.bi_valid >= 8 && (t3.pending_buf[t3.pending++] = 255 & t3.bi_buf, t3.bi_buf >>= 8, t3.bi_valid -= 8);
        })(t2);
      } }, C = function(t2, e2, a2, n2) {
        for (var i2 = 65535 & t2 | 0, r2 = t2 >>> 16 & 65535 | 0, s2 = 0; 0 !== a2; ) {
          a2 -= s2 = a2 > 2e3 ? 2e3 : a2;
          do {
            r2 = r2 + (i2 = i2 + e2[n2++] | 0) | 0;
          } while (--s2);
          i2 %= 65521, r2 %= 65521;
        }
        return i2 | r2 << 16 | 0;
      }, H = new Uint32Array((function() {
        for (var t2, e2 = [], a2 = 0; a2 < 256; a2++) {
          t2 = a2;
          for (var n2 = 0; n2 < 8; n2++) t2 = 1 & t2 ? 3988292384 ^ t2 >>> 1 : t2 >>> 1;
          e2[a2] = t2;
        }
        return e2;
      })()), M = function(t2, e2, a2, n2) {
        var i2 = H, r2 = n2 + a2;
        t2 ^= -1;
        for (var s2 = n2; s2 < r2; s2++) t2 = t2 >>> 8 ^ i2[255 & (t2 ^ e2[s2])];
        return -1 ^ t2;
      }, j = { 2: "need dictionary", 1: "stream end", 0: "", "-1": "file error", "-2": "stream error", "-3": "data error", "-4": "insufficient memory", "-5": "buffer error", "-6": "incompatible version" }, K = { Z_NO_FLUSH: 0, Z_PARTIAL_FLUSH: 1, Z_SYNC_FLUSH: 2, Z_FULL_FLUSH: 3, Z_FINISH: 4, Z_BLOCK: 5, Z_TREES: 6, Z_OK: 0, Z_STREAM_END: 1, Z_NEED_DICT: 2, Z_ERRNO: -1, Z_STREAM_ERROR: -2, Z_DATA_ERROR: -3, Z_MEM_ERROR: -4, Z_BUF_ERROR: -5, Z_NO_COMPRESSION: 0, Z_BEST_SPEED: 1, Z_BEST_COMPRESSION: 9, Z_DEFAULT_COMPRESSION: -1, Z_FILTERED: 1, Z_HUFFMAN_ONLY: 2, Z_RLE: 3, Z_FIXED: 4, Z_DEFAULT_STRATEGY: 0, Z_BINARY: 0, Z_TEXT: 1, Z_UNKNOWN: 2, Z_DEFLATED: 8 }, P = B._tr_init, Y = B._tr_stored_block, G = B._tr_flush_block, X = B._tr_tally, W = B._tr_align, q = K.Z_NO_FLUSH, J = K.Z_PARTIAL_FLUSH, Q = K.Z_FULL_FLUSH, V = K.Z_FINISH, $ = K.Z_BLOCK, tt = K.Z_OK, et = K.Z_STREAM_END, at = K.Z_STREAM_ERROR, nt = K.Z_DATA_ERROR, it = K.Z_BUF_ERROR, rt = K.Z_DEFAULT_COMPRESSION, st = K.Z_FILTERED, ot = K.Z_HUFFMAN_ONLY, lt = K.Z_RLE, ht = K.Z_FIXED, dt = K.Z_DEFAULT_STRATEGY, _t = K.Z_UNKNOWN, ft = K.Z_DEFLATED, ut = 258, ct = 262, wt = 42, mt = 113, bt = 666, gt = function(t2, e2) {
        return t2.msg = j[e2], e2;
      }, pt = function(t2) {
        return 2 * t2 - (t2 > 4 ? 9 : 0);
      }, vt = function(t2) {
        for (var e2 = t2.length; --e2 >= 0; ) t2[e2] = 0;
      }, kt = function(t2) {
        var e2, a2, n2, i2 = t2.w_size;
        n2 = e2 = t2.hash_size;
        do {
          a2 = t2.head[--n2], t2.head[n2] = a2 >= i2 ? a2 - i2 : 0;
        } while (--e2);
        n2 = e2 = i2;
        do {
          a2 = t2.prev[--n2], t2.prev[n2] = a2 >= i2 ? a2 - i2 : 0;
        } while (--e2);
      }, yt = function(t2, e2, a2) {
        return (e2 << t2.hash_shift ^ a2) & t2.hash_mask;
      }, xt = function(t2, e2) {
        var a2;
        if (t2.legacy_hash) a2 = t2.ins_h = yt(t2, t2.ins_h, t2.window[e2 + 3 - 1]);
        else {
          var n2 = t2.window, i2 = n2[e2] | n2[e2 + 1] << 8 | n2[e2 + 2] << 16 | n2[e2 + 3] << 24;
          a2 = t2.ins_h = Math.imul(i2, 66521) + 66521 >>> 16 & t2.hash_mask;
        }
        var r2 = t2.prev[e2 & t2.w_mask] = t2.head[a2];
        return t2.head[a2] = e2, r2;
      }, zt = function(t2) {
        var e2 = t2.state, a2 = e2.pending;
        a2 > t2.avail_out && (a2 = t2.avail_out), 0 !== a2 && (t2.output.set(e2.pending_buf.subarray(e2.pending_out, e2.pending_out + a2), t2.next_out), t2.next_out += a2, e2.pending_out += a2, t2.total_out += a2, t2.avail_out -= a2, e2.pending -= a2, 0 === e2.pending && (e2.pending_out = 0));
      }, At = function(t2, e2) {
        G(t2, t2.block_start >= 0 ? t2.block_start : -1, t2.strstart - t2.block_start, e2), t2.block_start = t2.strstart, zt(t2.strm);
      }, Et = function(t2, e2) {
        t2.pending_buf[t2.pending++] = e2;
      }, Rt = function(t2, e2) {
        t2.pending_buf[t2.pending++] = e2 >>> 8 & 255, t2.pending_buf[t2.pending++] = 255 & e2;
      }, Zt = function(t2, e2, a2, n2) {
        var i2 = t2.avail_in;
        return i2 > n2 && (i2 = n2), 0 === i2 ? 0 : (t2.avail_in -= i2, e2.set(t2.input.subarray(t2.next_in, t2.next_in + i2), a2), 1 === t2.state.wrap ? t2.adler = C(t2.adler, e2, i2, a2) : 2 === t2.state.wrap && (t2.adler = M(t2.adler, e2, i2, a2)), t2.next_in += i2, t2.total_in += i2, i2);
      }, St = function(t2, e2) {
        var a2, n2, i2 = t2.max_chain_length, r2 = t2.strstart, s2 = t2.prev_length, o2 = t2.nice_match, l2 = t2.strstart > t2.w_size - ct ? t2.strstart - (t2.w_size - ct) : 0, h2 = t2.window, d2 = t2.w_mask, _2 = t2.prev, f2 = t2.strstart + ut, u2 = h2[r2 + s2 - 1], c2 = h2[r2 + s2];
        t2.prev_length >= t2.good_match && (i2 >>= 2), o2 > t2.lookahead && (o2 = t2.lookahead);
        do {
          if (h2[(a2 = e2) + s2] === c2 && h2[a2 + s2 - 1] === u2 && h2[a2] === h2[r2] && h2[++a2] === h2[r2 + 1]) {
            r2 += 2, a2++;
            do {
            } while (h2[++r2] === h2[++a2] && h2[++r2] === h2[++a2] && h2[++r2] === h2[++a2] && h2[++r2] === h2[++a2] && h2[++r2] === h2[++a2] && h2[++r2] === h2[++a2] && h2[++r2] === h2[++a2] && h2[++r2] === h2[++a2] && r2 < f2);
            if (n2 = ut - (f2 - r2), r2 = f2 - ut, n2 > s2) {
              if (t2.match_start = e2, s2 = n2, n2 >= o2) break;
              u2 = h2[r2 + s2 - 1], c2 = h2[r2 + s2];
            }
          }
        } while ((e2 = _2[e2 & d2]) > l2 && 0 != --i2);
        return s2 <= t2.lookahead ? s2 : t2.lookahead;
      }, Ut = function(t2) {
        var e2, a2, n2, i2 = t2.w_size;
        do {
          if (a2 = t2.window_size - t2.lookahead - t2.strstart, t2.strstart >= i2 + (i2 - ct) && (t2.window.set(t2.window.subarray(i2, i2 + i2 - a2), 0), t2.match_start -= i2, t2.strstart -= i2, t2.block_start -= i2, t2.insert > t2.strstart && (t2.insert = t2.strstart), kt(t2), a2 += i2), 0 === t2.strm.avail_in) break;
          if (e2 = Zt(t2.strm, t2.window, t2.strstart + t2.lookahead, a2), t2.lookahead += e2, t2.legacy_hash) {
            if (t2.lookahead + t2.insert >= 3) for (n2 = t2.strstart - t2.insert, t2.ins_h = t2.window[n2], t2.ins_h = yt(t2, t2.ins_h, t2.window[n2 + 1]); t2.insert && (xt(t2, n2), n2++, t2.insert--, !(t2.lookahead + t2.insert < 3)); ) ;
          } else if (t2.lookahead + t2.insert > 3) for (n2 = t2.strstart - t2.insert; t2.insert && (xt(t2, n2), n2++, t2.insert--, !(t2.lookahead + t2.insert <= 3)); ) ;
        } while (t2.lookahead < ct && 0 !== t2.strm.avail_in);
      }, Dt = function(t2, e2) {
        var a2, n2, i2, r2 = t2.pending_buf_size - 5 > t2.w_size ? t2.w_size : t2.pending_buf_size - 5, s2 = 0, o2 = t2.strm.avail_in;
        do {
          if (a2 = 65535, i2 = t2.bi_valid + 42 >> 3, t2.strm.avail_out < i2) break;
          if (i2 = t2.strm.avail_out - i2, a2 > (n2 = t2.strstart - t2.block_start) + t2.strm.avail_in && (a2 = n2 + t2.strm.avail_in), a2 > i2 && (a2 = i2), a2 < r2 && (0 === a2 && e2 !== V || e2 === q || a2 !== n2 + t2.strm.avail_in)) break;
          s2 = e2 === V && a2 === n2 + t2.strm.avail_in ? 1 : 0, Y(t2, 0, 0, s2), t2.pending_buf[t2.pending - 4] = a2, t2.pending_buf[t2.pending - 3] = a2 >> 8, t2.pending_buf[t2.pending - 2] = ~a2, t2.pending_buf[t2.pending - 1] = ~a2 >> 8, zt(t2.strm), n2 && (n2 > a2 && (n2 = a2), t2.strm.output.set(t2.window.subarray(t2.block_start, t2.block_start + n2), t2.strm.next_out), t2.strm.next_out += n2, t2.strm.avail_out -= n2, t2.strm.total_out += n2, t2.block_start += n2, a2 -= n2), a2 && (Zt(t2.strm, t2.strm.output, t2.strm.next_out, a2), t2.strm.next_out += a2, t2.strm.avail_out -= a2, t2.strm.total_out += a2);
        } while (0 === s2);
        return (o2 -= t2.strm.avail_in) && (o2 >= t2.w_size ? (t2.matches = 2, t2.window.set(t2.strm.input.subarray(t2.strm.next_in - t2.w_size, t2.strm.next_in), 0), t2.strstart = t2.w_size, t2.insert = t2.strstart) : (t2.window_size - t2.strstart <= o2 && (t2.strstart -= t2.w_size, t2.window.set(t2.window.subarray(t2.w_size, t2.w_size + t2.strstart), 0), t2.matches < 2 && t2.matches++, t2.insert > t2.strstart && (t2.insert = t2.strstart)), t2.window.set(t2.strm.input.subarray(t2.strm.next_in - o2, t2.strm.next_in), t2.strstart), t2.strstart += o2, t2.insert += o2 > t2.w_size - t2.insert ? t2.w_size - t2.insert : o2), t2.block_start = t2.strstart), t2.high_water < t2.strstart && (t2.high_water = t2.strstart), s2 ? 4 : e2 !== q && e2 !== V && 0 === t2.strm.avail_in && t2.strstart === t2.block_start ? 2 : (i2 = t2.window_size - t2.strstart, t2.strm.avail_in > i2 && t2.block_start >= t2.w_size && (t2.block_start -= t2.w_size, t2.strstart -= t2.w_size, t2.window.set(t2.window.subarray(t2.w_size, t2.w_size + t2.strstart), 0), t2.matches < 2 && t2.matches++, i2 += t2.w_size, t2.insert > t2.strstart && (t2.insert = t2.strstart)), i2 > t2.strm.avail_in && (i2 = t2.strm.avail_in), i2 && (Zt(t2.strm, t2.window, t2.strstart, i2), t2.strstart += i2, t2.insert += i2 > t2.w_size - t2.insert ? t2.w_size - t2.insert : i2), t2.high_water < t2.strstart && (t2.high_water = t2.strstart), i2 = t2.bi_valid + 42 >> 3, r2 = (i2 = t2.pending_buf_size - i2 > 65535 ? 65535 : t2.pending_buf_size - i2) > t2.w_size ? t2.w_size : i2, ((n2 = t2.strstart - t2.block_start) >= r2 || (n2 || e2 === V) && e2 !== q && 0 === t2.strm.avail_in && n2 <= i2) && (a2 = n2 > i2 ? i2 : n2, s2 = e2 === V && 0 === t2.strm.avail_in && a2 === n2 ? 1 : 0, Y(t2, t2.block_start, a2, s2), t2.block_start += a2, zt(t2.strm)), s2 ? 3 : 1);
      }, Tt = function(t2, e2) {
        for (var a2, n2; ; ) {
          if (t2.lookahead < ct) {
            if (Ut(t2), t2.lookahead < ct && e2 === q) return 1;
            if (0 === t2.lookahead) break;
          }
          if (a2 = 0, t2.lookahead >= 3 && (a2 = xt(t2, t2.strstart)), 0 !== a2 && t2.strstart - a2 <= t2.w_size - ct && (t2.match_length = St(t2, a2)), t2.match_length >= 3) if (n2 = X(t2, t2.strstart - t2.match_start, t2.match_length - 3), t2.lookahead -= t2.match_length, t2.match_length <= t2.max_lazy_match && t2.lookahead >= 3) {
            t2.match_length--;
            do {
              t2.strstart++, a2 = xt(t2, t2.strstart);
            } while (0 != --t2.match_length);
            t2.strstart++;
          } else t2.strstart += t2.match_length, t2.match_length = 0, t2.legacy_hash && (t2.ins_h = t2.window[t2.strstart], t2.ins_h = yt(t2, t2.ins_h, t2.window[t2.strstart + 1]));
          else n2 = X(t2, 0, t2.window[t2.strstart]), t2.lookahead--, t2.strstart++;
          if (n2 && (At(t2, false), 0 === t2.strm.avail_out)) return 1;
        }
        return t2.insert = t2.strstart < 2 ? t2.strstart : 2, e2 === V ? (At(t2, true), 0 === t2.strm.avail_out ? 3 : 4) : t2.sym_next && (At(t2, false), 0 === t2.strm.avail_out) ? 1 : 2;
      }, Ot = function(t2, e2) {
        for (var a2, n2, i2; ; ) {
          if (t2.lookahead < ct) {
            if (Ut(t2), t2.lookahead < ct && e2 === q) return 1;
            if (0 === t2.lookahead) break;
          }
          if (a2 = 0, t2.lookahead >= 3 && (a2 = xt(t2, t2.strstart)), t2.prev_length = t2.match_length, t2.prev_match = t2.match_start, t2.match_length = 2, 0 !== a2 && t2.prev_length < t2.max_lazy_match && t2.strstart - a2 <= t2.w_size - ct && (t2.match_length = St(t2, a2), t2.match_length <= 5 && (t2.strategy === st || 3 === t2.match_length && t2.strstart - t2.match_start > 4096) && (t2.match_length = 2)), t2.prev_length >= 3 && t2.match_length <= t2.prev_length) {
            i2 = t2.strstart + t2.lookahead - 3, n2 = X(t2, t2.strstart - 1 - t2.prev_match, t2.prev_length - 3), t2.lookahead -= t2.prev_length - 1, t2.prev_length -= 2;
            do {
              ++t2.strstart <= i2 && (a2 = xt(t2, t2.strstart));
            } while (0 != --t2.prev_length);
            if (t2.match_available = 0, t2.match_length = 2, t2.strstart++, n2 && (At(t2, false), 0 === t2.strm.avail_out)) return 1;
          } else if (t2.match_available) {
            if ((n2 = X(t2, 0, t2.window[t2.strstart - 1])) && At(t2, false), t2.strstart++, t2.lookahead--, 0 === t2.strm.avail_out) return 1;
          } else t2.match_available = 1, t2.strstart++, t2.lookahead--;
        }
        return t2.match_available && (n2 = X(t2, 0, t2.window[t2.strstart - 1]), t2.match_available = 0), t2.insert = t2.strstart < 2 ? t2.strstart : 2, e2 === V ? (At(t2, true), 0 === t2.strm.avail_out ? 3 : 4) : t2.sym_next && (At(t2, false), 0 === t2.strm.avail_out) ? 1 : 2;
      };
      function Ft(t2, e2, a2, n2, i2) {
        this.good_length = t2, this.max_lazy = e2, this.nice_length = a2, this.max_chain = n2, this.func = i2;
      }
      var It = [new Ft(0, 0, 0, 0, Dt), new Ft(4, 4, 8, 4, Tt), new Ft(4, 5, 16, 8, Tt), new Ft(4, 6, 32, 32, Tt), new Ft(4, 4, 16, 16, Ot), new Ft(8, 16, 32, 32, Ot), new Ft(8, 16, 128, 128, Ot), new Ft(8, 32, 128, 256, Ot), new Ft(32, 128, 258, 1024, Ot), new Ft(32, 258, 258, 4096, Ot)];
      function Lt() {
        this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = ft, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.legacy_hash = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new Uint16Array(1146), this.dyn_dtree = new Uint16Array(122), this.bl_tree = new Uint16Array(78), vt(this.dyn_ltree), vt(this.dyn_dtree), vt(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new Uint16Array(16), this.heap = new Uint16Array(573), vt(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new Uint16Array(573), vt(this.depth), this.sym_buf = 0, this.lit_bufsize = 0, this.sym_next = 0, this.sym_end = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
      }
      var Nt = function(t2) {
        if (!t2) return 1;
        var e2 = t2.state;
        return !e2 || e2.strm !== t2 || e2.status !== wt && 57 !== e2.status && 69 !== e2.status && 73 !== e2.status && 91 !== e2.status && 103 !== e2.status && e2.status !== mt && e2.status !== bt ? 1 : 0;
      }, Bt = function(t2) {
        if (Nt(t2)) return gt(t2, at);
        t2.total_in = t2.total_out = 0, t2.data_type = _t;
        var e2 = t2.state;
        return e2.pending = 0, e2.pending_out = 0, e2.wrap < 0 && (e2.wrap = -e2.wrap), e2.status = 2 === e2.wrap ? 57 : e2.wrap ? wt : mt, t2.adler = 2 === e2.wrap ? 0 : 1, e2.last_flush = -2, P(e2), tt;
      }, Ct = function(t2) {
        var e2, a2 = Bt(t2);
        return a2 === tt && ((e2 = t2.state).window_size = 2 * e2.w_size, vt(e2.head), e2.max_lazy_match = It[e2.level].max_lazy, e2.good_match = It[e2.level].good_length, e2.nice_match = It[e2.level].nice_length, e2.max_chain_length = It[e2.level].max_chain, e2.strstart = 0, e2.block_start = 0, e2.lookahead = 0, e2.insert = 0, e2.match_length = e2.prev_length = 2, e2.match_available = 0, e2.ins_h = 0), a2;
      }, Ht = function(t2, e2, a2, n2, i2, r2, s2) {
        if (!t2) return at;
        var o2 = 1;
        if (e2 === rt && (e2 = 6), n2 < 0 ? (o2 = 0, n2 = -n2) : n2 > 15 && (o2 = 2, n2 -= 16), i2 < 1 || i2 > 9 || a2 !== ft || n2 < 8 || n2 > 15 || e2 < 0 || e2 > 9 || r2 < 0 || r2 > ht || 8 === n2 && 1 !== o2) return gt(t2, at);
        8 === n2 && (n2 = 9);
        var l2 = new Lt();
        return t2.state = l2, l2.strm = t2, l2.status = wt, l2.wrap = o2, l2.gzhead = null, l2.w_bits = n2, l2.w_size = 1 << l2.w_bits, l2.w_mask = l2.w_size - 1, l2.legacy_hash = s2 ? 1 : 0, l2.hash_bits = i2 + 7, !l2.legacy_hash && l2.hash_bits < 15 && (l2.hash_bits = 15), l2.hash_size = 1 << l2.hash_bits, l2.hash_mask = l2.hash_size - 1, l2.hash_shift = ~~((l2.hash_bits + 3 - 1) / 3), l2.window = new Uint8Array(2 * l2.w_size), l2.head = new Uint16Array(l2.hash_size), l2.prev = new Uint16Array(l2.w_size), l2.lit_bufsize = 1 << i2 + 6, l2.pending_buf_size = 4 * l2.lit_bufsize, l2.pending_buf = new Uint8Array(l2.pending_buf_size), l2.sym_buf = l2.lit_bufsize, l2.sym_end = 3 * (l2.lit_bufsize - 1), l2.level = e2, l2.strategy = r2, l2.method = a2, Ct(t2);
      }, Mt = { deflateInit: function(t2, e2) {
        return Ht(t2, e2, ft, 15, 8, dt);
      }, deflateInit2: Ht, deflateReset: Ct, deflateResetKeep: Bt, deflateSetHeader: function(t2, e2) {
        return Nt(t2) || 2 !== t2.state.wrap ? at : (t2.state.gzhead = e2, tt);
      }, deflate: function(t2, e2) {
        if (Nt(t2) || e2 > $ || e2 < 0) return t2 ? gt(t2, at) : at;
        var a2 = t2.state;
        if (!t2.output || 0 !== t2.avail_in && !t2.input || a2.status === bt && e2 !== V) return gt(t2, 0 === t2.avail_out ? it : at);
        var n2 = a2.last_flush;
        if (a2.last_flush = e2, 0 !== a2.pending) {
          if (zt(t2), 0 === t2.avail_out) return a2.last_flush = -1, tt;
        } else if (0 === t2.avail_in && pt(e2) <= pt(n2) && e2 !== V) return gt(t2, it);
        if (a2.status === bt && 0 !== t2.avail_in) return gt(t2, it);
        if (a2.status === wt && 0 === a2.wrap && (a2.status = mt), a2.status === wt) {
          var i2 = ft + (a2.w_bits - 8 << 4) << 8;
          if (i2 |= (a2.strategy >= ot || a2.level < 2 ? 0 : a2.level < 6 ? 1 : 6 === a2.level ? 2 : 3) << 6, 0 !== a2.strstart && (i2 |= 32), Rt(a2, i2 += 31 - i2 % 31), 0 !== a2.strstart && (Rt(a2, t2.adler >>> 16), Rt(a2, 65535 & t2.adler)), t2.adler = 1, a2.status = mt, zt(t2), 0 !== a2.pending) return a2.last_flush = -1, tt;
        }
        if (57 === a2.status) {
          if (t2.adler = 0, Et(a2, 31), Et(a2, 139), Et(a2, 8), a2.gzhead) Et(a2, (a2.gzhead.text ? 1 : 0) + (a2.gzhead.hcrc ? 2 : 0) + (a2.gzhead.extra ? 4 : 0) + (a2.gzhead.name ? 8 : 0) + (a2.gzhead.comment ? 16 : 0)), Et(a2, 255 & a2.gzhead.time), Et(a2, a2.gzhead.time >> 8 & 255), Et(a2, a2.gzhead.time >> 16 & 255), Et(a2, a2.gzhead.time >> 24 & 255), Et(a2, 9 === a2.level ? 2 : a2.strategy >= ot || a2.level < 2 ? 4 : 0), Et(a2, 255 & a2.gzhead.os), a2.gzhead.extra && a2.gzhead.extra.length && (Et(a2, 255 & a2.gzhead.extra.length), Et(a2, a2.gzhead.extra.length >> 8 & 255)), a2.gzhead.hcrc && (t2.adler = M(t2.adler, a2.pending_buf, a2.pending, 0)), a2.gzindex = 0, a2.status = 69;
          else if (Et(a2, 0), Et(a2, 0), Et(a2, 0), Et(a2, 0), Et(a2, 0), Et(a2, 9 === a2.level ? 2 : a2.strategy >= ot || a2.level < 2 ? 4 : 0), Et(a2, 3), a2.status = mt, zt(t2), 0 !== a2.pending) return a2.last_flush = -1, tt;
        }
        if (69 === a2.status) {
          if (a2.gzhead.extra) {
            for (var r2 = a2.pending, s2 = (65535 & a2.gzhead.extra.length) - a2.gzindex; a2.pending + s2 > a2.pending_buf_size; ) {
              var o2 = a2.pending_buf_size - a2.pending;
              if (a2.pending_buf.set(a2.gzhead.extra.subarray(a2.gzindex, a2.gzindex + o2), a2.pending), a2.pending = a2.pending_buf_size, a2.gzhead.hcrc && a2.pending > r2 && (t2.adler = M(t2.adler, a2.pending_buf, a2.pending - r2, r2)), a2.gzindex += o2, zt(t2), 0 !== a2.pending) return a2.last_flush = -1, tt;
              r2 = 0, s2 -= o2;
            }
            var l2 = new Uint8Array(a2.gzhead.extra);
            a2.pending_buf.set(l2.subarray(a2.gzindex, a2.gzindex + s2), a2.pending), a2.pending += s2, a2.gzhead.hcrc && a2.pending > r2 && (t2.adler = M(t2.adler, a2.pending_buf, a2.pending - r2, r2)), a2.gzindex = 0;
          }
          a2.status = 73;
        }
        if (73 === a2.status) {
          if (a2.gzhead.name) {
            var h2, d2 = a2.pending;
            do {
              if (a2.pending === a2.pending_buf_size) {
                if (a2.gzhead.hcrc && a2.pending > d2 && (t2.adler = M(t2.adler, a2.pending_buf, a2.pending - d2, d2)), zt(t2), 0 !== a2.pending) return a2.last_flush = -1, tt;
                d2 = 0;
              }
              h2 = a2.gzindex < a2.gzhead.name.length ? 255 & a2.gzhead.name.charCodeAt(a2.gzindex++) : 0, Et(a2, h2);
            } while (0 !== h2);
            a2.gzhead.hcrc && a2.pending > d2 && (t2.adler = M(t2.adler, a2.pending_buf, a2.pending - d2, d2)), a2.gzindex = 0;
          }
          a2.status = 91;
        }
        if (91 === a2.status) {
          if (a2.gzhead.comment) {
            var _2, f2 = a2.pending;
            do {
              if (a2.pending === a2.pending_buf_size) {
                if (a2.gzhead.hcrc && a2.pending > f2 && (t2.adler = M(t2.adler, a2.pending_buf, a2.pending - f2, f2)), zt(t2), 0 !== a2.pending) return a2.last_flush = -1, tt;
                f2 = 0;
              }
              _2 = a2.gzindex < a2.gzhead.comment.length ? 255 & a2.gzhead.comment.charCodeAt(a2.gzindex++) : 0, Et(a2, _2);
            } while (0 !== _2);
            a2.gzhead.hcrc && a2.pending > f2 && (t2.adler = M(t2.adler, a2.pending_buf, a2.pending - f2, f2));
          }
          a2.status = 103;
        }
        if (103 === a2.status) {
          if (a2.gzhead.hcrc) {
            if (a2.pending + 2 > a2.pending_buf_size && (zt(t2), 0 !== a2.pending)) return a2.last_flush = -1, tt;
            Et(a2, 255 & t2.adler), Et(a2, t2.adler >> 8 & 255), t2.adler = 0;
          }
          if (a2.status = mt, zt(t2), 0 !== a2.pending) return a2.last_flush = -1, tt;
        }
        if (0 !== t2.avail_in || 0 !== a2.lookahead || e2 !== q && a2.status !== bt) {
          var u2 = 0 === a2.level ? Dt(a2, e2) : a2.strategy === ot ? (function(t3, e3) {
            for (var a3; ; ) {
              if (0 === t3.lookahead && (Ut(t3), 0 === t3.lookahead)) {
                if (e3 === q) return 1;
                break;
              }
              if (t3.match_length = 0, a3 = X(t3, 0, t3.window[t3.strstart]), t3.lookahead--, t3.strstart++, a3 && (At(t3, false), 0 === t3.strm.avail_out)) return 1;
            }
            return t3.insert = 0, e3 === V ? (At(t3, true), 0 === t3.strm.avail_out ? 3 : 4) : t3.sym_next && (At(t3, false), 0 === t3.strm.avail_out) ? 1 : 2;
          })(a2, e2) : a2.strategy === lt ? (function(t3, e3) {
            for (var a3, n3, i3, r3, s3 = t3.window; ; ) {
              if (t3.lookahead <= ut) {
                if (Ut(t3), t3.lookahead <= ut && e3 === q) return 1;
                if (0 === t3.lookahead) break;
              }
              if (t3.match_length = 0, t3.lookahead >= 3 && t3.strstart > 0 && (n3 = s3[i3 = t3.strstart - 1]) === s3[++i3] && n3 === s3[++i3] && n3 === s3[++i3]) {
                r3 = t3.strstart + ut;
                do {
                } while (n3 === s3[++i3] && n3 === s3[++i3] && n3 === s3[++i3] && n3 === s3[++i3] && n3 === s3[++i3] && n3 === s3[++i3] && n3 === s3[++i3] && n3 === s3[++i3] && i3 < r3);
                t3.match_length = ut - (r3 - i3), t3.match_length > t3.lookahead && (t3.match_length = t3.lookahead);
              }
              if (t3.match_length >= 3 ? (a3 = X(t3, 1, t3.match_length - 3), t3.lookahead -= t3.match_length, t3.strstart += t3.match_length, t3.match_length = 0) : (a3 = X(t3, 0, t3.window[t3.strstart]), t3.lookahead--, t3.strstart++), a3 && (At(t3, false), 0 === t3.strm.avail_out)) return 1;
            }
            return t3.insert = 0, e3 === V ? (At(t3, true), 0 === t3.strm.avail_out ? 3 : 4) : t3.sym_next && (At(t3, false), 0 === t3.strm.avail_out) ? 1 : 2;
          })(a2, e2) : It[a2.level].func(a2, e2);
          if (3 !== u2 && 4 !== u2 || (a2.status = bt), 1 === u2 || 3 === u2) return 0 === t2.avail_out && (a2.last_flush = -1), tt;
          if (2 === u2 && (e2 === J ? W(a2) : e2 !== $ && (Y(a2, 0, 0, false), e2 === Q && (vt(a2.head), 0 === a2.lookahead && (a2.strstart = 0, a2.block_start = 0, a2.insert = 0))), zt(t2), 0 === t2.avail_out)) return a2.last_flush = -1, tt;
        }
        return e2 !== V ? tt : a2.wrap <= 0 ? et : (2 === a2.wrap ? (Et(a2, 255 & t2.adler), Et(a2, t2.adler >> 8 & 255), Et(a2, t2.adler >> 16 & 255), Et(a2, t2.adler >> 24 & 255), Et(a2, 255 & t2.total_in), Et(a2, t2.total_in >> 8 & 255), Et(a2, t2.total_in >> 16 & 255), Et(a2, t2.total_in >> 24 & 255)) : (Rt(a2, t2.adler >>> 16), Rt(a2, 65535 & t2.adler)), zt(t2), a2.wrap > 0 && (a2.wrap = -a2.wrap), 0 !== a2.pending ? tt : et);
      }, deflateEnd: function(t2) {
        if (Nt(t2)) return at;
        var e2 = t2.state.status;
        return t2.state = null, e2 === mt ? gt(t2, nt) : tt;
      }, deflateSetDictionary: function(t2, e2) {
        var a2 = e2.length;
        if (Nt(t2)) return at;
        var n2 = t2.state, i2 = n2.wrap;
        if (2 === i2 || 1 === i2 && n2.status !== wt || n2.lookahead) return at;
        if (1 === i2 && (t2.adler = C(t2.adler, e2, a2, 0)), n2.wrap = 0, a2 >= n2.w_size) {
          0 === i2 && (vt(n2.head), n2.strstart = 0, n2.block_start = 0, n2.insert = 0);
          var r2 = new Uint8Array(n2.w_size);
          r2.set(e2.subarray(a2 - n2.w_size, a2), 0), e2 = r2, a2 = n2.w_size;
        }
        var s2 = t2.avail_in, o2 = t2.next_in, l2 = t2.input;
        for (t2.avail_in = a2, t2.next_in = 0, t2.input = e2, Ut(n2); n2.lookahead >= 3; ) {
          var h2 = n2.strstart, d2 = n2.lookahead - 2;
          do {
            xt(n2, h2), h2++;
          } while (--d2);
          n2.strstart = h2, n2.lookahead = 2, Ut(n2);
        }
        return n2.strstart += n2.lookahead, n2.block_start = n2.strstart, n2.insert = n2.lookahead, n2.lookahead = 0, n2.match_length = n2.prev_length = 2, n2.match_available = 0, t2.next_in = o2, t2.input = l2, t2.avail_in = s2, n2.wrap = i2, tt;
      }, deflateInfo: "pako deflate (from Nodeca project)" };
      function jt(t2) {
        return jt = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t3) {
          return typeof t3;
        } : function(t3) {
          return t3 && "function" == typeof Symbol && t3.constructor === Symbol && t3 !== Symbol.prototype ? "symbol" : typeof t3;
        }, jt(t2);
      }
      var Kt = function(t2, e2) {
        return Object.prototype.hasOwnProperty.call(t2, e2);
      }, Pt = function(t2) {
        for (var e2 = Array.prototype.slice.call(arguments, 1); e2.length; ) {
          var a2 = e2.shift();
          if (a2) {
            if ("object" !== jt(a2)) throw new TypeError(a2 + "must be non-object");
            for (var n2 in a2) Kt(a2, n2) && (t2[n2] = a2[n2]);
          }
        }
        return t2;
      }, Yt = function(t2) {
        for (var e2 = 0, a2 = 0, n2 = t2.length; a2 < n2; a2++) e2 += t2[a2].length;
        for (var i2 = new Uint8Array(e2), r2 = 0, s2 = 0, o2 = t2.length; r2 < o2; r2++) {
          var l2 = t2[r2];
          i2.set(l2, s2), s2 += l2.length;
        }
        return i2;
      }, Gt = true;
      try {
        String.fromCharCode.apply(null, new Uint8Array(1));
      } catch (t2) {
        Gt = false;
      }
      for (var Xt = new Uint8Array(256), Wt = 0; Wt < 256; Wt++) Xt[Wt] = Wt >= 252 ? 6 : Wt >= 248 ? 5 : Wt >= 240 ? 4 : Wt >= 224 ? 3 : Wt >= 192 ? 2 : 1;
      Xt[254] = Xt[255] = 1;
      var qt = function(t2) {
        if ("function" == typeof TextEncoder && TextEncoder.prototype.encode) return new TextEncoder().encode(t2);
        var e2, a2, n2, i2, r2, s2 = t2.length, o2 = 0;
        for (i2 = 0; i2 < s2; i2++) 55296 == (64512 & (a2 = t2.charCodeAt(i2))) && i2 + 1 < s2 && 56320 == (64512 & (n2 = t2.charCodeAt(i2 + 1))) && (a2 = 65536 + (a2 - 55296 << 10) + (n2 - 56320), i2++), o2 += a2 < 128 ? 1 : a2 < 2048 ? 2 : a2 < 65536 ? 3 : 4;
        for (e2 = new Uint8Array(o2), r2 = 0, i2 = 0; r2 < o2; i2++) 55296 == (64512 & (a2 = t2.charCodeAt(i2))) && i2 + 1 < s2 && 56320 == (64512 & (n2 = t2.charCodeAt(i2 + 1))) && (a2 = 65536 + (a2 - 55296 << 10) + (n2 - 56320), i2++), a2 < 128 ? e2[r2++] = a2 : a2 < 2048 ? (e2[r2++] = 192 | a2 >>> 6, e2[r2++] = 128 | 63 & a2) : a2 < 65536 ? (e2[r2++] = 224 | a2 >>> 12, e2[r2++] = 128 | a2 >>> 6 & 63, e2[r2++] = 128 | 63 & a2) : (e2[r2++] = 240 | a2 >>> 18, e2[r2++] = 128 | a2 >>> 12 & 63, e2[r2++] = 128 | a2 >>> 6 & 63, e2[r2++] = 128 | 63 & a2);
        return e2;
      }, Jt = function(t2, e2) {
        var a2, n2, i2 = e2 || t2.length;
        if ("function" == typeof TextDecoder && TextDecoder.prototype.decode) return new TextDecoder().decode(t2.subarray(0, e2));
        var r2 = new Array(2 * i2);
        for (n2 = 0, a2 = 0; a2 < i2; ) {
          var s2 = t2[a2++];
          if (s2 < 128) r2[n2++] = s2;
          else {
            var o2 = Xt[s2];
            if (o2 > 4) r2[n2++] = 65533, a2 += o2 - 1;
            else {
              for (s2 &= 2 === o2 ? 31 : 3 === o2 ? 15 : 7; o2 > 1 && a2 < i2; ) s2 = s2 << 6 | 63 & t2[a2++], o2--;
              o2 > 1 ? r2[n2++] = 65533 : s2 < 65536 ? r2[n2++] = s2 : (s2 -= 65536, r2[n2++] = 55296 | s2 >> 10 & 1023, r2[n2++] = 56320 | 1023 & s2);
            }
          }
        }
        return (function(t3, e3) {
          if (e3 < 65534 && t3.subarray && Gt) return String.fromCharCode.apply(null, t3.length === e3 ? t3 : t3.subarray(0, e3));
          for (var a3 = "", n3 = 0; n3 < e3; n3++) a3 += String.fromCharCode(t3[n3]);
          return a3;
        })(r2, n2);
      }, Qt = function(t2, e2) {
        (e2 = e2 || t2.length) > t2.length && (e2 = t2.length);
        for (var a2 = e2 - 1; a2 >= 0 && 128 == (192 & t2[a2]); ) a2--;
        return a2 < 0 || 0 === a2 ? e2 : a2 + Xt[t2[a2]] > e2 ? a2 : e2;
      };
      var Vt = function() {
        this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
      }, $t = Object.prototype.toString, te = K.Z_NO_FLUSH, ee = K.Z_SYNC_FLUSH, ae = K.Z_FULL_FLUSH, ne = K.Z_FINISH, ie = K.Z_OK, re = K.Z_STREAM_END, se = { level: K.Z_DEFAULT_COMPRESSION, method: K.Z_DEFLATED, chunkSize: 16384, windowBits: 15, memLevel: 8, strategy: K.Z_DEFAULT_STRATEGY, legacyHash: true };
      function oe(t2) {
        this.options = Pt({}, se, t2 || {});
        var e2 = this.options;
        e2.raw && e2.windowBits > 0 ? e2.windowBits = -e2.windowBits : e2.gzip && e2.windowBits > 0 && e2.windowBits < 16 && (e2.windowBits += 16), this.err = 0, this.msg = "", this.ended = false, this.chunks = [], this.strm = new Vt(), this.strm.avail_out = 0;
        var a2 = Mt.deflateInit2(this.strm, e2.level, e2.method, e2.windowBits, e2.memLevel, e2.strategy, e2.legacyHash);
        if (a2 !== ie) throw new Error(j[a2]);
        if (e2.header && Mt.deflateSetHeader(this.strm, e2.header), e2.dictionary) {
          var n2;
          if (n2 = "string" == typeof e2.dictionary ? qt(e2.dictionary) : "[object ArrayBuffer]" === $t.call(e2.dictionary) ? new Uint8Array(e2.dictionary) : e2.dictionary, (a2 = Mt.deflateSetDictionary(this.strm, n2)) !== ie) throw new Error(j[a2]);
          this._dict_set = true;
        }
      }
      function le(t2, e2) {
        var a2 = new oe(e2);
        if (a2.push(t2, true), a2.err) throw a2.msg || j[a2.err];
        return a2.result;
      }
      oe.prototype.push = function(t2, e2) {
        var a2, n2, i2 = this.strm, r2 = this.options.chunkSize;
        if (this.ended) return false;
        for (n2 = e2 === ~~e2 ? e2 : true === e2 ? ne : te, "string" == typeof t2 ? i2.input = qt(t2) : "[object ArrayBuffer]" === $t.call(t2) ? i2.input = new Uint8Array(t2) : i2.input = t2, i2.next_in = 0, i2.avail_in = i2.input.length; ; ) if (0 === i2.avail_out && (i2.output = new Uint8Array(r2), i2.next_out = 0, i2.avail_out = r2), (n2 === ee || n2 === ae) && i2.avail_out <= 6) this.onData(i2.output.subarray(0, i2.next_out)), i2.avail_out = 0;
        else {
          if ((a2 = Mt.deflate(i2, n2)) === re) return i2.next_out > 0 && this.onData(i2.output.subarray(0, i2.next_out)), a2 = Mt.deflateEnd(this.strm), this.onEnd(a2), this.ended = true, a2 === ie;
          if (0 !== i2.avail_out) {
            if (n2 > 0 && i2.next_out > 0) this.onData(i2.output.subarray(0, i2.next_out)), i2.avail_out = 0;
            else if (0 === i2.avail_in) break;
          } else this.onData(i2.output);
        }
        return true;
      }, oe.prototype.onData = function(t2) {
        this.chunks.push(t2);
      }, oe.prototype.onEnd = function(t2) {
        t2 === ie && (this.result = Yt(this.chunks)), this.chunks = [], this.err = t2, this.msg = this.strm.msg;
      };
      var he = { Deflate: oe, deflate: le, deflateRaw: function(t2, e2) {
        return (e2 = e2 || {}).raw = true, le(t2, e2);
      }, gzip: function(t2, e2) {
        return (e2 = e2 || {}).gzip = true, le(t2, e2);
      }, constants: K }, de = 16209, _e = function(t2, e2) {
        var a2, n2, i2, r2, s2, o2, l2, h2, d2, _2, f2, u2, c2, w2, m2, b2, g2, p2, v2, k2, y2, x2, z2, A2, E2 = t2.state;
        a2 = t2.next_in, z2 = t2.input, n2 = a2 + (t2.avail_in - 5), i2 = t2.next_out, A2 = t2.output, r2 = i2 - (e2 - t2.avail_out), s2 = i2 + (t2.avail_out - 257), o2 = E2.dmax, l2 = E2.wsize, h2 = E2.whave, d2 = E2.wnext, _2 = E2.window, f2 = E2.hold, u2 = E2.bits, c2 = E2.lencode, w2 = E2.distcode, m2 = (1 << E2.lenbits) - 1, b2 = (1 << E2.distbits) - 1;
        t: do {
          u2 < 15 && (f2 += z2[a2++] << u2, u2 += 8, f2 += z2[a2++] << u2, u2 += 8), g2 = c2[f2 & m2];
          e: for (; ; ) {
            if (f2 >>>= p2 = g2 >>> 24, u2 -= p2, 0 === (p2 = g2 >>> 16 & 255)) A2[i2++] = 65535 & g2;
            else {
              if (!(16 & p2)) {
                if (0 == (64 & p2)) {
                  g2 = c2[(65535 & g2) + (f2 & (1 << p2) - 1)];
                  continue e;
                }
                if (32 & p2) {
                  E2.mode = 16191;
                  break t;
                }
                t2.msg = "invalid literal/length code", E2.mode = de;
                break t;
              }
              v2 = 65535 & g2, (p2 &= 15) && (u2 < p2 && (f2 += z2[a2++] << u2, u2 += 8), v2 += f2 & (1 << p2) - 1, f2 >>>= p2, u2 -= p2), u2 < 15 && (f2 += z2[a2++] << u2, u2 += 8, f2 += z2[a2++] << u2, u2 += 8), g2 = w2[f2 & b2];
              a: for (; ; ) {
                if (f2 >>>= p2 = g2 >>> 24, u2 -= p2, !(16 & (p2 = g2 >>> 16 & 255))) {
                  if (0 == (64 & p2)) {
                    g2 = w2[(65535 & g2) + (f2 & (1 << p2) - 1)];
                    continue a;
                  }
                  t2.msg = "invalid distance code", E2.mode = de;
                  break t;
                }
                if (k2 = 65535 & g2, u2 < (p2 &= 15) && (f2 += z2[a2++] << u2, (u2 += 8) < p2 && (f2 += z2[a2++] << u2, u2 += 8)), (k2 += f2 & (1 << p2) - 1) > o2) {
                  t2.msg = "invalid distance too far back", E2.mode = de;
                  break t;
                }
                if (f2 >>>= p2, u2 -= p2, k2 > (p2 = i2 - r2)) {
                  if ((p2 = k2 - p2) > h2 && E2.sane) {
                    t2.msg = "invalid distance too far back", E2.mode = de;
                    break t;
                  }
                  if (y2 = 0, x2 = _2, 0 === d2) {
                    if (y2 += l2 - p2, p2 < v2) {
                      v2 -= p2;
                      do {
                        A2[i2++] = _2[y2++];
                      } while (--p2);
                      y2 = i2 - k2, x2 = A2;
                    }
                  } else if (d2 < p2) {
                    if (y2 += l2 + d2 - p2, (p2 -= d2) < v2) {
                      v2 -= p2;
                      do {
                        A2[i2++] = _2[y2++];
                      } while (--p2);
                      if (y2 = 0, d2 < v2) {
                        v2 -= p2 = d2;
                        do {
                          A2[i2++] = _2[y2++];
                        } while (--p2);
                        y2 = i2 - k2, x2 = A2;
                      }
                    }
                  } else if (y2 += d2 - p2, p2 < v2) {
                    v2 -= p2;
                    do {
                      A2[i2++] = _2[y2++];
                    } while (--p2);
                    y2 = i2 - k2, x2 = A2;
                  }
                  for (; v2 > 2; ) A2[i2++] = x2[y2++], A2[i2++] = x2[y2++], A2[i2++] = x2[y2++], v2 -= 3;
                  v2 && (A2[i2++] = x2[y2++], v2 > 1 && (A2[i2++] = x2[y2++]));
                } else {
                  y2 = i2 - k2;
                  do {
                    A2[i2++] = A2[y2++], A2[i2++] = A2[y2++], A2[i2++] = A2[y2++], v2 -= 3;
                  } while (v2 > 2);
                  v2 && (A2[i2++] = A2[y2++], v2 > 1 && (A2[i2++] = A2[y2++]));
                }
                break;
              }
            }
            break;
          }
        } while (a2 < n2 && i2 < s2);
        a2 -= v2 = u2 >> 3, f2 &= (1 << (u2 -= v2 << 3)) - 1, t2.next_in = a2, t2.next_out = i2, t2.avail_in = a2 < n2 ? n2 - a2 + 5 : 5 - (a2 - n2), t2.avail_out = i2 < s2 ? s2 - i2 + 257 : 257 - (i2 - s2), E2.hold = f2, E2.bits = u2;
      }, fe = 15, ue = new Uint16Array([3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0]), ce = new Uint8Array([16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 199, 75]), we = new Uint16Array([1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0]), me = new Uint8Array([16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64]), be = function(t2, e2, a2, n2, i2, r2, s2, o2) {
        var l2, h2, d2, _2, f2, u2, c2, w2, m2, b2 = o2.bits, g2 = 0, p2 = 0, v2 = 0, k2 = 0, y2 = 0, x2 = 0, z2 = 0, A2 = 0, E2 = 0, R2 = 0, Z2 = null, S2 = new Uint16Array(16), U2 = new Uint16Array(16), D2 = null;
        for (g2 = 0; g2 <= fe; g2++) S2[g2] = 0;
        for (p2 = 0; p2 < n2; p2++) S2[e2[a2 + p2]]++;
        for (y2 = b2, k2 = fe; k2 >= 1 && 0 === S2[k2]; k2--) ;
        if (y2 > k2 && (y2 = k2), 0 === k2) return i2[r2++] = 20971520, i2[r2++] = 20971520, o2.bits = 1, 0;
        for (v2 = 1; v2 < k2 && 0 === S2[v2]; v2++) ;
        for (y2 < v2 && (y2 = v2), A2 = 1, g2 = 1; g2 <= fe; g2++) if (A2 <<= 1, (A2 -= S2[g2]) < 0) return -1;
        if (A2 > 0 && (0 === t2 || 1 !== k2)) return -1;
        for (U2[1] = 0, g2 = 1; g2 < fe; g2++) U2[g2 + 1] = U2[g2] + S2[g2];
        for (p2 = 0; p2 < n2; p2++) 0 !== e2[a2 + p2] && (s2[U2[e2[a2 + p2]]++] = p2);
        if (0 === t2 ? (Z2 = D2 = s2, u2 = 20) : 1 === t2 ? (Z2 = ue, D2 = ce, u2 = 257) : (Z2 = we, D2 = me, u2 = 0), R2 = 0, p2 = 0, g2 = v2, f2 = r2, x2 = y2, z2 = 0, d2 = -1, _2 = (E2 = 1 << y2) - 1, 1 === t2 && E2 > 852 || 2 === t2 && E2 > 592) return 1;
        for (; ; ) {
          c2 = g2 - z2, s2[p2] + 1 < u2 ? (w2 = 0, m2 = s2[p2]) : s2[p2] >= u2 ? (w2 = D2[s2[p2] - u2], m2 = Z2[s2[p2] - u2]) : (w2 = 96, m2 = 0), l2 = 1 << g2 - z2, v2 = h2 = 1 << x2;
          do {
            i2[f2 + (R2 >> z2) + (h2 -= l2)] = c2 << 24 | w2 << 16 | m2 | 0;
          } while (0 !== h2);
          for (l2 = 1 << g2 - 1; R2 & l2; ) l2 >>= 1;
          if (0 !== l2 ? (R2 &= l2 - 1, R2 += l2) : R2 = 0, p2++, 0 == --S2[g2]) {
            if (g2 === k2) break;
            g2 = e2[a2 + s2[p2]];
          }
          if (g2 > y2 && (R2 & _2) !== d2) {
            for (0 === z2 && (z2 = y2), f2 += v2, A2 = 1 << (x2 = g2 - z2); x2 + z2 < k2 && !((A2 -= S2[x2 + z2]) <= 0); ) x2++, A2 <<= 1;
            if (E2 += 1 << x2, 1 === t2 && E2 > 852 || 2 === t2 && E2 > 592) return 1;
            i2[d2 = R2 & _2] = y2 << 24 | x2 << 16 | f2 - r2 | 0;
          }
        }
        return 0 !== R2 && (i2[f2 + R2] = g2 - z2 << 24 | 64 << 16 | 0), o2.bits = y2, 0;
      }, ge = K.Z_FINISH, pe = K.Z_BLOCK, ve = K.Z_TREES, ke = K.Z_OK, ye = K.Z_STREAM_END, xe = K.Z_NEED_DICT, ze = K.Z_STREAM_ERROR, Ae = K.Z_DATA_ERROR, Ee = K.Z_MEM_ERROR, Re = K.Z_BUF_ERROR, Ze = K.Z_DEFLATED, Se = 16180, Ue = 16190, De = 16191, Te = 16192, Oe = 16194, Fe = 16199, Ie = 16200, Le = 16206, Ne = 16209, Be = function(t2) {
        return (t2 >>> 24 & 255) + (t2 >>> 8 & 65280) + ((65280 & t2) << 8) + ((255 & t2) << 24);
      };
      function Ce() {
        this.strm = null, this.mode = 0, this.last = false, this.wrap = 0, this.havedict = false, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new Uint16Array(320), this.work = new Uint16Array(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
      }
      var He, Me, je = function(t2) {
        if (!t2) return 1;
        var e2 = t2.state;
        return !e2 || e2.strm !== t2 || e2.mode < Se || e2.mode > 16211 ? 1 : 0;
      }, Ke = function(t2) {
        if (je(t2)) return ze;
        var e2 = t2.state;
        return t2.total_in = t2.total_out = e2.total = 0, t2.msg = "", e2.wrap && (t2.adler = 1 & e2.wrap), e2.mode = Se, e2.last = 0, e2.havedict = 0, e2.flags = -1, e2.dmax = 32768, e2.head = null, e2.hold = 0, e2.bits = 0, e2.lencode = e2.lendyn = new Int32Array(852), e2.distcode = e2.distdyn = new Int32Array(592), e2.sane = 1, e2.back = -1, ke;
      }, Pe = function(t2) {
        if (je(t2)) return ze;
        var e2 = t2.state;
        return e2.wsize = 0, e2.whave = 0, e2.wnext = 0, Ke(t2);
      }, Ye = function(t2, e2) {
        var a2;
        if (je(t2)) return ze;
        var n2 = t2.state;
        return e2 < 0 ? (a2 = 0, e2 = -e2) : (a2 = 5 + (e2 >> 4), e2 < 48 && (e2 &= 15)), e2 && (e2 < 8 || e2 > 15) ? ze : (null !== n2.window && n2.wbits !== e2 && (n2.window = null), n2.wrap = a2, n2.wbits = e2, Pe(t2));
      }, Ge = function(t2, e2) {
        if (!t2) return ze;
        var a2 = new Ce();
        t2.state = a2, a2.strm = t2, a2.window = null, a2.mode = Se;
        var n2 = Ye(t2, e2);
        return n2 !== ke && (t2.state = null), n2;
      }, Xe = true, We = function(t2) {
        if (Xe) {
          He = new Int32Array(512), Me = new Int32Array(32);
          for (var e2 = 0; e2 < 144; ) t2.lens[e2++] = 8;
          for (; e2 < 256; ) t2.lens[e2++] = 9;
          for (; e2 < 280; ) t2.lens[e2++] = 7;
          for (; e2 < 288; ) t2.lens[e2++] = 8;
          for (be(1, t2.lens, 0, 288, He, 0, t2.work, { bits: 9 }), e2 = 0; e2 < 32; ) t2.lens[e2++] = 5;
          be(2, t2.lens, 0, 32, Me, 0, t2.work, { bits: 5 }), Xe = false;
        }
        t2.lencode = He, t2.lenbits = 9, t2.distcode = Me, t2.distbits = 5;
      }, qe = function(t2, e2, a2, n2) {
        var i2, r2 = t2.state;
        return null === r2.window && (r2.window = new Uint8Array(1 << r2.wbits)), 0 === r2.wsize && (r2.wsize = 1 << r2.wbits, r2.wnext = 0, r2.whave = 0), n2 >= r2.wsize ? (r2.window.set(e2.subarray(a2 - r2.wsize, a2), 0), r2.wnext = 0, r2.whave = r2.wsize) : ((i2 = r2.wsize - r2.wnext) > n2 && (i2 = n2), r2.window.set(e2.subarray(a2 - n2, a2 - n2 + i2), r2.wnext), (n2 -= i2) ? (r2.window.set(e2.subarray(a2 - n2, a2), 0), r2.wnext = n2, r2.whave = r2.wsize) : (r2.wnext += i2, r2.wnext === r2.wsize && (r2.wnext = 0), r2.whave < r2.wsize && (r2.whave += i2))), 0;
      }, Je = { inflateReset: Pe, inflateReset2: Ye, inflateResetKeep: Ke, inflateInit: function(t2) {
        return Ge(t2, 15);
      }, inflateInit2: Ge, inflate: function(t2, e2) {
        var a2, n2, i2, r2, s2, o2, l2, h2, d2, _2, f2, u2, c2, w2, m2, b2, g2, p2, v2, k2, y2, x2, z2, A2, E2 = 0, R2 = new Uint8Array(4), Z2 = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
        if (je(t2) || !t2.output || !t2.input && 0 !== t2.avail_in) return ze;
        (a2 = t2.state).mode === De && (a2.mode = Te), s2 = t2.next_out, i2 = t2.output, l2 = t2.avail_out, r2 = t2.next_in, n2 = t2.input, o2 = t2.avail_in, h2 = a2.hold, d2 = a2.bits, _2 = o2, f2 = l2, x2 = ke;
        t: for (; ; ) switch (a2.mode) {
          case Se:
            if (0 === a2.wrap) {
              a2.mode = Te;
              break;
            }
            for (; d2 < 16; ) {
              if (0 === o2) break t;
              o2--, h2 += n2[r2++] << d2, d2 += 8;
            }
            if (2 & a2.wrap && 35615 === h2) {
              0 === a2.wbits && (a2.wbits = 15), a2.check = 0, R2[0] = 255 & h2, R2[1] = h2 >>> 8 & 255, a2.check = M(a2.check, R2, 2, 0), h2 = 0, d2 = 0, a2.mode = 16181;
              break;
            }
            if (a2.head && (a2.head.done = false), !(1 & a2.wrap) || (((255 & h2) << 8) + (h2 >> 8)) % 31) {
              t2.msg = "incorrect header check", a2.mode = Ne;
              break;
            }
            if ((15 & h2) !== Ze) {
              t2.msg = "unknown compression method", a2.mode = Ne;
              break;
            }
            if (d2 -= 4, y2 = 8 + (15 & (h2 >>>= 4)), 0 === a2.wbits && (a2.wbits = y2), y2 > 15 || y2 > a2.wbits) {
              t2.msg = "invalid window size", a2.mode = Ne;
              break;
            }
            a2.dmax = 1 << a2.wbits, a2.flags = 0, t2.adler = a2.check = 1, a2.mode = 512 & h2 ? 16189 : De, h2 = 0, d2 = 0;
            break;
          case 16181:
            for (; d2 < 16; ) {
              if (0 === o2) break t;
              o2--, h2 += n2[r2++] << d2, d2 += 8;
            }
            if (a2.flags = h2, (255 & a2.flags) !== Ze) {
              t2.msg = "unknown compression method", a2.mode = Ne;
              break;
            }
            if (57344 & a2.flags) {
              t2.msg = "unknown header flags set", a2.mode = Ne;
              break;
            }
            a2.head && (a2.head.text = h2 >> 8 & 1), 512 & a2.flags && 4 & a2.wrap && (R2[0] = 255 & h2, R2[1] = h2 >>> 8 & 255, a2.check = M(a2.check, R2, 2, 0)), h2 = 0, d2 = 0, a2.mode = 16182;
          case 16182:
            for (; d2 < 32; ) {
              if (0 === o2) break t;
              o2--, h2 += n2[r2++] << d2, d2 += 8;
            }
            a2.head && (a2.head.time = h2), 512 & a2.flags && 4 & a2.wrap && (R2[0] = 255 & h2, R2[1] = h2 >>> 8 & 255, R2[2] = h2 >>> 16 & 255, R2[3] = h2 >>> 24 & 255, a2.check = M(a2.check, R2, 4, 0)), h2 = 0, d2 = 0, a2.mode = 16183;
          case 16183:
            for (; d2 < 16; ) {
              if (0 === o2) break t;
              o2--, h2 += n2[r2++] << d2, d2 += 8;
            }
            a2.head && (a2.head.xflags = 255 & h2, a2.head.os = h2 >> 8), 512 & a2.flags && 4 & a2.wrap && (R2[0] = 255 & h2, R2[1] = h2 >>> 8 & 255, a2.check = M(a2.check, R2, 2, 0)), h2 = 0, d2 = 0, a2.mode = 16184;
          case 16184:
            if (1024 & a2.flags) {
              for (; d2 < 16; ) {
                if (0 === o2) break t;
                o2--, h2 += n2[r2++] << d2, d2 += 8;
              }
              a2.length = h2, a2.head && (a2.head.extra_len = h2), 512 & a2.flags && 4 & a2.wrap && (R2[0] = 255 & h2, R2[1] = h2 >>> 8 & 255, a2.check = M(a2.check, R2, 2, 0)), h2 = 0, d2 = 0;
            } else a2.head && (a2.head.extra = null);
            a2.mode = 16185;
          case 16185:
            if (1024 & a2.flags && ((u2 = a2.length) > o2 && (u2 = o2), u2 && (a2.head && (y2 = a2.head.extra_len - a2.length, a2.head.extra || (a2.head.extra = new Uint8Array(a2.head.extra_len)), a2.head.extra.set(n2.subarray(r2, r2 + u2), y2)), 512 & a2.flags && 4 & a2.wrap && (a2.check = M(a2.check, n2, u2, r2)), o2 -= u2, r2 += u2, a2.length -= u2), a2.length)) break t;
            a2.length = 0, a2.mode = 16186;
          case 16186:
            if (2048 & a2.flags) {
              if (0 === o2) break t;
              u2 = 0;
              do {
                y2 = n2[r2 + u2++], a2.head && y2 && a2.length < 65536 && (a2.head.name += String.fromCharCode(y2));
              } while (y2 && u2 < o2);
              if (512 & a2.flags && 4 & a2.wrap && (a2.check = M(a2.check, n2, u2, r2)), o2 -= u2, r2 += u2, y2) break t;
            } else a2.head && (a2.head.name = null);
            a2.length = 0, a2.mode = 16187;
          case 16187:
            if (4096 & a2.flags) {
              if (0 === o2) break t;
              u2 = 0;
              do {
                y2 = n2[r2 + u2++], a2.head && y2 && a2.length < 65536 && (a2.head.comment += String.fromCharCode(y2));
              } while (y2 && u2 < o2);
              if (512 & a2.flags && 4 & a2.wrap && (a2.check = M(a2.check, n2, u2, r2)), o2 -= u2, r2 += u2, y2) break t;
            } else a2.head && (a2.head.comment = null);
            a2.mode = 16188;
          case 16188:
            if (512 & a2.flags) {
              for (; d2 < 16; ) {
                if (0 === o2) break t;
                o2--, h2 += n2[r2++] << d2, d2 += 8;
              }
              if (4 & a2.wrap && h2 !== (65535 & a2.check)) {
                t2.msg = "header crc mismatch", a2.mode = Ne;
                break;
              }
              h2 = 0, d2 = 0;
            }
            a2.head && (a2.head.hcrc = a2.flags >> 9 & 1, a2.head.done = true), t2.adler = a2.check = 0, a2.mode = De;
            break;
          case 16189:
            for (; d2 < 32; ) {
              if (0 === o2) break t;
              o2--, h2 += n2[r2++] << d2, d2 += 8;
            }
            t2.adler = a2.check = Be(h2), h2 = 0, d2 = 0, a2.mode = Ue;
          case Ue:
            if (0 === a2.havedict) return t2.next_out = s2, t2.avail_out = l2, t2.next_in = r2, t2.avail_in = o2, a2.hold = h2, a2.bits = d2, xe;
            t2.adler = a2.check = 1, a2.mode = De;
          case De:
            if (e2 === pe || e2 === ve) break t;
          case Te:
            if (a2.last) {
              h2 >>>= 7 & d2, d2 -= 7 & d2, a2.mode = Le;
              break;
            }
            for (; d2 < 3; ) {
              if (0 === o2) break t;
              o2--, h2 += n2[r2++] << d2, d2 += 8;
            }
            switch (a2.last = 1 & h2, d2 -= 1, 3 & (h2 >>>= 1)) {
              case 0:
                a2.mode = 16193;
                break;
              case 1:
                if (We(a2), a2.mode = Fe, e2 === ve) {
                  h2 >>>= 2, d2 -= 2;
                  break t;
                }
                break;
              case 2:
                a2.mode = 16196;
                break;
              case 3:
                t2.msg = "invalid block type", a2.mode = Ne;
            }
            h2 >>>= 2, d2 -= 2;
            break;
          case 16193:
            for (h2 >>>= 7 & d2, d2 -= 7 & d2; d2 < 32; ) {
              if (0 === o2) break t;
              o2--, h2 += n2[r2++] << d2, d2 += 8;
            }
            if ((65535 & h2) != (h2 >>> 16 ^ 65535)) {
              t2.msg = "invalid stored block lengths", a2.mode = Ne;
              break;
            }
            if (a2.length = 65535 & h2, h2 = 0, d2 = 0, a2.mode = Oe, e2 === ve) break t;
          case Oe:
            a2.mode = 16195;
          case 16195:
            if (u2 = a2.length) {
              if (u2 > o2 && (u2 = o2), u2 > l2 && (u2 = l2), 0 === u2) break t;
              i2.set(n2.subarray(r2, r2 + u2), s2), o2 -= u2, r2 += u2, l2 -= u2, s2 += u2, a2.length -= u2;
              break;
            }
            a2.mode = De;
            break;
          case 16196:
            for (; d2 < 14; ) {
              if (0 === o2) break t;
              o2--, h2 += n2[r2++] << d2, d2 += 8;
            }
            if (a2.nlen = 257 + (31 & h2), h2 >>>= 5, d2 -= 5, a2.ndist = 1 + (31 & h2), h2 >>>= 5, d2 -= 5, a2.ncode = 4 + (15 & h2), h2 >>>= 4, d2 -= 4, a2.nlen > 286 || a2.ndist > 30) {
              t2.msg = "too many length or distance symbols", a2.mode = Ne;
              break;
            }
            a2.have = 0, a2.mode = 16197;
          case 16197:
            for (; a2.have < a2.ncode; ) {
              for (; d2 < 3; ) {
                if (0 === o2) break t;
                o2--, h2 += n2[r2++] << d2, d2 += 8;
              }
              a2.lens[Z2[a2.have++]] = 7 & h2, h2 >>>= 3, d2 -= 3;
            }
            for (; a2.have < 19; ) a2.lens[Z2[a2.have++]] = 0;
            if (a2.lencode = a2.lendyn, a2.lenbits = 7, z2 = { bits: a2.lenbits }, x2 = be(0, a2.lens, 0, 19, a2.lencode, 0, a2.work, z2), a2.lenbits = z2.bits, x2) {
              t2.msg = "invalid code lengths set", a2.mode = Ne;
              break;
            }
            a2.have = 0, a2.mode = 16198;
          case 16198:
            for (; a2.have < a2.nlen + a2.ndist; ) {
              for (; b2 = (E2 = a2.lencode[h2 & (1 << a2.lenbits) - 1]) >>> 16 & 255, g2 = 65535 & E2, !((m2 = E2 >>> 24) <= d2); ) {
                if (0 === o2) break t;
                o2--, h2 += n2[r2++] << d2, d2 += 8;
              }
              if (g2 < 16) h2 >>>= m2, d2 -= m2, a2.lens[a2.have++] = g2;
              else {
                if (16 === g2) {
                  for (A2 = m2 + 2; d2 < A2; ) {
                    if (0 === o2) break t;
                    o2--, h2 += n2[r2++] << d2, d2 += 8;
                  }
                  if (h2 >>>= m2, d2 -= m2, 0 === a2.have) {
                    t2.msg = "invalid bit length repeat", a2.mode = Ne;
                    break;
                  }
                  y2 = a2.lens[a2.have - 1], u2 = 3 + (3 & h2), h2 >>>= 2, d2 -= 2;
                } else if (17 === g2) {
                  for (A2 = m2 + 3; d2 < A2; ) {
                    if (0 === o2) break t;
                    o2--, h2 += n2[r2++] << d2, d2 += 8;
                  }
                  d2 -= m2, y2 = 0, u2 = 3 + (7 & (h2 >>>= m2)), h2 >>>= 3, d2 -= 3;
                } else {
                  for (A2 = m2 + 7; d2 < A2; ) {
                    if (0 === o2) break t;
                    o2--, h2 += n2[r2++] << d2, d2 += 8;
                  }
                  d2 -= m2, y2 = 0, u2 = 11 + (127 & (h2 >>>= m2)), h2 >>>= 7, d2 -= 7;
                }
                if (a2.have + u2 > a2.nlen + a2.ndist) {
                  t2.msg = "invalid bit length repeat", a2.mode = Ne;
                  break;
                }
                for (; u2--; ) a2.lens[a2.have++] = y2;
              }
            }
            if (a2.mode === Ne) break;
            if (0 === a2.lens[256]) {
              t2.msg = "invalid code -- missing end-of-block", a2.mode = Ne;
              break;
            }
            if (a2.lenbits = 9, z2 = { bits: a2.lenbits }, x2 = be(1, a2.lens, 0, a2.nlen, a2.lencode, 0, a2.work, z2), a2.lenbits = z2.bits, x2) {
              t2.msg = "invalid literal/lengths set", a2.mode = Ne;
              break;
            }
            if (a2.distbits = 6, a2.distcode = a2.distdyn, z2 = { bits: a2.distbits }, x2 = be(2, a2.lens, a2.nlen, a2.ndist, a2.distcode, 0, a2.work, z2), a2.distbits = z2.bits, x2) {
              t2.msg = "invalid distances set", a2.mode = Ne;
              break;
            }
            if (a2.mode = Fe, e2 === ve) break t;
          case Fe:
            a2.mode = Ie;
          case Ie:
            if (o2 >= 6 && l2 >= 258) {
              t2.next_out = s2, t2.avail_out = l2, t2.next_in = r2, t2.avail_in = o2, a2.hold = h2, a2.bits = d2, _e(t2, f2), s2 = t2.next_out, i2 = t2.output, l2 = t2.avail_out, r2 = t2.next_in, n2 = t2.input, o2 = t2.avail_in, h2 = a2.hold, d2 = a2.bits, a2.mode === De && (a2.back = -1);
              break;
            }
            for (a2.back = 0; b2 = (E2 = a2.lencode[h2 & (1 << a2.lenbits) - 1]) >>> 16 & 255, g2 = 65535 & E2, !((m2 = E2 >>> 24) <= d2); ) {
              if (0 === o2) break t;
              o2--, h2 += n2[r2++] << d2, d2 += 8;
            }
            if (b2 && 0 == (240 & b2)) {
              for (p2 = m2, v2 = b2, k2 = g2; b2 = (E2 = a2.lencode[k2 + ((h2 & (1 << p2 + v2) - 1) >> p2)]) >>> 16 & 255, g2 = 65535 & E2, !(p2 + (m2 = E2 >>> 24) <= d2); ) {
                if (0 === o2) break t;
                o2--, h2 += n2[r2++] << d2, d2 += 8;
              }
              h2 >>>= p2, d2 -= p2, a2.back += p2;
            }
            if (h2 >>>= m2, d2 -= m2, a2.back += m2, a2.length = g2, 0 === b2) {
              a2.mode = 16205;
              break;
            }
            if (32 & b2) {
              a2.back = -1, a2.mode = De;
              break;
            }
            if (64 & b2) {
              t2.msg = "invalid literal/length code", a2.mode = Ne;
              break;
            }
            a2.extra = 15 & b2, a2.mode = 16201;
          case 16201:
            if (a2.extra) {
              for (A2 = a2.extra; d2 < A2; ) {
                if (0 === o2) break t;
                o2--, h2 += n2[r2++] << d2, d2 += 8;
              }
              a2.length += h2 & (1 << a2.extra) - 1, h2 >>>= a2.extra, d2 -= a2.extra, a2.back += a2.extra;
            }
            a2.was = a2.length, a2.mode = 16202;
          case 16202:
            for (; b2 = (E2 = a2.distcode[h2 & (1 << a2.distbits) - 1]) >>> 16 & 255, g2 = 65535 & E2, !((m2 = E2 >>> 24) <= d2); ) {
              if (0 === o2) break t;
              o2--, h2 += n2[r2++] << d2, d2 += 8;
            }
            if (0 == (240 & b2)) {
              for (p2 = m2, v2 = b2, k2 = g2; b2 = (E2 = a2.distcode[k2 + ((h2 & (1 << p2 + v2) - 1) >> p2)]) >>> 16 & 255, g2 = 65535 & E2, !(p2 + (m2 = E2 >>> 24) <= d2); ) {
                if (0 === o2) break t;
                o2--, h2 += n2[r2++] << d2, d2 += 8;
              }
              h2 >>>= p2, d2 -= p2, a2.back += p2;
            }
            if (h2 >>>= m2, d2 -= m2, a2.back += m2, 64 & b2) {
              t2.msg = "invalid distance code", a2.mode = Ne;
              break;
            }
            a2.offset = g2, a2.extra = 15 & b2, a2.mode = 16203;
          case 16203:
            if (a2.extra) {
              for (A2 = a2.extra; d2 < A2; ) {
                if (0 === o2) break t;
                o2--, h2 += n2[r2++] << d2, d2 += 8;
              }
              a2.offset += h2 & (1 << a2.extra) - 1, h2 >>>= a2.extra, d2 -= a2.extra, a2.back += a2.extra;
            }
            if (a2.offset > a2.dmax) {
              t2.msg = "invalid distance too far back", a2.mode = Ne;
              break;
            }
            a2.mode = 16204;
          case 16204:
            if (0 === l2) break t;
            if (u2 = f2 - l2, a2.offset > u2) {
              if ((u2 = a2.offset - u2) > a2.whave && a2.sane) {
                t2.msg = "invalid distance too far back", a2.mode = Ne;
                break;
              }
              u2 > a2.wnext ? (u2 -= a2.wnext, c2 = a2.wsize - u2) : c2 = a2.wnext - u2, u2 > a2.length && (u2 = a2.length), w2 = a2.window;
            } else w2 = i2, c2 = s2 - a2.offset, u2 = a2.length;
            u2 > l2 && (u2 = l2), l2 -= u2, a2.length -= u2;
            do {
              i2[s2++] = w2[c2++];
            } while (--u2);
            0 === a2.length && (a2.mode = Ie);
            break;
          case 16205:
            if (0 === l2) break t;
            i2[s2++] = a2.length, l2--, a2.mode = Ie;
            break;
          case Le:
            if (a2.wrap) {
              for (; d2 < 32; ) {
                if (0 === o2) break t;
                o2--, h2 |= n2[r2++] << d2, d2 += 8;
              }
              if (f2 -= l2, t2.total_out += f2, a2.total += f2, 4 & a2.wrap && f2 && (t2.adler = a2.check = a2.flags ? M(a2.check, i2, f2, s2 - f2) : C(a2.check, i2, f2, s2 - f2)), f2 = l2, 4 & a2.wrap && (a2.flags ? h2 : Be(h2)) !== a2.check) {
                t2.msg = "incorrect data check", a2.mode = Ne;
                break;
              }
              h2 = 0, d2 = 0;
            }
            a2.mode = 16207;
          case 16207:
            if (a2.wrap && a2.flags) {
              for (; d2 < 32; ) {
                if (0 === o2) break t;
                o2--, h2 += n2[r2++] << d2, d2 += 8;
              }
              if (4 & a2.wrap && h2 !== (4294967295 & a2.total)) {
                t2.msg = "incorrect length check", a2.mode = Ne;
                break;
              }
              h2 = 0, d2 = 0;
            }
            a2.mode = 16208;
          case 16208:
            x2 = ye;
            break t;
          case Ne:
            x2 = Ae;
            break t;
          case 16210:
            return Ee;
          default:
            return ze;
        }
        return t2.next_out = s2, t2.avail_out = l2, t2.next_in = r2, t2.avail_in = o2, a2.hold = h2, a2.bits = d2, (a2.wsize || f2 !== t2.avail_out && a2.mode < Ne && (a2.mode < Le || e2 !== ge)) && qe(t2, t2.output, t2.next_out, f2 - t2.avail_out), _2 -= t2.avail_in, f2 -= t2.avail_out, t2.total_in += _2, t2.total_out += f2, a2.total += f2, 4 & a2.wrap && f2 && (t2.adler = a2.check = a2.flags ? M(a2.check, i2, f2, t2.next_out - f2) : C(a2.check, i2, f2, t2.next_out - f2)), t2.data_type = a2.bits + (a2.last ? 64 : 0) + (a2.mode === De ? 128 : 0) + (a2.mode === Fe || a2.mode === Oe ? 256 : 0), (0 === _2 && 0 === f2 || e2 === ge) && x2 === ke && (x2 = Re), x2;
      }, inflateEnd: function(t2) {
        if (je(t2)) return ze;
        var e2 = t2.state;
        return e2.window && (e2.window = null), t2.state = null, ke;
      }, inflateGetHeader: function(t2, e2) {
        if (je(t2)) return ze;
        var a2 = t2.state;
        return 0 == (2 & a2.wrap) ? ze : (a2.head = e2, e2.done = false, ke);
      }, inflateSetDictionary: function(t2, e2) {
        var a2, n2 = e2.length;
        return je(t2) || 0 !== (a2 = t2.state).wrap && a2.mode !== Ue ? ze : a2.mode === Ue && C(1, e2, n2, 0) !== a2.check ? Ae : qe(t2, e2, n2, n2) ? (a2.mode = 16210, Ee) : (a2.havedict = 1, ke);
      }, inflateInfo: "pako inflate (from Nodeca project)" };
      var Qe = function() {
        this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = false;
      }, Ve = Object.prototype.toString, $e = K.Z_NO_FLUSH, ta = K.Z_FINISH, ea = K.Z_OK, aa = K.Z_STREAM_END, na = K.Z_NEED_DICT, ia = K.Z_STREAM_ERROR, ra = K.Z_DATA_ERROR, sa = K.Z_MEM_ERROR, oa = K.Z_BUF_ERROR, la = { chunkSize: 65536, windowBits: 15, to: "" };
      function ha(t2) {
        this.options = Pt({}, la, t2 || {});
        var e2 = this.options;
        e2.raw && e2.windowBits >= 0 && e2.windowBits < 16 && (e2.windowBits = -e2.windowBits, 0 === e2.windowBits && (e2.windowBits = -15)), !(e2.windowBits >= 0 && e2.windowBits < 16) || t2 && t2.windowBits || (e2.windowBits += 32), e2.windowBits > 15 && e2.windowBits < 48 && 0 == (15 & e2.windowBits) && (e2.windowBits |= 15), this.err = 0, this.msg = "", this.ended = false, this.chunks = [], this.strm = new Vt(), this.strm.avail_out = 0;
        var a2 = Je.inflateInit2(this.strm, e2.windowBits);
        if (a2 !== ea) throw new Error(j[a2]);
        if (this.header = new Qe(), Je.inflateGetHeader(this.strm, this.header), e2.dictionary && ("string" == typeof e2.dictionary ? e2.dictionary = qt(e2.dictionary) : "[object ArrayBuffer]" === Ve.call(e2.dictionary) && (e2.dictionary = new Uint8Array(e2.dictionary)), e2.raw && (a2 = Je.inflateSetDictionary(this.strm, e2.dictionary)) !== ea)) throw new Error(j[a2]);
      }
      function da(t2, e2) {
        var a2 = new ha(e2);
        if (a2.push(t2, true), a2.err) throw a2.msg || j[a2.err];
        return a2.result;
      }
      ha.prototype.push = function(t2, e2) {
        var a2, n2, i2, r2 = this.strm, s2 = this.options.chunkSize, o2 = this.options.dictionary;
        if (this.ended) return false;
        for (n2 = e2 === ~~e2 ? e2 : true === e2 ? ta : $e, "[object ArrayBuffer]" === Ve.call(t2) ? r2.input = new Uint8Array(t2) : r2.input = t2, r2.next_in = 0, r2.avail_in = r2.input.length; ; ) {
          for (0 === r2.avail_out && (r2.output = new Uint8Array(s2), r2.next_out = 0, r2.avail_out = s2), (a2 = Je.inflate(r2, n2)) === na && o2 && ((a2 = Je.inflateSetDictionary(r2, o2)) === ea ? a2 = Je.inflate(r2, n2) : a2 === ra && (a2 = na)); r2.avail_in > 0 && a2 === aa && 2 & r2.state.wrap && 0 !== r2.state.flags && 0 !== r2.input[r2.next_in]; ) Je.inflateReset(r2), a2 = Je.inflate(r2, n2);
          switch (a2) {
            case ia:
            case ra:
            case na:
            case sa:
              return this.onEnd(a2), this.ended = true, false;
          }
          if (i2 = r2.avail_out, r2.next_out && (0 === r2.avail_out || a2 === aa || n2 > 0)) if ("string" === this.options.to) {
            var l2 = Qt(r2.output, r2.next_out), h2 = r2.next_out - l2, d2 = Jt(r2.output, l2);
            r2.next_out = h2, r2.avail_out = s2 - h2, h2 && r2.output.set(r2.output.subarray(l2, l2 + h2), 0), this.onData(d2);
          } else this.onData(r2.output.length === r2.next_out ? r2.output : r2.output.subarray(0, r2.next_out)), r2.avail_out = 0, r2.next_out = 0;
          if (a2 !== ea && a2 !== oa || 0 !== i2) {
            if (a2 === aa) return a2 = Je.inflateEnd(this.strm), this.onEnd(a2), this.ended = true, true;
            if (0 === r2.avail_in) {
              if (n2 === ta) return a2 = Je.inflateEnd(this.strm), this.onEnd(a2 === ea ? oa : a2), this.ended = true, false;
              break;
            }
          }
        }
        return true;
      }, ha.prototype.onData = function(t2) {
        this.chunks.push(t2);
      }, ha.prototype.onEnd = function(t2) {
        t2 === ea && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = Yt(this.chunks)), this.chunks = [], this.err = t2, this.msg = this.strm.msg;
      };
      var _a = { Inflate: ha, inflate: da, inflateRaw: function(t2, e2) {
        return (e2 = e2 || {}).raw = true, da(t2, e2);
      }, ungzip: da, constants: K }, fa = he.Deflate, ua = he.deflate, ca = he.deflateRaw, wa = he.gzip, ma = _a.Inflate, ba = _a.inflate, ga = _a.inflateRaw, pa = _a.ungzip, va = K, ka = { Deflate: fa, deflate: ua, deflateRaw: ca, gzip: wa, Inflate: ma, inflate: ba, inflateRaw: ga, ungzip: pa, constants: va };
      t.Deflate = fa, t.Inflate = ma, t.constants = va, t.default = ka, t.deflate = ua, t.deflateRaw = ca, t.gzip = wa, t.inflate = ba, t.inflateRaw = ga, t.ungzip = pa, Object.defineProperty(t, "__esModule", { value: true });
    }));
  }
});

// node_modules/pizzip/js/flate.js
var require_flate = __commonJS({
  "node_modules/pizzip/js/flate.js"(exports) {
    "use strict";
    var USE_TYPEDARRAY = typeof Uint8Array !== "undefined" && typeof Uint16Array !== "undefined" && typeof Uint32Array !== "undefined";
    var pako = require_pako_es5_min();
    exports.uncompressInputType = USE_TYPEDARRAY ? "uint8array" : "array";
    exports.compressInputType = USE_TYPEDARRAY ? "uint8array" : "array";
    exports.magic = "\b\0";
    exports.compress = function(input, compressionOptions) {
      return pako.deflateRaw(input, {
        level: compressionOptions.level || -1
        // default compression
      });
    };
    exports.uncompress = function(input) {
      return pako.inflateRaw(input);
    };
  }
});

// node_modules/pizzip/js/compressions.js
var require_compressions = __commonJS({
  "node_modules/pizzip/js/compressions.js"(exports) {
    "use strict";
    exports.STORE = {
      magic: "\0\0",
      compress: function compress(content) {
        return content;
      },
      uncompress: function uncompress(content) {
        return content;
      },
      compressInputType: null,
      uncompressInputType: null
    };
    exports.DEFLATE = require_flate();
  }
});

// node_modules/pizzip/js/nodeBuffer.js
var require_nodeBuffer = __commonJS({
  "node_modules/pizzip/js/nodeBuffer.js"(exports, module) {
    "use strict";
    module.exports = function(data, encoding) {
      if (typeof data === "number") {
        return Buffer.alloc(data);
      }
      return Buffer.from(data, encoding);
    };
    module.exports.test = function(b) {
      return Buffer.isBuffer(b);
    };
  }
});

// node_modules/pizzip/js/utils.js
var require_utils = __commonJS({
  "node_modules/pizzip/js/utils.js"(exports) {
    "use strict";
    function _typeof(o) {
      "@babel/helpers - typeof";
      return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
        return typeof o2;
      } : function(o2) {
        return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
      }, _typeof(o);
    }
    var support = require_support();
    var compressions = require_compressions();
    var nodeBuffer = require_nodeBuffer();
    exports.string2binary = function(str) {
      var result = "";
      for (var i = 0; i < str.length; i++) {
        result += String.fromCharCode(str.charCodeAt(i) & 255);
      }
      return result;
    };
    exports.arrayBuffer2Blob = function(buffer, mimeType) {
      exports.checkSupport("blob");
      mimeType = mimeType || "application/zip";
      try {
        return new Blob([buffer], {
          type: mimeType
        });
      } catch (_unused) {
        try {
          var Builder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
          var builder = new Builder();
          builder.append(buffer);
          return builder.getBlob(mimeType);
        } catch (_unused2) {
          throw new Error("Bug : can't construct the Blob.");
        }
      }
    };
    function identity(input) {
      return input;
    }
    function stringToArrayLike(str, array) {
      for (var i = 0; i < str.length; ++i) {
        array[i] = str.charCodeAt(i) & 255;
      }
      return array;
    }
    function arrayLikeToString(array) {
      var chunk = 65536;
      var result = [], len = array.length, type = exports.getTypeOf(array);
      var k = 0, canUseApply = true;
      try {
        switch (type) {
          case "uint8array":
            String.fromCharCode.apply(null, new Uint8Array(0));
            break;
          case "nodebuffer":
            String.fromCharCode.apply(null, nodeBuffer(0));
            break;
        }
      } catch (_unused3) {
        canUseApply = false;
      }
      if (!canUseApply) {
        var resultStr = "";
        for (var i = 0; i < array.length; i++) {
          resultStr += String.fromCharCode(array[i]);
        }
        return resultStr;
      }
      while (k < len && chunk > 1) {
        try {
          if (type === "array" || type === "nodebuffer") {
            result.push(String.fromCharCode.apply(null, array.slice(k, Math.min(k + chunk, len))));
          } else {
            result.push(String.fromCharCode.apply(null, array.subarray(k, Math.min(k + chunk, len))));
          }
          k += chunk;
        } catch (_unused4) {
          chunk = Math.floor(chunk / 2);
        }
      }
      return result.join("");
    }
    exports.applyFromCharCode = arrayLikeToString;
    function arrayLikeToArrayLike(arrayFrom, arrayTo) {
      for (var i = 0; i < arrayFrom.length; i++) {
        arrayTo[i] = arrayFrom[i];
      }
      return arrayTo;
    }
    var transform = {};
    transform.string = {
      string: identity,
      array: function array(input) {
        return stringToArrayLike(input, new Array(input.length));
      },
      arraybuffer: function arraybuffer(input) {
        return transform.string.uint8array(input).buffer;
      },
      uint8array: function uint8array(input) {
        return stringToArrayLike(input, new Uint8Array(input.length));
      },
      nodebuffer: function nodebuffer(input) {
        return stringToArrayLike(input, nodeBuffer(input.length));
      }
    };
    transform.array = {
      string: arrayLikeToString,
      array: identity,
      arraybuffer: function arraybuffer(input) {
        return new Uint8Array(input).buffer;
      },
      uint8array: function uint8array(input) {
        return new Uint8Array(input);
      },
      nodebuffer: function nodebuffer(input) {
        return nodeBuffer(input);
      }
    };
    transform.arraybuffer = {
      string: function string(input) {
        return arrayLikeToString(new Uint8Array(input));
      },
      array: function array(input) {
        return arrayLikeToArrayLike(new Uint8Array(input), new Array(input.byteLength));
      },
      arraybuffer: identity,
      uint8array: function uint8array(input) {
        return new Uint8Array(input);
      },
      nodebuffer: function nodebuffer(input) {
        return nodeBuffer(new Uint8Array(input));
      }
    };
    transform.uint8array = {
      string: arrayLikeToString,
      array: function array(input) {
        return arrayLikeToArrayLike(input, new Array(input.length));
      },
      arraybuffer: function arraybuffer(input) {
        return input.buffer;
      },
      uint8array: identity,
      nodebuffer: function nodebuffer(input) {
        return nodeBuffer(input);
      }
    };
    transform.nodebuffer = {
      string: arrayLikeToString,
      array: function array(input) {
        return arrayLikeToArrayLike(input, new Array(input.length));
      },
      arraybuffer: function arraybuffer(input) {
        return transform.nodebuffer.uint8array(input).buffer;
      },
      uint8array: function uint8array(input) {
        return arrayLikeToArrayLike(input, new Uint8Array(input.length));
      },
      nodebuffer: identity
    };
    exports.transformTo = function(outputType, input) {
      if (!input) {
        input = "";
      }
      if (!outputType) {
        return input;
      }
      exports.checkSupport(outputType);
      var inputType = exports.getTypeOf(input);
      var result = transform[inputType][outputType](input);
      return result;
    };
    exports.getTypeOf = function(input) {
      if (input == null) {
        return;
      }
      if (typeof input === "string") {
        return "string";
      }
      var protoResult = Object.prototype.toString.call(input);
      if (protoResult === "[object Array]") {
        return "array";
      }
      if (support.nodebuffer && nodeBuffer.test(input)) {
        return "nodebuffer";
      }
      if (support.uint8array && protoResult === "[object Uint8Array]") {
        return "uint8array";
      }
      if (support.arraybuffer && protoResult === "[object ArrayBuffer]") {
        return "arraybuffer";
      }
      if (protoResult === "[object Promise]") {
        throw new Error("Cannot read data from a promise, you probably are running new PizZip(data) with a promise");
      }
      if (_typeof(input) === "object" && typeof input.file === "function") {
        throw new Error("Cannot read data from a pizzip instance, you probably are running new PizZip(zip) with a zipinstance");
      }
      if (protoResult === "[object Date]") {
        throw new Error("Cannot read data from a Date, you probably are running new PizZip(data) with a date");
      }
      if (_typeof(input) === "object" && input.crc32 == null) {
        throw new Error("Unsupported data given to new PizZip(data) (object given)");
      }
    };
    exports.checkSupport = function(type) {
      var supported = support[type.toLowerCase()];
      if (!supported) {
        throw new Error(type + " is not supported by this browser");
      }
    };
    exports.MAX_VALUE_16BITS = 65535;
    exports.MAX_VALUE_32BITS = -1;
    exports.pretty = function(str) {
      var res = "", code, i;
      for (i = 0; i < (str || "").length; i++) {
        code = str.charCodeAt(i);
        res += "\\x" + (code < 16 ? "0" : "") + code.toString(16).toUpperCase();
      }
      return res;
    };
    exports.findCompression = function(compressionMethod) {
      for (var method in compressions) {
        if (!compressions.hasOwnProperty(method)) {
          continue;
        }
        if (compressions[method].magic === compressionMethod) {
          return compressions[method];
        }
      }
      return null;
    };
    exports.isRegExp = function(object) {
      return Object.prototype.toString.call(object) === "[object RegExp]";
    };
    exports.extend = function() {
      var result = {};
      var i, attr;
      for (i = 0; i < arguments.length; i++) {
        for (attr in arguments[i]) {
          if (arguments[i].hasOwnProperty(attr) && typeof result[attr] === "undefined") {
            result[attr] = arguments[i][attr];
          }
        }
      }
      return result;
    };
  }
});

// node_modules/pizzip/js/compressedObject.js
var require_compressedObject = __commonJS({
  "node_modules/pizzip/js/compressedObject.js"(exports, module) {
    "use strict";
    var utils = require_utils();
    function CompressedObject() {
      this.compressedSize = 0;
      this.uncompressedSize = 0;
      this.crc32 = 0;
      this.compressionMethod = null;
      this.compressedContent = null;
    }
    CompressedObject.from = function(source, getCompressedContent) {
      var compression = utils.findCompression(source.compressionMethod);
      if (!compression) {
        throw new Error("Corrupted zip : compression " + utils.pretty(source.compressionMethod) + " unknown");
      }
      var result = new CompressedObject();
      result.compressedSize = source.compressedSize;
      result.uncompressedSize = source.uncompressedSize;
      result.crc32 = source.crc32;
      result.compressionMethod = source.compressionMethod;
      result.getCompressedContent = getCompressedContent;
      result.getContent = function() {
        var content = compression.uncompress(utils.transformTo(compression.uncompressInputType, getCompressedContent()));
        if (content.length !== result.uncompressedSize) {
          throw new Error("Bug : uncompressed data size mismatch");
        }
        return content;
      };
      return result;
    };
    CompressedObject.prototype = {
      /**
       * Return the decompressed content in an unspecified format.
       * The format will depend on the decompressor.
       * @return {Object} the decompressed content.
       */
      getContent: function getContent() {
        return null;
      },
      /**
       * Return the compressed content in an unspecified format.
       * The format will depend on the compressed conten source.
       * @return {Object} the compressed content.
       */
      getCompressedContent: function getCompressedContent() {
        return null;
      }
    };
    module.exports = CompressedObject;
  }
});

// node_modules/pizzip/js/dataReader.js
var require_dataReader = __commonJS({
  "node_modules/pizzip/js/dataReader.js"(exports, module) {
    "use strict";
    var utils = require_utils();
    function DataReader() {
      this.data = null;
      this.length = 0;
      this.index = 0;
      this.zero = 0;
    }
    DataReader.prototype = {
      /**
       * Check that the offset will not go too far.
       * @param {string} offset the additional offset to check.
       * @throws {Error} an Error if the offset is out of bounds.
       */
      checkOffset: function checkOffset(offset) {
        this.checkIndex(this.index + offset);
      },
      /**
       * Check that the specifed index will not be too far.
       * @param {string} newIndex the index to check.
       * @throws {Error} an Error if the index is out of bounds.
       */
      checkIndex: function checkIndex(newIndex) {
        if (this.length < this.zero + newIndex || newIndex < 0) {
          throw new Error("End of data reached (data length = " + this.length + ", asked index = " + newIndex + "). Corrupted zip ?");
        }
      },
      /**
       * Change the index.
       * @param {number} newIndex The new index.
       * @throws {Error} if the new index is out of the data.
       */
      setIndex: function setIndex(newIndex) {
        this.checkIndex(newIndex);
        this.index = newIndex;
      },
      /**
       * Skip the next n bytes.
       * @param {number} n the number of bytes to skip.
       * @throws {Error} if the new index is out of the data.
       */
      skip: function skip(n) {
        this.setIndex(this.index + n);
      },
      /**
       * Get the byte at the specified index.
       * @param {number} i the index to use.
       * @return {number} a byte.
       */
      byteAt: function byteAt() {
      },
      /**
       * Get the next number with a given byte size.
       * @param {number} size the number of bytes to read.
       * @return {number} the corresponding number.
       */
      readInt: function readInt(size) {
        var result = 0, i;
        this.checkOffset(size);
        for (i = this.index + size - 1; i >= this.index; i--) {
          result = (result << 8) + this.byteAt(i);
        }
        this.index += size;
        return result;
      },
      /**
       * Get the next string with a given byte size.
       * @param {number} size the number of bytes to read.
       * @return {string} the corresponding string.
       */
      readString: function readString(size) {
        return utils.transformTo("string", this.readData(size));
      },
      /**
       * Get raw data without conversion, <size> bytes.
       * @param {number} size the number of bytes to read.
       * @return {Object} the raw data, implementation specific.
       */
      readData: function readData() {
      },
      /**
       * Find the last occurence of a zip signature (4 bytes).
       * @param {string} sig the signature to find.
       * @return {number} the index of the last occurence, -1 if not found.
       */
      lastIndexOfSignature: function lastIndexOfSignature() {
      },
      /**
       * Get the next date.
       * @return {Date} the date.
       */
      readDate: function readDate() {
        var dostime = this.readInt(4);
        return new Date(
          (dostime >> 25 & 127) + 1980,
          // year
          (dostime >> 21 & 15) - 1,
          // month
          dostime >> 16 & 31,
          // day
          dostime >> 11 & 31,
          // hour
          dostime >> 5 & 63,
          // minute
          (dostime & 31) << 1
        );
      }
    };
    module.exports = DataReader;
  }
});

// node_modules/pizzip/js/crc32.js
var require_crc32 = __commonJS({
  "node_modules/pizzip/js/crc32.js"(exports, module) {
    "use strict";
    var utils = require_utils();
    var table = [0, 1996959894, 3993919788, 2567524794, 124634137, 1886057615, 3915621685, 2657392035, 249268274, 2044508324, 3772115230, 2547177864, 162941995, 2125561021, 3887607047, 2428444049, 498536548, 1789927666, 4089016648, 2227061214, 450548861, 1843258603, 4107580753, 2211677639, 325883990, 1684777152, 4251122042, 2321926636, 335633487, 1661365465, 4195302755, 2366115317, 997073096, 1281953886, 3579855332, 2724688242, 1006888145, 1258607687, 3524101629, 2768942443, 901097722, 1119000684, 3686517206, 2898065728, 853044451, 1172266101, 3705015759, 2882616665, 651767980, 1373503546, 3369554304, 3218104598, 565507253, 1454621731, 3485111705, 3099436303, 671266974, 1594198024, 3322730930, 2970347812, 795835527, 1483230225, 3244367275, 3060149565, 1994146192, 31158534, 2563907772, 4023717930, 1907459465, 112637215, 2680153253, 3904427059, 2013776290, 251722036, 2517215374, 3775830040, 2137656763, 141376813, 2439277719, 3865271297, 1802195444, 476864866, 2238001368, 4066508878, 1812370925, 453092731, 2181625025, 4111451223, 1706088902, 314042704, 2344532202, 4240017532, 1658658271, 366619977, 2362670323, 4224994405, 1303535960, 984961486, 2747007092, 3569037538, 1256170817, 1037604311, 2765210733, 3554079995, 1131014506, 879679996, 2909243462, 3663771856, 1141124467, 855842277, 2852801631, 3708648649, 1342533948, 654459306, 3188396048, 3373015174, 1466479909, 544179635, 3110523913, 3462522015, 1591671054, 702138776, 2966460450, 3352799412, 1504918807, 783551873, 3082640443, 3233442989, 3988292384, 2596254646, 62317068, 1957810842, 3939845945, 2647816111, 81470997, 1943803523, 3814918930, 2489596804, 225274430, 2053790376, 3826175755, 2466906013, 167816743, 2097651377, 4027552580, 2265490386, 503444072, 1762050814, 4150417245, 2154129355, 426522225, 1852507879, 4275313526, 2312317920, 282753626, 1742555852, 4189708143, 2394877945, 397917763, 1622183637, 3604390888, 2714866558, 953729732, 1340076626, 3518719985, 2797360999, 1068828381, 1219638859, 3624741850, 2936675148, 906185462, 1090812512, 3747672003, 2825379669, 829329135, 1181335161, 3412177804, 3160834842, 628085408, 1382605366, 3423369109, 3138078467, 570562233, 1426400815, 3317316542, 2998733608, 733239954, 1555261956, 3268935591, 3050360625, 752459403, 1541320221, 2607071920, 3965973030, 1969922972, 40735498, 2617837225, 3943577151, 1913087877, 83908371, 2512341634, 3803740692, 2075208622, 213261112, 2463272603, 3855990285, 2094854071, 198958881, 2262029012, 4057260610, 1759359992, 534414190, 2176718541, 4139329115, 1873836001, 414664567, 2282248934, 4279200368, 1711684554, 285281116, 2405801727, 4167216745, 1634467795, 376229701, 2685067896, 3608007406, 1308918612, 956543938, 2808555105, 3495958263, 1231636301, 1047427035, 2932959818, 3654703836, 1088359270, 936918e3, 2847714899, 3736837829, 1202900863, 817233897, 3183342108, 3401237130, 1404277552, 615818150, 3134207493, 3453421203, 1423857449, 601450431, 3009837614, 3294710456, 1567103746, 711928724, 3020668471, 3272380065, 1510334235, 755167117];
    module.exports = function crc32(input, crc) {
      if (typeof input === "undefined" || !input.length) {
        return 0;
      }
      var isArray = utils.getTypeOf(input) !== "string";
      if (typeof crc == "undefined") {
        crc = 0;
      }
      var x = 0;
      var y = 0;
      var b = 0;
      crc ^= -1;
      for (var i = 0, iTop = input.length; i < iTop; i++) {
        b = isArray ? input[i] : input.charCodeAt(i);
        y = (crc ^ b) & 255;
        x = table[y];
        crc = crc >>> 8 ^ x;
      }
      return crc ^ -1;
    };
  }
});

// node_modules/pizzip/node_modules/pako/lib/zlib/trees.js
var require_trees = __commonJS({
  "node_modules/pizzip/node_modules/pako/lib/zlib/trees.js"(exports, module) {
    "use strict";
    var Z_FIXED = 4;
    var Z_BINARY = 0;
    var Z_TEXT = 1;
    var Z_UNKNOWN = 2;
    function zero(buf) {
      let len = buf.length;
      while (--len >= 0) {
        buf[len] = 0;
      }
    }
    var STORED_BLOCK = 0;
    var STATIC_TREES = 1;
    var DYN_TREES = 2;
    var MIN_MATCH = 3;
    var MAX_MATCH = 258;
    var LENGTH_CODES = 29;
    var LITERALS = 256;
    var L_CODES = LITERALS + 1 + LENGTH_CODES;
    var D_CODES = 30;
    var BL_CODES = 19;
    var HEAP_SIZE = 2 * L_CODES + 1;
    var MAX_BITS = 15;
    var Buf_size = 16;
    var MAX_BL_BITS = 7;
    var END_BLOCK = 256;
    var REP_3_6 = 16;
    var REPZ_3_10 = 17;
    var REPZ_11_138 = 18;
    var extra_lbits = (
      /* extra bits for each length code */
      new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0])
    );
    var extra_dbits = (
      /* extra bits for each distance code */
      new Uint8Array([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13])
    );
    var extra_blbits = (
      /* extra bits for each bit length code */
      new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7])
    );
    var bl_order = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
    var DIST_CODE_LEN = 512;
    var static_ltree = new Array((L_CODES + 2) * 2);
    zero(static_ltree);
    var static_dtree = new Array(D_CODES * 2);
    zero(static_dtree);
    var _dist_code = new Array(DIST_CODE_LEN);
    zero(_dist_code);
    var _length_code = new Array(MAX_MATCH - MIN_MATCH + 1);
    zero(_length_code);
    var base_length = new Array(LENGTH_CODES);
    zero(base_length);
    var base_dist = new Array(D_CODES);
    zero(base_dist);
    function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {
      this.static_tree = static_tree;
      this.extra_bits = extra_bits;
      this.extra_base = extra_base;
      this.elems = elems;
      this.max_length = max_length;
      this.has_stree = static_tree && static_tree.length;
    }
    var static_l_desc;
    var static_d_desc;
    var static_bl_desc;
    function TreeDesc(dyn_tree, stat_desc) {
      this.dyn_tree = dyn_tree;
      this.max_code = 0;
      this.stat_desc = stat_desc;
    }
    var d_code = (dist) => {
      return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
    };
    var put_short = (s, w) => {
      s.pending_buf[s.pending++] = w & 255;
      s.pending_buf[s.pending++] = w >>> 8 & 255;
    };
    var send_bits = (s, value, length) => {
      if (s.bi_valid > Buf_size - length) {
        s.bi_buf |= value << s.bi_valid & 65535;
        put_short(s, s.bi_buf);
        s.bi_buf = value >> Buf_size - s.bi_valid;
        s.bi_valid += length - Buf_size;
      } else {
        s.bi_buf |= value << s.bi_valid & 65535;
        s.bi_valid += length;
      }
    };
    var send_code = (s, c, tree) => {
      send_bits(
        s,
        tree[c * 2],
        tree[c * 2 + 1]
        /*.Len*/
      );
    };
    var bi_reverse = (code, len) => {
      let res = 0;
      do {
        res |= code & 1;
        code >>>= 1;
        res <<= 1;
      } while (--len > 0);
      return res >>> 1;
    };
    var bi_flush = (s) => {
      if (s.bi_valid === 16) {
        put_short(s, s.bi_buf);
        s.bi_buf = 0;
        s.bi_valid = 0;
      } else if (s.bi_valid >= 8) {
        s.pending_buf[s.pending++] = s.bi_buf & 255;
        s.bi_buf >>= 8;
        s.bi_valid -= 8;
      }
    };
    var gen_bitlen = (s, desc) => {
      const tree = desc.dyn_tree;
      const max_code = desc.max_code;
      const stree = desc.stat_desc.static_tree;
      const has_stree = desc.stat_desc.has_stree;
      const extra = desc.stat_desc.extra_bits;
      const base = desc.stat_desc.extra_base;
      const max_length = desc.stat_desc.max_length;
      let h;
      let n, m;
      let bits;
      let xbits;
      let f;
      let overflow = 0;
      for (bits = 0; bits <= MAX_BITS; bits++) {
        s.bl_count[bits] = 0;
      }
      tree[s.heap[s.heap_max] * 2 + 1] = 0;
      for (h = s.heap_max + 1; h < HEAP_SIZE; h++) {
        n = s.heap[h];
        bits = tree[tree[n * 2 + 1] * 2 + 1] + 1;
        if (bits > max_length) {
          bits = max_length;
          overflow++;
        }
        tree[n * 2 + 1] = bits;
        if (n > max_code) {
          continue;
        }
        s.bl_count[bits]++;
        xbits = 0;
        if (n >= base) {
          xbits = extra[n - base];
        }
        f = tree[n * 2];
        s.opt_len += f * (bits + xbits);
        if (has_stree) {
          s.static_len += f * (stree[n * 2 + 1] + xbits);
        }
      }
      if (overflow === 0) {
        return;
      }
      do {
        bits = max_length - 1;
        while (s.bl_count[bits] === 0) {
          bits--;
        }
        s.bl_count[bits]--;
        s.bl_count[bits + 1] += 2;
        s.bl_count[max_length]--;
        overflow -= 2;
      } while (overflow > 0);
      for (bits = max_length; bits !== 0; bits--) {
        n = s.bl_count[bits];
        while (n !== 0) {
          m = s.heap[--h];
          if (m > max_code) {
            continue;
          }
          if (tree[m * 2 + 1] !== bits) {
            s.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
            tree[m * 2 + 1] = bits;
          }
          n--;
        }
      }
    };
    var gen_codes = (tree, max_code, bl_count) => {
      const next_code = new Array(MAX_BITS + 1);
      let code = 0;
      let bits;
      let n;
      for (bits = 1; bits <= MAX_BITS; bits++) {
        code = code + bl_count[bits - 1] << 1;
        next_code[bits] = code;
      }
      for (n = 0; n <= max_code; n++) {
        let len = tree[n * 2 + 1];
        if (len === 0) {
          continue;
        }
        tree[n * 2] = bi_reverse(next_code[len]++, len);
      }
    };
    var tr_static_init = () => {
      let n;
      let bits;
      let length;
      let code;
      let dist;
      const bl_count = new Array(MAX_BITS + 1);
      length = 0;
      for (code = 0; code < LENGTH_CODES - 1; code++) {
        base_length[code] = length;
        for (n = 0; n < 1 << extra_lbits[code]; n++) {
          _length_code[length++] = code;
        }
      }
      _length_code[length - 1] = code;
      dist = 0;
      for (code = 0; code < 16; code++) {
        base_dist[code] = dist;
        for (n = 0; n < 1 << extra_dbits[code]; n++) {
          _dist_code[dist++] = code;
        }
      }
      dist >>= 7;
      for (; code < D_CODES; code++) {
        base_dist[code] = dist << 7;
        for (n = 0; n < 1 << extra_dbits[code] - 7; n++) {
          _dist_code[256 + dist++] = code;
        }
      }
      for (bits = 0; bits <= MAX_BITS; bits++) {
        bl_count[bits] = 0;
      }
      n = 0;
      while (n <= 143) {
        static_ltree[n * 2 + 1] = 8;
        n++;
        bl_count[8]++;
      }
      while (n <= 255) {
        static_ltree[n * 2 + 1] = 9;
        n++;
        bl_count[9]++;
      }
      while (n <= 279) {
        static_ltree[n * 2 + 1] = 7;
        n++;
        bl_count[7]++;
      }
      while (n <= 287) {
        static_ltree[n * 2 + 1] = 8;
        n++;
        bl_count[8]++;
      }
      gen_codes(static_ltree, L_CODES + 1, bl_count);
      for (n = 0; n < D_CODES; n++) {
        static_dtree[n * 2 + 1] = 5;
        static_dtree[n * 2] = bi_reverse(n, 5);
      }
      static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS + 1, L_CODES, MAX_BITS);
      static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, D_CODES, MAX_BITS);
      static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0, BL_CODES, MAX_BL_BITS);
    };
    var init_block = (s) => {
      let n;
      for (n = 0; n < L_CODES; n++) {
        s.dyn_ltree[n * 2] = 0;
      }
      for (n = 0; n < D_CODES; n++) {
        s.dyn_dtree[n * 2] = 0;
      }
      for (n = 0; n < BL_CODES; n++) {
        s.bl_tree[n * 2] = 0;
      }
      s.dyn_ltree[END_BLOCK * 2] = 1;
      s.opt_len = s.static_len = 0;
      s.sym_next = s.matches = 0;
    };
    var bi_windup = (s) => {
      if (s.bi_valid > 8) {
        put_short(s, s.bi_buf);
      } else if (s.bi_valid > 0) {
        s.pending_buf[s.pending++] = s.bi_buf;
      }
      s.bi_buf = 0;
      s.bi_valid = 0;
    };
    var smaller = (tree, n, m, depth) => {
      const _n2 = n * 2;
      const _m2 = m * 2;
      return tree[_n2] < tree[_m2] || tree[_n2] === tree[_m2] && depth[n] <= depth[m];
    };
    var pqdownheap = (s, tree, k) => {
      const v = s.heap[k];
      let j = k << 1;
      while (j <= s.heap_len) {
        if (j < s.heap_len && smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) {
          j++;
        }
        if (smaller(tree, v, s.heap[j], s.depth)) {
          break;
        }
        s.heap[k] = s.heap[j];
        k = j;
        j <<= 1;
      }
      s.heap[k] = v;
    };
    var compress_block = (s, ltree, dtree) => {
      let dist;
      let lc;
      let sx = 0;
      let code;
      let extra;
      if (s.sym_next !== 0) {
        do {
          dist = s.pending_buf[s.sym_buf + sx++] & 255;
          dist += (s.pending_buf[s.sym_buf + sx++] & 255) << 8;
          lc = s.pending_buf[s.sym_buf + sx++];
          if (dist === 0) {
            send_code(s, lc, ltree);
          } else {
            code = _length_code[lc];
            send_code(s, code + LITERALS + 1, ltree);
            extra = extra_lbits[code];
            if (extra !== 0) {
              lc -= base_length[code];
              send_bits(s, lc, extra);
            }
            dist--;
            code = d_code(dist);
            send_code(s, code, dtree);
            extra = extra_dbits[code];
            if (extra !== 0) {
              dist -= base_dist[code];
              send_bits(s, dist, extra);
            }
          }
        } while (sx < s.sym_next);
      }
      send_code(s, END_BLOCK, ltree);
    };
    var build_tree = (s, desc) => {
      const tree = desc.dyn_tree;
      const stree = desc.stat_desc.static_tree;
      const has_stree = desc.stat_desc.has_stree;
      const elems = desc.stat_desc.elems;
      let n, m;
      let max_code = -1;
      let node;
      s.heap_len = 0;
      s.heap_max = HEAP_SIZE;
      for (n = 0; n < elems; n++) {
        if (tree[n * 2] !== 0) {
          s.heap[++s.heap_len] = max_code = n;
          s.depth[n] = 0;
        } else {
          tree[n * 2 + 1] = 0;
        }
      }
      while (s.heap_len < 2) {
        node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
        tree[node * 2] = 1;
        s.depth[node] = 0;
        s.opt_len--;
        if (has_stree) {
          s.static_len -= stree[node * 2 + 1];
        }
      }
      desc.max_code = max_code;
      for (n = s.heap_len >> 1; n >= 1; n--) {
        pqdownheap(s, tree, n);
      }
      node = elems;
      do {
        n = s.heap[
          1
          /*SMALLEST*/
        ];
        s.heap[
          1
          /*SMALLEST*/
        ] = s.heap[s.heap_len--];
        pqdownheap(
          s,
          tree,
          1
          /*SMALLEST*/
        );
        m = s.heap[
          1
          /*SMALLEST*/
        ];
        s.heap[--s.heap_max] = n;
        s.heap[--s.heap_max] = m;
        tree[node * 2] = tree[n * 2] + tree[m * 2];
        s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
        tree[n * 2 + 1] = tree[m * 2 + 1] = node;
        s.heap[
          1
          /*SMALLEST*/
        ] = node++;
        pqdownheap(
          s,
          tree,
          1
          /*SMALLEST*/
        );
      } while (s.heap_len >= 2);
      s.heap[--s.heap_max] = s.heap[
        1
        /*SMALLEST*/
      ];
      gen_bitlen(s, desc);
      gen_codes(tree, max_code, s.bl_count);
    };
    var scan_tree = (s, tree, max_code) => {
      let n;
      let prevlen = -1;
      let curlen;
      let nextlen = tree[0 * 2 + 1];
      let count = 0;
      let max_count = 7;
      let min_count = 4;
      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      }
      tree[(max_code + 1) * 2 + 1] = 65535;
      for (n = 0; n <= max_code; n++) {
        curlen = nextlen;
        nextlen = tree[(n + 1) * 2 + 1];
        if (++count < max_count && curlen === nextlen) {
          continue;
        } else if (count < min_count) {
          s.bl_tree[curlen * 2] += count;
        } else if (curlen !== 0) {
          if (curlen !== prevlen) {
            s.bl_tree[curlen * 2]++;
          }
          s.bl_tree[REP_3_6 * 2]++;
        } else if (count <= 10) {
          s.bl_tree[REPZ_3_10 * 2]++;
        } else {
          s.bl_tree[REPZ_11_138 * 2]++;
        }
        count = 0;
        prevlen = curlen;
        if (nextlen === 0) {
          max_count = 138;
          min_count = 3;
        } else if (curlen === nextlen) {
          max_count = 6;
          min_count = 3;
        } else {
          max_count = 7;
          min_count = 4;
        }
      }
    };
    var send_tree = (s, tree, max_code) => {
      let n;
      let prevlen = -1;
      let curlen;
      let nextlen = tree[0 * 2 + 1];
      let count = 0;
      let max_count = 7;
      let min_count = 4;
      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      }
      for (n = 0; n <= max_code; n++) {
        curlen = nextlen;
        nextlen = tree[(n + 1) * 2 + 1];
        if (++count < max_count && curlen === nextlen) {
          continue;
        } else if (count < min_count) {
          do {
            send_code(s, curlen, s.bl_tree);
          } while (--count !== 0);
        } else if (curlen !== 0) {
          if (curlen !== prevlen) {
            send_code(s, curlen, s.bl_tree);
            count--;
          }
          send_code(s, REP_3_6, s.bl_tree);
          send_bits(s, count - 3, 2);
        } else if (count <= 10) {
          send_code(s, REPZ_3_10, s.bl_tree);
          send_bits(s, count - 3, 3);
        } else {
          send_code(s, REPZ_11_138, s.bl_tree);
          send_bits(s, count - 11, 7);
        }
        count = 0;
        prevlen = curlen;
        if (nextlen === 0) {
          max_count = 138;
          min_count = 3;
        } else if (curlen === nextlen) {
          max_count = 6;
          min_count = 3;
        } else {
          max_count = 7;
          min_count = 4;
        }
      }
    };
    var build_bl_tree = (s) => {
      let max_blindex;
      scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
      scan_tree(s, s.dyn_dtree, s.d_desc.max_code);
      build_tree(s, s.bl_desc);
      for (max_blindex = BL_CODES - 1; max_blindex >= 3; max_blindex--) {
        if (s.bl_tree[bl_order[max_blindex] * 2 + 1] !== 0) {
          break;
        }
      }
      s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
      return max_blindex;
    };
    var send_all_trees = (s, lcodes, dcodes, blcodes) => {
      let rank;
      send_bits(s, lcodes - 257, 5);
      send_bits(s, dcodes - 1, 5);
      send_bits(s, blcodes - 4, 4);
      for (rank = 0; rank < blcodes; rank++) {
        send_bits(s, s.bl_tree[bl_order[rank] * 2 + 1], 3);
      }
      send_tree(s, s.dyn_ltree, lcodes - 1);
      send_tree(s, s.dyn_dtree, dcodes - 1);
    };
    var detect_data_type = (s) => {
      let block_mask = 4093624447;
      let n;
      for (n = 0; n <= 31; n++, block_mask >>>= 1) {
        if (block_mask & 1 && s.dyn_ltree[n * 2] !== 0) {
          return Z_BINARY;
        }
      }
      if (s.dyn_ltree[9 * 2] !== 0 || s.dyn_ltree[10 * 2] !== 0 || s.dyn_ltree[13 * 2] !== 0) {
        return Z_TEXT;
      }
      for (n = 32; n < LITERALS; n++) {
        if (s.dyn_ltree[n * 2] !== 0) {
          return Z_TEXT;
        }
      }
      return Z_BINARY;
    };
    var static_init_done = false;
    var _tr_init = (s) => {
      if (!static_init_done) {
        tr_static_init();
        static_init_done = true;
      }
      s.l_desc = new TreeDesc(s.dyn_ltree, static_l_desc);
      s.d_desc = new TreeDesc(s.dyn_dtree, static_d_desc);
      s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);
      s.bi_buf = 0;
      s.bi_valid = 0;
      init_block(s);
    };
    var _tr_stored_block = (s, buf, stored_len, last) => {
      send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);
      bi_windup(s);
      put_short(s, stored_len);
      put_short(s, ~stored_len);
      if (stored_len) {
        s.pending_buf.set(s.window.subarray(buf, buf + stored_len), s.pending);
      }
      s.pending += stored_len;
    };
    var _tr_align = (s) => {
      send_bits(s, STATIC_TREES << 1, 3);
      send_code(s, END_BLOCK, static_ltree);
      bi_flush(s);
    };
    var _tr_flush_block = (s, buf, stored_len, last) => {
      let opt_lenb, static_lenb;
      let max_blindex = 0;
      if (s.level > 0) {
        if (s.strm.data_type === Z_UNKNOWN) {
          s.strm.data_type = detect_data_type(s);
        }
        build_tree(s, s.l_desc);
        build_tree(s, s.d_desc);
        max_blindex = build_bl_tree(s);
        opt_lenb = s.opt_len + 3 + 7 >>> 3;
        static_lenb = s.static_len + 3 + 7 >>> 3;
        if (static_lenb <= opt_lenb) {
          opt_lenb = static_lenb;
        }
      } else {
        opt_lenb = static_lenb = stored_len + 5;
      }
      if (stored_len + 4 <= opt_lenb && buf !== -1) {
        _tr_stored_block(s, buf, stored_len, last);
      } else if (s.strategy === Z_FIXED || static_lenb === opt_lenb) {
        send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
        compress_block(s, static_ltree, static_dtree);
      } else {
        send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
        send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
        compress_block(s, s.dyn_ltree, s.dyn_dtree);
      }
      init_block(s);
      if (last) {
        bi_windup(s);
      }
    };
    var _tr_tally = (s, dist, lc) => {
      s.pending_buf[s.sym_buf + s.sym_next++] = dist;
      s.pending_buf[s.sym_buf + s.sym_next++] = dist >> 8;
      s.pending_buf[s.sym_buf + s.sym_next++] = lc;
      if (dist === 0) {
        s.dyn_ltree[lc * 2]++;
      } else {
        s.matches++;
        dist--;
        s.dyn_ltree[(_length_code[lc] + LITERALS + 1) * 2]++;
        s.dyn_dtree[d_code(dist) * 2]++;
      }
      return s.sym_next === s.sym_end;
    };
    module.exports._tr_init = _tr_init;
    module.exports._tr_stored_block = _tr_stored_block;
    module.exports._tr_flush_block = _tr_flush_block;
    module.exports._tr_tally = _tr_tally;
    module.exports._tr_align = _tr_align;
  }
});

// node_modules/pizzip/node_modules/pako/lib/zlib/adler32.js
var require_adler32 = __commonJS({
  "node_modules/pizzip/node_modules/pako/lib/zlib/adler32.js"(exports, module) {
    "use strict";
    var adler32 = (adler, buf, len, pos) => {
      let s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n = 0;
      while (len !== 0) {
        n = len > 2e3 ? 2e3 : len;
        len -= n;
        do {
          s1 = s1 + buf[pos++] | 0;
          s2 = s2 + s1 | 0;
        } while (--n);
        s1 %= 65521;
        s2 %= 65521;
      }
      return s1 | s2 << 16 | 0;
    };
    module.exports = adler32;
  }
});

// node_modules/pizzip/node_modules/pako/lib/zlib/crc32.js
var require_crc322 = __commonJS({
  "node_modules/pizzip/node_modules/pako/lib/zlib/crc32.js"(exports, module) {
    "use strict";
    var makeTable = () => {
      let c, table = [];
      for (var n = 0; n < 256; n++) {
        c = n;
        for (var k = 0; k < 8; k++) {
          c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
        }
        table[n] = c;
      }
      return table;
    };
    var crcTable = new Uint32Array(makeTable());
    var crc32 = (crc, buf, len, pos) => {
      const t = crcTable;
      const end = pos + len;
      crc ^= -1;
      for (let i = pos; i < end; i++) {
        crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
      }
      return crc ^ -1;
    };
    module.exports = crc32;
  }
});

// node_modules/pizzip/node_modules/pako/lib/zlib/messages.js
var require_messages = __commonJS({
  "node_modules/pizzip/node_modules/pako/lib/zlib/messages.js"(exports, module) {
    "use strict";
    module.exports = {
      2: "need dictionary",
      /* Z_NEED_DICT       2  */
      1: "stream end",
      /* Z_STREAM_END      1  */
      0: "",
      /* Z_OK              0  */
      "-1": "file error",
      /* Z_ERRNO         (-1) */
      "-2": "stream error",
      /* Z_STREAM_ERROR  (-2) */
      "-3": "data error",
      /* Z_DATA_ERROR    (-3) */
      "-4": "insufficient memory",
      /* Z_MEM_ERROR     (-4) */
      "-5": "buffer error",
      /* Z_BUF_ERROR     (-5) */
      "-6": "incompatible version"
      /* Z_VERSION_ERROR (-6) */
    };
  }
});

// node_modules/pizzip/node_modules/pako/lib/zlib/constants.js
var require_constants = __commonJS({
  "node_modules/pizzip/node_modules/pako/lib/zlib/constants.js"(exports, module) {
    "use strict";
    module.exports = {
      /* Allowed flush values; see deflate() and inflate() below for details */
      Z_NO_FLUSH: 0,
      Z_PARTIAL_FLUSH: 1,
      Z_SYNC_FLUSH: 2,
      Z_FULL_FLUSH: 3,
      Z_FINISH: 4,
      Z_BLOCK: 5,
      Z_TREES: 6,
      /* Return codes for the compression/decompression functions. Negative values
      * are errors, positive values are used for special but normal events.
      */
      Z_OK: 0,
      Z_STREAM_END: 1,
      Z_NEED_DICT: 2,
      Z_ERRNO: -1,
      Z_STREAM_ERROR: -2,
      Z_DATA_ERROR: -3,
      Z_MEM_ERROR: -4,
      Z_BUF_ERROR: -5,
      //Z_VERSION_ERROR: -6,
      /* compression levels */
      Z_NO_COMPRESSION: 0,
      Z_BEST_SPEED: 1,
      Z_BEST_COMPRESSION: 9,
      Z_DEFAULT_COMPRESSION: -1,
      Z_FILTERED: 1,
      Z_HUFFMAN_ONLY: 2,
      Z_RLE: 3,
      Z_FIXED: 4,
      Z_DEFAULT_STRATEGY: 0,
      /* Possible values of the data_type field (though see inflate()) */
      Z_BINARY: 0,
      Z_TEXT: 1,
      //Z_ASCII:                1, // = Z_TEXT (deprecated)
      Z_UNKNOWN: 2,
      /* The deflate compression method */
      Z_DEFLATED: 8
      //Z_NULL:                 null // Use -1 or null inline, depending on var type
    };
  }
});

// node_modules/pizzip/node_modules/pako/lib/zlib/deflate.js
var require_deflate = __commonJS({
  "node_modules/pizzip/node_modules/pako/lib/zlib/deflate.js"(exports, module) {
    "use strict";
    var { _tr_init, _tr_stored_block, _tr_flush_block, _tr_tally, _tr_align } = require_trees();
    var adler32 = require_adler32();
    var crc32 = require_crc322();
    var msg = require_messages();
    var {
      Z_NO_FLUSH,
      Z_PARTIAL_FLUSH,
      Z_FULL_FLUSH,
      Z_FINISH,
      Z_BLOCK,
      Z_OK,
      Z_STREAM_END,
      Z_STREAM_ERROR,
      Z_DATA_ERROR,
      Z_BUF_ERROR,
      Z_DEFAULT_COMPRESSION,
      Z_FILTERED,
      Z_HUFFMAN_ONLY,
      Z_RLE,
      Z_FIXED,
      Z_DEFAULT_STRATEGY,
      Z_UNKNOWN,
      Z_DEFLATED
    } = require_constants();
    var MAX_MEM_LEVEL = 9;
    var MAX_WBITS = 15;
    var DEF_MEM_LEVEL = 8;
    var LENGTH_CODES = 29;
    var LITERALS = 256;
    var L_CODES = LITERALS + 1 + LENGTH_CODES;
    var D_CODES = 30;
    var BL_CODES = 19;
    var HEAP_SIZE = 2 * L_CODES + 1;
    var MAX_BITS = 15;
    var MIN_MATCH = 3;
    var MAX_MATCH = 258;
    var MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1;
    var PRESET_DICT = 32;
    var INIT_STATE = 42;
    var GZIP_STATE = 57;
    var EXTRA_STATE = 69;
    var NAME_STATE = 73;
    var COMMENT_STATE = 91;
    var HCRC_STATE = 103;
    var BUSY_STATE = 113;
    var FINISH_STATE = 666;
    var BS_NEED_MORE = 1;
    var BS_BLOCK_DONE = 2;
    var BS_FINISH_STARTED = 3;
    var BS_FINISH_DONE = 4;
    var OS_CODE = 3;
    var err = (strm, errorCode) => {
      strm.msg = msg[errorCode];
      return errorCode;
    };
    var rank = (f) => {
      return f * 2 - (f > 4 ? 9 : 0);
    };
    var zero = (buf) => {
      let len = buf.length;
      while (--len >= 0) {
        buf[len] = 0;
      }
    };
    var slide_hash = (s) => {
      let n, m;
      let p;
      let wsize = s.w_size;
      n = s.hash_size;
      p = n;
      do {
        m = s.head[--p];
        s.head[p] = m >= wsize ? m - wsize : 0;
      } while (--n);
      n = wsize;
      p = n;
      do {
        m = s.prev[--p];
        s.prev[p] = m >= wsize ? m - wsize : 0;
      } while (--n);
    };
    var HASH = (s, prev, data) => (prev << s.hash_shift ^ data) & s.hash_mask;
    var INSERT_STRING = (s, str) => {
      let h;
      if (s.legacy_hash) {
        h = s.ins_h = HASH(s, s.ins_h, s.window[str + MIN_MATCH - 1]);
      } else {
        const w = s.window;
        const value = w[str] | w[str + 1] << 8 | w[str + 2] << 16 | w[str + 3] << 24;
        h = s.ins_h = Math.imul(value, 66521) + 66521 >>> 16 & s.hash_mask;
      }
      const hash_head = s.prev[str & s.w_mask] = s.head[h];
      s.head[h] = str;
      return hash_head;
    };
    var flush_pending = (strm) => {
      const s = strm.state;
      let len = s.pending;
      if (len > strm.avail_out) {
        len = strm.avail_out;
      }
      if (len === 0) {
        return;
      }
      strm.output.set(s.pending_buf.subarray(s.pending_out, s.pending_out + len), strm.next_out);
      strm.next_out += len;
      s.pending_out += len;
      strm.total_out += len;
      strm.avail_out -= len;
      s.pending -= len;
      if (s.pending === 0) {
        s.pending_out = 0;
      }
    };
    var flush_block_only = (s, last) => {
      _tr_flush_block(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, last);
      s.block_start = s.strstart;
      flush_pending(s.strm);
    };
    var put_byte = (s, b) => {
      s.pending_buf[s.pending++] = b;
    };
    var putShortMSB = (s, b) => {
      s.pending_buf[s.pending++] = b >>> 8 & 255;
      s.pending_buf[s.pending++] = b & 255;
    };
    var read_buf = (strm, buf, start, size) => {
      let len = strm.avail_in;
      if (len > size) {
        len = size;
      }
      if (len === 0) {
        return 0;
      }
      strm.avail_in -= len;
      buf.set(strm.input.subarray(strm.next_in, strm.next_in + len), start);
      if (strm.state.wrap === 1) {
        strm.adler = adler32(strm.adler, buf, len, start);
      } else if (strm.state.wrap === 2) {
        strm.adler = crc32(strm.adler, buf, len, start);
      }
      strm.next_in += len;
      strm.total_in += len;
      return len;
    };
    var longest_match = (s, cur_match) => {
      let chain_length = s.max_chain_length;
      let scan = s.strstart;
      let match;
      let len;
      let best_len = s.prev_length;
      let nice_match = s.nice_match;
      const limit = s.strstart > s.w_size - MIN_LOOKAHEAD ? s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0;
      const _win = s.window;
      const wmask = s.w_mask;
      const prev = s.prev;
      const strend = s.strstart + MAX_MATCH;
      let scan_end1 = _win[scan + best_len - 1];
      let scan_end = _win[scan + best_len];
      if (s.prev_length >= s.good_match) {
        chain_length >>= 2;
      }
      if (nice_match > s.lookahead) {
        nice_match = s.lookahead;
      }
      do {
        match = cur_match;
        if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) {
          continue;
        }
        scan += 2;
        match++;
        do {
        } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend);
        len = MAX_MATCH - (strend - scan);
        scan = strend - MAX_MATCH;
        if (len > best_len) {
          s.match_start = cur_match;
          best_len = len;
          if (len >= nice_match) {
            break;
          }
          scan_end1 = _win[scan + best_len - 1];
          scan_end = _win[scan + best_len];
        }
      } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);
      if (best_len <= s.lookahead) {
        return best_len;
      }
      return s.lookahead;
    };
    var fill_window = (s) => {
      const _w_size = s.w_size;
      let n, more, str;
      do {
        more = s.window_size - s.lookahead - s.strstart;
        if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
          s.window.set(s.window.subarray(_w_size, _w_size + _w_size - more), 0);
          s.match_start -= _w_size;
          s.strstart -= _w_size;
          s.block_start -= _w_size;
          if (s.insert > s.strstart) {
            s.insert = s.strstart;
          }
          slide_hash(s);
          more += _w_size;
        }
        if (s.strm.avail_in === 0) {
          break;
        }
        n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
        s.lookahead += n;
        if (!s.legacy_hash) {
          if (s.lookahead + s.insert > MIN_MATCH) {
            str = s.strstart - s.insert;
            while (s.insert) {
              INSERT_STRING(s, str);
              str++;
              s.insert--;
              if (s.lookahead + s.insert <= MIN_MATCH) {
                break;
              }
            }
          }
        } else if (s.lookahead + s.insert >= MIN_MATCH) {
          str = s.strstart - s.insert;
          s.ins_h = s.window[str];
          s.ins_h = HASH(s, s.ins_h, s.window[str + 1]);
          while (s.insert) {
            INSERT_STRING(s, str);
            str++;
            s.insert--;
            if (s.lookahead + s.insert < MIN_MATCH) {
              break;
            }
          }
        }
      } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);
    };
    var deflate_stored = (s, flush) => {
      let min_block = s.pending_buf_size - 5 > s.w_size ? s.w_size : s.pending_buf_size - 5;
      let len, left, have, last = 0;
      let used = s.strm.avail_in;
      do {
        len = 65535;
        have = s.bi_valid + 42 >> 3;
        if (s.strm.avail_out < have) {
          break;
        }
        have = s.strm.avail_out - have;
        left = s.strstart - s.block_start;
        if (len > left + s.strm.avail_in) {
          len = left + s.strm.avail_in;
        }
        if (len > have) {
          len = have;
        }
        if (len < min_block && (len === 0 && flush !== Z_FINISH || flush === Z_NO_FLUSH || len !== left + s.strm.avail_in)) {
          break;
        }
        last = flush === Z_FINISH && len === left + s.strm.avail_in ? 1 : 0;
        _tr_stored_block(s, 0, 0, last);
        s.pending_buf[s.pending - 4] = len;
        s.pending_buf[s.pending - 3] = len >> 8;
        s.pending_buf[s.pending - 2] = ~len;
        s.pending_buf[s.pending - 1] = ~len >> 8;
        flush_pending(s.strm);
        if (left) {
          if (left > len) {
            left = len;
          }
          s.strm.output.set(s.window.subarray(s.block_start, s.block_start + left), s.strm.next_out);
          s.strm.next_out += left;
          s.strm.avail_out -= left;
          s.strm.total_out += left;
          s.block_start += left;
          len -= left;
        }
        if (len) {
          read_buf(s.strm, s.strm.output, s.strm.next_out, len);
          s.strm.next_out += len;
          s.strm.avail_out -= len;
          s.strm.total_out += len;
        }
      } while (last === 0);
      used -= s.strm.avail_in;
      if (used) {
        if (used >= s.w_size) {
          s.matches = 2;
          s.window.set(s.strm.input.subarray(s.strm.next_in - s.w_size, s.strm.next_in), 0);
          s.strstart = s.w_size;
          s.insert = s.strstart;
        } else {
          if (s.window_size - s.strstart <= used) {
            s.strstart -= s.w_size;
            s.window.set(s.window.subarray(s.w_size, s.w_size + s.strstart), 0);
            if (s.matches < 2) {
              s.matches++;
            }
            if (s.insert > s.strstart) {
              s.insert = s.strstart;
            }
          }
          s.window.set(s.strm.input.subarray(s.strm.next_in - used, s.strm.next_in), s.strstart);
          s.strstart += used;
          s.insert += used > s.w_size - s.insert ? s.w_size - s.insert : used;
        }
        s.block_start = s.strstart;
      }
      if (s.high_water < s.strstart) {
        s.high_water = s.strstart;
      }
      if (last) {
        return BS_FINISH_DONE;
      }
      if (flush !== Z_NO_FLUSH && flush !== Z_FINISH && s.strm.avail_in === 0 && s.strstart === s.block_start) {
        return BS_BLOCK_DONE;
      }
      have = s.window_size - s.strstart;
      if (s.strm.avail_in > have && s.block_start >= s.w_size) {
        s.block_start -= s.w_size;
        s.strstart -= s.w_size;
        s.window.set(s.window.subarray(s.w_size, s.w_size + s.strstart), 0);
        if (s.matches < 2) {
          s.matches++;
        }
        have += s.w_size;
        if (s.insert > s.strstart) {
          s.insert = s.strstart;
        }
      }
      if (have > s.strm.avail_in) {
        have = s.strm.avail_in;
      }
      if (have) {
        read_buf(s.strm, s.window, s.strstart, have);
        s.strstart += have;
        s.insert += have > s.w_size - s.insert ? s.w_size - s.insert : have;
      }
      if (s.high_water < s.strstart) {
        s.high_water = s.strstart;
      }
      have = s.bi_valid + 42 >> 3;
      have = s.pending_buf_size - have > 65535 ? 65535 : s.pending_buf_size - have;
      min_block = have > s.w_size ? s.w_size : have;
      left = s.strstart - s.block_start;
      if (left >= min_block || (left || flush === Z_FINISH) && flush !== Z_NO_FLUSH && s.strm.avail_in === 0 && left <= have) {
        len = left > have ? have : left;
        last = flush === Z_FINISH && s.strm.avail_in === 0 && len === left ? 1 : 0;
        _tr_stored_block(s, s.block_start, len, last);
        s.block_start += len;
        flush_pending(s.strm);
      }
      return last ? BS_FINISH_STARTED : BS_NEED_MORE;
    };
    var deflate_fast = (s, flush) => {
      let hash_head;
      let bflush;
      for (; ; ) {
        if (s.lookahead < MIN_LOOKAHEAD) {
          fill_window(s);
          if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
            return BS_NEED_MORE;
          }
          if (s.lookahead === 0) {
            break;
          }
        }
        hash_head = 0;
        if (s.lookahead >= MIN_MATCH) {
          hash_head = INSERT_STRING(s, s.strstart);
        }
        if (hash_head !== 0 && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
          s.match_length = longest_match(s, hash_head);
        }
        if (s.match_length >= MIN_MATCH) {
          bflush = _tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);
          s.lookahead -= s.match_length;
          if (s.match_length <= s.max_lazy_match && s.lookahead >= MIN_MATCH) {
            s.match_length--;
            do {
              s.strstart++;
              hash_head = INSERT_STRING(s, s.strstart);
            } while (--s.match_length !== 0);
            s.strstart++;
          } else {
            s.strstart += s.match_length;
            s.match_length = 0;
            if (s.legacy_hash) {
              s.ins_h = s.window[s.strstart];
              s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + 1]);
            }
          }
        } else {
          bflush = _tr_tally(s, 0, s.window[s.strstart]);
          s.lookahead--;
          s.strstart++;
        }
        if (bflush) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
      }
      s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
      if (flush === Z_FINISH) {
        flush_block_only(s, true);
        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        return BS_FINISH_DONE;
      }
      if (s.sym_next) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
      return BS_BLOCK_DONE;
    };
    var deflate_slow = (s, flush) => {
      let hash_head;
      let bflush;
      let max_insert;
      for (; ; ) {
        if (s.lookahead < MIN_LOOKAHEAD) {
          fill_window(s);
          if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
            return BS_NEED_MORE;
          }
          if (s.lookahead === 0) {
            break;
          }
        }
        hash_head = 0;
        if (s.lookahead >= MIN_MATCH) {
          hash_head = INSERT_STRING(s, s.strstart);
        }
        s.prev_length = s.match_length;
        s.prev_match = s.match_start;
        s.match_length = MIN_MATCH - 1;
        if (hash_head !== 0 && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
          s.match_length = longest_match(s, hash_head);
          if (s.match_length <= 5 && (s.strategy === Z_FILTERED || s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096)) {
            s.match_length = MIN_MATCH - 1;
          }
        }
        if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
          max_insert = s.strstart + s.lookahead - MIN_MATCH;
          bflush = _tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
          s.lookahead -= s.prev_length - 1;
          s.prev_length -= 2;
          do {
            if (++s.strstart <= max_insert) {
              hash_head = INSERT_STRING(s, s.strstart);
            }
          } while (--s.prev_length !== 0);
          s.match_available = 0;
          s.match_length = MIN_MATCH - 1;
          s.strstart++;
          if (bflush) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
        } else if (s.match_available) {
          bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
          if (bflush) {
            flush_block_only(s, false);
          }
          s.strstart++;
          s.lookahead--;
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        } else {
          s.match_available = 1;
          s.strstart++;
          s.lookahead--;
        }
      }
      if (s.match_available) {
        bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
        s.match_available = 0;
      }
      s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
      if (flush === Z_FINISH) {
        flush_block_only(s, true);
        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        return BS_FINISH_DONE;
      }
      if (s.sym_next) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
      return BS_BLOCK_DONE;
    };
    var deflate_rle = (s, flush) => {
      let bflush;
      let prev;
      let scan, strend;
      const _win = s.window;
      for (; ; ) {
        if (s.lookahead <= MAX_MATCH) {
          fill_window(s);
          if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH) {
            return BS_NEED_MORE;
          }
          if (s.lookahead === 0) {
            break;
          }
        }
        s.match_length = 0;
        if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
          scan = s.strstart - 1;
          prev = _win[scan];
          if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
            strend = s.strstart + MAX_MATCH;
            do {
            } while (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && scan < strend);
            s.match_length = MAX_MATCH - (strend - scan);
            if (s.match_length > s.lookahead) {
              s.match_length = s.lookahead;
            }
          }
        }
        if (s.match_length >= MIN_MATCH) {
          bflush = _tr_tally(s, 1, s.match_length - MIN_MATCH);
          s.lookahead -= s.match_length;
          s.strstart += s.match_length;
          s.match_length = 0;
        } else {
          bflush = _tr_tally(s, 0, s.window[s.strstart]);
          s.lookahead--;
          s.strstart++;
        }
        if (bflush) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
      }
      s.insert = 0;
      if (flush === Z_FINISH) {
        flush_block_only(s, true);
        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        return BS_FINISH_DONE;
      }
      if (s.sym_next) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
      return BS_BLOCK_DONE;
    };
    var deflate_huff = (s, flush) => {
      let bflush;
      for (; ; ) {
        if (s.lookahead === 0) {
          fill_window(s);
          if (s.lookahead === 0) {
            if (flush === Z_NO_FLUSH) {
              return BS_NEED_MORE;
            }
            break;
          }
        }
        s.match_length = 0;
        bflush = _tr_tally(s, 0, s.window[s.strstart]);
        s.lookahead--;
        s.strstart++;
        if (bflush) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
      }
      s.insert = 0;
      if (flush === Z_FINISH) {
        flush_block_only(s, true);
        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        return BS_FINISH_DONE;
      }
      if (s.sym_next) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
      return BS_BLOCK_DONE;
    };
    function Config(good_length, max_lazy, nice_length, max_chain, func) {
      this.good_length = good_length;
      this.max_lazy = max_lazy;
      this.nice_length = nice_length;
      this.max_chain = max_chain;
      this.func = func;
    }
    var configuration_table = [
      /*      good lazy nice chain */
      new Config(0, 0, 0, 0, deflate_stored),
      /* 0 store only */
      new Config(4, 4, 8, 4, deflate_fast),
      /* 1 max speed, no lazy matches */
      new Config(4, 5, 16, 8, deflate_fast),
      /* 2 */
      new Config(4, 6, 32, 32, deflate_fast),
      /* 3 */
      new Config(4, 4, 16, 16, deflate_slow),
      /* 4 lazy matches */
      new Config(8, 16, 32, 32, deflate_slow),
      /* 5 */
      new Config(8, 16, 128, 128, deflate_slow),
      /* 6 */
      new Config(8, 32, 128, 256, deflate_slow),
      /* 7 */
      new Config(32, 128, 258, 1024, deflate_slow),
      /* 8 */
      new Config(32, 258, 258, 4096, deflate_slow)
      /* 9 max compression */
    ];
    var lm_init = (s) => {
      s.window_size = 2 * s.w_size;
      zero(s.head);
      s.max_lazy_match = configuration_table[s.level].max_lazy;
      s.good_match = configuration_table[s.level].good_length;
      s.nice_match = configuration_table[s.level].nice_length;
      s.max_chain_length = configuration_table[s.level].max_chain;
      s.strstart = 0;
      s.block_start = 0;
      s.lookahead = 0;
      s.insert = 0;
      s.match_length = s.prev_length = MIN_MATCH - 1;
      s.match_available = 0;
      s.ins_h = 0;
    };
    function DeflateState() {
      this.strm = null;
      this.status = 0;
      this.pending_buf = null;
      this.pending_buf_size = 0;
      this.pending_out = 0;
      this.pending = 0;
      this.wrap = 0;
      this.gzhead = null;
      this.gzindex = 0;
      this.method = Z_DEFLATED;
      this.last_flush = -1;
      this.w_size = 0;
      this.w_bits = 0;
      this.w_mask = 0;
      this.window = null;
      this.window_size = 0;
      this.prev = null;
      this.head = null;
      this.ins_h = 0;
      this.legacy_hash = 0;
      this.hash_size = 0;
      this.hash_bits = 0;
      this.hash_mask = 0;
      this.hash_shift = 0;
      this.block_start = 0;
      this.match_length = 0;
      this.prev_match = 0;
      this.match_available = 0;
      this.strstart = 0;
      this.match_start = 0;
      this.lookahead = 0;
      this.prev_length = 0;
      this.max_chain_length = 0;
      this.max_lazy_match = 0;
      this.level = 0;
      this.strategy = 0;
      this.good_match = 0;
      this.nice_match = 0;
      this.dyn_ltree = new Uint16Array(HEAP_SIZE * 2);
      this.dyn_dtree = new Uint16Array((2 * D_CODES + 1) * 2);
      this.bl_tree = new Uint16Array((2 * BL_CODES + 1) * 2);
      zero(this.dyn_ltree);
      zero(this.dyn_dtree);
      zero(this.bl_tree);
      this.l_desc = null;
      this.d_desc = null;
      this.bl_desc = null;
      this.bl_count = new Uint16Array(MAX_BITS + 1);
      this.heap = new Uint16Array(2 * L_CODES + 1);
      zero(this.heap);
      this.heap_len = 0;
      this.heap_max = 0;
      this.depth = new Uint16Array(2 * L_CODES + 1);
      zero(this.depth);
      this.sym_buf = 0;
      this.lit_bufsize = 0;
      this.sym_next = 0;
      this.sym_end = 0;
      this.opt_len = 0;
      this.static_len = 0;
      this.matches = 0;
      this.insert = 0;
      this.bi_buf = 0;
      this.bi_valid = 0;
    }
    var deflateStateCheck = (strm) => {
      if (!strm) {
        return 1;
      }
      const s = strm.state;
      if (!s || s.strm !== strm || s.status !== INIT_STATE && //#ifdef GZIP
      s.status !== GZIP_STATE && //#endif
      s.status !== EXTRA_STATE && s.status !== NAME_STATE && s.status !== COMMENT_STATE && s.status !== HCRC_STATE && s.status !== BUSY_STATE && s.status !== FINISH_STATE) {
        return 1;
      }
      return 0;
    };
    var deflateResetKeep = (strm) => {
      if (deflateStateCheck(strm)) {
        return err(strm, Z_STREAM_ERROR);
      }
      strm.total_in = strm.total_out = 0;
      strm.data_type = Z_UNKNOWN;
      const s = strm.state;
      s.pending = 0;
      s.pending_out = 0;
      if (s.wrap < 0) {
        s.wrap = -s.wrap;
      }
      s.status = //#ifdef GZIP
      s.wrap === 2 ? GZIP_STATE : (
        //#endif
        s.wrap ? INIT_STATE : BUSY_STATE
      );
      strm.adler = s.wrap === 2 ? 0 : 1;
      s.last_flush = -2;
      _tr_init(s);
      return Z_OK;
    };
    var deflateReset = (strm) => {
      const ret = deflateResetKeep(strm);
      if (ret === Z_OK) {
        lm_init(strm.state);
      }
      return ret;
    };
    var deflateSetHeader = (strm, head) => {
      if (deflateStateCheck(strm) || strm.state.wrap !== 2) {
        return Z_STREAM_ERROR;
      }
      strm.state.gzhead = head;
      return Z_OK;
    };
    var deflateInit2 = (strm, level, method, windowBits, memLevel, strategy, legacyHash) => {
      if (!strm) {
        return Z_STREAM_ERROR;
      }
      let wrap = 1;
      if (level === Z_DEFAULT_COMPRESSION) {
        level = 6;
      }
      if (windowBits < 0) {
        wrap = 0;
        windowBits = -windowBits;
      } else if (windowBits > 15) {
        wrap = 2;
        windowBits -= 16;
      }
      if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED || windowBits < 8 || windowBits > 15 || level < 0 || level > 9 || strategy < 0 || strategy > Z_FIXED || windowBits === 8 && wrap !== 1) {
        return err(strm, Z_STREAM_ERROR);
      }
      if (windowBits === 8) {
        windowBits = 9;
      }
      const s = new DeflateState();
      strm.state = s;
      s.strm = strm;
      s.status = INIT_STATE;
      s.wrap = wrap;
      s.gzhead = null;
      s.w_bits = windowBits;
      s.w_size = 1 << s.w_bits;
      s.w_mask = s.w_size - 1;
      s.legacy_hash = legacyHash ? 1 : 0;
      s.hash_bits = memLevel + 7;
      if (!s.legacy_hash && s.hash_bits < 15) {
        s.hash_bits = 15;
      }
      s.hash_size = 1 << s.hash_bits;
      s.hash_mask = s.hash_size - 1;
      s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);
      s.window = new Uint8Array(s.w_size * 2);
      s.head = new Uint16Array(s.hash_size);
      s.prev = new Uint16Array(s.w_size);
      s.lit_bufsize = 1 << memLevel + 6;
      s.pending_buf_size = s.lit_bufsize * 4;
      s.pending_buf = new Uint8Array(s.pending_buf_size);
      s.sym_buf = s.lit_bufsize;
      s.sym_end = (s.lit_bufsize - 1) * 3;
      s.level = level;
      s.strategy = strategy;
      s.method = method;
      return deflateReset(strm);
    };
    var deflateInit = (strm, level) => {
      return deflateInit2(strm, level, Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY);
    };
    var deflate = (strm, flush) => {
      if (deflateStateCheck(strm) || flush > Z_BLOCK || flush < 0) {
        return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
      }
      const s = strm.state;
      if (!strm.output || strm.avail_in !== 0 && !strm.input || s.status === FINISH_STATE && flush !== Z_FINISH) {
        return err(strm, strm.avail_out === 0 ? Z_BUF_ERROR : Z_STREAM_ERROR);
      }
      const old_flush = s.last_flush;
      s.last_flush = flush;
      if (s.pending !== 0) {
        flush_pending(strm);
        if (strm.avail_out === 0) {
          s.last_flush = -1;
          return Z_OK;
        }
      } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) && flush !== Z_FINISH) {
        return err(strm, Z_BUF_ERROR);
      }
      if (s.status === FINISH_STATE && strm.avail_in !== 0) {
        return err(strm, Z_BUF_ERROR);
      }
      if (s.status === INIT_STATE && s.wrap === 0) {
        s.status = BUSY_STATE;
      }
      if (s.status === INIT_STATE) {
        let header = Z_DEFLATED + (s.w_bits - 8 << 4) << 8;
        let level_flags = -1;
        if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
          level_flags = 0;
        } else if (s.level < 6) {
          level_flags = 1;
        } else if (s.level === 6) {
          level_flags = 2;
        } else {
          level_flags = 3;
        }
        header |= level_flags << 6;
        if (s.strstart !== 0) {
          header |= PRESET_DICT;
        }
        header += 31 - header % 31;
        putShortMSB(s, header);
        if (s.strstart !== 0) {
          putShortMSB(s, strm.adler >>> 16);
          putShortMSB(s, strm.adler & 65535);
        }
        strm.adler = 1;
        s.status = BUSY_STATE;
        flush_pending(strm);
        if (s.pending !== 0) {
          s.last_flush = -1;
          return Z_OK;
        }
      }
      if (s.status === GZIP_STATE) {
        strm.adler = 0;
        put_byte(s, 31);
        put_byte(s, 139);
        put_byte(s, 8);
        if (!s.gzhead) {
          put_byte(s, 0);
          put_byte(s, 0);
          put_byte(s, 0);
          put_byte(s, 0);
          put_byte(s, 0);
          put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
          put_byte(s, OS_CODE);
          s.status = BUSY_STATE;
          flush_pending(strm);
          if (s.pending !== 0) {
            s.last_flush = -1;
            return Z_OK;
          }
        } else {
          put_byte(
            s,
            (s.gzhead.text ? 1 : 0) + (s.gzhead.hcrc ? 2 : 0) + (!s.gzhead.extra ? 0 : 4) + (!s.gzhead.name ? 0 : 8) + (!s.gzhead.comment ? 0 : 16)
          );
          put_byte(s, s.gzhead.time & 255);
          put_byte(s, s.gzhead.time >> 8 & 255);
          put_byte(s, s.gzhead.time >> 16 & 255);
          put_byte(s, s.gzhead.time >> 24 & 255);
          put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
          put_byte(s, s.gzhead.os & 255);
          if (s.gzhead.extra && s.gzhead.extra.length) {
            put_byte(s, s.gzhead.extra.length & 255);
            put_byte(s, s.gzhead.extra.length >> 8 & 255);
          }
          if (s.gzhead.hcrc) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending, 0);
          }
          s.gzindex = 0;
          s.status = EXTRA_STATE;
        }
      }
      if (s.status === EXTRA_STATE) {
        if (s.gzhead.extra) {
          let beg = s.pending;
          let left = (s.gzhead.extra.length & 65535) - s.gzindex;
          while (s.pending + left > s.pending_buf_size) {
            let copy = s.pending_buf_size - s.pending;
            s.pending_buf.set(s.gzhead.extra.subarray(s.gzindex, s.gzindex + copy), s.pending);
            s.pending = s.pending_buf_size;
            if (s.gzhead.hcrc && s.pending > beg) {
              strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
            }
            s.gzindex += copy;
            flush_pending(strm);
            if (s.pending !== 0) {
              s.last_flush = -1;
              return Z_OK;
            }
            beg = 0;
            left -= copy;
          }
          let gzhead_extra = new Uint8Array(s.gzhead.extra);
          s.pending_buf.set(gzhead_extra.subarray(s.gzindex, s.gzindex + left), s.pending);
          s.pending += left;
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          s.gzindex = 0;
        }
        s.status = NAME_STATE;
      }
      if (s.status === NAME_STATE) {
        if (s.gzhead.name) {
          let beg = s.pending;
          let val;
          do {
            if (s.pending === s.pending_buf_size) {
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
              }
              flush_pending(strm);
              if (s.pending !== 0) {
                s.last_flush = -1;
                return Z_OK;
              }
              beg = 0;
            }
            if (s.gzindex < s.gzhead.name.length) {
              val = s.gzhead.name.charCodeAt(s.gzindex++) & 255;
            } else {
              val = 0;
            }
            put_byte(s, val);
          } while (val !== 0);
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          s.gzindex = 0;
        }
        s.status = COMMENT_STATE;
      }
      if (s.status === COMMENT_STATE) {
        if (s.gzhead.comment) {
          let beg = s.pending;
          let val;
          do {
            if (s.pending === s.pending_buf_size) {
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
              }
              flush_pending(strm);
              if (s.pending !== 0) {
                s.last_flush = -1;
                return Z_OK;
              }
              beg = 0;
            }
            if (s.gzindex < s.gzhead.comment.length) {
              val = s.gzhead.comment.charCodeAt(s.gzindex++) & 255;
            } else {
              val = 0;
            }
            put_byte(s, val);
          } while (val !== 0);
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
        }
        s.status = HCRC_STATE;
      }
      if (s.status === HCRC_STATE) {
        if (s.gzhead.hcrc) {
          if (s.pending + 2 > s.pending_buf_size) {
            flush_pending(strm);
            if (s.pending !== 0) {
              s.last_flush = -1;
              return Z_OK;
            }
          }
          put_byte(s, strm.adler & 255);
          put_byte(s, strm.adler >> 8 & 255);
          strm.adler = 0;
        }
        s.status = BUSY_STATE;
        flush_pending(strm);
        if (s.pending !== 0) {
          s.last_flush = -1;
          return Z_OK;
        }
      }
      if (strm.avail_in !== 0 || s.lookahead !== 0 || flush !== Z_NO_FLUSH && s.status !== FINISH_STATE) {
        let bstate = s.level === 0 ? deflate_stored(s, flush) : s.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s, flush) : s.strategy === Z_RLE ? deflate_rle(s, flush) : configuration_table[s.level].func(s, flush);
        if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
          s.status = FINISH_STATE;
        }
        if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
          if (strm.avail_out === 0) {
            s.last_flush = -1;
          }
          return Z_OK;
        }
        if (bstate === BS_BLOCK_DONE) {
          if (flush === Z_PARTIAL_FLUSH) {
            _tr_align(s);
          } else if (flush !== Z_BLOCK) {
            _tr_stored_block(s, 0, 0, false);
            if (flush === Z_FULL_FLUSH) {
              zero(s.head);
              if (s.lookahead === 0) {
                s.strstart = 0;
                s.block_start = 0;
                s.insert = 0;
              }
            }
          }
          flush_pending(strm);
          if (strm.avail_out === 0) {
            s.last_flush = -1;
            return Z_OK;
          }
        }
      }
      if (flush !== Z_FINISH) {
        return Z_OK;
      }
      if (s.wrap <= 0) {
        return Z_STREAM_END;
      }
      if (s.wrap === 2) {
        put_byte(s, strm.adler & 255);
        put_byte(s, strm.adler >> 8 & 255);
        put_byte(s, strm.adler >> 16 & 255);
        put_byte(s, strm.adler >> 24 & 255);
        put_byte(s, strm.total_in & 255);
        put_byte(s, strm.total_in >> 8 & 255);
        put_byte(s, strm.total_in >> 16 & 255);
        put_byte(s, strm.total_in >> 24 & 255);
      } else {
        putShortMSB(s, strm.adler >>> 16);
        putShortMSB(s, strm.adler & 65535);
      }
      flush_pending(strm);
      if (s.wrap > 0) {
        s.wrap = -s.wrap;
      }
      return s.pending !== 0 ? Z_OK : Z_STREAM_END;
    };
    var deflateEnd = (strm) => {
      if (deflateStateCheck(strm)) {
        return Z_STREAM_ERROR;
      }
      const status = strm.state.status;
      strm.state = null;
      return status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK;
    };
    var deflateSetDictionary = (strm, dictionary) => {
      let dictLength = dictionary.length;
      if (deflateStateCheck(strm)) {
        return Z_STREAM_ERROR;
      }
      const s = strm.state;
      const wrap = s.wrap;
      if (wrap === 2 || wrap === 1 && s.status !== INIT_STATE || s.lookahead) {
        return Z_STREAM_ERROR;
      }
      if (wrap === 1) {
        strm.adler = adler32(strm.adler, dictionary, dictLength, 0);
      }
      s.wrap = 0;
      if (dictLength >= s.w_size) {
        if (wrap === 0) {
          zero(s.head);
          s.strstart = 0;
          s.block_start = 0;
          s.insert = 0;
        }
        let tmpDict = new Uint8Array(s.w_size);
        tmpDict.set(dictionary.subarray(dictLength - s.w_size, dictLength), 0);
        dictionary = tmpDict;
        dictLength = s.w_size;
      }
      const avail = strm.avail_in;
      const next = strm.next_in;
      const input = strm.input;
      strm.avail_in = dictLength;
      strm.next_in = 0;
      strm.input = dictionary;
      fill_window(s);
      while (s.lookahead >= MIN_MATCH) {
        let str = s.strstart;
        let n = s.lookahead - (MIN_MATCH - 1);
        do {
          INSERT_STRING(s, str);
          str++;
        } while (--n);
        s.strstart = str;
        s.lookahead = MIN_MATCH - 1;
        fill_window(s);
      }
      s.strstart += s.lookahead;
      s.block_start = s.strstart;
      s.insert = s.lookahead;
      s.lookahead = 0;
      s.match_length = s.prev_length = MIN_MATCH - 1;
      s.match_available = 0;
      strm.next_in = next;
      strm.input = input;
      strm.avail_in = avail;
      s.wrap = wrap;
      return Z_OK;
    };
    module.exports.deflateInit = deflateInit;
    module.exports.deflateInit2 = deflateInit2;
    module.exports.deflateReset = deflateReset;
    module.exports.deflateResetKeep = deflateResetKeep;
    module.exports.deflateSetHeader = deflateSetHeader;
    module.exports.deflate = deflate;
    module.exports.deflateEnd = deflateEnd;
    module.exports.deflateSetDictionary = deflateSetDictionary;
    module.exports.deflateInfo = "pako deflate (from Nodeca project)";
  }
});

// node_modules/pizzip/node_modules/pako/lib/utils/common.js
var require_common = __commonJS({
  "node_modules/pizzip/node_modules/pako/lib/utils/common.js"(exports, module) {
    "use strict";
    var _has = (obj, key) => {
      return Object.prototype.hasOwnProperty.call(obj, key);
    };
    module.exports.assign = function(obj) {
      const sources = Array.prototype.slice.call(arguments, 1);
      while (sources.length) {
        const source = sources.shift();
        if (!source) {
          continue;
        }
        if (typeof source !== "object") {
          throw new TypeError(source + "must be non-object");
        }
        for (const p in source) {
          if (_has(source, p)) {
            obj[p] = source[p];
          }
        }
      }
      return obj;
    };
    module.exports.flattenChunks = (chunks) => {
      let len = 0;
      for (let i = 0, l = chunks.length; i < l; i++) {
        len += chunks[i].length;
      }
      const result = new Uint8Array(len);
      for (let i = 0, pos = 0, l = chunks.length; i < l; i++) {
        let chunk = chunks[i];
        result.set(chunk, pos);
        pos += chunk.length;
      }
      return result;
    };
  }
});

// node_modules/pizzip/node_modules/pako/lib/utils/strings.js
var require_strings = __commonJS({
  "node_modules/pizzip/node_modules/pako/lib/utils/strings.js"(exports, module) {
    "use strict";
    var STR_APPLY_UIA_OK = true;
    try {
      String.fromCharCode.apply(null, new Uint8Array(1));
    } catch (__) {
      STR_APPLY_UIA_OK = false;
    }
    var _utf8len = new Uint8Array(256);
    for (let q = 0; q < 256; q++) {
      _utf8len[q] = q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1;
    }
    _utf8len[254] = _utf8len[255] = 1;
    module.exports.string2buf = (str) => {
      if (typeof TextEncoder === "function" && TextEncoder.prototype.encode) {
        return new TextEncoder().encode(str);
      }
      let buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
      for (m_pos = 0; m_pos < str_len; m_pos++) {
        c = str.charCodeAt(m_pos);
        if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
          c2 = str.charCodeAt(m_pos + 1);
          if ((c2 & 64512) === 56320) {
            c = 65536 + (c - 55296 << 10) + (c2 - 56320);
            m_pos++;
          }
        }
        buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
      }
      buf = new Uint8Array(buf_len);
      for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
        c = str.charCodeAt(m_pos);
        if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
          c2 = str.charCodeAt(m_pos + 1);
          if ((c2 & 64512) === 56320) {
            c = 65536 + (c - 55296 << 10) + (c2 - 56320);
            m_pos++;
          }
        }
        if (c < 128) {
          buf[i++] = c;
        } else if (c < 2048) {
          buf[i++] = 192 | c >>> 6;
          buf[i++] = 128 | c & 63;
        } else if (c < 65536) {
          buf[i++] = 224 | c >>> 12;
          buf[i++] = 128 | c >>> 6 & 63;
          buf[i++] = 128 | c & 63;
        } else {
          buf[i++] = 240 | c >>> 18;
          buf[i++] = 128 | c >>> 12 & 63;
          buf[i++] = 128 | c >>> 6 & 63;
          buf[i++] = 128 | c & 63;
        }
      }
      return buf;
    };
    var buf2binstring = (buf, len) => {
      if (len < 65534) {
        if (buf.subarray && STR_APPLY_UIA_OK) {
          return String.fromCharCode.apply(null, buf.length === len ? buf : buf.subarray(0, len));
        }
      }
      let result = "";
      for (let i = 0; i < len; i++) {
        result += String.fromCharCode(buf[i]);
      }
      return result;
    };
    module.exports.buf2string = (buf, max) => {
      const len = max || buf.length;
      if (typeof TextDecoder === "function" && TextDecoder.prototype.decode) {
        return new TextDecoder().decode(buf.subarray(0, max));
      }
      let i, out;
      const utf16buf = new Array(len * 2);
      for (out = 0, i = 0; i < len; ) {
        let c = buf[i++];
        if (c < 128) {
          utf16buf[out++] = c;
          continue;
        }
        let c_len = _utf8len[c];
        if (c_len > 4) {
          utf16buf[out++] = 65533;
          i += c_len - 1;
          continue;
        }
        c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
        while (c_len > 1 && i < len) {
          c = c << 6 | buf[i++] & 63;
          c_len--;
        }
        if (c_len > 1) {
          utf16buf[out++] = 65533;
          continue;
        }
        if (c < 65536) {
          utf16buf[out++] = c;
        } else {
          c -= 65536;
          utf16buf[out++] = 55296 | c >> 10 & 1023;
          utf16buf[out++] = 56320 | c & 1023;
        }
      }
      return buf2binstring(utf16buf, out);
    };
    module.exports.utf8border = (buf, max) => {
      max = max || buf.length;
      if (max > buf.length) {
        max = buf.length;
      }
      let pos = max - 1;
      while (pos >= 0 && (buf[pos] & 192) === 128) {
        pos--;
      }
      if (pos < 0) {
        return max;
      }
      if (pos === 0) {
        return max;
      }
      return pos + _utf8len[buf[pos]] > max ? pos : max;
    };
  }
});

// node_modules/pizzip/node_modules/pako/lib/zlib/zstream.js
var require_zstream = __commonJS({
  "node_modules/pizzip/node_modules/pako/lib/zlib/zstream.js"(exports, module) {
    "use strict";
    function ZStream() {
      this.input = null;
      this.next_in = 0;
      this.avail_in = 0;
      this.total_in = 0;
      this.output = null;
      this.next_out = 0;
      this.avail_out = 0;
      this.total_out = 0;
      this.msg = "";
      this.state = null;
      this.data_type = 2;
      this.adler = 0;
    }
    module.exports = ZStream;
  }
});

// node_modules/pizzip/node_modules/pako/lib/deflate.js
var require_deflate2 = __commonJS({
  "node_modules/pizzip/node_modules/pako/lib/deflate.js"(exports, module) {
    "use strict";
    var zlib_deflate = require_deflate();
    var utils = require_common();
    var strings = require_strings();
    var msg = require_messages();
    var ZStream = require_zstream();
    var toString = Object.prototype.toString;
    var {
      Z_NO_FLUSH,
      Z_SYNC_FLUSH,
      Z_FULL_FLUSH,
      Z_FINISH,
      Z_OK,
      Z_STREAM_END,
      Z_DEFAULT_COMPRESSION,
      Z_DEFAULT_STRATEGY,
      Z_DEFLATED
    } = require_constants();
    var defaultOptions = {
      level: Z_DEFAULT_COMPRESSION,
      method: Z_DEFLATED,
      chunkSize: 16384,
      windowBits: 15,
      memLevel: 8,
      strategy: Z_DEFAULT_STRATEGY,
      legacyHash: true
    };
    function Deflate(options) {
      this.options = utils.assign({}, defaultOptions, options || {});
      let opt = this.options;
      if (opt.raw && opt.windowBits > 0) {
        opt.windowBits = -opt.windowBits;
      } else if (opt.gzip && opt.windowBits > 0 && opt.windowBits < 16) {
        opt.windowBits += 16;
      }
      this.err = 0;
      this.msg = "";
      this.ended = false;
      this.chunks = [];
      this.strm = new ZStream();
      this.strm.avail_out = 0;
      let status = zlib_deflate.deflateInit2(
        this.strm,
        opt.level,
        opt.method,
        opt.windowBits,
        opt.memLevel,
        opt.strategy,
        opt.legacyHash
      );
      if (status !== Z_OK) {
        throw new Error(msg[status]);
      }
      if (opt.header) {
        zlib_deflate.deflateSetHeader(this.strm, opt.header);
      }
      if (opt.dictionary) {
        let dict;
        if (typeof opt.dictionary === "string") {
          dict = strings.string2buf(opt.dictionary);
        } else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") {
          dict = new Uint8Array(opt.dictionary);
        } else {
          dict = opt.dictionary;
        }
        status = zlib_deflate.deflateSetDictionary(this.strm, dict);
        if (status !== Z_OK) {
          throw new Error(msg[status]);
        }
        this._dict_set = true;
      }
    }
    Deflate.prototype.push = function(data, flush_mode) {
      const strm = this.strm;
      const chunkSize = this.options.chunkSize;
      let status, _flush_mode;
      if (this.ended) {
        return false;
      }
      if (flush_mode === ~~flush_mode) _flush_mode = flush_mode;
      else _flush_mode = flush_mode === true ? Z_FINISH : Z_NO_FLUSH;
      if (typeof data === "string") {
        strm.input = strings.string2buf(data);
      } else if (toString.call(data) === "[object ArrayBuffer]") {
        strm.input = new Uint8Array(data);
      } else {
        strm.input = data;
      }
      strm.next_in = 0;
      strm.avail_in = strm.input.length;
      for (; ; ) {
        if (strm.avail_out === 0) {
          strm.output = new Uint8Array(chunkSize);
          strm.next_out = 0;
          strm.avail_out = chunkSize;
        }
        if ((_flush_mode === Z_SYNC_FLUSH || _flush_mode === Z_FULL_FLUSH) && strm.avail_out <= 6) {
          this.onData(strm.output.subarray(0, strm.next_out));
          strm.avail_out = 0;
          continue;
        }
        status = zlib_deflate.deflate(strm, _flush_mode);
        if (status === Z_STREAM_END) {
          if (strm.next_out > 0) {
            this.onData(strm.output.subarray(0, strm.next_out));
          }
          status = zlib_deflate.deflateEnd(this.strm);
          this.onEnd(status);
          this.ended = true;
          return status === Z_OK;
        }
        if (strm.avail_out === 0) {
          this.onData(strm.output);
          continue;
        }
        if (_flush_mode > 0 && strm.next_out > 0) {
          this.onData(strm.output.subarray(0, strm.next_out));
          strm.avail_out = 0;
          continue;
        }
        if (strm.avail_in === 0) break;
      }
      return true;
    };
    Deflate.prototype.onData = function(chunk) {
      this.chunks.push(chunk);
    };
    Deflate.prototype.onEnd = function(status) {
      if (status === Z_OK) {
        this.result = utils.flattenChunks(this.chunks);
      }
      this.chunks = [];
      this.err = status;
      this.msg = this.strm.msg;
    };
    function deflate(input, options) {
      const deflator = new Deflate(options);
      deflator.push(input, true);
      if (deflator.err) {
        throw deflator.msg || msg[deflator.err];
      }
      return deflator.result;
    }
    function deflateRaw(input, options) {
      options = options || {};
      options.raw = true;
      return deflate(input, options);
    }
    function gzip(input, options) {
      options = options || {};
      options.gzip = true;
      return deflate(input, options);
    }
    module.exports.Deflate = Deflate;
    module.exports.deflate = deflate;
    module.exports.deflateRaw = deflateRaw;
    module.exports.gzip = gzip;
    module.exports.constants = require_constants();
  }
});

// node_modules/pizzip/node_modules/pako/lib/zlib/inffast.js
var require_inffast = __commonJS({
  "node_modules/pizzip/node_modules/pako/lib/zlib/inffast.js"(exports, module) {
    "use strict";
    var BAD = 16209;
    var TYPE = 16191;
    module.exports = function inflate_fast(strm, start) {
      let _in;
      let last;
      let _out;
      let beg;
      let end;
      let dmax;
      let wsize;
      let whave;
      let wnext;
      let s_window;
      let hold;
      let bits;
      let lcode;
      let dcode;
      let lmask;
      let dmask;
      let here;
      let op;
      let len;
      let dist;
      let from;
      let from_source;
      let input, output;
      const state = strm.state;
      _in = strm.next_in;
      input = strm.input;
      last = _in + (strm.avail_in - 5);
      _out = strm.next_out;
      output = strm.output;
      beg = _out - (start - strm.avail_out);
      end = _out + (strm.avail_out - 257);
      dmax = state.dmax;
      wsize = state.wsize;
      whave = state.whave;
      wnext = state.wnext;
      s_window = state.window;
      hold = state.hold;
      bits = state.bits;
      lcode = state.lencode;
      dcode = state.distcode;
      lmask = (1 << state.lenbits) - 1;
      dmask = (1 << state.distbits) - 1;
      top:
        do {
          if (bits < 15) {
            hold += input[_in++] << bits;
            bits += 8;
            hold += input[_in++] << bits;
            bits += 8;
          }
          here = lcode[hold & lmask];
          dolen:
            for (; ; ) {
              op = here >>> 24;
              hold >>>= op;
              bits -= op;
              op = here >>> 16 & 255;
              if (op === 0) {
                output[_out++] = here & 65535;
              } else if (op & 16) {
                len = here & 65535;
                op &= 15;
                if (op) {
                  if (bits < op) {
                    hold += input[_in++] << bits;
                    bits += 8;
                  }
                  len += hold & (1 << op) - 1;
                  hold >>>= op;
                  bits -= op;
                }
                if (bits < 15) {
                  hold += input[_in++] << bits;
                  bits += 8;
                  hold += input[_in++] << bits;
                  bits += 8;
                }
                here = dcode[hold & dmask];
                dodist:
                  for (; ; ) {
                    op = here >>> 24;
                    hold >>>= op;
                    bits -= op;
                    op = here >>> 16 & 255;
                    if (op & 16) {
                      dist = here & 65535;
                      op &= 15;
                      if (bits < op) {
                        hold += input[_in++] << bits;
                        bits += 8;
                        if (bits < op) {
                          hold += input[_in++] << bits;
                          bits += 8;
                        }
                      }
                      dist += hold & (1 << op) - 1;
                      if (dist > dmax) {
                        strm.msg = "invalid distance too far back";
                        state.mode = BAD;
                        break top;
                      }
                      hold >>>= op;
                      bits -= op;
                      op = _out - beg;
                      if (dist > op) {
                        op = dist - op;
                        if (op > whave) {
                          if (state.sane) {
                            strm.msg = "invalid distance too far back";
                            state.mode = BAD;
                            break top;
                          }
                        }
                        from = 0;
                        from_source = s_window;
                        if (wnext === 0) {
                          from += wsize - op;
                          if (op < len) {
                            len -= op;
                            do {
                              output[_out++] = s_window[from++];
                            } while (--op);
                            from = _out - dist;
                            from_source = output;
                          }
                        } else if (wnext < op) {
                          from += wsize + wnext - op;
                          op -= wnext;
                          if (op < len) {
                            len -= op;
                            do {
                              output[_out++] = s_window[from++];
                            } while (--op);
                            from = 0;
                            if (wnext < len) {
                              op = wnext;
                              len -= op;
                              do {
                                output[_out++] = s_window[from++];
                              } while (--op);
                              from = _out - dist;
                              from_source = output;
                            }
                          }
                        } else {
                          from += wnext - op;
                          if (op < len) {
                            len -= op;
                            do {
                              output[_out++] = s_window[from++];
                            } while (--op);
                            from = _out - dist;
                            from_source = output;
                          }
                        }
                        while (len > 2) {
                          output[_out++] = from_source[from++];
                          output[_out++] = from_source[from++];
                          output[_out++] = from_source[from++];
                          len -= 3;
                        }
                        if (len) {
                          output[_out++] = from_source[from++];
                          if (len > 1) {
                            output[_out++] = from_source[from++];
                          }
                        }
                      } else {
                        from = _out - dist;
                        do {
                          output[_out++] = output[from++];
                          output[_out++] = output[from++];
                          output[_out++] = output[from++];
                          len -= 3;
                        } while (len > 2);
                        if (len) {
                          output[_out++] = output[from++];
                          if (len > 1) {
                            output[_out++] = output[from++];
                          }
                        }
                      }
                    } else if ((op & 64) === 0) {
                      here = dcode[(here & 65535) + (hold & (1 << op) - 1)];
                      continue dodist;
                    } else {
                      strm.msg = "invalid distance code";
                      state.mode = BAD;
                      break top;
                    }
                    break;
                  }
              } else if ((op & 64) === 0) {
                here = lcode[(here & 65535) + (hold & (1 << op) - 1)];
                continue dolen;
              } else if (op & 32) {
                state.mode = TYPE;
                break top;
              } else {
                strm.msg = "invalid literal/length code";
                state.mode = BAD;
                break top;
              }
              break;
            }
        } while (_in < last && _out < end);
      len = bits >> 3;
      _in -= len;
      bits -= len << 3;
      hold &= (1 << bits) - 1;
      strm.next_in = _in;
      strm.next_out = _out;
      strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
      strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
      state.hold = hold;
      state.bits = bits;
      return;
    };
  }
});

// node_modules/pizzip/node_modules/pako/lib/zlib/inftrees.js
var require_inftrees = __commonJS({
  "node_modules/pizzip/node_modules/pako/lib/zlib/inftrees.js"(exports, module) {
    "use strict";
    var MAXBITS = 15;
    var ENOUGH_LENS = 852;
    var ENOUGH_DISTS = 592;
    var CODES = 0;
    var LENS = 1;
    var DISTS = 2;
    var lbase = new Uint16Array([
      /* Length codes 257..285 base */
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      13,
      15,
      17,
      19,
      23,
      27,
      31,
      35,
      43,
      51,
      59,
      67,
      83,
      99,
      115,
      131,
      163,
      195,
      227,
      258,
      0,
      0
    ]);
    var lext = new Uint8Array([
      /* Length codes 257..285 extra */
      16,
      16,
      16,
      16,
      16,
      16,
      16,
      16,
      17,
      17,
      17,
      17,
      18,
      18,
      18,
      18,
      19,
      19,
      19,
      19,
      20,
      20,
      20,
      20,
      21,
      21,
      21,
      21,
      16,
      199,
      75
    ]);
    var dbase = new Uint16Array([
      /* Distance codes 0..29 base */
      1,
      2,
      3,
      4,
      5,
      7,
      9,
      13,
      17,
      25,
      33,
      49,
      65,
      97,
      129,
      193,
      257,
      385,
      513,
      769,
      1025,
      1537,
      2049,
      3073,
      4097,
      6145,
      8193,
      12289,
      16385,
      24577,
      0,
      0
    ]);
    var dext = new Uint8Array([
      /* Distance codes 0..29 extra */
      16,
      16,
      16,
      16,
      17,
      17,
      18,
      18,
      19,
      19,
      20,
      20,
      21,
      21,
      22,
      22,
      23,
      23,
      24,
      24,
      25,
      25,
      26,
      26,
      27,
      27,
      28,
      28,
      29,
      29,
      64,
      64
    ]);
    var inflate_table = (type, lens, lens_index, codes, table, table_index, work, opts) => {
      const bits = opts.bits;
      let len = 0;
      let sym = 0;
      let min = 0, max = 0;
      let root = 0;
      let curr = 0;
      let drop = 0;
      let left = 0;
      let used = 0;
      let huff = 0;
      let incr;
      let fill;
      let low;
      let mask;
      let next;
      let base = null;
      let match;
      const count = new Uint16Array(MAXBITS + 1);
      const offs = new Uint16Array(MAXBITS + 1);
      let extra = null;
      let here_bits, here_op, here_val;
      for (len = 0; len <= MAXBITS; len++) {
        count[len] = 0;
      }
      for (sym = 0; sym < codes; sym++) {
        count[lens[lens_index + sym]]++;
      }
      root = bits;
      for (max = MAXBITS; max >= 1; max--) {
        if (count[max] !== 0) {
          break;
        }
      }
      if (root > max) {
        root = max;
      }
      if (max === 0) {
        table[table_index++] = 1 << 24 | 64 << 16 | 0;
        table[table_index++] = 1 << 24 | 64 << 16 | 0;
        opts.bits = 1;
        return 0;
      }
      for (min = 1; min < max; min++) {
        if (count[min] !== 0) {
          break;
        }
      }
      if (root < min) {
        root = min;
      }
      left = 1;
      for (len = 1; len <= MAXBITS; len++) {
        left <<= 1;
        left -= count[len];
        if (left < 0) {
          return -1;
        }
      }
      if (left > 0 && (type === CODES || max !== 1)) {
        return -1;
      }
      offs[1] = 0;
      for (len = 1; len < MAXBITS; len++) {
        offs[len + 1] = offs[len] + count[len];
      }
      for (sym = 0; sym < codes; sym++) {
        if (lens[lens_index + sym] !== 0) {
          work[offs[lens[lens_index + sym]]++] = sym;
        }
      }
      if (type === CODES) {
        base = extra = work;
        match = 20;
      } else if (type === LENS) {
        base = lbase;
        extra = lext;
        match = 257;
      } else {
        base = dbase;
        extra = dext;
        match = 0;
      }
      huff = 0;
      sym = 0;
      len = min;
      next = table_index;
      curr = root;
      drop = 0;
      low = -1;
      used = 1 << root;
      mask = used - 1;
      if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) {
        return 1;
      }
      for (; ; ) {
        here_bits = len - drop;
        if (work[sym] + 1 < match) {
          here_op = 0;
          here_val = work[sym];
        } else if (work[sym] >= match) {
          here_op = extra[work[sym] - match];
          here_val = base[work[sym] - match];
        } else {
          here_op = 32 + 64;
          here_val = 0;
        }
        incr = 1 << len - drop;
        fill = 1 << curr;
        min = fill;
        do {
          fill -= incr;
          table[next + (huff >> drop) + fill] = here_bits << 24 | here_op << 16 | here_val | 0;
        } while (fill !== 0);
        incr = 1 << len - 1;
        while (huff & incr) {
          incr >>= 1;
        }
        if (incr !== 0) {
          huff &= incr - 1;
          huff += incr;
        } else {
          huff = 0;
        }
        sym++;
        if (--count[len] === 0) {
          if (len === max) {
            break;
          }
          len = lens[lens_index + work[sym]];
        }
        if (len > root && (huff & mask) !== low) {
          if (drop === 0) {
            drop = root;
          }
          next += min;
          curr = len - drop;
          left = 1 << curr;
          while (curr + drop < max) {
            left -= count[curr + drop];
            if (left <= 0) {
              break;
            }
            curr++;
            left <<= 1;
          }
          used += 1 << curr;
          if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) {
            return 1;
          }
          low = huff & mask;
          table[low] = root << 24 | curr << 16 | next - table_index | 0;
        }
      }
      if (huff !== 0) {
        table[next + huff] = len - drop << 24 | 64 << 16 | 0;
      }
      opts.bits = root;
      return 0;
    };
    module.exports = inflate_table;
  }
});

// node_modules/pizzip/node_modules/pako/lib/zlib/inflate.js
var require_inflate = __commonJS({
  "node_modules/pizzip/node_modules/pako/lib/zlib/inflate.js"(exports, module) {
    "use strict";
    var adler32 = require_adler32();
    var crc32 = require_crc322();
    var inflate_fast = require_inffast();
    var inflate_table = require_inftrees();
    var CODES = 0;
    var LENS = 1;
    var DISTS = 2;
    var {
      Z_FINISH,
      Z_BLOCK,
      Z_TREES,
      Z_OK,
      Z_STREAM_END,
      Z_NEED_DICT,
      Z_STREAM_ERROR,
      Z_DATA_ERROR,
      Z_MEM_ERROR,
      Z_BUF_ERROR,
      Z_DEFLATED
    } = require_constants();
    var HEAD = 16180;
    var FLAGS = 16181;
    var TIME = 16182;
    var OS = 16183;
    var EXLEN = 16184;
    var EXTRA = 16185;
    var NAME = 16186;
    var COMMENT = 16187;
    var HCRC = 16188;
    var DICTID = 16189;
    var DICT = 16190;
    var TYPE = 16191;
    var TYPEDO = 16192;
    var STORED = 16193;
    var COPY_ = 16194;
    var COPY = 16195;
    var TABLE = 16196;
    var LENLENS = 16197;
    var CODELENS = 16198;
    var LEN_ = 16199;
    var LEN = 16200;
    var LENEXT = 16201;
    var DIST = 16202;
    var DISTEXT = 16203;
    var MATCH = 16204;
    var LIT = 16205;
    var CHECK = 16206;
    var LENGTH = 16207;
    var DONE = 16208;
    var BAD = 16209;
    var MEM = 16210;
    var SYNC = 16211;
    var ENOUGH_LENS = 852;
    var ENOUGH_DISTS = 592;
    var MAX_WBITS = 15;
    var DEF_WBITS = MAX_WBITS;
    var zswap32 = (q) => {
      return (q >>> 24 & 255) + (q >>> 8 & 65280) + ((q & 65280) << 8) + ((q & 255) << 24);
    };
    function InflateState() {
      this.strm = null;
      this.mode = 0;
      this.last = false;
      this.wrap = 0;
      this.havedict = false;
      this.flags = 0;
      this.dmax = 0;
      this.check = 0;
      this.total = 0;
      this.head = null;
      this.wbits = 0;
      this.wsize = 0;
      this.whave = 0;
      this.wnext = 0;
      this.window = null;
      this.hold = 0;
      this.bits = 0;
      this.length = 0;
      this.offset = 0;
      this.extra = 0;
      this.lencode = null;
      this.distcode = null;
      this.lenbits = 0;
      this.distbits = 0;
      this.ncode = 0;
      this.nlen = 0;
      this.ndist = 0;
      this.have = 0;
      this.next = null;
      this.lens = new Uint16Array(320);
      this.work = new Uint16Array(288);
      this.lendyn = null;
      this.distdyn = null;
      this.sane = 0;
      this.back = 0;
      this.was = 0;
    }
    var inflateStateCheck = (strm) => {
      if (!strm) {
        return 1;
      }
      const state = strm.state;
      if (!state || state.strm !== strm || state.mode < HEAD || state.mode > SYNC) {
        return 1;
      }
      return 0;
    };
    var inflateResetKeep = (strm) => {
      if (inflateStateCheck(strm)) {
        return Z_STREAM_ERROR;
      }
      const state = strm.state;
      strm.total_in = strm.total_out = state.total = 0;
      strm.msg = "";
      if (state.wrap) {
        strm.adler = state.wrap & 1;
      }
      state.mode = HEAD;
      state.last = 0;
      state.havedict = 0;
      state.flags = -1;
      state.dmax = 32768;
      state.head = null;
      state.hold = 0;
      state.bits = 0;
      state.lencode = state.lendyn = new Int32Array(ENOUGH_LENS);
      state.distcode = state.distdyn = new Int32Array(ENOUGH_DISTS);
      state.sane = 1;
      state.back = -1;
      return Z_OK;
    };
    var inflateReset = (strm) => {
      if (inflateStateCheck(strm)) {
        return Z_STREAM_ERROR;
      }
      const state = strm.state;
      state.wsize = 0;
      state.whave = 0;
      state.wnext = 0;
      return inflateResetKeep(strm);
    };
    var inflateReset2 = (strm, windowBits) => {
      let wrap;
      if (inflateStateCheck(strm)) {
        return Z_STREAM_ERROR;
      }
      const state = strm.state;
      if (windowBits < 0) {
        wrap = 0;
        windowBits = -windowBits;
      } else {
        wrap = (windowBits >> 4) + 5;
        if (windowBits < 48) {
          windowBits &= 15;
        }
      }
      if (windowBits && (windowBits < 8 || windowBits > 15)) {
        return Z_STREAM_ERROR;
      }
      if (state.window !== null && state.wbits !== windowBits) {
        state.window = null;
      }
      state.wrap = wrap;
      state.wbits = windowBits;
      return inflateReset(strm);
    };
    var inflateInit2 = (strm, windowBits) => {
      if (!strm) {
        return Z_STREAM_ERROR;
      }
      const state = new InflateState();
      strm.state = state;
      state.strm = strm;
      state.window = null;
      state.mode = HEAD;
      const ret = inflateReset2(strm, windowBits);
      if (ret !== Z_OK) {
        strm.state = null;
      }
      return ret;
    };
    var inflateInit = (strm) => {
      return inflateInit2(strm, DEF_WBITS);
    };
    var virgin = true;
    var lenfix;
    var distfix;
    var fixedtables = (state) => {
      if (virgin) {
        lenfix = new Int32Array(512);
        distfix = new Int32Array(32);
        let sym = 0;
        while (sym < 144) {
          state.lens[sym++] = 8;
        }
        while (sym < 256) {
          state.lens[sym++] = 9;
        }
        while (sym < 280) {
          state.lens[sym++] = 7;
        }
        while (sym < 288) {
          state.lens[sym++] = 8;
        }
        inflate_table(LENS, state.lens, 0, 288, lenfix, 0, state.work, { bits: 9 });
        sym = 0;
        while (sym < 32) {
          state.lens[sym++] = 5;
        }
        inflate_table(DISTS, state.lens, 0, 32, distfix, 0, state.work, { bits: 5 });
        virgin = false;
      }
      state.lencode = lenfix;
      state.lenbits = 9;
      state.distcode = distfix;
      state.distbits = 5;
    };
    var updatewindow = (strm, src, end, copy) => {
      let dist;
      const state = strm.state;
      if (state.window === null) {
        state.window = new Uint8Array(1 << state.wbits);
      }
      if (state.wsize === 0) {
        state.wsize = 1 << state.wbits;
        state.wnext = 0;
        state.whave = 0;
      }
      if (copy >= state.wsize) {
        state.window.set(src.subarray(end - state.wsize, end), 0);
        state.wnext = 0;
        state.whave = state.wsize;
      } else {
        dist = state.wsize - state.wnext;
        if (dist > copy) {
          dist = copy;
        }
        state.window.set(src.subarray(end - copy, end - copy + dist), state.wnext);
        copy -= dist;
        if (copy) {
          state.window.set(src.subarray(end - copy, end), 0);
          state.wnext = copy;
          state.whave = state.wsize;
        } else {
          state.wnext += dist;
          if (state.wnext === state.wsize) {
            state.wnext = 0;
          }
          if (state.whave < state.wsize) {
            state.whave += dist;
          }
        }
      }
      return 0;
    };
    var inflate = (strm, flush) => {
      let state;
      let input, output;
      let next;
      let put;
      let have, left;
      let hold;
      let bits;
      let _in, _out;
      let copy;
      let from;
      let from_source;
      let here = 0;
      let here_bits, here_op, here_val;
      let last_bits, last_op, last_val;
      let len;
      let ret;
      const hbuf = new Uint8Array(4);
      let opts;
      let n;
      const order = (
        /* permutation of code lengths */
        new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15])
      );
      if (inflateStateCheck(strm) || !strm.output || !strm.input && strm.avail_in !== 0) {
        return Z_STREAM_ERROR;
      }
      state = strm.state;
      if (state.mode === TYPE) {
        state.mode = TYPEDO;
      }
      put = strm.next_out;
      output = strm.output;
      left = strm.avail_out;
      next = strm.next_in;
      input = strm.input;
      have = strm.avail_in;
      hold = state.hold;
      bits = state.bits;
      _in = have;
      _out = left;
      ret = Z_OK;
      inf_leave:
        for (; ; ) {
          switch (state.mode) {
            case HEAD:
              if (state.wrap === 0) {
                state.mode = TYPEDO;
                break;
              }
              while (bits < 16) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if (state.wrap & 2 && hold === 35615) {
                if (state.wbits === 0) {
                  state.wbits = 15;
                }
                state.check = 0;
                hbuf[0] = hold & 255;
                hbuf[1] = hold >>> 8 & 255;
                state.check = crc32(state.check, hbuf, 2, 0);
                hold = 0;
                bits = 0;
                state.mode = FLAGS;
                break;
              }
              if (state.head) {
                state.head.done = false;
              }
              if (!(state.wrap & 1) || /* check if zlib header allowed */
              (((hold & 255) << 8) + (hold >> 8)) % 31) {
                strm.msg = "incorrect header check";
                state.mode = BAD;
                break;
              }
              if ((hold & 15) !== Z_DEFLATED) {
                strm.msg = "unknown compression method";
                state.mode = BAD;
                break;
              }
              hold >>>= 4;
              bits -= 4;
              len = (hold & 15) + 8;
              if (state.wbits === 0) {
                state.wbits = len;
              }
              if (len > 15 || len > state.wbits) {
                strm.msg = "invalid window size";
                state.mode = BAD;
                break;
              }
              state.dmax = 1 << state.wbits;
              state.flags = 0;
              strm.adler = state.check = 1;
              state.mode = hold & 512 ? DICTID : TYPE;
              hold = 0;
              bits = 0;
              break;
            case FLAGS:
              while (bits < 16) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              state.flags = hold;
              if ((state.flags & 255) !== Z_DEFLATED) {
                strm.msg = "unknown compression method";
                state.mode = BAD;
                break;
              }
              if (state.flags & 57344) {
                strm.msg = "unknown header flags set";
                state.mode = BAD;
                break;
              }
              if (state.head) {
                state.head.text = hold >> 8 & 1;
              }
              if (state.flags & 512 && state.wrap & 4) {
                hbuf[0] = hold & 255;
                hbuf[1] = hold >>> 8 & 255;
                state.check = crc32(state.check, hbuf, 2, 0);
              }
              hold = 0;
              bits = 0;
              state.mode = TIME;
            /* falls through */
            case TIME:
              while (bits < 32) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if (state.head) {
                state.head.time = hold;
              }
              if (state.flags & 512 && state.wrap & 4) {
                hbuf[0] = hold & 255;
                hbuf[1] = hold >>> 8 & 255;
                hbuf[2] = hold >>> 16 & 255;
                hbuf[3] = hold >>> 24 & 255;
                state.check = crc32(state.check, hbuf, 4, 0);
              }
              hold = 0;
              bits = 0;
              state.mode = OS;
            /* falls through */
            case OS:
              while (bits < 16) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if (state.head) {
                state.head.xflags = hold & 255;
                state.head.os = hold >> 8;
              }
              if (state.flags & 512 && state.wrap & 4) {
                hbuf[0] = hold & 255;
                hbuf[1] = hold >>> 8 & 255;
                state.check = crc32(state.check, hbuf, 2, 0);
              }
              hold = 0;
              bits = 0;
              state.mode = EXLEN;
            /* falls through */
            case EXLEN:
              if (state.flags & 1024) {
                while (bits < 16) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.length = hold;
                if (state.head) {
                  state.head.extra_len = hold;
                }
                if (state.flags & 512 && state.wrap & 4) {
                  hbuf[0] = hold & 255;
                  hbuf[1] = hold >>> 8 & 255;
                  state.check = crc32(state.check, hbuf, 2, 0);
                }
                hold = 0;
                bits = 0;
              } else if (state.head) {
                state.head.extra = null;
              }
              state.mode = EXTRA;
            /* falls through */
            case EXTRA:
              if (state.flags & 1024) {
                copy = state.length;
                if (copy > have) {
                  copy = have;
                }
                if (copy) {
                  if (state.head) {
                    len = state.head.extra_len - state.length;
                    if (!state.head.extra) {
                      state.head.extra = new Uint8Array(state.head.extra_len);
                    }
                    state.head.extra.set(
                      input.subarray(
                        next,
                        // extra field is limited to 65536 bytes
                        // - no need for additional size check
                        next + copy
                      ),
                      /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
                      len
                    );
                  }
                  if (state.flags & 512 && state.wrap & 4) {
                    state.check = crc32(state.check, input, copy, next);
                  }
                  have -= copy;
                  next += copy;
                  state.length -= copy;
                }
                if (state.length) {
                  break inf_leave;
                }
              }
              state.length = 0;
              state.mode = NAME;
            /* falls through */
            case NAME:
              if (state.flags & 2048) {
                if (have === 0) {
                  break inf_leave;
                }
                copy = 0;
                do {
                  len = input[next + copy++];
                  if (state.head && len && state.length < 65536) {
                    state.head.name += String.fromCharCode(len);
                  }
                } while (len && copy < have);
                if (state.flags & 512 && state.wrap & 4) {
                  state.check = crc32(state.check, input, copy, next);
                }
                have -= copy;
                next += copy;
                if (len) {
                  break inf_leave;
                }
              } else if (state.head) {
                state.head.name = null;
              }
              state.length = 0;
              state.mode = COMMENT;
            /* falls through */
            case COMMENT:
              if (state.flags & 4096) {
                if (have === 0) {
                  break inf_leave;
                }
                copy = 0;
                do {
                  len = input[next + copy++];
                  if (state.head && len && state.length < 65536) {
                    state.head.comment += String.fromCharCode(len);
                  }
                } while (len && copy < have);
                if (state.flags & 512 && state.wrap & 4) {
                  state.check = crc32(state.check, input, copy, next);
                }
                have -= copy;
                next += copy;
                if (len) {
                  break inf_leave;
                }
              } else if (state.head) {
                state.head.comment = null;
              }
              state.mode = HCRC;
            /* falls through */
            case HCRC:
              if (state.flags & 512) {
                while (bits < 16) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (state.wrap & 4 && hold !== (state.check & 65535)) {
                  strm.msg = "header crc mismatch";
                  state.mode = BAD;
                  break;
                }
                hold = 0;
                bits = 0;
              }
              if (state.head) {
                state.head.hcrc = state.flags >> 9 & 1;
                state.head.done = true;
              }
              strm.adler = state.check = 0;
              state.mode = TYPE;
              break;
            case DICTID:
              while (bits < 32) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              strm.adler = state.check = zswap32(hold);
              hold = 0;
              bits = 0;
              state.mode = DICT;
            /* falls through */
            case DICT:
              if (state.havedict === 0) {
                strm.next_out = put;
                strm.avail_out = left;
                strm.next_in = next;
                strm.avail_in = have;
                state.hold = hold;
                state.bits = bits;
                return Z_NEED_DICT;
              }
              strm.adler = state.check = 1;
              state.mode = TYPE;
            /* falls through */
            case TYPE:
              if (flush === Z_BLOCK || flush === Z_TREES) {
                break inf_leave;
              }
            /* falls through */
            case TYPEDO:
              if (state.last) {
                hold >>>= bits & 7;
                bits -= bits & 7;
                state.mode = CHECK;
                break;
              }
              while (bits < 3) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              state.last = hold & 1;
              hold >>>= 1;
              bits -= 1;
              switch (hold & 3) {
                case 0:
                  state.mode = STORED;
                  break;
                case 1:
                  fixedtables(state);
                  state.mode = LEN_;
                  if (flush === Z_TREES) {
                    hold >>>= 2;
                    bits -= 2;
                    break inf_leave;
                  }
                  break;
                case 2:
                  state.mode = TABLE;
                  break;
                case 3:
                  strm.msg = "invalid block type";
                  state.mode = BAD;
              }
              hold >>>= 2;
              bits -= 2;
              break;
            case STORED:
              hold >>>= bits & 7;
              bits -= bits & 7;
              while (bits < 32) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
                strm.msg = "invalid stored block lengths";
                state.mode = BAD;
                break;
              }
              state.length = hold & 65535;
              hold = 0;
              bits = 0;
              state.mode = COPY_;
              if (flush === Z_TREES) {
                break inf_leave;
              }
            /* falls through */
            case COPY_:
              state.mode = COPY;
            /* falls through */
            case COPY:
              copy = state.length;
              if (copy) {
                if (copy > have) {
                  copy = have;
                }
                if (copy > left) {
                  copy = left;
                }
                if (copy === 0) {
                  break inf_leave;
                }
                output.set(input.subarray(next, next + copy), put);
                have -= copy;
                next += copy;
                left -= copy;
                put += copy;
                state.length -= copy;
                break;
              }
              state.mode = TYPE;
              break;
            case TABLE:
              while (bits < 14) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              state.nlen = (hold & 31) + 257;
              hold >>>= 5;
              bits -= 5;
              state.ndist = (hold & 31) + 1;
              hold >>>= 5;
              bits -= 5;
              state.ncode = (hold & 15) + 4;
              hold >>>= 4;
              bits -= 4;
              if (state.nlen > 286 || state.ndist > 30) {
                strm.msg = "too many length or distance symbols";
                state.mode = BAD;
                break;
              }
              state.have = 0;
              state.mode = LENLENS;
            /* falls through */
            case LENLENS:
              while (state.have < state.ncode) {
                while (bits < 3) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.lens[order[state.have++]] = hold & 7;
                hold >>>= 3;
                bits -= 3;
              }
              while (state.have < 19) {
                state.lens[order[state.have++]] = 0;
              }
              state.lencode = state.lendyn;
              state.lenbits = 7;
              opts = { bits: state.lenbits };
              ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
              state.lenbits = opts.bits;
              if (ret) {
                strm.msg = "invalid code lengths set";
                state.mode = BAD;
                break;
              }
              state.have = 0;
              state.mode = CODELENS;
            /* falls through */
            case CODELENS:
              while (state.have < state.nlen + state.ndist) {
                for (; ; ) {
                  here = state.lencode[hold & (1 << state.lenbits) - 1];
                  here_bits = here >>> 24;
                  here_op = here >>> 16 & 255;
                  here_val = here & 65535;
                  if (here_bits <= bits) {
                    break;
                  }
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (here_val < 16) {
                  hold >>>= here_bits;
                  bits -= here_bits;
                  state.lens[state.have++] = here_val;
                } else {
                  if (here_val === 16) {
                    n = here_bits + 2;
                    while (bits < n) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    hold >>>= here_bits;
                    bits -= here_bits;
                    if (state.have === 0) {
                      strm.msg = "invalid bit length repeat";
                      state.mode = BAD;
                      break;
                    }
                    len = state.lens[state.have - 1];
                    copy = 3 + (hold & 3);
                    hold >>>= 2;
                    bits -= 2;
                  } else if (here_val === 17) {
                    n = here_bits + 3;
                    while (bits < n) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    hold >>>= here_bits;
                    bits -= here_bits;
                    len = 0;
                    copy = 3 + (hold & 7);
                    hold >>>= 3;
                    bits -= 3;
                  } else {
                    n = here_bits + 7;
                    while (bits < n) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    hold >>>= here_bits;
                    bits -= here_bits;
                    len = 0;
                    copy = 11 + (hold & 127);
                    hold >>>= 7;
                    bits -= 7;
                  }
                  if (state.have + copy > state.nlen + state.ndist) {
                    strm.msg = "invalid bit length repeat";
                    state.mode = BAD;
                    break;
                  }
                  while (copy--) {
                    state.lens[state.have++] = len;
                  }
                }
              }
              if (state.mode === BAD) {
                break;
              }
              if (state.lens[256] === 0) {
                strm.msg = "invalid code -- missing end-of-block";
                state.mode = BAD;
                break;
              }
              state.lenbits = 9;
              opts = { bits: state.lenbits };
              ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
              state.lenbits = opts.bits;
              if (ret) {
                strm.msg = "invalid literal/lengths set";
                state.mode = BAD;
                break;
              }
              state.distbits = 6;
              state.distcode = state.distdyn;
              opts = { bits: state.distbits };
              ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
              state.distbits = opts.bits;
              if (ret) {
                strm.msg = "invalid distances set";
                state.mode = BAD;
                break;
              }
              state.mode = LEN_;
              if (flush === Z_TREES) {
                break inf_leave;
              }
            /* falls through */
            case LEN_:
              state.mode = LEN;
            /* falls through */
            case LEN:
              if (have >= 6 && left >= 258) {
                strm.next_out = put;
                strm.avail_out = left;
                strm.next_in = next;
                strm.avail_in = have;
                state.hold = hold;
                state.bits = bits;
                inflate_fast(strm, _out);
                put = strm.next_out;
                output = strm.output;
                left = strm.avail_out;
                next = strm.next_in;
                input = strm.input;
                have = strm.avail_in;
                hold = state.hold;
                bits = state.bits;
                if (state.mode === TYPE) {
                  state.back = -1;
                }
                break;
              }
              state.back = 0;
              for (; ; ) {
                here = state.lencode[hold & (1 << state.lenbits) - 1];
                here_bits = here >>> 24;
                here_op = here >>> 16 & 255;
                here_val = here & 65535;
                if (here_bits <= bits) {
                  break;
                }
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if (here_op && (here_op & 240) === 0) {
                last_bits = here_bits;
                last_op = here_op;
                last_val = here_val;
                for (; ; ) {
                  here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                  here_bits = here >>> 24;
                  here_op = here >>> 16 & 255;
                  here_val = here & 65535;
                  if (last_bits + here_bits <= bits) {
                    break;
                  }
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                hold >>>= last_bits;
                bits -= last_bits;
                state.back += last_bits;
              }
              hold >>>= here_bits;
              bits -= here_bits;
              state.back += here_bits;
              state.length = here_val;
              if (here_op === 0) {
                state.mode = LIT;
                break;
              }
              if (here_op & 32) {
                state.back = -1;
                state.mode = TYPE;
                break;
              }
              if (here_op & 64) {
                strm.msg = "invalid literal/length code";
                state.mode = BAD;
                break;
              }
              state.extra = here_op & 15;
              state.mode = LENEXT;
            /* falls through */
            case LENEXT:
              if (state.extra) {
                n = state.extra;
                while (bits < n) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.length += hold & (1 << state.extra) - 1;
                hold >>>= state.extra;
                bits -= state.extra;
                state.back += state.extra;
              }
              state.was = state.length;
              state.mode = DIST;
            /* falls through */
            case DIST:
              for (; ; ) {
                here = state.distcode[hold & (1 << state.distbits) - 1];
                here_bits = here >>> 24;
                here_op = here >>> 16 & 255;
                here_val = here & 65535;
                if (here_bits <= bits) {
                  break;
                }
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if ((here_op & 240) === 0) {
                last_bits = here_bits;
                last_op = here_op;
                last_val = here_val;
                for (; ; ) {
                  here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                  here_bits = here >>> 24;
                  here_op = here >>> 16 & 255;
                  here_val = here & 65535;
                  if (last_bits + here_bits <= bits) {
                    break;
                  }
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                hold >>>= last_bits;
                bits -= last_bits;
                state.back += last_bits;
              }
              hold >>>= here_bits;
              bits -= here_bits;
              state.back += here_bits;
              if (here_op & 64) {
                strm.msg = "invalid distance code";
                state.mode = BAD;
                break;
              }
              state.offset = here_val;
              state.extra = here_op & 15;
              state.mode = DISTEXT;
            /* falls through */
            case DISTEXT:
              if (state.extra) {
                n = state.extra;
                while (bits < n) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.offset += hold & (1 << state.extra) - 1;
                hold >>>= state.extra;
                bits -= state.extra;
                state.back += state.extra;
              }
              if (state.offset > state.dmax) {
                strm.msg = "invalid distance too far back";
                state.mode = BAD;
                break;
              }
              state.mode = MATCH;
            /* falls through */
            case MATCH:
              if (left === 0) {
                break inf_leave;
              }
              copy = _out - left;
              if (state.offset > copy) {
                copy = state.offset - copy;
                if (copy > state.whave) {
                  if (state.sane) {
                    strm.msg = "invalid distance too far back";
                    state.mode = BAD;
                    break;
                  }
                }
                if (copy > state.wnext) {
                  copy -= state.wnext;
                  from = state.wsize - copy;
                } else {
                  from = state.wnext - copy;
                }
                if (copy > state.length) {
                  copy = state.length;
                }
                from_source = state.window;
              } else {
                from_source = output;
                from = put - state.offset;
                copy = state.length;
              }
              if (copy > left) {
                copy = left;
              }
              left -= copy;
              state.length -= copy;
              do {
                output[put++] = from_source[from++];
              } while (--copy);
              if (state.length === 0) {
                state.mode = LEN;
              }
              break;
            case LIT:
              if (left === 0) {
                break inf_leave;
              }
              output[put++] = state.length;
              left--;
              state.mode = LEN;
              break;
            case CHECK:
              if (state.wrap) {
                while (bits < 32) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold |= input[next++] << bits;
                  bits += 8;
                }
                _out -= left;
                strm.total_out += _out;
                state.total += _out;
                if (state.wrap & 4 && _out) {
                  strm.adler = state.check = /*UPDATE_CHECK(state.check, put - _out, _out);*/
                  state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out);
                }
                _out = left;
                if (state.wrap & 4 && (state.flags ? hold : zswap32(hold)) !== state.check) {
                  strm.msg = "incorrect data check";
                  state.mode = BAD;
                  break;
                }
                hold = 0;
                bits = 0;
              }
              state.mode = LENGTH;
            /* falls through */
            case LENGTH:
              if (state.wrap && state.flags) {
                while (bits < 32) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (state.wrap & 4 && hold !== (state.total & 4294967295)) {
                  strm.msg = "incorrect length check";
                  state.mode = BAD;
                  break;
                }
                hold = 0;
                bits = 0;
              }
              state.mode = DONE;
            /* falls through */
            case DONE:
              ret = Z_STREAM_END;
              break inf_leave;
            case BAD:
              ret = Z_DATA_ERROR;
              break inf_leave;
            case MEM:
              return Z_MEM_ERROR;
            case SYNC:
            /* falls through */
            default:
              return Z_STREAM_ERROR;
          }
        }
      strm.next_out = put;
      strm.avail_out = left;
      strm.next_in = next;
      strm.avail_in = have;
      state.hold = hold;
      state.bits = bits;
      if (state.wsize || _out !== strm.avail_out && state.mode < BAD && (state.mode < CHECK || flush !== Z_FINISH)) {
        if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
          state.mode = MEM;
          return Z_MEM_ERROR;
        }
      }
      _in -= strm.avail_in;
      _out -= strm.avail_out;
      strm.total_in += _in;
      strm.total_out += _out;
      state.total += _out;
      if (state.wrap & 4 && _out) {
        strm.adler = state.check = /*UPDATE_CHECK(state.check, strm.next_out - _out, _out);*/
        state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out);
      }
      strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
      if ((_in === 0 && _out === 0 || flush === Z_FINISH) && ret === Z_OK) {
        ret = Z_BUF_ERROR;
      }
      return ret;
    };
    var inflateEnd = (strm) => {
      if (inflateStateCheck(strm)) {
        return Z_STREAM_ERROR;
      }
      let state = strm.state;
      if (state.window) {
        state.window = null;
      }
      strm.state = null;
      return Z_OK;
    };
    var inflateGetHeader = (strm, head) => {
      if (inflateStateCheck(strm)) {
        return Z_STREAM_ERROR;
      }
      const state = strm.state;
      if ((state.wrap & 2) === 0) {
        return Z_STREAM_ERROR;
      }
      state.head = head;
      head.done = false;
      return Z_OK;
    };
    var inflateSetDictionary = (strm, dictionary) => {
      const dictLength = dictionary.length;
      let state;
      let dictid;
      let ret;
      if (inflateStateCheck(strm)) {
        return Z_STREAM_ERROR;
      }
      state = strm.state;
      if (state.wrap !== 0 && state.mode !== DICT) {
        return Z_STREAM_ERROR;
      }
      if (state.mode === DICT) {
        dictid = 1;
        dictid = adler32(dictid, dictionary, dictLength, 0);
        if (dictid !== state.check) {
          return Z_DATA_ERROR;
        }
      }
      ret = updatewindow(strm, dictionary, dictLength, dictLength);
      if (ret) {
        state.mode = MEM;
        return Z_MEM_ERROR;
      }
      state.havedict = 1;
      return Z_OK;
    };
    module.exports.inflateReset = inflateReset;
    module.exports.inflateReset2 = inflateReset2;
    module.exports.inflateResetKeep = inflateResetKeep;
    module.exports.inflateInit = inflateInit;
    module.exports.inflateInit2 = inflateInit2;
    module.exports.inflate = inflate;
    module.exports.inflateEnd = inflateEnd;
    module.exports.inflateGetHeader = inflateGetHeader;
    module.exports.inflateSetDictionary = inflateSetDictionary;
    module.exports.inflateInfo = "pako inflate (from Nodeca project)";
  }
});

// node_modules/pizzip/node_modules/pako/lib/zlib/gzheader.js
var require_gzheader = __commonJS({
  "node_modules/pizzip/node_modules/pako/lib/zlib/gzheader.js"(exports, module) {
    "use strict";
    function GZheader() {
      this.text = 0;
      this.time = 0;
      this.xflags = 0;
      this.os = 0;
      this.extra = null;
      this.extra_len = 0;
      this.name = "";
      this.comment = "";
      this.hcrc = 0;
      this.done = false;
    }
    module.exports = GZheader;
  }
});

// node_modules/pizzip/node_modules/pako/lib/inflate.js
var require_inflate2 = __commonJS({
  "node_modules/pizzip/node_modules/pako/lib/inflate.js"(exports, module) {
    "use strict";
    var zlib_inflate = require_inflate();
    var utils = require_common();
    var strings = require_strings();
    var msg = require_messages();
    var ZStream = require_zstream();
    var GZheader = require_gzheader();
    var toString = Object.prototype.toString;
    var {
      Z_NO_FLUSH,
      Z_FINISH,
      Z_OK,
      Z_STREAM_END,
      Z_NEED_DICT,
      Z_STREAM_ERROR,
      Z_DATA_ERROR,
      Z_MEM_ERROR,
      Z_BUF_ERROR
    } = require_constants();
    var defaultOptions = {
      chunkSize: 1024 * 64,
      windowBits: 15,
      to: ""
    };
    function Inflate(options) {
      this.options = utils.assign({}, defaultOptions, options || {});
      const opt = this.options;
      if (opt.raw && opt.windowBits >= 0 && opt.windowBits < 16) {
        opt.windowBits = -opt.windowBits;
        if (opt.windowBits === 0) {
          opt.windowBits = -15;
        }
      }
      if (opt.windowBits >= 0 && opt.windowBits < 16 && !(options && options.windowBits)) {
        opt.windowBits += 32;
      }
      if (opt.windowBits > 15 && opt.windowBits < 48) {
        if ((opt.windowBits & 15) === 0) {
          opt.windowBits |= 15;
        }
      }
      this.err = 0;
      this.msg = "";
      this.ended = false;
      this.chunks = [];
      this.strm = new ZStream();
      this.strm.avail_out = 0;
      let status = zlib_inflate.inflateInit2(
        this.strm,
        opt.windowBits
      );
      if (status !== Z_OK) {
        throw new Error(msg[status]);
      }
      this.header = new GZheader();
      zlib_inflate.inflateGetHeader(this.strm, this.header);
      if (opt.dictionary) {
        if (typeof opt.dictionary === "string") {
          opt.dictionary = strings.string2buf(opt.dictionary);
        } else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") {
          opt.dictionary = new Uint8Array(opt.dictionary);
        }
        if (opt.raw) {
          status = zlib_inflate.inflateSetDictionary(this.strm, opt.dictionary);
          if (status !== Z_OK) {
            throw new Error(msg[status]);
          }
        }
      }
    }
    Inflate.prototype.push = function(data, flush_mode) {
      const strm = this.strm;
      const chunkSize = this.options.chunkSize;
      const dictionary = this.options.dictionary;
      let status, _flush_mode, last_avail_out;
      if (this.ended) return false;
      if (flush_mode === ~~flush_mode) _flush_mode = flush_mode;
      else _flush_mode = flush_mode === true ? Z_FINISH : Z_NO_FLUSH;
      if (toString.call(data) === "[object ArrayBuffer]") {
        strm.input = new Uint8Array(data);
      } else {
        strm.input = data;
      }
      strm.next_in = 0;
      strm.avail_in = strm.input.length;
      for (; ; ) {
        if (strm.avail_out === 0) {
          strm.output = new Uint8Array(chunkSize);
          strm.next_out = 0;
          strm.avail_out = chunkSize;
        }
        status = zlib_inflate.inflate(strm, _flush_mode);
        if (status === Z_NEED_DICT && dictionary) {
          status = zlib_inflate.inflateSetDictionary(strm, dictionary);
          if (status === Z_OK) {
            status = zlib_inflate.inflate(strm, _flush_mode);
          } else if (status === Z_DATA_ERROR) {
            status = Z_NEED_DICT;
          }
        }
        while (strm.avail_in > 0 && status === Z_STREAM_END && strm.state.wrap & 2 && strm.state.flags !== 0 && strm.input[strm.next_in] !== 0) {
          zlib_inflate.inflateReset(strm);
          status = zlib_inflate.inflate(strm, _flush_mode);
        }
        switch (status) {
          case Z_STREAM_ERROR:
          case Z_DATA_ERROR:
          case Z_NEED_DICT:
          case Z_MEM_ERROR:
            this.onEnd(status);
            this.ended = true;
            return false;
        }
        last_avail_out = strm.avail_out;
        if (strm.next_out) {
          if (strm.avail_out === 0 || status === Z_STREAM_END || _flush_mode > 0) {
            if (this.options.to === "string") {
              let next_out_utf8 = strings.utf8border(strm.output, strm.next_out);
              let tail = strm.next_out - next_out_utf8;
              let utf8str = strings.buf2string(strm.output, next_out_utf8);
              strm.next_out = tail;
              strm.avail_out = chunkSize - tail;
              if (tail) strm.output.set(strm.output.subarray(next_out_utf8, next_out_utf8 + tail), 0);
              this.onData(utf8str);
            } else {
              this.onData(strm.output.length === strm.next_out ? strm.output : strm.output.subarray(0, strm.next_out));
              strm.avail_out = 0;
              strm.next_out = 0;
            }
          }
        }
        if ((status === Z_OK || status === Z_BUF_ERROR) && last_avail_out === 0) continue;
        if (status === Z_STREAM_END) {
          status = zlib_inflate.inflateEnd(this.strm);
          this.onEnd(status);
          this.ended = true;
          return true;
        }
        if (strm.avail_in === 0) {
          if (_flush_mode === Z_FINISH) {
            status = zlib_inflate.inflateEnd(this.strm);
            this.onEnd(status === Z_OK ? Z_BUF_ERROR : status);
            this.ended = true;
            return false;
          }
          break;
        }
      }
      return true;
    };
    Inflate.prototype.onData = function(chunk) {
      this.chunks.push(chunk);
    };
    Inflate.prototype.onEnd = function(status) {
      if (status === Z_OK) {
        if (this.options.to === "string") {
          this.result = this.chunks.join("");
        } else {
          this.result = utils.flattenChunks(this.chunks);
        }
      }
      this.chunks = [];
      this.err = status;
      this.msg = this.strm.msg;
    };
    function inflate(input, options) {
      const inflator = new Inflate(options);
      inflator.push(input, true);
      if (inflator.err) throw inflator.msg || msg[inflator.err];
      return inflator.result;
    }
    function inflateRaw(input, options) {
      options = options || {};
      options.raw = true;
      return inflate(input, options);
    }
    module.exports.Inflate = Inflate;
    module.exports.inflate = inflate;
    module.exports.inflateRaw = inflateRaw;
    module.exports.ungzip = inflate;
    module.exports.constants = require_constants();
  }
});

// node_modules/pizzip/node_modules/pako/index.js
var require_pako = __commonJS({
  "node_modules/pizzip/node_modules/pako/index.js"(exports, module) {
    "use strict";
    var { Deflate, deflate, deflateRaw, gzip } = require_deflate2();
    var { Inflate, inflate, inflateRaw, ungzip } = require_inflate2();
    var constants = require_constants();
    module.exports.Deflate = Deflate;
    module.exports.deflate = deflate;
    module.exports.deflateRaw = deflateRaw;
    module.exports.gzip = gzip;
    module.exports.Inflate = Inflate;
    module.exports.inflate = inflate;
    module.exports.inflateRaw = inflateRaw;
    module.exports.ungzip = ungzip;
    module.exports.constants = constants;
  }
});

// node_modules/pizzip/js/fileReader.js
var require_fileReader = __commonJS({
  "node_modules/pizzip/js/fileReader.js"(exports, module) {
    "use strict";
    var fs = __require("node:fs");
    var _require = __require("node:stream");
    var Readable = _require.Readable;
    var DataReader = require_dataReader();
    function readExactly(fd, buffer, offset, length, position) {
      var read = 0;
      while (read < length) {
        var count = fs.readSync(fd, buffer, offset + read, length - read, position + read);
        if (!count) {
          throw new Error("Corrupted zip : unexpected end of file");
        }
        read += count;
      }
    }
    function FileReader(file) {
      var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      this.chunkSize = require_chunk_size()(options.chunkSize);
      this.file = file;
      this.fd = fs.openSync(file, "r");
      try {
        this.length = fs.fstatSync(this.fd).size;
      } catch (error) {
        fs.closeSync(this.fd);
        throw error;
      }
      this.index = 0;
      this.zero = 0;
      this.closed = false;
    }
    FileReader.prototype = new DataReader();
    FileReader.prototype._pizzipFileReader = true;
    FileReader.prototype.assertOpen = function() {
      if (this.closed) {
        throw new Error("ZIP file reader has been disposed");
      }
    };
    FileReader.prototype.byteAt = function(index) {
      this.assertOpen();
      var _byte = Buffer.allocUnsafe(1);
      readExactly(this.fd, _byte, 0, 1, this.zero + index);
      return _byte[0];
    };
    FileReader.prototype.readData = function(size) {
      this.assertOpen();
      this.checkOffset(size);
      var data = Buffer.allocUnsafe(size);
      readExactly(this.fd, data, 0, size, this.zero + this.index);
      this.index += size;
      return data;
    };
    FileReader.prototype.lastIndexOfSignature = function(signature) {
      this.assertOpen();
      var size = Math.min(this.length, 65558);
      var offset = this.length - size;
      var data = Buffer.allocUnsafe(size);
      readExactly(this.fd, data, 0, size, offset);
      for (var i = data.length - 4; i >= 0; i--) {
        if (data[i] === signature.charCodeAt(0) && data[i + 1] === signature.charCodeAt(1) && data[i + 2] === signature.charCodeAt(2) && data[i + 3] === signature.charCodeAt(3)) {
          return offset + i - this.zero;
        }
      }
      return -1;
    };
    FileReader.prototype.dispose = function() {
      if (this.closed) {
        return;
      }
      this.closed = true;
      fs.closeSync(this.fd);
    };
    function createFdReadStream(source, offset, size, chunkSize, disposedError) {
      if (source.closed) {
        throw new Error(disposedError);
      }
      if (!size) {
        return Readable.from([]);
      }
      var position = offset;
      var remaining = size;
      var pending = false;
      return new Readable({
        highWaterMark: chunkSize,
        read: function read() {
          var _this = this;
          if (pending) {
            return;
          }
          if (source.closed) {
            this.destroy(new Error(disposedError));
            return;
          }
          if (remaining <= 0) {
            this.push(null);
            return;
          }
          pending = true;
          var buffer = Buffer.allocUnsafe(Math.min(chunkSize, remaining));
          fs.read(source.fd, buffer, 0, buffer.length, position, function(error, count) {
            pending = false;
            if (_this.destroyed) {
              return;
            }
            if (source.closed) {
              _this.destroy(new Error(disposedError));
              return;
            }
            if (error) {
              _this.destroy(error);
              return;
            }
            if (!count) {
              _this.destroy(new Error("Corrupted zip : unexpected end of file"));
              return;
            }
            position += count;
            remaining -= count;
            _this.push(buffer.subarray(0, count));
          });
        }
      });
    }
    FileReader.prototype.createReadStream = function(offset, size) {
      var chunkSize = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : this.chunkSize;
      return createFdReadStream(this, offset, size, chunkSize, "ZIP file reader has been disposed");
    };
    FileReader.prototype.checkCRC32 = function(entry) {
      this.assertOpen();
      var crc32 = require_crc32();
      var checksum = 0;
      var length = 0;
      function consume(chunk2) {
        checksum = crc32(chunk2, checksum);
        length += chunk2.length;
        if (length > entry.uncompressedSize) {
          throw new Error("Bug : uncompressed data size mismatch");
        }
      }
      var inflater = entry.compressionMethod === "\b\0" ? new (require_pako()).Inflate({
        raw: true,
        chunkSize: this.chunkSize
      }) : null;
      if (inflater) {
        inflater.onData = consume;
      }
      var buffer = Buffer.allocUnsafe(Math.min(this.chunkSize, entry.compressedSize));
      var offset = 0;
      while (offset < entry.compressedSize) {
        var size = Math.min(buffer.length, entry.compressedSize - offset);
        readExactly(this.fd, buffer, 0, size, entry._fileOffset + offset);
        offset += size;
        var chunk = buffer.subarray(0, size);
        if (inflater) {
          inflater.push(chunk, offset === entry.compressedSize);
          if (inflater.err) {
            throw new Error("Corrupted zip : " + inflater.msg);
          }
        } else {
          consume(chunk);
        }
      }
      if (length !== entry.uncompressedSize || inflater && !inflater.ended) {
        throw new Error("Bug : uncompressed data size mismatch");
      }
      if (checksum >>> 0 !== entry.crc32 >>> 0) {
        throw new Error("Corrupted zip : CRC32 mismatch");
      }
    };
    FileReader.createFdReadStream = createFdReadStream;
    module.exports = FileReader;
  }
});

// node_modules/pizzip/js/filesystem-storage.js
var require_filesystem_storage = __commonJS({
  "node_modules/pizzip/js/filesystem-storage.js"(exports, module) {
    "use strict";
    var fs = __require("node:fs");
    var os = __require("node:os");
    var path = __require("node:path");
    var CompressedObject = require_compressedObject();
    var FileReader = require_fileReader();
    function toBuffer(data) {
      if (Buffer.isBuffer(data)) {
        return data;
      }
      if (data instanceof Uint8Array) {
        return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
      }
      if (typeof data === "string") {
        return Buffer.from(data, "binary");
      }
      return Buffer.from(data);
    }
    function writeAll(fd, buffer, offset) {
      var written = 0;
      while (written < buffer.length) {
        var count = fs.writeSync(fd, buffer, written, buffer.length - written, offset + written);
        if (!count) {
          throw new Error("Could not write filesystem ZIP storage");
        }
        written += count;
      }
    }
    function readExactly(fd, buffer, offset, size) {
      var read = 0;
      while (read < size) {
        var count = fs.readSync(fd, buffer, read, size - read, offset + read);
        if (!count) {
          throw new Error("Corrupted zip : unexpected end of file");
        }
        read += count;
      }
    }
    function DiskData(storage, offset, size) {
      this.storage = storage;
      this.offset = offset;
      this.size = size;
      this._pizzipDiskData = true;
    }
    DiskData.prototype.getContent = function() {
      return this.storage.read(this.offset, this.size);
    };
    DiskData.prototype.createReadStream = function(chunkSize) {
      return this.storage.createReadStream(this.offset, this.size, chunkSize);
    };
    function FilesystemStorage(options) {
      this.chunkSize = require_chunk_size()(options.chunkSize);
      var directory = options.directory || os.tmpdir();
      if (!fs.statSync(directory).isDirectory()) {
        throw new Error("Filesystem ZIP storage directory does not exist: " + directory);
      }
      this.path = fs.mkdtempSync(path.join(directory, "pizzip-"));
      this.file = path.join(this.path, "entries");
      try {
        this.fd = fs.openSync(this.file, "wx+", 384);
      } catch (error) {
        fs.rmSync(this.path, {
          recursive: true,
          force: true
        });
        throw error;
      }
      this.size = 0;
      this.closed = false;
      this.filter = options.filter || null;
    }
    FilesystemStorage.prototype.assertOpen = function() {
      if (this.closed) {
        throw new Error("Filesystem ZIP storage has been disposed");
      }
    };
    FilesystemStorage.prototype.shouldStore = function(name) {
      return !this.filter || this.filter(name);
    };
    FilesystemStorage.prototype.createReadStream = function(offset, size) {
      var chunkSize = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : this.chunkSize;
      return FileReader.createFdReadStream(this, offset, size, chunkSize, "Filesystem ZIP storage has been disposed");
    };
    FilesystemStorage.prototype.write = function(data, encoding) {
      this.assertOpen();
      var offset = this.size;
      if (typeof data === "string") {
        data = Buffer.from(data, encoding);
      }
      var buffer = toBuffer(data);
      writeAll(this.fd, buffer, offset);
      this.size += buffer.length;
      return new DiskData(this, offset, buffer.length);
    };
    FilesystemStorage.prototype.read = function(offset, size) {
      this.assertOpen();
      var buffer = Buffer.allocUnsafe(size);
      readExactly(this.fd, buffer, offset, size);
      return buffer;
    };
    FilesystemStorage.prototype.copyFrom = function(fd, offset, size) {
      this.assertOpen();
      var destOffset = this.size;
      if (!size) {
        return new DiskData(this, destOffset, 0);
      }
      var buffer = Buffer.allocUnsafe(Math.min(this.chunkSize, size));
      var remaining = size;
      var src = offset;
      var dest = destOffset;
      while (remaining > 0) {
        var want = Math.min(buffer.length, remaining);
        readExactly(fd, buffer, src, want);
        writeAll(this.fd, buffer.subarray(0, want), dest);
        src += want;
        dest += want;
        remaining -= want;
      }
      this.size += size;
      return new DiskData(this, destOffset, size);
    };
    FilesystemStorage.prototype.wrapCompressed = function(diskData, source) {
      var result = CompressedObject.from(source, function() {
        return diskData.getContent();
      });
      result._fileReader = this;
      result._fileOffset = diskData.offset;
      return result;
    };
    FilesystemStorage.prototype.compressed = function(data, source) {
      return this.wrapCompressed(this.write(data), source);
    };
    FilesystemStorage.prototype.compressedFromReader = function(source) {
      source._fileReader.assertOpen();
      return this.wrapCompressed(this.copyFrom(source._fileReader.fd, source._fileOffset, source.compressedSize), source);
    };
    FilesystemStorage.prototype.dispose = function() {
      if (this.closed) {
        return;
      }
      this.closed = true;
      fs.closeSync(this.fd);
      fs.rmSync(this.path, {
        recursive: true,
        force: true
      });
    };
    FilesystemStorage.DiskData = DiskData;
    module.exports = FilesystemStorage;
  }
});

// node_modules/pizzip/js/signature.js
var require_signature = __commonJS({
  "node_modules/pizzip/js/signature.js"(exports) {
    "use strict";
    exports.LOCAL_FILE_HEADER = "PK";
    exports.CENTRAL_FILE_HEADER = "PK";
    exports.CENTRAL_DIRECTORY_END = "PK";
    exports.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07";
    exports.ZIP64_CENTRAL_DIRECTORY_END = "PK";
    exports.DATA_DESCRIPTOR = "PK\x07\b";
  }
});

// node_modules/pizzip/js/defaults.js
var require_defaults = __commonJS({
  "node_modules/pizzip/js/defaults.js"(exports) {
    "use strict";
    exports.base64 = false;
    exports.binary = false;
    exports.dir = false;
    exports.createFolders = false;
    exports.date = null;
    exports.compression = null;
    exports.compressionOptions = null;
    exports.comment = null;
    exports.unixPermissions = null;
    exports.dosPermissions = null;
  }
});

// node_modules/pizzip/js/utf8.js
var require_utf8 = __commonJS({
  "node_modules/pizzip/js/utf8.js"(exports) {
    "use strict";
    var utils = require_utils();
    var support = require_support();
    var nodeBuffer = require_nodeBuffer();
    var _utf8len = new Array(256);
    for (i = 0; i < 256; i++) {
      _utf8len[i] = i >= 252 ? 6 : i >= 248 ? 5 : i >= 240 ? 4 : i >= 224 ? 3 : i >= 192 ? 2 : 1;
    }
    var i;
    _utf8len[254] = _utf8len[254] = 1;
    function string2buf(str) {
      var buf, c, c2, mPos, i2, bufLen = 0;
      var strLen = str.length;
      for (mPos = 0; mPos < strLen; mPos++) {
        c = str.charCodeAt(mPos);
        if ((c & 64512) === 55296 && mPos + 1 < strLen) {
          c2 = str.charCodeAt(mPos + 1);
          if ((c2 & 64512) === 56320) {
            c = 65536 + (c - 55296 << 10) + (c2 - 56320);
            mPos++;
          }
        }
        bufLen += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
      }
      if (support.uint8array) {
        buf = new Uint8Array(bufLen);
      } else {
        buf = new Array(bufLen);
      }
      for (i2 = 0, mPos = 0; i2 < bufLen; mPos++) {
        c = str.charCodeAt(mPos);
        if ((c & 64512) === 55296 && mPos + 1 < strLen) {
          c2 = str.charCodeAt(mPos + 1);
          if ((c2 & 64512) === 56320) {
            c = 65536 + (c - 55296 << 10) + (c2 - 56320);
            mPos++;
          }
        }
        if (c < 128) {
          buf[i2++] = c;
        } else if (c < 2048) {
          buf[i2++] = 192 | c >>> 6;
          buf[i2++] = 128 | c & 63;
        } else if (c < 65536) {
          buf[i2++] = 224 | c >>> 12;
          buf[i2++] = 128 | c >>> 6 & 63;
          buf[i2++] = 128 | c & 63;
        } else {
          buf[i2++] = 240 | c >>> 18;
          buf[i2++] = 128 | c >>> 12 & 63;
          buf[i2++] = 128 | c >>> 6 & 63;
          buf[i2++] = 128 | c & 63;
        }
      }
      return buf;
    }
    function utf8border(buf, max) {
      var pos;
      max = max || buf.length;
      if (max > buf.length) {
        max = buf.length;
      }
      pos = max - 1;
      while (pos >= 0 && (buf[pos] & 192) === 128) {
        pos--;
      }
      if (pos < 0) {
        return max;
      }
      if (pos === 0) {
        return max;
      }
      return pos + _utf8len[buf[pos]] > max ? pos : max;
    }
    function buf2string(buf) {
      var i2, out, c, cLen;
      var len = buf.length;
      var utf16buf = new Array(len * 2);
      for (out = 0, i2 = 0; i2 < len; ) {
        c = buf[i2++];
        if (c < 128) {
          utf16buf[out++] = c;
          continue;
        }
        cLen = _utf8len[c];
        if (cLen > 4) {
          utf16buf[out++] = 65533;
          i2 += cLen - 1;
          continue;
        }
        c &= cLen === 2 ? 31 : cLen === 3 ? 15 : 7;
        while (cLen > 1 && i2 < len) {
          c = c << 6 | buf[i2++] & 63;
          cLen--;
        }
        if (cLen > 1) {
          utf16buf[out++] = 65533;
          continue;
        }
        if (c < 65536) {
          utf16buf[out++] = c;
        } else {
          c -= 65536;
          utf16buf[out++] = 55296 | c >> 10 & 1023;
          utf16buf[out++] = 56320 | c & 1023;
        }
      }
      if (utf16buf.length !== out) {
        if (utf16buf.subarray) {
          utf16buf = utf16buf.subarray(0, out);
        } else {
          utf16buf.length = out;
        }
      }
      return utils.applyFromCharCode(utf16buf);
    }
    exports.utf8encode = function utf8encode(str) {
      if (support.nodebuffer) {
        return nodeBuffer(str, "utf-8");
      }
      return string2buf(str);
    };
    exports.utf8decode = function utf8decode(buf) {
      if (support.nodebuffer) {
        return utils.transformTo("nodebuffer", buf).toString("utf-8");
      }
      buf = utils.transformTo(support.uint8array ? "uint8array" : "array", buf);
      var result = [], len = buf.length, chunk = 65536;
      var k = 0;
      while (k < len) {
        var nextBoundary = utf8border(buf, Math.min(k + chunk, len));
        if (support.uint8array) {
          result.push(buf2string(buf.subarray(k, nextBoundary)));
        } else {
          result.push(buf2string(buf.slice(k, nextBoundary)));
        }
        k = nextBoundary;
      }
      return result.join("");
    };
  }
});

// node_modules/pizzip/js/stringWriter.js
var require_stringWriter = __commonJS({
  "node_modules/pizzip/js/stringWriter.js"(exports, module) {
    "use strict";
    var utils = require_utils();
    function StringWriter() {
      this.data = [];
    }
    StringWriter.prototype = {
      /**
       * Append any content to the current string.
       * @param {Object} input the content to add.
       */
      append: function append(input) {
        input = utils.transformTo("string", input);
        this.data.push(input);
      },
      /**
       * Finalize the construction an return the result.
       * @return {string} the generated string.
       */
      finalize: function finalize() {
        return this.data.join("");
      }
    };
    module.exports = StringWriter;
  }
});

// node_modules/pizzip/js/uint8ArrayWriter.js
var require_uint8ArrayWriter = __commonJS({
  "node_modules/pizzip/js/uint8ArrayWriter.js"(exports, module) {
    "use strict";
    var utils = require_utils();
    function Uint8ArrayWriter(length) {
      this.data = new Uint8Array(length);
      this.index = 0;
    }
    Uint8ArrayWriter.prototype = {
      /**
       * Append any content to the current array.
       * @param {Object} input the content to add.
       */
      append: function append(input) {
        if (input.length !== 0) {
          input = utils.transformTo("uint8array", input);
          this.data.set(input, this.index);
          this.index += input.length;
        }
      },
      /**
       * Finalize the construction an return the result.
       * @return {Uint8Array} the generated array.
       */
      finalize: function finalize() {
        return this.data;
      }
    };
    module.exports = Uint8ArrayWriter;
  }
});

// node_modules/pizzip/js/file-order.js
var require_file_order = __commonJS({
  "node_modules/pizzip/js/file-order.js"(exports, module) {
    "use strict";
    function _toConsumableArray(r) {
      return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
    }
    function _nonIterableSpread() {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    function _unsupportedIterableToArray(r, a) {
      if (r) {
        if ("string" == typeof r) return _arrayLikeToArray(r, a);
        var t = {}.toString.call(r).slice(8, -1);
        return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
      }
    }
    function _iterableToArray(r) {
      if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
    }
    function _arrayWithoutHoles(r) {
      if (Array.isArray(r)) return _arrayLikeToArray(r);
    }
    function _arrayLikeToArray(r, a) {
      (null == a || a > r.length) && (a = r.length);
      for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
      return n;
    }
    module.exports = function fileOrder(files, order) {
      if (typeof order === "function") {
        return order(files);
      }
      var names = Object.keys(files);
      if (!Array.isArray(order)) {
        return names;
      }
      return [].concat(_toConsumableArray(order), _toConsumableArray(names.filter(function(name) {
        return !order.includes(name);
      })));
    };
  }
});

// node_modules/pizzip/js/object.js
var require_object = __commonJS({
  "node_modules/pizzip/js/object.js"(exports, module) {
    "use strict";
    function _createForOfIteratorHelper(r, e) {
      var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
      if (!t) {
        if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) {
          t && (r = t);
          var _n = 0, F = function F2() {
          };
          return { s: F, n: function n() {
            return _n >= r.length ? { done: true } : { done: false, value: r[_n++] };
          }, e: function e2(r2) {
            throw r2;
          }, f: F };
        }
        throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
      }
      var o, a = true, u = false;
      return { s: function s() {
        t = t.call(r);
      }, n: function n() {
        var r2 = t.next();
        return a = r2.done, r2;
      }, e: function e2(r2) {
        u = true, o = r2;
      }, f: function f() {
        try {
          a || null == t["return"] || t["return"]();
        } finally {
          if (u) throw o;
        }
      } };
    }
    function _unsupportedIterableToArray(r, a) {
      if (r) {
        if ("string" == typeof r) return _arrayLikeToArray(r, a);
        var t = {}.toString.call(r).slice(8, -1);
        return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
      }
    }
    function _arrayLikeToArray(r, a) {
      (null == a || a > r.length) && (a = r.length);
      for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
      return n;
    }
    var support = require_support();
    var utils = require_utils();
    var _crc = require_crc32();
    var signature = require_signature();
    var defaults = require_defaults();
    var base64 = require_base64();
    var compressions = require_compressions();
    var CompressedObject = require_compressedObject();
    var nodeBuffer = require_nodeBuffer();
    var utf8 = require_utf8();
    var StringWriter = require_stringWriter();
    var Uint8ArrayWriter = require_uint8ArrayWriter();
    var fileOrder = require_file_order();
    function getRawData(file) {
      if (file._data && file._data._pizzipDiskData) {
        return file._data.getContent();
      }
      if (file._data instanceof CompressedObject) {
        file._data = file._data.getContent();
        file.options.binary = true;
        file.options.base64 = false;
        if (utils.getTypeOf(file._data) === "uint8array") {
          var copy = file._data;
          file._data = new Uint8Array(copy.length);
          if (copy.length !== 0) {
            file._data.set(copy, 0);
          }
        }
      }
      return file._data;
    }
    function getBinaryData(file) {
      var result = getRawData(file), type = utils.getTypeOf(result);
      if (type === "string") {
        if (!file.options.binary) {
          if (support.nodebuffer) {
            return nodeBuffer(result, "utf-8");
          }
        }
        return file.asBinary();
      }
      return result;
    }
    var out = {
      /**
       * Read an existing zip and merge the data in the current PizZip object.
       * The implementation is in pizzip-load.js, don't forget to include it.
       * @param {String|ArrayBuffer|Uint8Array|Buffer} stream  The stream to load
       * @param {Object} options Options for loading the stream.
       *  options.base64 : is the stream in base64 ? default : false
       * @return {PizZip} the current PizZip object
       */
      load: function load() {
        throw new Error("Load method is not defined. Is the file pizzip-load.js included ?");
      },
      /**
       * Filter nested files/folders with the specified function.
       * @param {Function} search the predicate to use :
       * function (relativePath, file) {...}
       * It takes 2 arguments : the relative path and the file.
       * @return {Array} An array of matching elements.
       */
      filter: function filter(search) {
        var result = [];
        var filename, relativePath, file, fileClone;
        for (filename in this.files) {
          if (!this.files.hasOwnProperty(filename)) {
            continue;
          }
          file = this.files[filename];
          fileClone = new ZipObject(file.name, file._data, utils.extend(file.options));
          relativePath = filename.slice(this.root.length, filename.length);
          if (filename.slice(0, this.root.length) === this.root && // the file is in the current root
          search(relativePath, fileClone)) {
            result.push(fileClone);
          }
        }
        return result;
      },
      /**
       * Add a file to the zip file, or search a file.
       * @param   {string|RegExp} name The name of the file to add (if data is defined),
       * the name of the file to find (if no data) or a regex to match files.
       * @param   {String|ArrayBuffer|Uint8Array|Buffer} data  The file data, either raw or base64 encoded
       * @param   {Object} o     File options
       * @return  {PizZip|Object|Array} this PizZip object (when adding a file),
       * a file (when searching by string) or an array of files (when searching by regex).
       */
      file: function file(name, data, o) {
        if (arguments.length === 1) {
          if (utils.isRegExp(name)) {
            var regexp = name;
            return this.filter(function(relativePath, file2) {
              return !file2.dir && regexp.test(relativePath);
            });
          }
          return this.filter(function(relativePath, file2) {
            return !file2.dir && relativePath === name;
          })[0] || null;
        }
        name = this.root + name;
        fileAdd.call(this, name, data, o);
        return this;
      },
      /**
       * Add a directory to the zip file, or search.
       * @param   {String|RegExp} arg The name of the directory to add, or a regex to search folders.
       * @return  {PizZip} an object with the new directory as the root, or an array containing matching folders.
       */
      folder: function folder(arg) {
        if (!arg) {
          return this;
        }
        if (utils.isRegExp(arg)) {
          return this.filter(function(relativePath, file) {
            return file.dir && arg.test(relativePath);
          });
        }
        var name = this.root + arg;
        var newFolder = folderAdd.call(this, name);
        var ret = this.shallowClone();
        ret.root = newFolder.name;
        return ret;
      },
      /**
       * Delete a file, or a directory and all sub-files, from the zip
       * @param {string} name the name of the file to delete
       * @return {PizZip} this PizZip object
       */
      remove: function remove(name) {
        name = this.root + name;
        var file = this.files[name];
        if (!file) {
          if (name.slice(-1) !== "/") {
            name += "/";
          }
          file = this.files[name];
        }
        if (file && !file.dir) {
          delete this.files[name];
        } else {
          var kids = this.filter(function(relativePath, file2) {
            return file2.name.slice(0, name.length) === name;
          });
          for (var i = 0; i < kids.length; i++) {
            delete this.files[kids[i].name];
          }
        }
        return this;
      },
      /**
       * Generate the complete zip file
       * @param {Object} options the options to generate the zip file :
       * - base64, (deprecated, use type instead) true to generate base64.
       * - compression, "STORE" by default.
       * - type, "base64" by default. Values are : string, base64, uint8array, arraybuffer, blob.
       * @return {String|Uint8Array|ArrayBuffer|Buffer|Blob} the zip file
       */
      generate: function generate(options) {
        options = utils.extend(options || {}, {
          base64: true,
          compression: "STORE",
          compressionOptions: null,
          type: "base64",
          platform: "DOS",
          comment: null,
          mimeType: "application/zip",
          encodeFileName: utf8.utf8encode
        });
        utils.checkSupport(options.type);
        if (options.platform === "darwin" || options.platform === "freebsd" || options.platform === "linux" || options.platform === "sunos") {
          options.platform = "UNIX";
        }
        if (options.platform === "win32") {
          options.platform = "DOS";
        }
        var zipData = [], encodedComment = utils.transformTo("string", options.encodeFileName(options.comment || this.comment || ""));
        var localDirLength = 0, centralDirLength = 0, writer, i;
        var fileNames = fileOrder(this.files, options.fileOrder);
        var _iterator = _createForOfIteratorHelper(fileNames), _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done; ) {
            var name = _step.value;
            if (!this.files.hasOwnProperty(name)) {
              continue;
            }
            var file = this.files[name];
            var compressionName = file.options.compression || options.compression.toUpperCase();
            var compression = compressions[compressionName];
            if (!compression) {
              throw new Error(compressionName + " is not a valid compression method !");
            }
            var compressionOptions = file.options.compressionOptions || options.compressionOptions || {};
            var compressedObject = generateCompressedObjectFrom.call(this, file, compression, compressionOptions);
            var zipPart = generateZipParts.call(this, name, file, compressedObject, localDirLength, options.platform, options.encodeFileName);
            localDirLength += zipPart.fileRecord.length + compressedObject.compressedSize;
            centralDirLength += zipPart.dirRecord.length;
            zipData.push(zipPart);
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
        var dirEnd = "";
        dirEnd = signature.CENTRAL_DIRECTORY_END + // number of this disk
        "\0\0\0\0" + // total number of entries in the central directory on this disk
        decToHex(zipData.length, 2) + // total number of entries in the central directory
        decToHex(zipData.length, 2) + // size of the central directory   4 bytes
        decToHex(centralDirLength, 4) + // offset of start of central directory with respect to the starting disk number
        decToHex(localDirLength, 4) + // .ZIP file comment length
        decToHex(encodedComment.length, 2) + // .ZIP file comment
        encodedComment;
        var typeName = options.type.toLowerCase();
        if (typeName === "uint8array" || typeName === "arraybuffer" || typeName === "blob" || typeName === "nodebuffer") {
          writer = new Uint8ArrayWriter(localDirLength + centralDirLength + dirEnd.length);
        } else {
          writer = new StringWriter(localDirLength + centralDirLength + dirEnd.length);
        }
        for (i = 0; i < zipData.length; i++) {
          writer.append(zipData[i].fileRecord);
          writer.append(zipData[i].compressedObject.compressedContent);
        }
        for (i = 0; i < zipData.length; i++) {
          writer.append(zipData[i].dirRecord);
        }
        writer.append(dirEnd);
        var zip = writer.finalize();
        switch (options.type.toLowerCase()) {
          // case "zip is an Uint8Array"
          case "uint8array":
          case "arraybuffer":
          case "nodebuffer":
            return utils.transformTo(options.type.toLowerCase(), zip);
          case "blob":
            return utils.arrayBuffer2Blob(utils.transformTo("arraybuffer", zip), options.mimeType);
          // case "zip is a string"
          case "base64":
            return options.base64 ? base64.encode(zip) : zip;
          default:
            return zip;
        }
      },
      /**
       * @deprecated
       * This method will be removed in a future version without replacement.
       */
      crc32: function crc32(input, crc) {
        return _crc(input, crc);
      },
      /**
       * @deprecated
       * This method will be removed in a future version without replacement.
       */
      utf8encode: function utf8encode(string) {
        return utils.transformTo("string", utf8.utf8encode(string));
      },
      /**
       * @deprecated
       * This method will be removed in a future version without replacement.
       */
      utf8decode: function utf8decode(input) {
        return utf8.utf8decode(input);
      }
    };
    function dataToString(asUTF8) {
      var result = getRawData(this);
      if (result === null || typeof result === "undefined") {
        return "";
      }
      if (this.options.base64) {
        result = base64.decode(result);
      }
      if (asUTF8 && this.options.binary) {
        result = out.utf8decode(result);
      } else {
        result = utils.transformTo("string", result);
      }
      if (!asUTF8 && !this.options.binary) {
        result = utils.transformTo("string", out.utf8encode(result));
      }
      return result;
    }
    function ZipObject(name, data, options) {
      this.name = name;
      this.dir = options.dir;
      this.date = options.date;
      this.comment = options.comment;
      this.unixPermissions = options.unixPermissions;
      this.dosPermissions = options.dosPermissions;
      this._data = data;
      this.options = options;
      this._initialMetadata = {
        dir: options.dir,
        date: options.date
      };
    }
    ZipObject.prototype = {
      /**
       * Return the content as UTF8 string.
       * @return {string} the UTF8 string.
       */
      asText: function asText() {
        return dataToString.call(this, true);
      },
      /**
       * Returns the binary content.
       * @return {string} the content as binary.
       */
      asBinary: function asBinary() {
        return dataToString.call(this, false);
      },
      /**
       * Returns the content as a nodejs Buffer.
       * @return {Buffer} the content as a Buffer.
       */
      asNodeBuffer: function asNodeBuffer() {
        var result = getBinaryData(this);
        return utils.transformTo("nodebuffer", result);
      },
      /**
       * Returns the content as an Uint8Array.
       * @return {Uint8Array} the content as an Uint8Array.
       */
      asUint8Array: function asUint8Array() {
        var result = getBinaryData(this);
        return utils.transformTo("uint8array", result);
      },
      /**
       * Returns the content as an ArrayBuffer.
       * @return {ArrayBuffer} the content as an ArrayBufer.
       */
      asArrayBuffer: function asArrayBuffer() {
        return this.asUint8Array().buffer;
      }
    };
    function decToHex(dec, bytes) {
      var hex = "", i;
      for (i = 0; i < bytes; i++) {
        hex += String.fromCharCode(dec & 255);
        dec >>>= 8;
      }
      return hex;
    }
    function prepareFileAttrs(o) {
      o = o || {};
      if (o.base64 === true && (o.binary === null || o.binary === void 0)) {
        o.binary = true;
      }
      o = utils.extend(o, defaults);
      o.date = o.date || /* @__PURE__ */ new Date();
      if (typeof o.compression === "string") {
        o.compression = o.compression.toUpperCase();
      } else {
        o.compression = null;
      }
      return o;
    }
    function copyCompressed(source) {
      var copy = new Uint8Array(utils.transformTo("uint8array", source.getCompressedContent()));
      return CompressedObject.from(source, function() {
        return copy;
      });
    }
    function persistData(storage, name, data, o) {
      if (data instanceof CompressedObject) {
        if (storage.shouldStore(name)) {
          return data._fileReader ? storage.compressedFromReader(data) : storage.compressed(data.getCompressedContent(), data);
        }
        if (!data._fileReader) {
          return copyCompressed(data);
        }
        return data;
      }
      if (!storage.shouldStore(name)) {
        return data;
      }
      var storageEncoding = "utf-8";
      if (typeof data === "string") {
        if (o.base64) {
          data = base64.decode(data);
          storageEncoding = "binary";
        } else if (o.binary) {
          storageEncoding = "binary";
        }
      }
      o.base64 = false;
      o.binary = true;
      return storage.write(data, typeof data === "string" ? storageEncoding : null);
    }
    function fileAdd(name, data, o) {
      var dataType = utils.getTypeOf(data), parent;
      o = prepareFileAttrs(o);
      if (typeof o.unixPermissions === "string") {
        o.unixPermissions = parseInt(o.unixPermissions, 8);
      }
      if (o.unixPermissions && o.unixPermissions & 16384) {
        o.dir = true;
      }
      if (o.dosPermissions && o.dosPermissions & 16) {
        o.dir = true;
      }
      if (o.dir) {
        name = forceTrailingSlash(name);
      }
      if (o.createFolders && (parent = parentFolder(name))) {
        folderAdd.call(this, parent, true);
      }
      if (o.dir || data === null || typeof data === "undefined") {
        o.base64 = false;
        o.binary = false;
        data = null;
        dataType = null;
      } else if (dataType === "string") {
        if (o.binary && !o.base64) {
          if (o.optimizedBinaryString !== true) {
            data = utils.string2binary(data);
          }
        }
      } else {
        o.base64 = false;
        o.binary = true;
        if (!dataType && !(data instanceof CompressedObject) && !(data && data._pizzipDiskData)) {
          throw new Error("The data of '" + name + "' is in an unsupported format !");
        }
        if (dataType === "arraybuffer") {
          data = utils.transformTo("uint8array", data);
        }
      }
      if (this._storage && data !== null) {
        data = persistData(this._storage, name, data, o);
      }
      var object = new ZipObject(name, data, o);
      this.files[name] = object;
      return object;
    }
    function parentFolder(path) {
      if (path.slice(-1) === "/") {
        path = path.substring(0, path.length - 1);
      }
      var lastSlash = path.lastIndexOf("/");
      return lastSlash > 0 ? path.substring(0, lastSlash) : "";
    }
    function forceTrailingSlash(path) {
      if (path.slice(-1) !== "/") {
        path += "/";
      }
      return path;
    }
    function folderAdd(name, createFolders) {
      createFolders = typeof createFolders !== "undefined" ? createFolders : false;
      name = forceTrailingSlash(name);
      if (!this.files[name]) {
        fileAdd.call(this, name, null, {
          dir: true,
          createFolders
        });
      }
      return this.files[name];
    }
    function generateCompressedObjectFrom(file, compression, compressionOptions) {
      var result = new CompressedObject();
      var content;
      if (file._data instanceof CompressedObject) {
        result.uncompressedSize = file._data.uncompressedSize;
        result.crc32 = file._data.crc32;
        if (result.uncompressedSize === 0 || file.dir) {
          compression = compressions.STORE;
          result.compressedContent = "";
          result.crc32 = 0;
        } else if (file._data.compressionMethod === compression.magic) {
          result.compressedContent = file._data.getCompressedContent();
        } else {
          content = file._data.getContent();
          result.compressedContent = compression.compress(utils.transformTo(compression.compressInputType, content), compressionOptions);
        }
      } else {
        content = getBinaryData(file);
        if (!content || content.length === 0 || file.dir) {
          compression = compressions.STORE;
          content = "";
        }
        result.uncompressedSize = content.length;
        result.crc32 = _crc(content);
        result.compressedContent = compression.compress(utils.transformTo(compression.compressInputType, content), compressionOptions);
      }
      result.compressedSize = result.compressedContent.length;
      result.compressionMethod = compression.magic;
      return result;
    }
    function generateUnixExternalFileAttr(unixPermissions, isDir) {
      var result = unixPermissions;
      if (!unixPermissions) {
        result = isDir ? 16893 : 33204;
      }
      return (result & 65535) << 16;
    }
    function generateDosExternalFileAttr(dosPermissions) {
      return (dosPermissions || 0) & 63;
    }
    function generateZipParts(name, file, compressedObject, offset, platform, encodeFileName) {
      var useCustomEncoding = encodeFileName !== utf8.utf8encode, encodedFileName = utils.transformTo("string", encodeFileName(file.name)), utfEncodedFileName = utils.transformTo("string", utf8.utf8encode(file.name)), comment = file.comment || "", encodedComment = utils.transformTo("string", encodeFileName(comment)), utfEncodedComment = utils.transformTo("string", utf8.utf8encode(comment)), useUTF8ForFileName = utfEncodedFileName.length !== file.name.length, useUTF8ForComment = utfEncodedComment.length !== comment.length, o = file.options;
      var dosTime, dosDate, extraFields = "", unicodePathExtraField = "", unicodeCommentExtraField = "", dir, date;
      if (file._initialMetadata.dir !== file.dir) {
        dir = file.dir;
      } else {
        dir = o.dir;
      }
      if (file._initialMetadata.date !== file.date) {
        date = file.date;
      } else {
        date = o.date;
      }
      var extFileAttr = 0;
      var versionMadeBy = 0;
      if (dir) {
        extFileAttr |= 16;
      }
      if (platform === "UNIX") {
        versionMadeBy = 798;
        extFileAttr |= generateUnixExternalFileAttr(file.unixPermissions, dir);
      } else {
        versionMadeBy = 20;
        extFileAttr |= generateDosExternalFileAttr(file.dosPermissions, dir);
      }
      dosTime = date.getHours();
      dosTime <<= 6;
      dosTime |= date.getMinutes();
      dosTime <<= 5;
      dosTime |= date.getSeconds() / 2;
      dosDate = date.getFullYear() - 1980;
      dosDate <<= 4;
      dosDate |= date.getMonth() + 1;
      dosDate <<= 5;
      dosDate |= date.getDate();
      if (useUTF8ForFileName) {
        unicodePathExtraField = // Version
        decToHex(1, 1) + // NameCRC32
        decToHex(_crc(encodedFileName), 4) + // UnicodeName
        utfEncodedFileName;
        extraFields += // Info-ZIP Unicode Path Extra Field
        "up" + // size
        decToHex(unicodePathExtraField.length, 2) + // content
        unicodePathExtraField;
      }
      if (useUTF8ForComment) {
        unicodeCommentExtraField = // Version
        decToHex(1, 1) + // CommentCRC32
        decToHex(this.crc32(encodedComment), 4) + // UnicodeName
        utfEncodedComment;
        extraFields += // Info-ZIP Unicode Path Extra Field
        "uc" + // size
        decToHex(unicodeCommentExtraField.length, 2) + // content
        unicodeCommentExtraField;
      }
      var header = "";
      header += "\n\0";
      header += !useCustomEncoding && (useUTF8ForFileName || useUTF8ForComment) ? "\0\b" : "\0\0";
      header += compressedObject.compressionMethod;
      header += decToHex(dosTime, 2);
      header += decToHex(dosDate, 2);
      header += decToHex(compressedObject.crc32, 4);
      header += decToHex(compressedObject.compressedSize, 4);
      header += decToHex(compressedObject.uncompressedSize, 4);
      header += decToHex(encodedFileName.length, 2);
      header += decToHex(extraFields.length, 2);
      var fileRecord = signature.LOCAL_FILE_HEADER + header + encodedFileName + extraFields;
      var dirRecord = signature.CENTRAL_FILE_HEADER + // version made by (00: DOS)
      decToHex(versionMadeBy, 2) + // file header (common to file and central directory)
      header + // file comment length
      decToHex(encodedComment.length, 2) + // disk number start
      "\0\0\0\0" + // external file attributes
      decToHex(extFileAttr, 4) + // relative offset of local header
      decToHex(offset, 4) + // file name
      encodedFileName + // extra field
      extraFields + // file comment
      encodedComment;
      return {
        fileRecord,
        dirRecord,
        compressedObject
      };
    }
    module.exports = out;
  }
});

// node_modules/pizzip/js/stringReader.js
var require_stringReader = __commonJS({
  "node_modules/pizzip/js/stringReader.js"(exports, module) {
    "use strict";
    var DataReader = require_dataReader();
    var utils = require_utils();
    function StringReader(data, optimizedBinaryString) {
      this.data = data;
      if (!optimizedBinaryString) {
        this.data = utils.string2binary(this.data);
      }
      this.length = this.data.length;
      this.index = 0;
      this.zero = 0;
    }
    StringReader.prototype = new DataReader();
    StringReader.prototype.byteAt = function(i) {
      return this.data.charCodeAt(this.zero + i);
    };
    StringReader.prototype.lastIndexOfSignature = function(sig) {
      return this.data.lastIndexOf(sig) - this.zero;
    };
    StringReader.prototype.readData = function(size) {
      this.checkOffset(size);
      var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
      this.index += size;
      return result;
    };
    module.exports = StringReader;
  }
});

// node_modules/pizzip/js/arrayReader.js
var require_arrayReader = __commonJS({
  "node_modules/pizzip/js/arrayReader.js"(exports, module) {
    "use strict";
    var DataReader = require_dataReader();
    function ArrayReader(data) {
      if (data) {
        this.data = data;
        this.length = this.data.length;
        this.index = 0;
        this.zero = 0;
        for (var i = 0; i < this.data.length; i++) {
          data[i] &= data[i];
        }
      }
    }
    ArrayReader.prototype = new DataReader();
    ArrayReader.prototype.byteAt = function(i) {
      return this.data[this.zero + i];
    };
    ArrayReader.prototype.lastIndexOfSignature = function(sig) {
      var sig0 = sig.charCodeAt(0), sig1 = sig.charCodeAt(1), sig2 = sig.charCodeAt(2), sig3 = sig.charCodeAt(3);
      for (var i = this.length - 4; i >= 0; --i) {
        if (this.data[i] === sig0 && this.data[i + 1] === sig1 && this.data[i + 2] === sig2 && this.data[i + 3] === sig3) {
          return i - this.zero;
        }
      }
      return -1;
    };
    ArrayReader.prototype.readData = function(size) {
      this.checkOffset(size);
      if (size === 0) {
        return [];
      }
      var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
      this.index += size;
      return result;
    };
    module.exports = ArrayReader;
  }
});

// node_modules/pizzip/js/uint8ArrayReader.js
var require_uint8ArrayReader = __commonJS({
  "node_modules/pizzip/js/uint8ArrayReader.js"(exports, module) {
    "use strict";
    var ArrayReader = require_arrayReader();
    function Uint8ArrayReader(data) {
      if (data) {
        this.data = data;
        this.length = this.data.length;
        this.index = 0;
        this.zero = 0;
      }
    }
    Uint8ArrayReader.prototype = new ArrayReader();
    Uint8ArrayReader.prototype.readData = function(size) {
      this.checkOffset(size);
      if (size === 0) {
        return new Uint8Array(0);
      }
      var result = this.data.subarray(this.zero + this.index, this.zero + this.index + size);
      this.index += size;
      return result;
    };
    module.exports = Uint8ArrayReader;
  }
});

// node_modules/pizzip/js/nodeBufferReader.js
var require_nodeBufferReader = __commonJS({
  "node_modules/pizzip/js/nodeBufferReader.js"(exports, module) {
    "use strict";
    var Uint8ArrayReader = require_uint8ArrayReader();
    function NodeBufferReader(data) {
      this.data = data;
      this.length = this.data.length;
      this.index = 0;
      this.zero = 0;
    }
    NodeBufferReader.prototype = new Uint8ArrayReader();
    NodeBufferReader.prototype.readData = function(size) {
      this.checkOffset(size);
      var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
      this.index += size;
      return result;
    };
    module.exports = NodeBufferReader;
  }
});

// node_modules/pizzip/js/zipEntry.js
var require_zipEntry = __commonJS({
  "node_modules/pizzip/js/zipEntry.js"(exports, module) {
    "use strict";
    var StringReader = require_stringReader();
    var utils = require_utils();
    var CompressedObject = require_compressedObject();
    var pizzipProto = require_object();
    var support = require_support();
    var MADE_BY_DOS = 0;
    var MADE_BY_UNIX = 3;
    function ZipEntry(options, loadOptions) {
      this.options = options;
      this.loadOptions = loadOptions;
    }
    ZipEntry.prototype = {
      /**
       * say if the file is encrypted.
       * @return {boolean} true if the file is encrypted, false otherwise.
       */
      isEncrypted: function isEncrypted() {
        return (this.bitFlag & 1) === 1;
      },
      /**
       * say if the file has utf-8 filename/comment.
       * @return {boolean} true if the filename/comment is in utf-8, false otherwise.
       */
      useUTF8: function useUTF8() {
        return (this.bitFlag & 2048) === 2048;
      },
      /**
       * Prepare the function used to generate the compressed content from this ZipFile.
       * @param {DataReader} reader the reader to use.
       * @param {number} from the offset from where we should read the data.
       * @param {number} length the length of the data to read.
       * @return {Function} the callback to get the compressed content (the type depends of the DataReader class).
       */
      prepareCompressedContent: function prepareCompressedContent(reader, from, length) {
        return function() {
          var previousIndex = reader.index;
          reader.setIndex(from);
          var compressedFileData = reader.readData(length);
          reader.setIndex(previousIndex);
          return compressedFileData;
        };
      },
      /**
       * Prepare the function used to generate the uncompressed content from this ZipFile.
       * @param {DataReader} reader the reader to use.
       * @param {number} from the offset from where we should read the data.
       * @param {number} length the length of the data to read.
       * @param {PizZip.compression} compression the compression used on this file.
       * @param {number} uncompressedSize the uncompressed size to expect.
       * @return {Function} the callback to get the uncompressed content (the type depends of the DataReader class).
       */
      prepareContent: function prepareContent(reader, from, length, compression, uncompressedSize) {
        return function() {
          var compressedFileData = utils.transformTo(compression.uncompressInputType, this.getCompressedContent());
          var uncompressedFileData = compression.uncompress(compressedFileData);
          if (uncompressedFileData.length !== uncompressedSize) {
            throw new Error("Bug : uncompressed data size mismatch");
          }
          return uncompressedFileData;
        };
      },
      /**
       * Read the local part of a zip file and add the info in this object.
       * @param {DataReader} reader the reader to use.
       */
      readLocalPart: function readLocalPart(reader) {
        reader.skip(22);
        this.fileNameLength = reader.readInt(2);
        var localExtraFieldsLength = reader.readInt(2);
        this.fileName = reader.readData(this.fileNameLength);
        reader.skip(localExtraFieldsLength);
        if (this.compressedSize === -1 || this.uncompressedSize === -1) {
          throw new Error("Bug or corrupted zip : didn't get enough informations from the central directory (compressedSize == -1 || uncompressedSize == -1)");
        }
        var compression = utils.findCompression(this.compressionMethod);
        if (compression === null) {
          throw new Error("Corrupted zip : compression " + utils.pretty(this.compressionMethod) + " unknown (inner file : " + utils.transformTo("string", this.fileName) + ")");
        }
        this.decompressed = new CompressedObject();
        this.decompressed.compressedSize = this.compressedSize;
        this.decompressed.uncompressedSize = this.uncompressedSize;
        this.decompressed.crc32 = this.crc32;
        this.decompressed.compressionMethod = this.compressionMethod;
        this.decompressed.getCompressedContent = this.prepareCompressedContent(reader, reader.index, this.compressedSize, compression);
        this.decompressed.getContent = this.prepareContent(reader, reader.index, this.compressedSize, compression, this.uncompressedSize);
        if (reader._pizzipFileReader) {
          if (this.compressedSize < 0 || this.uncompressedSize < 0) {
            throw new Error("Corrupted zip : invalid entry size");
          }
          reader.checkOffset(this.compressedSize);
          this.decompressed._fileReader = reader;
          this.decompressed._fileOffset = reader.zero + reader.index;
        }
        if (this.loadOptions.checkCRC32) {
          if (reader.checkCRC32) {
            reader.checkCRC32(this.decompressed);
            return;
          }
          this.decompressed = utils.transformTo("string", this.decompressed.getContent());
          if (pizzipProto.crc32(this.decompressed) !== this.crc32) {
            throw new Error("Corrupted zip : CRC32 mismatch");
          }
        }
      },
      /**
       * Read the central part of a zip file and add the info in this object.
       * @param {DataReader} reader the reader to use.
       */
      readCentralPart: function readCentralPart(reader) {
        this.versionMadeBy = reader.readInt(2);
        this.versionNeeded = reader.readInt(2);
        this.bitFlag = reader.readInt(2);
        this.compressionMethod = reader.readString(2);
        this.date = reader.readDate();
        this.crc32 = reader.readInt(4);
        this.compressedSize = reader.readInt(4);
        this.uncompressedSize = reader.readInt(4);
        this.fileNameLength = reader.readInt(2);
        this.extraFieldsLength = reader.readInt(2);
        this.fileCommentLength = reader.readInt(2);
        this.diskNumberStart = reader.readInt(2);
        this.internalFileAttributes = reader.readInt(2);
        this.externalFileAttributes = reader.readInt(4);
        this.localHeaderOffset = reader.readInt(4);
        if (this.isEncrypted()) {
          throw new Error("Encrypted zip are not supported");
        }
        this.fileName = reader.readData(this.fileNameLength);
        this.readExtraFields(reader);
        this.parseZIP64ExtraField(reader);
        this.fileComment = reader.readData(this.fileCommentLength);
      },
      /**
       * Parse the external file attributes and get the unix/dos permissions.
       */
      processAttributes: function processAttributes() {
        this.unixPermissions = null;
        this.dosPermissions = null;
        var madeBy = this.versionMadeBy >> 8;
        this.dir = !!(this.externalFileAttributes & 16);
        if (madeBy === MADE_BY_DOS) {
          this.dosPermissions = this.externalFileAttributes & 63;
        }
        if (madeBy === MADE_BY_UNIX) {
          this.unixPermissions = this.externalFileAttributes >> 16 & 65535;
        }
        if (!this.dir && this.fileNameStr.slice(-1) === "/") {
          this.dir = true;
        }
      },
      /**
       * Parse the ZIP64 extra field and merge the info in the current ZipEntry.
       */
      parseZIP64ExtraField: function parseZIP64ExtraField() {
        if (!this.extraFields[1]) {
          return;
        }
        var extraReader = new StringReader(this.extraFields[1].value);
        if (this.uncompressedSize === utils.MAX_VALUE_32BITS) {
          this.uncompressedSize = extraReader.readInt(8);
        }
        if (this.compressedSize === utils.MAX_VALUE_32BITS) {
          this.compressedSize = extraReader.readInt(8);
        }
        if (this.localHeaderOffset === utils.MAX_VALUE_32BITS) {
          this.localHeaderOffset = extraReader.readInt(8);
        }
        if (this.diskNumberStart === utils.MAX_VALUE_32BITS) {
          this.diskNumberStart = extraReader.readInt(4);
        }
      },
      /**
       * Read the central part of a zip file and add the info in this object.
       * @param {DataReader} reader the reader to use.
       */
      readExtraFields: function readExtraFields(reader) {
        var start = reader.index;
        var extraFieldId, extraFieldLength, extraFieldValue;
        this.extraFields = this.extraFields || {};
        while (reader.index < start + this.extraFieldsLength) {
          extraFieldId = reader.readInt(2);
          extraFieldLength = reader.readInt(2);
          extraFieldValue = reader.readString(extraFieldLength);
          this.extraFields[extraFieldId] = {
            id: extraFieldId,
            length: extraFieldLength,
            value: extraFieldValue
          };
        }
      },
      /**
       * Apply an UTF8 transformation if needed.
       */
      handleUTF8: function handleUTF8() {
        var decodeParamType = support.uint8array ? "uint8array" : "array";
        if (this.useUTF8()) {
          this.fileNameStr = pizzipProto.utf8decode(this.fileName);
          this.fileCommentStr = pizzipProto.utf8decode(this.fileComment);
        } else {
          var upath = this.findExtraFieldUnicodePath();
          if (upath !== null) {
            this.fileNameStr = upath;
          } else {
            var fileNameByteArray = utils.transformTo(decodeParamType, this.fileName);
            this.fileNameStr = this.loadOptions.decodeFileName(fileNameByteArray);
          }
          var ucomment = this.findExtraFieldUnicodeComment();
          if (ucomment !== null) {
            this.fileCommentStr = ucomment;
          } else {
            var commentByteArray = utils.transformTo(decodeParamType, this.fileComment);
            this.fileCommentStr = this.loadOptions.decodeFileName(commentByteArray);
          }
        }
      },
      /**
       * Find the unicode path declared in the extra field, if any.
       * @return {String} the unicode path, null otherwise.
       */
      findExtraFieldUnicodePath: function findExtraFieldUnicodePath() {
        var upathField = this.extraFields[28789];
        if (upathField) {
          var extraReader = new StringReader(upathField.value);
          if (extraReader.readInt(1) !== 1) {
            return null;
          }
          if (pizzipProto.crc32(this.fileName) !== extraReader.readInt(4)) {
            return null;
          }
          return pizzipProto.utf8decode(extraReader.readString(upathField.length - 5));
        }
        return null;
      },
      /**
       * Find the unicode comment declared in the extra field, if any.
       * @return {String} the unicode comment, null otherwise.
       */
      findExtraFieldUnicodeComment: function findExtraFieldUnicodeComment() {
        var ucommentField = this.extraFields[25461];
        if (ucommentField) {
          var extraReader = new StringReader(ucommentField.value);
          if (extraReader.readInt(1) !== 1) {
            return null;
          }
          if (pizzipProto.crc32(this.fileComment) !== extraReader.readInt(4)) {
            return null;
          }
          return pizzipProto.utf8decode(extraReader.readString(ucommentField.length - 5));
        }
        return null;
      }
    };
    module.exports = ZipEntry;
  }
});

// node_modules/pizzip/js/zipEntries.js
var require_zipEntries = __commonJS({
  "node_modules/pizzip/js/zipEntries.js"(exports, module) {
    "use strict";
    var StringReader = require_stringReader();
    var NodeBufferReader = require_nodeBufferReader();
    var Uint8ArrayReader = require_uint8ArrayReader();
    var ArrayReader = require_arrayReader();
    var utils = require_utils();
    var sig = require_signature();
    var ZipEntry = require_zipEntry();
    var support = require_support();
    function ZipEntries(data, loadOptions) {
      this.files = [];
      this.loadOptions = loadOptions;
      if (data) {
        this.load(data);
      }
    }
    ZipEntries.prototype = {
      /**
       * Check that the reader is on the speficied signature.
       * @param {string} expectedSignature the expected signature.
       * @throws {Error} if it is an other signature.
       */
      checkSignature: function checkSignature(expectedSignature) {
        var signature = this.reader.readString(4);
        if (signature !== expectedSignature) {
          throw new Error("Corrupted zip or bug : unexpected signature (" + utils.pretty(signature) + ", expected " + utils.pretty(expectedSignature) + ")");
        }
      },
      /**
       * Check if the given signature is at the given index.
       * @param {number} askedIndex the index to check.
       * @param {string} expectedSignature the signature to expect.
       * @return {boolean} true if the signature is here, false otherwise.
       */
      isSignature: function isSignature(askedIndex, expectedSignature) {
        var currentIndex = this.reader.index;
        this.reader.setIndex(askedIndex);
        var signature = this.reader.readString(4);
        var result = signature === expectedSignature;
        this.reader.setIndex(currentIndex);
        return result;
      },
      /**
       * Read the end of the central directory.
       */
      readBlockEndOfCentral: function readBlockEndOfCentral() {
        this.diskNumber = this.reader.readInt(2);
        this.diskWithCentralDirStart = this.reader.readInt(2);
        this.centralDirRecordsOnThisDisk = this.reader.readInt(2);
        this.centralDirRecords = this.reader.readInt(2);
        this.centralDirSize = this.reader.readInt(4);
        this.centralDirOffset = this.reader.readInt(4);
        this.zipCommentLength = this.reader.readInt(2);
        var zipComment = this.reader.readData(this.zipCommentLength);
        var decodeParamType = support.uint8array ? "uint8array" : "array";
        var decodeContent = utils.transformTo(decodeParamType, zipComment);
        this.zipComment = this.loadOptions.decodeFileName(decodeContent);
      },
      /**
       * Read the end of the Zip 64 central directory.
       * Not merged with the method readEndOfCentral :
       * The end of central can coexist with its Zip64 brother,
       * I don't want to read the wrong number of bytes !
       */
      readBlockZip64EndOfCentral: function readBlockZip64EndOfCentral() {
        this.zip64EndOfCentralSize = this.reader.readInt(8);
        this.versionMadeBy = this.reader.readString(2);
        this.versionNeeded = this.reader.readInt(2);
        this.diskNumber = this.reader.readInt(4);
        this.diskWithCentralDirStart = this.reader.readInt(4);
        this.centralDirRecordsOnThisDisk = this.reader.readInt(8);
        this.centralDirRecords = this.reader.readInt(8);
        this.centralDirSize = this.reader.readInt(8);
        this.centralDirOffset = this.reader.readInt(8);
        this.zip64ExtensibleData = {};
        var extraDataSize = this.zip64EndOfCentralSize - 44;
        var index = 0;
        var extraFieldId, extraFieldLength, extraFieldValue;
        while (index < extraDataSize) {
          extraFieldId = this.reader.readInt(2);
          extraFieldLength = this.reader.readInt(4);
          extraFieldValue = this.reader.readString(extraFieldLength);
          this.zip64ExtensibleData[extraFieldId] = {
            id: extraFieldId,
            length: extraFieldLength,
            value: extraFieldValue
          };
        }
      },
      /**
       * Read the end of the Zip 64 central directory locator.
       */
      readBlockZip64EndOfCentralLocator: function readBlockZip64EndOfCentralLocator() {
        this.diskWithZip64CentralDirStart = this.reader.readInt(4);
        this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8);
        this.disksCount = this.reader.readInt(4);
        if (this.disksCount > 1) {
          throw new Error("Multi-volumes zip are not supported");
        }
      },
      /**
       * Read the local files, based on the offset read in the central part.
       */
      readLocalFiles: function readLocalFiles() {
        var i, file;
        for (i = 0; i < this.files.length; i++) {
          file = this.files[i];
          this.reader.setIndex(file.localHeaderOffset);
          this.checkSignature(sig.LOCAL_FILE_HEADER);
          file.readLocalPart(this.reader);
          file.handleUTF8();
          file.processAttributes();
        }
      },
      /**
       * Read the central directory.
       */
      readCentralDir: function readCentralDir() {
        var file;
        this.reader.setIndex(this.centralDirOffset);
        while (this.reader.readString(4) === sig.CENTRAL_FILE_HEADER) {
          file = new ZipEntry({
            zip64: this.zip64
          }, this.loadOptions);
          file.readCentralPart(this.reader);
          this.files.push(file);
        }
        if (this.centralDirRecords !== this.files.length) {
          if (this.centralDirRecords !== 0 && this.files.length === 0) {
            throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
          } else {
          }
        }
      },
      /**
       * Read the end of central directory.
       */
      readEndOfCentral: function readEndOfCentral() {
        var offset = this.reader.lastIndexOfSignature(sig.CENTRAL_DIRECTORY_END);
        if (offset < 0) {
          var isGarbage = !this.isSignature(0, sig.LOCAL_FILE_HEADER);
          if (isGarbage) {
            throw new Error("Can't find end of central directory : is this a zip file ?");
          } else {
            throw new Error("Corrupted zip : can't find end of central directory");
          }
        }
        this.reader.setIndex(offset);
        var endOfCentralDirOffset = offset;
        this.checkSignature(sig.CENTRAL_DIRECTORY_END);
        this.readBlockEndOfCentral();
        if (this.diskNumber === utils.MAX_VALUE_16BITS || this.diskWithCentralDirStart === utils.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === utils.MAX_VALUE_16BITS || this.centralDirRecords === utils.MAX_VALUE_16BITS || this.centralDirSize === utils.MAX_VALUE_32BITS || this.centralDirOffset === utils.MAX_VALUE_32BITS) {
          this.zip64 = true;
          offset = this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
          if (offset < 0) {
            throw new Error("Corrupted zip : can't find the ZIP64 end of central directory locator");
          }
          this.reader.setIndex(offset);
          this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
          this.readBlockZip64EndOfCentralLocator();
          if (!this.isSignature(this.relativeOffsetEndOfZip64CentralDir, sig.ZIP64_CENTRAL_DIRECTORY_END)) {
            this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_END);
            if (this.relativeOffsetEndOfZip64CentralDir < 0) {
              throw new Error("Corrupted zip : can't find the ZIP64 end of central directory");
            }
          }
          this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir);
          this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_END);
          this.readBlockZip64EndOfCentral();
        }
        var expectedEndOfCentralDirOffset = this.centralDirOffset + this.centralDirSize;
        if (this.zip64) {
          expectedEndOfCentralDirOffset += 20;
          expectedEndOfCentralDirOffset += 12 + this.zip64EndOfCentralSize;
        }
        var extraBytes = endOfCentralDirOffset - expectedEndOfCentralDirOffset;
        if (extraBytes > 0) {
          if (this.isSignature(endOfCentralDirOffset, sig.CENTRAL_FILE_HEADER)) {
          } else {
            this.reader.zero = extraBytes;
          }
        } else if (extraBytes < 0) {
          throw new Error("Corrupted zip: missing " + Math.abs(extraBytes) + " bytes.");
        }
      },
      prepareReader: function prepareReader(data) {
        if (data && data._pizzipFileReader) {
          this.reader = data;
          return;
        }
        var type = utils.getTypeOf(data);
        utils.checkSupport(type);
        if (type === "string" && !support.uint8array) {
          this.reader = new StringReader(data, this.loadOptions.optimizedBinaryString);
        } else if (type === "nodebuffer") {
          this.reader = new NodeBufferReader(data);
        } else if (support.uint8array) {
          this.reader = new Uint8ArrayReader(utils.transformTo("uint8array", data));
        } else if (support.array) {
          this.reader = new ArrayReader(utils.transformTo("array", data));
        } else {
          throw new Error("Unexpected error: unsupported type '" + type + "'");
        }
      },
      /**
       * Read a zip file and create ZipEntries.
       * @param {String|ArrayBuffer|Uint8Array|Buffer} data the binary string representing a zip file.
       */
      load: function load(data) {
        this.prepareReader(data);
        this.readEndOfCentral();
        this.readCentralDir();
        this.readLocalFiles();
      }
    };
    module.exports = ZipEntries;
  }
});

// node_modules/pizzip/js/load.js
var require_load = __commonJS({
  "node_modules/pizzip/js/load.js"(exports, module) {
    "use strict";
    var base64 = require_base64();
    var utf8 = require_utf8();
    var utils = require_utils();
    var ZipEntries = require_zipEntries();
    module.exports = function(data, options) {
      var i, input;
      options = utils.extend(options || {}, {
        base64: false,
        checkCRC32: false,
        optimizedBinaryString: false,
        createFolders: false,
        decodeFileName: utf8.utf8decode
      });
      if (options.base64) {
        data = base64.decode(data);
      }
      var zipEntries = new ZipEntries(data, options);
      var files = zipEntries.files;
      for (i = 0; i < files.length; i++) {
        input = files[i];
        this.file(input.fileNameStr, input.decompressed, {
          binary: true,
          optimizedBinaryString: true,
          date: input.date,
          dir: input.dir,
          comment: input.fileCommentStr.length ? input.fileCommentStr : null,
          unixPermissions: input.unixPermissions,
          dosPermissions: input.dosPermissions,
          createFolders: options.createFolders
        });
      }
      if (zipEntries.zipComment.length) {
        this.comment = zipEntries.zipComment;
      }
      return this;
    };
  }
});

// node_modules/pizzip/js/loadFile.js
var require_loadFile = __commonJS({
  "node_modules/pizzip/js/loadFile.js"(exports, module) {
    "use strict";
    var FileReader = require_fileReader();
    module.exports = function(file, options) {
      var reader = new FileReader(file, {
        chunkSize: options && options.chunkSize !== void 0 ? options.chunkSize : this._chunkSize
      });
      var snapshot = Object.assign({}, this.files);
      var comment = this.comment;
      try {
        this.load(reader, options);
        this._readers.add(reader);
        return this;
      } catch (error) {
        for (var _i = 0, _Object$keys = Object.keys(this.files); _i < _Object$keys.length; _i++) {
          var name = _Object$keys[_i];
          delete this.files[name];
        }
        Object.assign(this.files, snapshot);
        this.comment = comment;
        reader.dispose();
        throw error;
      }
    };
  }
});

// node_modules/pizzip/js/deprecatedPublicUtils.js
var require_deprecatedPublicUtils = __commonJS({
  "node_modules/pizzip/js/deprecatedPublicUtils.js"(exports) {
    "use strict";
    var utils = require_utils();
    exports.string2binary = function(str) {
      return utils.string2binary(str);
    };
    exports.string2Uint8Array = function(str) {
      return utils.transformTo("uint8array", str);
    };
    exports.uint8Array2String = function(array) {
      return utils.transformTo("string", array);
    };
    exports.string2Blob = function(str) {
      var buffer = utils.transformTo("arraybuffer", str);
      return utils.arrayBuffer2Blob(buffer);
    };
    exports.arrayBuffer2Blob = function(buffer) {
      return utils.arrayBuffer2Blob(buffer);
    };
    exports.transformTo = function(outputType, input) {
      return utils.transformTo(outputType, input);
    };
    exports.getTypeOf = function(input) {
      return utils.getTypeOf(input);
    };
    exports.checkSupport = function(type) {
      return utils.checkSupport(type);
    };
    exports.MAX_VALUE_16BITS = utils.MAX_VALUE_16BITS;
    exports.MAX_VALUE_32BITS = utils.MAX_VALUE_32BITS;
    exports.pretty = function(str) {
      return utils.pretty(str);
    };
    exports.findCompression = function(compressionMethod) {
      return utils.findCompression(compressionMethod);
    };
    exports.isRegExp = function(object) {
      return utils.isRegExp(object);
    };
  }
});

// node_modules/pizzip/js/node-stream.js
var require_node_stream = __commonJS({
  "node_modules/pizzip/js/node-stream.js"(exports, module) {
    "use strict";
    function _typeof(o) {
      "@babel/helpers - typeof";
      return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
        return typeof o2;
      } : function(o2) {
        return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
      }, _typeof(o);
    }
    function _createForOfIteratorHelper(r, e) {
      var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
      if (!t) {
        if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) {
          t && (r = t);
          var _n = 0, F = function F2() {
          };
          return { s: F, n: function n() {
            return _n >= r.length ? { done: true } : { done: false, value: r[_n++] };
          }, e: function e2(r2) {
            throw r2;
          }, f: F };
        }
        throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
      }
      var o, a = true, u = false;
      return { s: function s() {
        t = t.call(r);
      }, n: function n() {
        var r2 = t.next();
        return a = r2.done, r2;
      }, e: function e2(r2) {
        u = true, o = r2;
      }, f: function f() {
        try {
          a || null == t["return"] || t["return"]();
        } finally {
          if (u) throw o;
        }
      } };
    }
    function _unsupportedIterableToArray(r, a) {
      if (r) {
        if ("string" == typeof r) return _arrayLikeToArray(r, a);
        var t = {}.toString.call(r).slice(8, -1);
        return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
      }
    }
    function _arrayLikeToArray(r, a) {
      (null == a || a > r.length) && (a = r.length);
      for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
      return n;
    }
    function ownKeys(e, r) {
      var t = Object.keys(e);
      if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r && (o = o.filter(function(r2) {
          return Object.getOwnPropertyDescriptor(e, r2).enumerable;
        })), t.push.apply(t, o);
      }
      return t;
    }
    function _objectSpread(e) {
      for (var r = 1; r < arguments.length; r++) {
        var t = null != arguments[r] ? arguments[r] : {};
        r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
          _defineProperty(e, r2, t[r2]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
          Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
        });
      }
      return e;
    }
    function _defineProperty(e, r, t) {
      return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
    }
    function _toPropertyKey(t) {
      var i = _toPrimitive(t, "string");
      return "symbol" == _typeof(i) ? i : i + "";
    }
    function _toPrimitive(t, r) {
      if ("object" != _typeof(t) || !t) return t;
      var e = t[Symbol.toPrimitive];
      if (void 0 !== e) {
        var i = e.call(t, r || "default");
        if ("object" != _typeof(i)) return i;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return ("string" === r ? String : Number)(t);
    }
    function _regeneratorRuntime() {
      "use strict";
      var r = _regenerator(), e = r.m(_regeneratorRuntime), t = (Object.getPrototypeOf ? Object.getPrototypeOf(e) : e.__proto__).constructor;
      function n(r2) {
        var e2 = "function" == typeof r2 && r2.constructor;
        return !!e2 && (e2 === t || "GeneratorFunction" === (e2.displayName || e2.name));
      }
      var o = { "throw": 1, "return": 2, "break": 3, "continue": 3 };
      function a(r2) {
        var e2, t2;
        return function(n2) {
          e2 || (e2 = { stop: function stop() {
            return t2(n2.a, 2);
          }, "catch": function _catch() {
            return n2.v;
          }, abrupt: function abrupt(r3, e3) {
            return t2(n2.a, o[r3], e3);
          }, delegateYield: function delegateYield(r3, o2, a2) {
            return e2.resultName = o2, t2(n2.d, _regeneratorValues(r3), a2);
          }, finish: function finish(r3) {
            return t2(n2.f, r3);
          } }, t2 = function t3(r3, _t, o2) {
            n2.p = e2.prev, n2.n = e2.next;
            try {
              return r3(_t, o2);
            } finally {
              e2.next = n2.n;
            }
          }), e2.resultName && (e2[e2.resultName] = n2.v, e2.resultName = void 0), e2.sent = n2.v, e2.next = n2.n;
          try {
            return r2.call(this, e2);
          } finally {
            n2.p = e2.prev, n2.n = e2.next;
          }
        };
      }
      return (_regeneratorRuntime = function _regeneratorRuntime2() {
        return { wrap: function wrap(e2, t2, n2, o2) {
          return r.w(a(e2), t2, n2, o2 && o2.reverse());
        }, isGeneratorFunction: n, mark: r.m, awrap: function awrap(r2, e2) {
          return new _OverloadYield(r2, e2);
        }, AsyncIterator: _regeneratorAsyncIterator, async: function async(r2, e2, t2, o2, u) {
          return (n(e2) ? _regeneratorAsyncGen : _regeneratorAsync)(a(r2), e2, t2, o2, u);
        }, keys: _regeneratorKeys, values: _regeneratorValues };
      })();
    }
    function _regeneratorValues(e) {
      if (null != e) {
        var t = e["function" == typeof Symbol && Symbol.iterator || "@@iterator"], r = 0;
        if (t) return t.call(e);
        if ("function" == typeof e.next) return e;
        if (!isNaN(e.length)) return { next: function next() {
          return e && r >= e.length && (e = void 0), { value: e && e[r++], done: !e };
        } };
      }
      throw new TypeError(_typeof(e) + " is not iterable");
    }
    function _regeneratorKeys(e) {
      var n = Object(e), r = [];
      for (var t in n) r.unshift(t);
      return function e2() {
        for (; r.length; ) if ((t = r.pop()) in n) return e2.value = t, e2.done = false, e2;
        return e2.done = true, e2;
      };
    }
    function _regeneratorAsync(n, e, r, t, o) {
      var a = _regeneratorAsyncGen(n, e, r, t, o);
      return a.next().then(function(n2) {
        return n2.done ? n2.value : a.next();
      });
    }
    function _regeneratorAsyncGen(r, e, t, o, n) {
      return new _regeneratorAsyncIterator(_regenerator().w(r, e, t, o), n || Promise);
    }
    function _regeneratorAsyncIterator(t, e) {
      function n(r2, o, i, f) {
        try {
          var c = t[r2](o), u = c.value;
          return u instanceof _OverloadYield ? e.resolve(u.v).then(function(t2) {
            n("next", t2, i, f);
          }, function(t2) {
            n("throw", t2, i, f);
          }) : e.resolve(u).then(function(t2) {
            c.value = t2, i(c);
          }, function(t2) {
            return n("throw", t2, i, f);
          });
        } catch (t2) {
          f(t2);
        }
      }
      var r;
      this.next || (_regeneratorDefine2(_regeneratorAsyncIterator.prototype), _regeneratorDefine2(_regeneratorAsyncIterator.prototype, "function" == typeof Symbol && Symbol.asyncIterator || "@asyncIterator", function() {
        return this;
      })), _regeneratorDefine2(this, "_invoke", function(t2, o, i) {
        function f() {
          return new e(function(e2, r2) {
            n(t2, i, e2, r2);
          });
        }
        return r = r ? r.then(f, f) : f();
      }, true);
    }
    function _regenerator() {
      var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag";
      function i(r2, n2, o2, i2) {
        var c2 = n2 && n2.prototype instanceof Generator ? n2 : Generator, u2 = Object.create(c2.prototype);
        return _regeneratorDefine2(u2, "_invoke", (function(r3, n3, o3) {
          var i3, c3, u3, f2 = 0, p = o3 || [], y = false, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d2(t2, r4) {
            return i3 = t2, c3 = 0, u3 = e, G.n = r4, a;
          } };
          function d(r4, n4) {
            for (c3 = r4, u3 = n4, t = 0; !y && f2 && !o4 && t < p.length; t++) {
              var o4, i4 = p[t], d2 = G.p, l = i4[2];
              r4 > 3 ? (o4 = l === n4) && (u3 = i4[(c3 = i4[4]) ? 5 : (c3 = 3, 3)], i4[4] = i4[5] = e) : i4[0] <= d2 && ((o4 = r4 < 2 && d2 < i4[1]) ? (c3 = 0, G.v = n4, G.n = i4[1]) : d2 < l && (o4 = r4 < 3 || i4[0] > n4 || n4 > l) && (i4[4] = r4, i4[5] = n4, G.n = l, c3 = 0));
            }
            if (o4 || r4 > 1) return a;
            throw y = true, n4;
          }
          return function(o4, p2, l) {
            if (f2 > 1) throw TypeError("Generator is already running");
            for (y && 1 === p2 && d(p2, l), c3 = p2, u3 = l; (t = c3 < 2 ? e : u3) || !y; ) {
              i3 || (c3 ? c3 < 3 ? (c3 > 1 && (G.n = -1), d(c3, u3)) : G.n = u3 : G.v = u3);
              try {
                if (f2 = 2, i3) {
                  if (c3 || (o4 = "next"), t = i3[o4]) {
                    if (!(t = t.call(i3, u3))) throw TypeError("iterator result is not an object");
                    if (!t.done) return t;
                    u3 = t.value, c3 < 2 && (c3 = 0);
                  } else 1 === c3 && (t = i3["return"]) && t.call(i3), c3 < 2 && (u3 = TypeError("The iterator does not provide a '" + o4 + "' method"), c3 = 1);
                  i3 = e;
                } else if ((t = (y = G.n < 0) ? u3 : r3.call(n3, G)) !== a) break;
              } catch (t2) {
                i3 = e, c3 = 1, u3 = t2;
              } finally {
                f2 = 1;
              }
            }
            return { value: t, done: y };
          };
        })(r2, o2, i2), true), u2;
      }
      var a = {};
      function Generator() {
      }
      function GeneratorFunction() {
      }
      function GeneratorFunctionPrototype() {
      }
      t = Object.getPrototypeOf;
      var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function() {
        return this;
      }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c);
      function f(e2) {
        return Object.setPrototypeOf ? Object.setPrototypeOf(e2, GeneratorFunctionPrototype) : (e2.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e2, o, "GeneratorFunction")), e2.prototype = Object.create(u), e2;
      }
      return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function() {
        return this;
      }), _regeneratorDefine2(u, "toString", function() {
        return "[object Generator]";
      }), (_regenerator = function _regenerator2() {
        return { w: i, m: f };
      })();
    }
    function _regeneratorDefine2(e, r, n, t) {
      var i = Object.defineProperty;
      try {
        i({}, "", {});
      } catch (e2) {
        i = 0;
      }
      _regeneratorDefine2 = function _regeneratorDefine(e2, r2, n2, t2) {
        function o(r3, n3) {
          _regeneratorDefine2(e2, r3, function(e3) {
            return this._invoke(r3, n3, e3);
          });
        }
        r2 ? i ? i(e2, r2, { value: n2, enumerable: !t2, configurable: !t2, writable: !t2 }) : e2[r2] = n2 : (o("next", 0), o("throw", 1), o("return", 2));
      }, _regeneratorDefine2(e, r, n, t);
    }
    var _marked = /* @__PURE__ */ _regeneratorRuntime().mark(slices);
    function asyncGeneratorStep(n, t, e, r, o, a, c) {
      try {
        var i = n[a](c), u = i.value;
      } catch (n2) {
        return void e(n2);
      }
      i.done ? t(u) : Promise.resolve(u).then(r, o);
    }
    function _asyncToGenerator(n) {
      return function() {
        var t = this, e = arguments;
        return new Promise(function(r, o) {
          var a = n.apply(t, e);
          function _next(n2) {
            asyncGeneratorStep(a, r, o, _next, _throw, "next", n2);
          }
          function _throw(n2) {
            asyncGeneratorStep(a, r, o, _next, _throw, "throw", n2);
          }
          _next(void 0);
        });
      };
    }
    function _wrapAsyncGenerator(e) {
      return function() {
        return new AsyncGenerator(e.apply(this, arguments));
      };
    }
    function AsyncGenerator(e) {
      var t, n;
      function resume(t2, n2) {
        try {
          var r = e[t2](n2), o = r.value, u = o instanceof _OverloadYield;
          Promise.resolve(u ? o.v : o).then(function(n3) {
            if (u) {
              var i = "return" === t2 && o.k ? t2 : "next";
              if (!o.k || n3.done) return resume(i, n3);
              n3 = e[i](n3).value;
            }
            settle(!!r.done, n3);
          }, function(e2) {
            resume("throw", e2);
          });
        } catch (e2) {
          settle(2, e2);
        }
      }
      function settle(e2, r) {
        2 === e2 ? t.reject(r) : t.resolve({ value: r, done: e2 }), (t = t.next) ? resume(t.key, t.arg) : n = null;
      }
      this._invoke = function(e2, r) {
        return new Promise(function(o, u) {
          var i = { key: e2, arg: r, resolve: o, reject: u, next: null };
          n ? n = n.next = i : (t = n = i, resume(e2, r));
        });
      }, "function" != typeof e["return"] && (this["return"] = void 0);
    }
    AsyncGenerator.prototype["function" == typeof Symbol && Symbol.asyncIterator || "@@asyncIterator"] = function() {
      return this;
    }, AsyncGenerator.prototype.next = function(e) {
      return this._invoke("next", e);
    }, AsyncGenerator.prototype["throw"] = function(e) {
      return this._invoke("throw", e);
    }, AsyncGenerator.prototype["return"] = function(e) {
      return this._invoke("return", e);
    };
    function _awaitAsyncGenerator(e) {
      return new _OverloadYield(e, 0);
    }
    function _asyncGeneratorDelegate(t) {
      var e = {}, n = false;
      function pump(e2, r) {
        return n = true, r = new Promise(function(n2) {
          n2(t[e2](r));
        }), { done: false, value: new _OverloadYield(r, 1) };
      }
      return e["undefined" != typeof Symbol && Symbol.iterator || "@@iterator"] = function() {
        return this;
      }, e.next = function(t2) {
        return n ? (n = false, t2) : pump("next", t2);
      }, "function" == typeof t["throw"] && (e["throw"] = function(t2) {
        if (n) throw n = false, t2;
        return pump("throw", t2);
      }), "function" == typeof t["return"] && (e["return"] = function(t2) {
        return n ? (n = false, t2) : pump("return", t2);
      }), e;
    }
    function _OverloadYield(e, d) {
      this.v = e, this.k = d;
    }
    function _asyncIterator(r) {
      var n, t, o, e = 2;
      for ("undefined" != typeof Symbol && (t = Symbol.asyncIterator, o = Symbol.iterator); e--; ) {
        if (t && null != (n = r[t])) return n.call(r);
        if (o && null != (n = r[o])) return new AsyncFromSyncIterator(n.call(r));
        t = "@@asyncIterator", o = "@@iterator";
      }
      throw new TypeError("Object is not async iterable");
    }
    function AsyncFromSyncIterator(r) {
      function AsyncFromSyncIteratorContinuation(r2) {
        if (Object(r2) !== r2) return Promise.reject(new TypeError(r2 + " is not an object."));
        var n = r2.done;
        return Promise.resolve(r2.value).then(function(r3) {
          return { value: r3, done: n };
        });
      }
      return AsyncFromSyncIterator = function AsyncFromSyncIterator2(r2) {
        this.s = r2, this.n = r2.next;
      }, AsyncFromSyncIterator.prototype = { s: null, n: null, next: function next() {
        return AsyncFromSyncIteratorContinuation(this.n.apply(this.s, arguments));
      }, "return": function _return(r2) {
        var n = this.s["return"];
        return void 0 === n ? Promise.resolve({ value: r2, done: true }) : AsyncFromSyncIteratorContinuation(n.apply(this.s, arguments));
      }, "throw": function _throw(r2) {
        var n = this.s["return"];
        return void 0 === n ? Promise.reject(r2) : AsyncFromSyncIteratorContinuation(n.apply(this.s, arguments));
      } }, new AsyncFromSyncIterator(r);
    }
    var _require = __require("node:stream");
    var PassThrough = _require.PassThrough;
    var Readable = _require.Readable;
    var Transform = _require.Transform;
    var Writable = _require.Writable;
    var pipeline = _require.pipeline;
    var _require2 = __require("node:zlib");
    var createDeflateRaw = _require2.createDeflateRaw;
    var createInflateRaw = _require2.createInflateRaw;
    var CompressedObject = require_compressedObject();
    var crc32 = require_crc32();
    var fileOrder = require_file_order();
    var STORE = 0;
    var DEFLATE = 8;
    var DATA_DESCRIPTOR = 8;
    var UTF8 = 2048;
    var MAX_16 = 65535;
    var MAX_32 = 4294967295;
    function write16(buffer, value, offset) {
      if (value < 0 || value > MAX_16) {
        throw new RangeError("ZIP64 is required for this ZIP field");
      }
      buffer.writeUInt16LE(value, offset);
    }
    function write32(buffer, value, offset) {
      if (value < 0 || value > MAX_32) {
        throw new RangeError("ZIP64 is required for this ZIP field");
      }
      buffer.writeUInt32LE(value >>> 0, offset);
    }
    function dosDateTime(date) {
      var value = date || /* @__PURE__ */ new Date();
      var year = Math.min(2107, Math.max(1980, value.getFullYear()));
      return {
        date: year - 1980 << 9 | value.getMonth() + 1 << 5 | value.getDate(),
        time: value.getHours() << 11 | value.getMinutes() << 5 | value.getSeconds() >> 1
      };
    }
    function writeChunk(_x3, _x4) {
      return _writeChunk.apply(this, arguments);
    }
    function _writeChunk() {
      _writeChunk = _asyncToGenerator(/* @__PURE__ */ _regeneratorRuntime().mark(function _callee2(destination, chunk) {
        var offset;
        return _regeneratorRuntime().wrap(function _callee2$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              offset = 0;
            case 1:
              if (!(offset < chunk.length)) {
                _context3.next = 7;
                break;
              }
              _context3.next = 4;
              return writeBuffer(destination, chunk.subarray(offset, offset + destination._zipChunkSize));
            case 4:
              offset += destination._zipChunkSize;
              _context3.next = 1;
              break;
            case 7:
            case "end":
              return _context3.stop();
          }
        }, _callee2);
      }));
      return _writeChunk.apply(this, arguments);
    }
    function writeBuffer(destination, chunk) {
      if (destination.destroyed) {
        return Promise.reject(new Error("ZIP stream was destroyed"));
      }
      if (destination.write(chunk)) {
        return Promise.resolve();
      }
      return new Promise(function(resolve, reject) {
        function done(callback, value) {
          destination.removeListener("drain", onDrain);
          destination.removeListener("error", onError);
          destination.removeListener("close", onClose);
          callback(value);
        }
        function onDrain() {
          done(resolve);
        }
        function onError(error) {
          done(reject, error);
        }
        function onClose() {
          done(reject, new Error("ZIP stream closed before drain"));
        }
        destination.once("drain", onDrain);
        destination.once("error", onError);
        destination.once("close", onClose);
      });
    }
    function rawData(entry) {
      if (entry.dir) {
        return Buffer.alloc(0);
      }
      return entry.asNodeBuffer();
    }
    function asBuffer(value) {
      if (Buffer.isBuffer(value)) {
        return value;
      }
      if (value instanceof Uint8Array) {
        return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
      }
      if (typeof value === "string") {
        return Buffer.from(value, "binary");
      }
      throw new TypeError("ZIP entry has unsupported compressed data");
    }
    function isCompressed(data) {
      return data instanceof CompressedObject;
    }
    function compressionMethod(entry, options) {
      if (entry.dir) {
        return STORE;
      }
      var requested = entry.options.compression || options.compression;
      if (requested === "STORE") {
        return STORE;
      }
      if (requested === "DEFLATE") {
        return DEFLATE;
      }
      throw new Error("".concat(requested, " is not a valid compression method for generateNodeStream"));
    }
    function slices(data, chunkSize) {
      var offset;
      return _regeneratorRuntime().wrap(function slices$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            offset = 0;
          case 1:
            if (!(offset < data.length)) {
              _context.next = 7;
              break;
            }
            _context.next = 4;
            return data.subarray(offset, offset + chunkSize);
          case 4:
            offset += chunkSize;
            _context.next = 1;
            break;
          case 7:
          case "end":
            return _context.stop();
        }
      }, _marked);
    }
    function entryChunks(_x, _x2) {
      return _entryChunks.apply(this, arguments);
    }
    function _entryChunks() {
      _entryChunks = _wrapAsyncGenerator(/* @__PURE__ */ _regeneratorRuntime().mark(function _callee(entry, chunkSize) {
        var data;
        return _regeneratorRuntime().wrap(function _callee$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              data = entry._data;
              if (!isCompressed(data)) {
                _context2.next = 9;
                break;
              }
              if (!(data._fileReader && data._fileReader.createReadStream)) {
                _context2.next = 6;
                break;
              }
              return _context2.delegateYield(_asyncGeneratorDelegate(_asyncIterator(data._fileReader.createReadStream(data._fileOffset, data.compressedSize, chunkSize)), _awaitAsyncGenerator), "t0", 4);
            case 4:
              _context2.next = 7;
              break;
            case 6:
              return _context2.delegateYield(_asyncGeneratorDelegate(_asyncIterator(slices(asBuffer(data.getCompressedContent()), chunkSize)), _awaitAsyncGenerator), "t1", 7);
            case 7:
              _context2.next = 14;
              break;
            case 9:
              if (!(data && data.createReadStream)) {
                _context2.next = 13;
                break;
              }
              return _context2.delegateYield(_asyncGeneratorDelegate(_asyncIterator(data.createReadStream(chunkSize)), _awaitAsyncGenerator), "t2", 11);
            case 11:
              _context2.next = 14;
              break;
            case 13:
              return _context2.delegateYield(_asyncGeneratorDelegate(_asyncIterator(slices(rawData(entry), chunkSize)), _awaitAsyncGenerator), "t3", 14);
            case 14:
            case "end":
              return _context2.stop();
          }
        }, _callee);
      }));
      return _entryChunks.apply(this, arguments);
    }
    function sourceFor(entry, reused, chunkSize) {
      return {
        stream: Readable.from(entryChunks(entry, chunkSize), {
          objectMode: false,
          highWaterMark: chunkSize
        }),
        inflate: !reused && isCompressed(entry._data) && entry._data.compressionMethod === "\b\0"
      };
    }
    function utf8Flag(name, comment) {
      return Buffer.byteLength(name, "utf8") !== name.length || Buffer.byteLength(comment, "utf8") !== comment.length ? UTF8 : 0;
    }
    function localHeader(entry) {
      var header = Buffer.alloc(30 + entry.name.length);
      header.writeUInt32LE(67324752, 0);
      write16(header, entry.usesDescriptor ? 20 : 10, 4);
      write16(header, entry.flags | (entry.usesDescriptor ? DATA_DESCRIPTOR : 0), 6);
      write16(header, entry.method, 8);
      write16(header, entry.time, 10);
      write16(header, entry.date, 12);
      write32(header, entry.usesDescriptor ? 0 : entry.crc32, 14);
      write32(header, entry.usesDescriptor ? 0 : entry.compressedSize, 18);
      write32(header, entry.usesDescriptor ? 0 : entry.uncompressedSize, 22);
      write16(header, entry.name.length, 26);
      write16(header, 0, 28);
      entry.name.copy(header, 30);
      return header;
    }
    function descriptor(entry) {
      var buffer = Buffer.alloc(16);
      buffer.writeUInt32LE(134695760, 0);
      write32(buffer, entry.crc32, 4);
      write32(buffer, entry.compressedSize, 8);
      write32(buffer, entry.uncompressedSize, 12);
      return buffer;
    }
    function centralHeader(entry) {
      var buffer = Buffer.alloc(46 + entry.name.length + entry.comment.length);
      buffer.writeUInt32LE(33639248, 0);
      write16(buffer, 20, 4);
      write16(buffer, entry.usesDescriptor ? 20 : 10, 6);
      write16(buffer, entry.flags | (entry.usesDescriptor ? DATA_DESCRIPTOR : 0), 8);
      write16(buffer, entry.method, 10);
      write16(buffer, entry.time, 12);
      write16(buffer, entry.date, 14);
      write32(buffer, entry.crc32, 16);
      write32(buffer, entry.compressedSize, 20);
      write32(buffer, entry.uncompressedSize, 24);
      write16(buffer, entry.name.length, 28);
      write16(buffer, 0, 30);
      write16(buffer, entry.comment.length, 32);
      write16(buffer, 0, 34);
      write16(buffer, 0, 36);
      write32(buffer, entry.dir ? 16 : entry.dosPermissions || 0, 38);
      write32(buffer, entry.offset, 42);
      entry.name.copy(buffer, 46);
      entry.comment.copy(buffer, 46 + entry.name.length);
      return buffer;
    }
    function endRecord(entries, size, offset, comment) {
      var buffer = Buffer.alloc(22 + comment.length);
      buffer.writeUInt32LE(101010256, 0);
      write16(buffer, 0, 4);
      write16(buffer, 0, 6);
      write16(buffer, entries, 8);
      write16(buffer, entries, 10);
      write32(buffer, size, 12);
      write32(buffer, offset, 16);
      write16(buffer, comment.length, 20);
      comment.copy(buffer, 22);
      return buffer;
    }
    function writeEntry(_x5, _x6, _x7, _x8) {
      return _writeEntry.apply(this, arguments);
    }
    function _writeEntry() {
      _writeEntry = _asyncToGenerator(/* @__PURE__ */ _regeneratorRuntime().mark(function _callee3(destination, entry, offset, options) {
        var name, comment, method, reused, usesDescriptor, dateTime, metadata, source, stages, streamOptions, compressionOptions, written, onClose;
        return _regeneratorRuntime().wrap(function _callee3$(_context4) {
          while (1) switch (_context4.prev = _context4.next) {
            case 0:
              onClose = function _onClose() {
                var _iterator = _createForOfIteratorHelper(stages), _step;
                try {
                  for (_iterator.s(); !(_step = _iterator.n()).done; ) {
                    var stage = _step.value;
                    stage.destroy(new Error("ZIP stream was destroyed"));
                  }
                } catch (err) {
                  _iterator.e(err);
                } finally {
                  _iterator.f();
                }
              };
              name = Buffer.from(entry.name, "utf8");
              comment = Buffer.from(entry.comment || "", "utf8");
              if (!(name.length > MAX_16 || comment.length > MAX_16)) {
                _context4.next = 5;
                break;
              }
              throw new RangeError("ZIP filename or comment exceeds the classic ZIP limit");
            case 5:
              method = compressionMethod(entry, options);
              reused = isCompressed(entry._data) && entry._data.compressionMethod === (method === STORE ? "\0\0" : "\b\0");
              usesDescriptor = !reused;
              dateTime = dosDateTime(entry.date);
              metadata = {
                comment,
                compressedSize: reused ? entry._data.compressedSize : 0,
                crc32: reused ? entry._data.crc32 >>> 0 : 0,
                date: dateTime.date,
                dir: entry.dir,
                dosPermissions: entry.dosPermissions,
                flags: utf8Flag(entry.name, entry.comment || ""),
                method,
                name,
                offset,
                time: dateTime.time,
                uncompressedSize: reused ? entry._data.uncompressedSize : 0,
                usesDescriptor
              };
              _context4.next = 12;
              return writeChunk(destination, localHeader(metadata));
            case 12:
              source = sourceFor(entry, reused, options.chunkSize);
              stages = [source.stream];
              streamOptions = {
                highWaterMark: options.chunkSize,
                chunkSize: options.chunkSize
              };
              if (source.inflate) {
                stages.push(createInflateRaw(streamOptions));
              }
              if (!reused) {
                stages.push(new Transform({
                  highWaterMark: options.chunkSize,
                  transform: function transform(chunk, encoding, callback) {
                    metadata.crc32 = crc32(chunk, metadata.crc32) >>> 0;
                    metadata.uncompressedSize += chunk.length;
                    if (isCompressed(entry._data) && metadata.uncompressedSize > entry._data.uncompressedSize) {
                      callback(new Error("Bug : uncompressed data size mismatch"));
                      return;
                    }
                    if (metadata.uncompressedSize > MAX_32) {
                      callback(new RangeError("ZIP64 is required for this ZIP field"));
                      return;
                    }
                    callback(null, chunk);
                  }
                }));
                if (method === DEFLATE) {
                  compressionOptions = entry.options.compressionOptions || options.compressionOptions;
                  stages.push(createDeflateRaw(_objectSpread({
                    // Only level is part of the ZIP API; zlib flush/dictionary options
                    // can produce data that ZIP readers cannot decompress.
                    level: compressionOptions.level
                  }, streamOptions)));
                }
              }
              written = 0;
              stages.push(new Writable({
                highWaterMark: options.chunkSize,
                write: function write(chunk, encoding, callback) {
                  written += chunk.length;
                  if (written > MAX_32) {
                    callback(new RangeError("ZIP64 is required for this ZIP field"));
                    return;
                  }
                  writeChunk(destination, chunk).then(function() {
                    return callback();
                  }, callback);
                }
              }));
              destination.once("close", onClose);
              _context4.prev = 20;
              _context4.next = 23;
              return new Promise(function(resolve, reject) {
                pipeline.apply(void 0, stages.concat([function(error) {
                  return error ? reject(error) : resolve();
                }]));
                if (destination.destroyed) {
                  onClose();
                }
              });
            case 23:
              _context4.prev = 23;
              destination.removeListener("close", onClose);
              return _context4.finish(23);
            case 26:
              if (!(reused && written !== metadata.compressedSize)) {
                _context4.next = 28;
                break;
              }
              throw new Error("Bug : compressed data size mismatch");
            case 28:
              if (reused) {
                _context4.next = 34;
                break;
              }
              if (!(isCompressed(entry._data) && metadata.uncompressedSize !== entry._data.uncompressedSize)) {
                _context4.next = 31;
                break;
              }
              throw new Error("Bug : uncompressed data size mismatch");
            case 31:
              metadata.compressedSize = written;
              _context4.next = 34;
              return writeChunk(destination, descriptor(metadata));
            case 34:
              return _context4.abrupt("return", metadata);
            case 35:
            case "end":
              return _context4.stop();
          }
        }, _callee3, null, [[20, , 23, 26]]);
      }));
      return _writeEntry.apply(this, arguments);
    }
    function writeArchive(_x9, _x0, _x1) {
      return _writeArchive.apply(this, arguments);
    }
    function _writeArchive() {
      _writeArchive = _asyncToGenerator(/* @__PURE__ */ _regeneratorRuntime().mark(function _callee4(zip, destination, options) {
        var names, offset, entries, _iterator2, _step2, name, _entry, centralOffset, _i, _entries, entry, header, comment;
        return _regeneratorRuntime().wrap(function _callee4$(_context5) {
          while (1) switch (_context5.prev = _context5.next) {
            case 0:
              names = fileOrder(zip.files, options.fileOrder);
              if (!(names.length > MAX_16)) {
                _context5.next = 3;
                break;
              }
              throw new RangeError("ZIP64 is required for more than 65535 entries");
            case 3:
              offset = 0;
              entries = [];
              _iterator2 = _createForOfIteratorHelper(names);
              _context5.prev = 6;
              _iterator2.s();
            case 8:
              if ((_step2 = _iterator2.n()).done) {
                _context5.next = 19;
                break;
              }
              name = _step2.value;
              if (Object.prototype.hasOwnProperty.call(zip.files, name)) {
                _context5.next = 12;
                break;
              }
              return _context5.abrupt("continue", 17);
            case 12:
              _context5.next = 14;
              return writeEntry(destination, zip.files[name], offset, options);
            case 14:
              _entry = _context5.sent;
              entries.push(_entry);
              offset += 30 + _entry.name.length + _entry.compressedSize + (_entry.usesDescriptor ? 16 : 0);
            case 17:
              _context5.next = 8;
              break;
            case 19:
              _context5.next = 24;
              break;
            case 21:
              _context5.prev = 21;
              _context5.t0 = _context5["catch"](6);
              _iterator2.e(_context5.t0);
            case 24:
              _context5.prev = 24;
              _iterator2.f();
              return _context5.finish(24);
            case 27:
              centralOffset = offset;
              _i = 0, _entries = entries;
            case 29:
              if (!(_i < _entries.length)) {
                _context5.next = 38;
                break;
              }
              entry = _entries[_i];
              header = centralHeader(entry);
              _context5.next = 34;
              return writeChunk(destination, header);
            case 34:
              offset += header.length;
            case 35:
              _i++;
              _context5.next = 29;
              break;
            case 38:
              comment = Buffer.from(options.comment || zip.comment || "", "utf8");
              if (!(comment.length > MAX_16)) {
                _context5.next = 41;
                break;
              }
              throw new RangeError("ZIP comment exceeds the classic ZIP limit");
            case 41:
              _context5.next = 43;
              return writeChunk(destination, endRecord(entries.length, offset - centralOffset, centralOffset, comment));
            case 43:
            case "end":
              return _context5.stop();
          }
        }, _callee4, null, [[6, 21, 24, 27]]);
      }));
      return _writeArchive.apply(this, arguments);
    }
    module.exports = function generateNodeStream() {
      var _this = this;
      var options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      var chunkSize = require_chunk_size()(options.chunkSize, this._chunkSize);
      var destination = new PassThrough({
        highWaterMark: options.highWaterMark === void 0 ? chunkSize : options.highWaterMark
      });
      destination._zipChunkSize = chunkSize;
      var settings = {
        chunkSize,
        comment: options.comment,
        compression: (options.compression || "STORE").toUpperCase(),
        compressionOptions: options.compressionOptions || {},
        fileOrder: options.fileOrder
      };
      queueMicrotask(function() {
        writeArchive(_this, destination, settings).then(function() {
          return destination.end();
        }, function(error) {
          return destination.destroy(error);
        });
      });
      return destination;
    };
  }
});

// node_modules/pizzip/js/index.js
var require_js = __commonJS({
  "node_modules/pizzip/js/index.js"(exports, module) {
    "use strict";
    function _typeof(o) {
      "@babel/helpers - typeof";
      return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
        return typeof o2;
      } : function(o2) {
        return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
      }, _typeof(o);
    }
    function _createForOfIteratorHelper(r, e) {
      var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
      if (!t) {
        if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) {
          t && (r = t);
          var _n = 0, F = function F2() {
          };
          return { s: F, n: function n() {
            return _n >= r.length ? { done: true } : { done: false, value: r[_n++] };
          }, e: function e2(r2) {
            throw r2;
          }, f: F };
        }
        throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
      }
      var o, a = true, u = false;
      return { s: function s() {
        t = t.call(r);
      }, n: function n() {
        var r2 = t.next();
        return a = r2.done, r2;
      }, e: function e2(r2) {
        u = true, o = r2;
      }, f: function f() {
        try {
          a || null == t["return"] || t["return"]();
        } finally {
          if (u) throw o;
        }
      } };
    }
    function _unsupportedIterableToArray(r, a) {
      if (r) {
        if ("string" == typeof r) return _arrayLikeToArray(r, a);
        var t = {}.toString.call(r).slice(8, -1);
        return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
      }
    }
    function _arrayLikeToArray(r, a) {
      (null == a || a > r.length) && (a = r.length);
      for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
      return n;
    }
    function ownKeys(e, r) {
      var t = Object.keys(e);
      if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r && (o = o.filter(function(r2) {
          return Object.getOwnPropertyDescriptor(e, r2).enumerable;
        })), t.push.apply(t, o);
      }
      return t;
    }
    function _objectSpread(e) {
      for (var r = 1; r < arguments.length; r++) {
        var t = null != arguments[r] ? arguments[r] : {};
        r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
          _defineProperty(e, r2, t[r2]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
          Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
        });
      }
      return e;
    }
    function _defineProperty(e, r, t) {
      return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
    }
    function _toPropertyKey(t) {
      var i = _toPrimitive(t, "string");
      return "symbol" == _typeof(i) ? i : i + "";
    }
    function _toPrimitive(t, r) {
      if ("object" != _typeof(t) || !t) return t;
      var e = t[Symbol.toPrimitive];
      if (void 0 !== e) {
        var i = e.call(t, r || "default");
        if ("object" != _typeof(i)) return i;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return ("string" === r ? String : Number)(t);
    }
    var base64 = require_base64();
    function PizZip2(data, options) {
      if (!(this instanceof PizZip2)) {
        return new PizZip2(data, options);
      }
      this.files = {};
      this.comment = null;
      this._chunkSize = require_chunk_size()(options && options.chunkSize);
      this._storage = null;
      this._readers = /* @__PURE__ */ new Set();
      if (options && options.storage && options.storage.type === "filesystem") {
        this._storage = new (require_filesystem_storage())(_objectSpread(_objectSpread({}, options.storage), {}, {
          chunkSize: this._chunkSize
        }));
      }
      this.dispose = function() {
        var _iterator = _createForOfIteratorHelper(this._readers), _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done; ) {
            var reader = _step.value;
            reader.dispose();
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
        this._readers.clear();
        if (this._storage) {
          this._storage.dispose();
        }
      };
      this.root = "";
      if (data) {
        try {
          this.load(data, options);
        } catch (error) {
          this.dispose();
          throw error;
        }
      }
      this.clone = function() {
        var _this = this;
        var newObj = new PizZip2();
        Object.keys(this.files).forEach(function(file) {
          newObj.file(file, _this.files[file].asUint8Array());
        });
        return newObj;
      };
      this.shallowClone = function() {
        var newObj = new PizZip2();
        for (var i in this) {
          if (typeof this[i] !== "function") {
            newObj[i] = this[i];
          }
        }
        return newObj;
      };
    }
    PizZip2.prototype = require_object();
    PizZip2.prototype.load = require_load();
    PizZip2.prototype.loadFile = require_loadFile();
    PizZip2.support = require_support();
    PizZip2.defaults = require_defaults();
    PizZip2.utils = require_deprecatedPublicUtils();
    PizZip2.base64 = {
      /**
       * @deprecated
       * This method will be removed in a future version without replacement.
       */
      encode: function encode(input) {
        return base64.encode(input);
      },
      /**
       * @deprecated
       * This method will be removed in a future version without replacement.
       */
      decode: function decode(input) {
        return base64.decode(input);
      }
    };
    PizZip2.compressions = require_compressions();
    PizZip2.prototype.generateNodeStream = require_node_stream();
    module.exports = PizZip2;
    module.exports["default"] = PizZip2;
  }
});

// lib/zip-safety.mjs
var import_pizzip = __toESM(require_js(), 1);
import { inflateRawSync } from "node:zlib";
var MAX_EXPANDED = 128 * 1024 * 1024;
var MAX_ENTRY = 32 * 1024 * 1024;
function assertSafeZip(input) {
  const bytes = Buffer.from(input);
  requireCondition(bytes.length <= 50 * 1024 * 1024, "E_INPUT", "\uBB38\uC11C \uD06C\uAE30 \uC81C\uD55C\uC744 \uCD08\uACFC\uD588\uC2B5\uB2C8\uB2E4.");
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (bytes.readUInt32LE(i) === 101010256 && i + 22 + bytes.readUInt16LE(i + 20) === bytes.length) {
      end = i;
      break;
    }
  }
  requireCondition(end >= 0, "E_INPUT", "\uC720\uD6A8\uD55C ZIP \uBB38\uC11C\uAC00 \uC544\uB2D9\uB2C8\uB2E4.");
  const count = bytes.readUInt16LE(end + 10);
  const centralSize = bytes.readUInt32LE(end + 12);
  let pos = bytes.readUInt32LE(end + 16);
  requireCondition(count > 0 && count <= 4096 && pos + centralSize === end && bytes.readUInt16LE(end + 4) === 0 && bytes.readUInt16LE(end + 6) === 0 && bytes.readUInt16LE(end + 8) === count, "E_UNSUPPORTED", "\uBD84\uD560 ZIP, ZIP64 \uB610\uB294 \uB108\uBB34 \uBCF5\uC7A1\uD55C \uBB38\uC11C\uB294 \uC9C0\uC6D0\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
  const names = /* @__PURE__ */ new Set();
  let expanded = 0;
  for (let i = 0; i < count; i++) {
    requireCondition(pos + 46 <= end && bytes.readUInt32LE(pos) === 33639248, "E_INPUT", "\uC190\uC0C1\uB41C ZIP \uB514\uB809\uD130\uB9AC\uC785\uB2C8\uB2E4.");
    const flags = bytes.readUInt16LE(pos + 8);
    const method = bytes.readUInt16LE(pos + 10);
    const size = bytes.readUInt32LE(pos + 24);
    const compressed = bytes.readUInt32LE(pos + 20);
    const nameLength = bytes.readUInt16LE(pos + 28);
    const extraLength = bytes.readUInt16LE(pos + 30);
    const commentLength = bytes.readUInt16LE(pos + 32);
    const localOffset = bytes.readUInt32LE(pos + 42);
    const next = pos + 46 + nameLength + extraLength + commentLength;
    requireCondition(next <= end && nameLength > 0, "E_INPUT", "\uC190\uC0C1\uB41C ZIP \uD56D\uBAA9\uC785\uB2C8\uB2E4.");
    const rawName = bytes.subarray(pos + 46, pos + 46 + nameLength);
    const name = rawName.toString("utf8").normalize("NFC");
    requireCondition(!name.includes("\\") && !name.includes("\0") && !name.startsWith("/") && !/^[A-Za-z]:/.test(name) && !name.split("/").includes("..") && !names.has(name), "E_INPUT", "ZIP \uACBD\uB85C \uB610\uB294 \uC911\uBCF5 \uD56D\uBAA9\uC774 \uC720\uD6A8\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
    names.add(name);
    requireCondition(!(flags & 1) && (method === 0 || method === 8), "E_UNSUPPORTED", "\uC554\uD638\uD654 \uB610\uB294 \uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 ZIP \uC555\uCD95 \uD615\uC2DD\uC785\uB2C8\uB2E4.");
    expanded += size;
    requireCondition(size <= MAX_ENTRY && expanded <= MAX_EXPANDED && localOffset + 30 <= pos && bytes.readUInt32LE(localOffset) === 67324752, "E_INPUT", "ZIP \uD06C\uAE30 \uB610\uB294 \uC624\uD504\uC14B \uC81C\uD55C\uC744 \uCD08\uACFC\uD588\uC2B5\uB2C8\uB2E4.");
    const localNameLength = bytes.readUInt16LE(localOffset + 26);
    const localExtraLength = bytes.readUInt16LE(localOffset + 28);
    requireCondition(bytes.subarray(localOffset + 30, localOffset + 30 + localNameLength).equals(rawName) && localOffset + 30 + localNameLength + localExtraLength + compressed <= bytes.readUInt32LE(end + 16), "E_INPUT", "ZIP \uB85C\uCEEC \uD56D\uBAA9\uC774 \uB514\uB809\uD130\uB9AC\uC640 \uB2E4\uB985\uB2C8\uB2E4.");
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    try {
      const data = bytes.subarray(dataStart, dataStart + compressed);
      const actual = method === 8 ? inflateRawSync(data, { maxOutputLength: MAX_ENTRY }) : data;
      requireCondition(actual.length === size, "E_INPUT", "ZIP\uC5D0 \uC120\uC5B8\uB41C \uC555\uCD95 \uD574\uC81C \uD06C\uAE30\uAC00 \uC2E4\uC81C \uD06C\uAE30\uC640 \uB2E4\uB985\uB2C8\uB2E4.");
    } catch (error) {
      if (error instanceof FillError) throw error;
      throw new FillError("E_INPUT", "ZIP \uC555\uCD95 \uB370\uC774\uD130\uAC00 \uC190\uC0C1\uB418\uC5C8\uAC70\uB098 \uD06C\uAE30 \uC81C\uD55C\uC744 \uCD08\uACFC\uD588\uC2B5\uB2C8\uB2E4.");
    }
    requireCondition(!/(^|\/)(vbaProject\.bin|embeddings\/|Scripts\/)/i.test(name), "E_UNSUPPORTED", "\uB9E4\uD06C\uB85C \uB610\uB294 \uB0B4\uC7A5 \uC2E4\uD589 \uAC1C\uCCB4\uB97C \uD3EC\uD568\uD55C \uBB38\uC11C\uB294 \uC9C0\uC6D0\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
    pos = next;
  }
  requireCondition(pos === end, "E_INPUT", "ZIP \uB514\uB809\uD130\uB9AC \uAE38\uC774\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
  try {
    const zip = new import_pizzip.default(bytes, { checkCRC32: true });
    let actualExpanded = 0;
    for (const entry of Object.values(zip.files)) {
      if (entry.dir) continue;
      const content = entry.asUint8Array();
      actualExpanded += content.length;
      requireCondition(content.length <= MAX_ENTRY && actualExpanded <= MAX_EXPANDED, "E_INPUT", "\uC555\uCD95 \uD574\uC81C \uD06C\uAE30 \uC81C\uD55C\uC744 \uCD08\uACFC\uD588\uC2B5\uB2C8\uB2E4.");
      if (/\.(xml|rels)$/i.test(entry.name)) {
        const text = Buffer.from(content).toString("utf8");
        requireCondition(!/<!DOCTYPE|<!ENTITY/i.test(text), "E_UNSUPPORTED", "\uC678\uBD80 \uC5D4\uD2F0\uD2F0\uAC00 \uD3EC\uD568\uB41C XML\uC740 \uC9C0\uC6D0\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
      }
    }
  } catch (error) {
    if (error instanceof FillError) throw error;
    throw new FillError("E_INPUT", "ZIP \uBB38\uC11C\uC758 \uC555\uCD95 \uB610\uB294 \uAC80\uC0AC\uAC12\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
  }
}

export {
  require_js,
  assertSafeZip
};
/*! Bundled license information:

pako/dist/pako.es5.min.js:
  (*! pako 2.2.0 https://github.com/nodeca/pako @license (MIT AND Zlib) *)

pizzip/js/node-stream.js:
  (*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE *)
*/
