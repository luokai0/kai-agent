// @bun
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: __accessProp.bind(mod, key),
        enumerable: true
      });
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
var __require = import.meta.require;

// node_modules/uuid/dist/max.js
var require_max = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _default = exports.default = "ffffffff-ffff-ffff-ffff-ffffffffffff";
});

// node_modules/uuid/dist/nil.js
var require_nil = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _default = exports.default = "00000000-0000-0000-0000-000000000000";
});

// node_modules/uuid/dist/regex.js
var require_regex = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _default = exports.default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i;
});

// node_modules/uuid/dist/validate.js
var require_validate = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _regex = _interopRequireDefault(require_regex());
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function validate(uuid) {
    return typeof uuid === "string" && _regex.default.test(uuid);
  }
  var _default = exports.default = validate;
});

// node_modules/uuid/dist/parse.js
var require_parse = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _validate = _interopRequireDefault(require_validate());
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function parse(uuid) {
    if (!(0, _validate.default)(uuid)) {
      throw TypeError("Invalid UUID");
    }
    let v;
    const arr = new Uint8Array(16);
    arr[0] = (v = parseInt(uuid.slice(0, 8), 16)) >>> 24;
    arr[1] = v >>> 16 & 255;
    arr[2] = v >>> 8 & 255;
    arr[3] = v & 255;
    arr[4] = (v = parseInt(uuid.slice(9, 13), 16)) >>> 8;
    arr[5] = v & 255;
    arr[6] = (v = parseInt(uuid.slice(14, 18), 16)) >>> 8;
    arr[7] = v & 255;
    arr[8] = (v = parseInt(uuid.slice(19, 23), 16)) >>> 8;
    arr[9] = v & 255;
    arr[10] = (v = parseInt(uuid.slice(24, 36), 16)) / 1099511627776 & 255;
    arr[11] = v / 4294967296 & 255;
    arr[12] = v >>> 24 & 255;
    arr[13] = v >>> 16 & 255;
    arr[14] = v >>> 8 & 255;
    arr[15] = v & 255;
    return arr;
  }
  var _default = exports.default = parse;
});

// node_modules/uuid/dist/stringify.js
var require_stringify = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  exports.unsafeStringify = unsafeStringify;
  var _validate = _interopRequireDefault(require_validate());
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  var byteToHex = [];
  for (let i = 0;i < 256; ++i) {
    byteToHex.push((i + 256).toString(16).slice(1));
  }
  function unsafeStringify(arr, offset = 0) {
    return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
  }
  function stringify(arr, offset = 0) {
    const uuid = unsafeStringify(arr, offset);
    if (!(0, _validate.default)(uuid)) {
      throw TypeError("Stringified UUID is invalid");
    }
    return uuid;
  }
  var _default = exports.default = stringify;
});

// node_modules/uuid/dist/rng.js
var require_rng = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = rng;
  var _nodeCrypto = _interopRequireDefault(__require("crypto"));
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  var rnds8Pool = new Uint8Array(256);
  var poolPtr = rnds8Pool.length;
  function rng() {
    if (poolPtr > rnds8Pool.length - 16) {
      _nodeCrypto.default.randomFillSync(rnds8Pool);
      poolPtr = 0;
    }
    return rnds8Pool.slice(poolPtr, poolPtr += 16);
  }
});

// node_modules/uuid/dist/v1.js
var require_v1 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _rng = _interopRequireDefault(require_rng());
  var _stringify = require_stringify();
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  var _nodeId;
  var _clockseq;
  var _lastMSecs = 0;
  var _lastNSecs = 0;
  function v1(options, buf, offset) {
    let i = buf && offset || 0;
    const b = buf || new Array(16);
    options = options || {};
    let node = options.node;
    let clockseq = options.clockseq;
    if (!options._v6) {
      if (!node) {
        node = _nodeId;
      }
      if (clockseq == null) {
        clockseq = _clockseq;
      }
    }
    if (node == null || clockseq == null) {
      const seedBytes = options.random || (options.rng || _rng.default)();
      if (node == null) {
        node = [seedBytes[0], seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]];
        if (!_nodeId && !options._v6) {
          node[0] |= 1;
          _nodeId = node;
        }
      }
      if (clockseq == null) {
        clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 16383;
        if (_clockseq === undefined && !options._v6) {
          _clockseq = clockseq;
        }
      }
    }
    let msecs = options.msecs !== undefined ? options.msecs : Date.now();
    let nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;
    const dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 1e4;
    if (dt < 0 && options.clockseq === undefined) {
      clockseq = clockseq + 1 & 16383;
    }
    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
      nsecs = 0;
    }
    if (nsecs >= 1e4) {
      throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
    }
    _lastMSecs = msecs;
    _lastNSecs = nsecs;
    _clockseq = clockseq;
    msecs += 12219292800000;
    const tl = ((msecs & 268435455) * 1e4 + nsecs) % 4294967296;
    b[i++] = tl >>> 24 & 255;
    b[i++] = tl >>> 16 & 255;
    b[i++] = tl >>> 8 & 255;
    b[i++] = tl & 255;
    const tmh = msecs / 4294967296 * 1e4 & 268435455;
    b[i++] = tmh >>> 8 & 255;
    b[i++] = tmh & 255;
    b[i++] = tmh >>> 24 & 15 | 16;
    b[i++] = tmh >>> 16 & 255;
    b[i++] = clockseq >>> 8 | 128;
    b[i++] = clockseq & 255;
    for (let n = 0;n < 6; ++n) {
      b[i + n] = node[n];
    }
    return buf || (0, _stringify.unsafeStringify)(b);
  }
  var _default = exports.default = v1;
});

// node_modules/uuid/dist/v1ToV6.js
var require_v1ToV6 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = v1ToV6;
  var _parse = _interopRequireDefault(require_parse());
  var _stringify = require_stringify();
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function v1ToV6(uuid) {
    const v1Bytes = typeof uuid === "string" ? (0, _parse.default)(uuid) : uuid;
    const v6Bytes = _v1ToV6(v1Bytes);
    return typeof uuid === "string" ? (0, _stringify.unsafeStringify)(v6Bytes) : v6Bytes;
  }
  function _v1ToV6(v1Bytes, randomize = false) {
    return Uint8Array.of((v1Bytes[6] & 15) << 4 | v1Bytes[7] >> 4 & 15, (v1Bytes[7] & 15) << 4 | (v1Bytes[4] & 240) >> 4, (v1Bytes[4] & 15) << 4 | (v1Bytes[5] & 240) >> 4, (v1Bytes[5] & 15) << 4 | (v1Bytes[0] & 240) >> 4, (v1Bytes[0] & 15) << 4 | (v1Bytes[1] & 240) >> 4, (v1Bytes[1] & 15) << 4 | (v1Bytes[2] & 240) >> 4, 96 | v1Bytes[2] & 15, v1Bytes[3], v1Bytes[8], v1Bytes[9], v1Bytes[10], v1Bytes[11], v1Bytes[12], v1Bytes[13], v1Bytes[14], v1Bytes[15]);
  }
});

// node_modules/uuid/dist/v35.js
var require_v35 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.URL = exports.DNS = undefined;
  exports.default = v35;
  var _stringify = require_stringify();
  var _parse = _interopRequireDefault(require_parse());
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function stringToBytes(str) {
    str = unescape(encodeURIComponent(str));
    const bytes = [];
    for (let i = 0;i < str.length; ++i) {
      bytes.push(str.charCodeAt(i));
    }
    return bytes;
  }
  var DNS = exports.DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
  var URL = exports.URL = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
  function v35(name, version, hashfunc) {
    function generateUUID(value, namespace, buf, offset) {
      var _namespace;
      if (typeof value === "string") {
        value = stringToBytes(value);
      }
      if (typeof namespace === "string") {
        namespace = (0, _parse.default)(namespace);
      }
      if (((_namespace = namespace) === null || _namespace === undefined ? undefined : _namespace.length) !== 16) {
        throw TypeError("Namespace must be array-like (16 iterable integer values, 0-255)");
      }
      let bytes = new Uint8Array(16 + value.length);
      bytes.set(namespace);
      bytes.set(value, namespace.length);
      bytes = hashfunc(bytes);
      bytes[6] = bytes[6] & 15 | version;
      bytes[8] = bytes[8] & 63 | 128;
      if (buf) {
        offset = offset || 0;
        for (let i = 0;i < 16; ++i) {
          buf[offset + i] = bytes[i];
        }
        return buf;
      }
      return (0, _stringify.unsafeStringify)(bytes);
    }
    try {
      generateUUID.name = name;
    } catch (err) {}
    generateUUID.DNS = DNS;
    generateUUID.URL = URL;
    return generateUUID;
  }
});

// node_modules/uuid/dist/md5.js
var require_md5 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _nodeCrypto = _interopRequireDefault(__require("crypto"));
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function md5(bytes) {
    if (Array.isArray(bytes)) {
      bytes = Buffer.from(bytes);
    } else if (typeof bytes === "string") {
      bytes = Buffer.from(bytes, "utf8");
    }
    return _nodeCrypto.default.createHash("md5").update(bytes).digest();
  }
  var _default = exports.default = md5;
});

// node_modules/uuid/dist/v3.js
var require_v3 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _v = _interopRequireDefault(require_v35());
  var _md = _interopRequireDefault(require_md5());
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  var v3 = (0, _v.default)("v3", 48, _md.default);
  var _default = exports.default = v3;
});

// node_modules/uuid/dist/native.js
var require_native = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _nodeCrypto = _interopRequireDefault(__require("crypto"));
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  var _default = exports.default = {
    randomUUID: _nodeCrypto.default.randomUUID
  };
});

// node_modules/uuid/dist/v4.js
var require_v4 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _native = _interopRequireDefault(require_native());
  var _rng = _interopRequireDefault(require_rng());
  var _stringify = require_stringify();
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function v4(options, buf, offset) {
    if (_native.default.randomUUID && !buf && !options) {
      return _native.default.randomUUID();
    }
    options = options || {};
    const rnds = options.random || (options.rng || _rng.default)();
    rnds[6] = rnds[6] & 15 | 64;
    rnds[8] = rnds[8] & 63 | 128;
    if (buf) {
      offset = offset || 0;
      for (let i = 0;i < 16; ++i) {
        buf[offset + i] = rnds[i];
      }
      return buf;
    }
    return (0, _stringify.unsafeStringify)(rnds);
  }
  var _default = exports.default = v4;
});

// node_modules/uuid/dist/sha1.js
var require_sha1 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _nodeCrypto = _interopRequireDefault(__require("crypto"));
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function sha1(bytes) {
    if (Array.isArray(bytes)) {
      bytes = Buffer.from(bytes);
    } else if (typeof bytes === "string") {
      bytes = Buffer.from(bytes, "utf8");
    }
    return _nodeCrypto.default.createHash("sha1").update(bytes).digest();
  }
  var _default = exports.default = sha1;
});

// node_modules/uuid/dist/v5.js
var require_v5 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _v = _interopRequireDefault(require_v35());
  var _sha = _interopRequireDefault(require_sha1());
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  var v5 = (0, _v.default)("v5", 80, _sha.default);
  var _default = exports.default = v5;
});

// node_modules/uuid/dist/v6.js
var require_v6 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = v6;
  var _stringify = require_stringify();
  var _v = _interopRequireDefault(require_v1());
  var _v1ToV = _interopRequireDefault(require_v1ToV6());
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function v6(options = {}, buf, offset = 0) {
    let bytes = (0, _v.default)({
      ...options,
      _v6: true
    }, new Uint8Array(16));
    bytes = (0, _v1ToV.default)(bytes);
    if (buf) {
      for (let i = 0;i < 16; i++) {
        buf[offset + i] = bytes[i];
      }
      return buf;
    }
    return (0, _stringify.unsafeStringify)(bytes);
  }
});

// node_modules/uuid/dist/v6ToV1.js
var require_v6ToV1 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = v6ToV1;
  var _parse = _interopRequireDefault(require_parse());
  var _stringify = require_stringify();
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function v6ToV1(uuid) {
    const v6Bytes = typeof uuid === "string" ? (0, _parse.default)(uuid) : uuid;
    const v1Bytes = _v6ToV1(v6Bytes);
    return typeof uuid === "string" ? (0, _stringify.unsafeStringify)(v1Bytes) : v1Bytes;
  }
  function _v6ToV1(v6Bytes) {
    return Uint8Array.of((v6Bytes[3] & 15) << 4 | v6Bytes[4] >> 4 & 15, (v6Bytes[4] & 15) << 4 | (v6Bytes[5] & 240) >> 4, (v6Bytes[5] & 15) << 4 | v6Bytes[6] & 15, v6Bytes[7], (v6Bytes[1] & 15) << 4 | (v6Bytes[2] & 240) >> 4, (v6Bytes[2] & 15) << 4 | (v6Bytes[3] & 240) >> 4, 16 | (v6Bytes[0] & 240) >> 4, (v6Bytes[0] & 15) << 4 | (v6Bytes[1] & 240) >> 4, v6Bytes[8], v6Bytes[9], v6Bytes[10], v6Bytes[11], v6Bytes[12], v6Bytes[13], v6Bytes[14], v6Bytes[15]);
  }
});

// node_modules/uuid/dist/v7.js
var require_v7 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _rng = _interopRequireDefault(require_rng());
  var _stringify = require_stringify();
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  var _seqLow = null;
  var _seqHigh = null;
  var _msecs = 0;
  function v7(options, buf, offset) {
    options = options || {};
    let i = buf && offset || 0;
    const b = buf || new Uint8Array(16);
    const rnds = options.random || (options.rng || _rng.default)();
    const msecs = options.msecs !== undefined ? options.msecs : Date.now();
    let seq = options.seq !== undefined ? options.seq : null;
    let seqHigh = _seqHigh;
    let seqLow = _seqLow;
    if (msecs > _msecs && options.msecs === undefined) {
      _msecs = msecs;
      if (seq !== null) {
        seqHigh = null;
        seqLow = null;
      }
    }
    if (seq !== null) {
      if (seq > 2147483647) {
        seq = 2147483647;
      }
      seqHigh = seq >>> 19 & 4095;
      seqLow = seq & 524287;
    }
    if (seqHigh === null || seqLow === null) {
      seqHigh = rnds[6] & 127;
      seqHigh = seqHigh << 8 | rnds[7];
      seqLow = rnds[8] & 63;
      seqLow = seqLow << 8 | rnds[9];
      seqLow = seqLow << 5 | rnds[10] >>> 3;
    }
    if (msecs + 1e4 > _msecs && seq === null) {
      if (++seqLow > 524287) {
        seqLow = 0;
        if (++seqHigh > 4095) {
          seqHigh = 0;
          _msecs++;
        }
      }
    } else {
      _msecs = msecs;
    }
    _seqHigh = seqHigh;
    _seqLow = seqLow;
    b[i++] = _msecs / 1099511627776 & 255;
    b[i++] = _msecs / 4294967296 & 255;
    b[i++] = _msecs / 16777216 & 255;
    b[i++] = _msecs / 65536 & 255;
    b[i++] = _msecs / 256 & 255;
    b[i++] = _msecs & 255;
    b[i++] = seqHigh >>> 4 & 15 | 112;
    b[i++] = seqHigh & 255;
    b[i++] = seqLow >>> 13 & 63 | 128;
    b[i++] = seqLow >>> 5 & 255;
    b[i++] = seqLow << 3 & 255 | rnds[10] & 7;
    b[i++] = rnds[11];
    b[i++] = rnds[12];
    b[i++] = rnds[13];
    b[i++] = rnds[14];
    b[i++] = rnds[15];
    return buf || (0, _stringify.unsafeStringify)(b);
  }
  var _default = exports.default = v7;
});

// node_modules/uuid/dist/version.js
var require_version = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _validate = _interopRequireDefault(require_validate());
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function version(uuid) {
    if (!(0, _validate.default)(uuid)) {
      throw TypeError("Invalid UUID");
    }
    return parseInt(uuid.slice(14, 15), 16);
  }
  var _default = exports.default = version;
});

// node_modules/uuid/dist/index.js
var require_dist = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "MAX", {
    enumerable: true,
    get: function() {
      return _max.default;
    }
  });
  Object.defineProperty(exports, "NIL", {
    enumerable: true,
    get: function() {
      return _nil.default;
    }
  });
  Object.defineProperty(exports, "parse", {
    enumerable: true,
    get: function() {
      return _parse.default;
    }
  });
  Object.defineProperty(exports, "stringify", {
    enumerable: true,
    get: function() {
      return _stringify.default;
    }
  });
  Object.defineProperty(exports, "v1", {
    enumerable: true,
    get: function() {
      return _v.default;
    }
  });
  Object.defineProperty(exports, "v1ToV6", {
    enumerable: true,
    get: function() {
      return _v1ToV.default;
    }
  });
  Object.defineProperty(exports, "v3", {
    enumerable: true,
    get: function() {
      return _v2.default;
    }
  });
  Object.defineProperty(exports, "v4", {
    enumerable: true,
    get: function() {
      return _v3.default;
    }
  });
  Object.defineProperty(exports, "v5", {
    enumerable: true,
    get: function() {
      return _v4.default;
    }
  });
  Object.defineProperty(exports, "v6", {
    enumerable: true,
    get: function() {
      return _v5.default;
    }
  });
  Object.defineProperty(exports, "v6ToV1", {
    enumerable: true,
    get: function() {
      return _v6ToV.default;
    }
  });
  Object.defineProperty(exports, "v7", {
    enumerable: true,
    get: function() {
      return _v6.default;
    }
  });
  Object.defineProperty(exports, "validate", {
    enumerable: true,
    get: function() {
      return _validate.default;
    }
  });
  Object.defineProperty(exports, "version", {
    enumerable: true,
    get: function() {
      return _version.default;
    }
  });
  var _max = _interopRequireDefault(require_max());
  var _nil = _interopRequireDefault(require_nil());
  var _parse = _interopRequireDefault(require_parse());
  var _stringify = _interopRequireDefault(require_stringify());
  var _v = _interopRequireDefault(require_v1());
  var _v1ToV = _interopRequireDefault(require_v1ToV6());
  var _v2 = _interopRequireDefault(require_v3());
  var _v3 = _interopRequireDefault(require_v4());
  var _v4 = _interopRequireDefault(require_v5());
  var _v5 = _interopRequireDefault(require_v6());
  var _v6ToV = _interopRequireDefault(require_v6ToV1());
  var _v6 = _interopRequireDefault(require_v7());
  var _validate = _interopRequireDefault(require_validate());
  var _version = _interopRequireDefault(require_version());
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
});

// node_modules/uuid/wrapper.mjs
var import_dist, v1, v1ToV6, v3, v4, v5, v6, v6ToV1, v7, NIL, MAX, version, validate, stringify, parse;
var init_wrapper = __esm(() => {
  import_dist = __toESM(require_dist(), 1);
  v1 = import_dist.default.v1;
  v1ToV6 = import_dist.default.v1ToV6;
  v3 = import_dist.default.v3;
  v4 = import_dist.default.v4;
  v5 = import_dist.default.v5;
  v6 = import_dist.default.v6;
  v6ToV1 = import_dist.default.v6ToV1;
  v7 = import_dist.default.v7;
  NIL = import_dist.default.NIL;
  MAX = import_dist.default.MAX;
  version = import_dist.default.version;
  validate = import_dist.default.validate;
  stringify = import_dist.default.stringify;
  parse = import_dist.default.parse;
});

// src/neural/neuron.ts
class NeuronImpl {
  id;
  bias;
  weights;
  activation;
  gradient;
  delta;
  connections;
  layer;
  position;
  inputSize;
  constructor(layer, position, inputSize) {
    this.id = v4();
    this.layer = layer;
    this.position = position;
    this.inputSize = inputSize;
    const limit = Math.sqrt(6 / (inputSize + 1));
    this.weights = new Float64Array(inputSize);
    for (let i = 0;i < inputSize; i++) {
      this.weights[i] = (Math.random() * 2 - 1) * limit;
    }
    this.bias = (Math.random() * 2 - 1) * limit;
    this.activation = 0;
    this.gradient = 0;
    this.delta = 0;
    this.connections = new Set;
  }
  forward(inputs) {
    let sum = this.bias;
    for (let i = 0;i < inputs.length && i < this.weights.length; i++) {
      sum += inputs[i] * this.weights[i];
    }
    this.activation = sum;
    return sum;
  }
  updateWeights(inputs, learningRate, gradient) {
    for (let i = 0;i < this.weights.length && i < inputs.length; i++) {
      this.weights[i] -= learningRate * gradient * inputs[i];
    }
    this.bias -= learningRate * gradient;
  }
  getWeights() {
    return this.weights.slice();
  }
  setWeights(weights) {
    this.weights = new Float64Array(weights);
  }
  clone() {
    const cloned = new NeuronImpl(this.layer, this.position, this.inputSize);
    cloned.id = this.id;
    cloned.bias = this.bias;
    cloned.weights = new Float64Array(this.weights);
    cloned.activation = this.activation;
    cloned.gradient = this.gradient;
    cloned.delta = this.delta;
    cloned.connections = new Set(this.connections);
    return cloned;
  }
  serialize() {
    return {
      id: this.id,
      bias: this.bias,
      weights: this.weights,
      activation: this.activation,
      gradient: this.gradient,
      delta: this.delta,
      connections: this.connections,
      layer: this.layer,
      position: this.position
    };
  }
  static deserialize(data) {
    const neuron = new NeuronImpl(data.layer, data.position, data.weights.length);
    neuron.id = data.id;
    neuron.bias = data.bias;
    neuron.weights = new Float64Array(data.weights);
    neuron.activation = data.activation;
    neuron.gradient = data.gradient;
    neuron.delta = data.delta;
    neuron.connections = new Set(data.connections);
    return neuron;
  }
}
var init_neuron = __esm(() => {
  init_wrapper();
});

// src/neural/activations.ts
function applyActivation(fn, x, context) {
  if (fn === "softmax" && context?.allValues) {
    const softmaxResults = softmaxForward(new Float64Array(context.allValues));
    const idx = context.allValues.indexOf(x);
    return idx >= 0 ? softmaxResults[idx] : activations[fn].forward(x);
  }
  return activations[fn].forward(x);
}
function applyActivationDerivative(fn, x) {
  return activations[fn].backward(x);
}
function softmaxForward(inputs) {
  const maxVal = Math.max(...inputs);
  const exps = new Float64Array(inputs.length);
  let sum = 0;
  for (let i = 0;i < inputs.length; i++) {
    exps[i] = Math.exp(inputs[i] - maxVal);
    sum += exps[i];
  }
  for (let i = 0;i < inputs.length; i++) {
    exps[i] /= sum;
  }
  return exps;
}
function softmaxBackward(softmaxOutput, gradOutput) {
  const n = softmaxOutput.length;
  const gradInput = new Float64Array(n);
  for (let i = 0;i < n; i++) {
    let sum = 0;
    for (let j = 0;j < n; j++) {
      const kronecker = i === j ? 1 : 0;
      sum += gradOutput[j] * softmaxOutput[i] * (kronecker - softmaxOutput[j]);
    }
    gradInput[i] = sum;
  }
  return gradInput;
}
var ALPHA = 0.01, ELU_ALPHA = 1, SELU_SCALE = 1.0507009873554805, SELU_ALPHA = 1.6732632423543772, activations;
var init_activations = __esm(() => {
  activations = {
    sigmoid: {
      forward: (x) => {
        if (x >= 0) {
          const expNegX = Math.exp(-x);
          return 1 / (1 + expNegX);
        }
        const expX = Math.exp(x);
        return expX / (1 + expX);
      },
      backward: (x) => {
        const s = activations.sigmoid.forward(x);
        return s * (1 - s);
      }
    },
    tanh: {
      forward: (x) => Math.tanh(x),
      backward: (x) => {
        const t = Math.tanh(x);
        return 1 - t * t;
      }
    },
    relu: {
      forward: (x) => Math.max(0, x),
      backward: (x) => x > 0 ? 1 : 0
    },
    leaky_relu: {
      forward: (x) => x > 0 ? x : ALPHA * x,
      backward: (x) => x > 0 ? 1 : ALPHA
    },
    elu: {
      forward: (x) => x > 0 ? x : ELU_ALPHA * (Math.exp(x) - 1),
      backward: (x) => x > 0 ? 1 : ELU_ALPHA * Math.exp(x)
    },
    selu: {
      forward: (x) => {
        if (x > 0)
          return SELU_SCALE * x;
        return SELU_SCALE * SELU_ALPHA * (Math.exp(x) - 1);
      },
      backward: (x) => {
        if (x > 0)
          return SELU_SCALE;
        return SELU_SCALE * SELU_ALPHA * Math.exp(x);
      }
    },
    gelu: {
      forward: (x) => {
        const cdf = 0.5 * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x * x * x)));
        return x * cdf;
      },
      backward: (x) => {
        const tanh = Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x * x * x));
        const sech2 = 1 - tanh * tanh;
        const inner = Math.sqrt(2 / Math.PI) * (1 + 3 * 0.044715 * x * x);
        return 0.5 * (1 + tanh) + 0.5 * x * sech2 * inner;
      }
    },
    swish: {
      forward: (x) => x * activations.sigmoid.forward(x),
      backward: (x) => {
        const sig = activations.sigmoid.forward(x);
        return sig + x * sig * (1 - sig);
      }
    },
    mish: {
      forward: (x) => x * Math.tanh(Math.log(1 + Math.exp(x))),
      backward: (x) => {
        const exp = Math.exp(x);
        const exp2 = exp * exp;
        const exp3 = exp2 * exp;
        const tanh = Math.tanh(Math.log(1 + exp));
        const sech2 = 1 - tanh * tanh;
        const numerator = exp3 + 4 * exp2 + 6 * exp * x + x * exp3 + 4 * x;
        const denominator = (exp2 + 2 * exp + 1) * (exp2 + 2 * exp + 1);
        return tanh + sech2 * numerator / denominator;
      }
    },
    softmax: {
      forward: (x) => {
        return Math.exp(x);
      },
      backward: (_x) => {
        throw new Error("Softmax backward requires full context");
      }
    },
    linear: {
      forward: (x) => x,
      backward: (_x) => 1
    },
    hard_sigmoid: {
      forward: (x) => {
        if (x < -2.5)
          return 0;
        if (x > 2.5)
          return 1;
        return 0.2 * x + 0.5;
      },
      backward: (x) => {
        if (x >= -2.5 && x <= 2.5)
          return 0.2;
        return 0;
      }
    },
    softplus: {
      forward: (x) => Math.log(1 + Math.exp(x)),
      backward: (x) => 1 / (1 + Math.exp(-x))
    },
    softsign: {
      forward: (x) => x / (1 + Math.abs(x)),
      backward: (x) => 1 / ((1 + Math.abs(x)) * (1 + Math.abs(x)))
    },
    exponential: {
      forward: (x) => Math.exp(x),
      backward: (x) => Math.exp(x)
    }
  };
});

// src/neural/layer.ts
class LayerImpl {
  id;
  neurons;
  activationFunction;
  type;
  dropoutRate;
  inputSize;
  constructor(type, size, inputSize, activationFunction = "relu", dropoutRate = 0) {
    this.id = v4();
    this.type = type;
    this.activationFunction = activationFunction;
    this.dropoutRate = dropoutRate;
    this.inputSize = inputSize;
    this.neurons = [];
    for (let i = 0;i < size; i++) {
      this.neurons.push(new NeuronImpl(type === "input" ? 0 : 1, i, type === "input" ? 1 : inputSize));
    }
  }
  forward(inputs, training = false) {
    const outputs = new Float64Array(this.neurons.length);
    const preActivations = new Float64Array(this.neurons.length);
    for (let i = 0;i < this.neurons.length; i++) {
      preActivations[i] = this.neurons[i].forward(inputs);
    }
    if (this.activationFunction === "softmax") {
      const softmaxOutput = softmaxForward(preActivations);
      for (let i = 0;i < this.neurons.length; i++) {
        outputs[i] = softmaxOutput[i];
        this.neurons[i].activation = softmaxOutput[i];
      }
    } else {
      for (let i = 0;i < this.neurons.length; i++) {
        outputs[i] = applyActivation(this.activationFunction, preActivations[i]);
        this.neurons[i].activation = outputs[i];
      }
    }
    if (training && this.dropoutRate > 0 && this.type !== "input") {
      for (let i = 0;i < outputs.length; i++) {
        if (Math.random() < this.dropoutRate) {
          outputs[i] = 0;
        } else {
          outputs[i] /= 1 - this.dropoutRate;
        }
      }
    }
    return outputs;
  }
  backward(errors, prevActivations, learningRate) {
    const prevErrors = new Float64Array(this.inputSize);
    for (let i = 0;i < this.neurons.length; i++) {
      const neuron = this.neurons[i];
      let gradient = errors[i];
      if (this.activationFunction !== "softmax") {
        gradient *= applyActivationDerivative(this.activationFunction, neuron.activation);
      }
      neuron.delta = gradient;
      for (let j = 0;j < neuron.weights.length && j < prevActivations.length; j++) {
        prevErrors[j] += gradient * neuron.weights[j];
        neuron.weights[j] -= learningRate * gradient * prevActivations[j];
      }
      neuron.bias -= learningRate * gradient;
    }
    return prevErrors;
  }
  getOutput() {
    return new Float64Array(this.neurons.map((n) => n.activation));
  }
  getSize() {
    return this.neurons.length;
  }
  getInputSize() {
    return this.inputSize;
  }
  serialize() {
    return {
      id: this.id,
      neurons: this.neurons.map((n) => n instanceof NeuronImpl ? n.serialize() : n),
      activationFunction: this.activationFunction,
      type: this.type,
      dropoutRate: this.dropoutRate
    };
  }
  static deserialize(data) {
    const layer = new LayerImpl(data.type, data.neurons.length, data.neurons[0]?.weights?.length || 1, data.activationFunction, data.dropoutRate);
    layer.id = data.id;
    layer.neurons = data.neurons.map((n, i) => {
      const neuron = NeuronImpl.deserialize(n);
      neuron.layer = data.type === "input" ? 0 : 1;
      neuron.position = i;
      return neuron;
    });
    return layer;
  }
}
var EmbeddingLayer, AttentionLayer, LSTMLayer;
var init_layer = __esm(() => {
  init_wrapper();
  init_neuron();
  init_activations();
  EmbeddingLayer = class EmbeddingLayer extends LayerImpl {
    embeddingMatrix;
    vocabSize;
    embeddingDim;
    constructor(vocabSize, embeddingDim) {
      super("embedding", embeddingDim, 1, "linear", 0);
      this.vocabSize = vocabSize;
      this.embeddingDim = embeddingDim;
      this.embeddingMatrix = [];
      const limit = Math.sqrt(3 / embeddingDim);
      for (let i = 0;i < vocabSize; i++) {
        const embedding = new Float64Array(embeddingDim);
        for (let j = 0;j < embeddingDim; j++) {
          embedding[j] = (Math.random() * 2 - 1) * limit;
        }
        this.embeddingMatrix.push(embedding);
      }
    }
    embedTokens(indices) {
      return indices.map((idx) => {
        if (idx >= 0 && idx < this.embeddingMatrix.length) {
          return this.embeddingMatrix[idx].slice();
        }
        return new Float64Array(this.embeddingDim).fill(0);
      });
    }
    updateEmbedding(indices, gradients, learningRate) {
      for (let i = 0;i < indices.length; i++) {
        const idx = indices[i];
        if (idx >= 0 && idx < this.embeddingMatrix.length && i < gradients.length) {
          for (let j = 0;j < this.embeddingDim; j++) {
            this.embeddingMatrix[idx][j] -= learningRate * gradients[i][j];
          }
        }
      }
    }
  };
  AttentionLayer = class AttentionLayer extends LayerImpl {
    headSize;
    numHeads;
    constructor(size, numHeads, inputSize) {
      super("attention", size, inputSize, "linear", 0);
      this.numHeads = numHeads;
      this.headSize = Math.floor(size / numHeads);
    }
    computeAttention(query, key, value) {
      const seqLen = query.length;
      const outputs = [];
      for (let h = 0;h < this.numHeads; h++) {
        const headOutputs = [];
        for (let i = 0;i < seqLen; i++) {
          const scores = new Float64Array(seqLen);
          for (let j = 0;j < seqLen; j++) {
            let dot = 0;
            for (let k = 0;k < this.headSize; k++) {
              dot += query[i][h * this.headSize + k] * key[j][h * this.headSize + k];
            }
            scores[j] = dot / Math.sqrt(this.headSize);
          }
          const maxScore = Math.max(...scores);
          let sum = 0;
          for (let j = 0;j < seqLen; j++) {
            scores[j] = Math.exp(scores[j] - maxScore);
            sum += scores[j];
          }
          for (let j = 0;j < seqLen; j++) {
            scores[j] /= sum;
          }
          const output = new Float64Array(this.headSize);
          for (let j = 0;j < seqLen; j++) {
            for (let k = 0;k < this.headSize; k++) {
              output[k] += scores[j] * value[j][h * this.headSize + k];
            }
          }
          headOutputs.push(output);
        }
        for (let i = 0;i < seqLen; i++) {
          if (!outputs[i]) {
            outputs[i] = new Float64Array(this.neurons.length);
          }
          for (let k = 0;k < this.headSize; k++) {
            outputs[i][h * this.headSize + k] = headOutputs[i][k];
          }
        }
      }
      return outputs;
    }
  };
  LSTMLayer = class LSTMLayer extends LayerImpl {
    forgetGateWeights;
    inputGateWeights;
    outputGateWeights;
    cellGateWeights;
    constructor(size, inputSize) {
      super("lstm", size, inputSize, "tanh", 0);
      const limit = Math.sqrt(6 / (size + inputSize));
      this.forgetGateWeights = new Float64Array(inputSize + size);
      this.inputGateWeights = new Float64Array(inputSize + size);
      this.outputGateWeights = new Float64Array(inputSize + size);
      this.cellGateWeights = new Float64Array(inputSize + size);
      for (let i = 0;i < this.forgetGateWeights.length; i++) {
        this.forgetGateWeights[i] = (Math.random() * 2 - 1) * limit;
        this.inputGateWeights[i] = (Math.random() * 2 - 1) * limit;
        this.outputGateWeights[i] = (Math.random() * 2 - 1) * limit;
        this.cellGateWeights[i] = (Math.random() * 2 - 1) * limit;
      }
    }
    forwardStep(input, prevHidden, prevCell) {
      const combined = new Float64Array(this.inputSize + this.neurons.length);
      combined.set(input, 0);
      combined.set(prevHidden, this.inputSize);
      const forgetGate = new Float64Array(this.neurons.length);
      for (let i = 0;i < this.neurons.length; i++) {
        let sum = 0;
        for (let j = 0;j < combined.length; j++) {
          sum += combined[j] * this.forgetGateWeights[j];
        }
        forgetGate[i] = 1 / (1 + Math.exp(-sum));
      }
      const inputGate = new Float64Array(this.neurons.length);
      for (let i = 0;i < this.neurons.length; i++) {
        let sum = 0;
        for (let j = 0;j < combined.length; j++) {
          sum += combined[j] * this.inputGateWeights[j];
        }
        inputGate[i] = 1 / (1 + Math.exp(-sum));
      }
      const cellCandidate = new Float64Array(this.neurons.length);
      for (let i = 0;i < this.neurons.length; i++) {
        let sum = 0;
        for (let j = 0;j < combined.length; j++) {
          sum += combined[j] * this.cellGateWeights[j];
        }
        cellCandidate[i] = Math.tanh(sum);
      }
      const newCell = new Float64Array(this.neurons.length);
      for (let i = 0;i < this.neurons.length; i++) {
        newCell[i] = forgetGate[i] * prevCell[i] + inputGate[i] * cellCandidate[i];
      }
      const outputGate = new Float64Array(this.neurons.length);
      for (let i = 0;i < this.neurons.length; i++) {
        let sum = 0;
        for (let j = 0;j < combined.length; j++) {
          sum += combined[j] * this.outputGateWeights[j];
        }
        outputGate[i] = 1 / (1 + Math.exp(-sum));
      }
      const newHidden = new Float64Array(this.neurons.length);
      for (let i = 0;i < this.neurons.length; i++) {
        newHidden[i] = outputGate[i] * Math.tanh(newCell[i]);
      }
      return { hidden: newHidden, cell: newCell };
    }
  };
});

// src/neural/loss.ts
function computeLoss(fn, predicted, target) {
  if (fn === "sparse_categorical_crossentropy" && typeof target === "number") {
    return lossFunctions.sparse_categorical_crossentropy.compute(predicted, target);
  }
  const lossFn = lossFunctions[fn];
  return lossFn.compute(predicted, target);
}
function computeLossGradient(fn, predicted, target) {
  if (fn === "sparse_categorical_crossentropy" && typeof target === "number") {
    return lossFunctions.sparse_categorical_crossentropy.gradient(predicted, target);
  }
  const lossFn = lossFunctions[fn];
  return lossFn.gradient(predicted, target);
}
var EPSILON = 0.000000000000001, lossFunctions;
var init_loss = __esm(() => {
  lossFunctions = {
    mse: {
      compute: (predicted, target) => {
        let sum = 0;
        for (let i = 0;i < predicted.length; i++) {
          const diff = predicted[i] - target[i];
          sum += diff * diff;
        }
        return sum / predicted.length;
      },
      gradient: (predicted, target) => {
        const grad = new Float64Array(predicted.length);
        const factor = 2 / predicted.length;
        for (let i = 0;i < predicted.length; i++) {
          grad[i] = factor * (predicted[i] - target[i]);
        }
        return grad;
      }
    },
    mae: {
      compute: (predicted, target) => {
        let sum = 0;
        for (let i = 0;i < predicted.length; i++) {
          sum += Math.abs(predicted[i] - target[i]);
        }
        return sum / predicted.length;
      },
      gradient: (predicted, target) => {
        const grad = new Float64Array(predicted.length);
        const factor = 1 / predicted.length;
        for (let i = 0;i < predicted.length; i++) {
          grad[i] = factor * Math.sign(predicted[i] - target[i]);
        }
        return grad;
      }
    },
    binary_crossentropy: {
      compute: (predicted, target) => {
        let sum = 0;
        for (let i = 0;i < predicted.length; i++) {
          const p = Math.max(EPSILON, Math.min(1 - EPSILON, predicted[i]));
          sum += -target[i] * Math.log(p) - (1 - target[i]) * Math.log(1 - p);
        }
        return sum / predicted.length;
      },
      gradient: (predicted, target) => {
        const grad = new Float64Array(predicted.length);
        const factor = 1 / predicted.length;
        for (let i = 0;i < predicted.length; i++) {
          const p = Math.max(EPSILON, Math.min(1 - EPSILON, predicted[i]));
          grad[i] = factor * ((p - target[i]) / (p * (1 - p)));
        }
        return grad;
      }
    },
    categorical_crossentropy: {
      compute: (predicted, target) => {
        let sum = 0;
        for (let i = 0;i < predicted.length; i++) {
          const p = Math.max(EPSILON, predicted[i]);
          sum -= target[i] * Math.log(p);
        }
        return sum;
      },
      gradient: (predicted, target) => {
        const grad = new Float64Array(predicted.length);
        for (let i = 0;i < predicted.length; i++) {
          const p = Math.max(EPSILON, predicted[i]);
          grad[i] = -target[i] / p;
        }
        return grad;
      }
    },
    sparse_categorical_crossentropy: {
      compute: (predicted, targetIndex) => {
        const p = Math.max(EPSILON, predicted[targetIndex]);
        return -Math.log(p);
      },
      gradient: (predicted, targetIndex) => {
        const grad = new Float64Array(predicted.length);
        for (let i = 0;i < predicted.length; i++) {
          grad[i] = i === targetIndex ? -1 / Math.max(EPSILON, predicted[i]) : 0;
        }
        return grad;
      }
    },
    hinge: {
      compute: (predicted, target) => {
        let sum = 0;
        for (let i = 0;i < predicted.length; i++) {
          sum += Math.max(0, 1 - target[i] * predicted[i]);
        }
        return sum / predicted.length;
      },
      gradient: (predicted, target) => {
        const grad = new Float64Array(predicted.length);
        const factor = 1 / predicted.length;
        for (let i = 0;i < predicted.length; i++) {
          if (target[i] * predicted[i] < 1) {
            grad[i] = -factor * target[i];
          }
        }
        return grad;
      }
    },
    squared_hinge: {
      compute: (predicted, target) => {
        let sum = 0;
        for (let i = 0;i < predicted.length; i++) {
          const margin = Math.max(0, 1 - target[i] * predicted[i]);
          sum += margin * margin;
        }
        return sum / predicted.length;
      },
      gradient: (predicted, target) => {
        const grad = new Float64Array(predicted.length);
        const factor = 2 / predicted.length;
        for (let i = 0;i < predicted.length; i++) {
          const margin = 1 - target[i] * predicted[i];
          if (margin > 0) {
            grad[i] = -factor * target[i] * margin;
          }
        }
        return grad;
      }
    },
    huber: {
      compute: (predicted, target, delta = 1) => {
        let sum = 0;
        for (let i = 0;i < predicted.length; i++) {
          const diff = Math.abs(predicted[i] - target[i]);
          if (diff <= delta) {
            sum += 0.5 * diff * diff;
          } else {
            sum += delta * diff - 0.5 * delta * delta;
          }
        }
        return sum / predicted.length;
      },
      gradient: (predicted, target, delta = 1) => {
        const grad = new Float64Array(predicted.length);
        const factor = 1 / predicted.length;
        for (let i = 0;i < predicted.length; i++) {
          const diff = predicted[i] - target[i];
          const absDiff = Math.abs(diff);
          if (absDiff <= delta) {
            grad[i] = factor * diff;
          } else {
            grad[i] = factor * delta * Math.sign(diff);
          }
        }
        return grad;
      }
    },
    log_cosh: {
      compute: (predicted, target) => {
        let sum = 0;
        for (let i = 0;i < predicted.length; i++) {
          const diff = predicted[i] - target[i];
          sum += Math.log(Math.cosh(diff));
        }
        return sum / predicted.length;
      },
      gradient: (predicted, target) => {
        const grad = new Float64Array(predicted.length);
        const factor = 1 / predicted.length;
        for (let i = 0;i < predicted.length; i++) {
          const diff = predicted[i] - target[i];
          grad[i] = factor * Math.tanh(diff);
        }
        return grad;
      }
    },
    kl_divergence: {
      compute: (predicted, target) => {
        let sum = 0;
        for (let i = 0;i < predicted.length; i++) {
          const p = Math.max(EPSILON, target[i]);
          const q = Math.max(EPSILON, predicted[i]);
          sum += p * Math.log(p / q);
        }
        return sum;
      },
      gradient: (predicted, target) => {
        const grad = new Float64Array(predicted.length);
        for (let i = 0;i < predicted.length; i++) {
          const p = Math.max(EPSILON, target[i]);
          const q = Math.max(EPSILON, predicted[i]);
          grad[i] = -p / q;
        }
        return grad;
      }
    }
  };
});

// src/neural/optimizers.ts
class OptimizerBase {
  params;
  state;
  constructor(params) {
    this.params = params;
    this.state = {
      velocity: new Map,
      momentum: new Map,
      cache: new Map,
      iteration: 0
    };
  }
  getIteration() {
    return this.state.iteration;
  }
  reset() {
    this.state = {
      velocity: new Map,
      momentum: new Map,
      cache: new Map,
      iteration: 0
    };
  }
}
function createOptimizer(type, params) {
  switch (type) {
    case "sgd":
      return new SGDOptimizer(params);
    case "momentum":
      return new MomentumOptimizer(params);
    case "nesterov":
      return new NesterovOptimizer(params);
    case "adagrad":
      return new AdagradOptimizer(params);
    case "rmsprop":
      return new RMSpropOptimizer(params);
    case "adam":
      return new AdamOptimizer(params);
    case "adamax":
      return new AdamaxOptimizer(params);
    case "nadam":
      return new NadamOptimizer(params);
    case "ftrl":
      return new FtrlOptimizer(params);
    default:
      return new SGDOptimizer(params);
  }
}
var EPSILON2 = 0.00000001, DEFAULT_BETA1 = 0.9, DEFAULT_BETA2 = 0.999, DEFAULT_MOMENTUM = 0.9, DEFAULT_RHO = 0.9, SGDOptimizer, MomentumOptimizer, NesterovOptimizer, AdagradOptimizer, RMSpropOptimizer, AdamOptimizer, AdamaxOptimizer, NadamOptimizer, FtrlOptimizer;
var init_optimizers = __esm(() => {
  SGDOptimizer = class SGDOptimizer extends OptimizerBase {
    update(paramId, param, gradient) {
      const updated = new Float64Array(param.length);
      const lr = this.params.learningRate;
      for (let i = 0;i < param.length; i++) {
        updated[i] = param[i] - lr * gradient[i];
      }
      this.state.iteration++;
      return updated;
    }
  };
  MomentumOptimizer = class MomentumOptimizer extends OptimizerBase {
    update(paramId, param, gradient) {
      let velocity = this.state.velocity.get(paramId);
      if (!velocity) {
        velocity = new Float64Array(param.length);
        this.state.velocity.set(paramId, velocity);
      }
      const updated = new Float64Array(param.length);
      const lr = this.params.learningRate;
      const m = this.params.momentum ?? DEFAULT_MOMENTUM;
      for (let i = 0;i < param.length; i++) {
        velocity[i] = m * velocity[i] - lr * gradient[i];
        updated[i] = param[i] + velocity[i];
      }
      this.state.iteration++;
      return updated;
    }
  };
  NesterovOptimizer = class NesterovOptimizer extends OptimizerBase {
    update(paramId, param, gradient) {
      let velocity = this.state.velocity.get(paramId);
      if (!velocity) {
        velocity = new Float64Array(param.length);
        this.state.velocity.set(paramId, velocity);
      }
      const updated = new Float64Array(param.length);
      const lr = this.params.learningRate;
      const m = this.params.momentum ?? DEFAULT_MOMENTUM;
      for (let i = 0;i < param.length; i++) {
        const oldVelocity = velocity[i];
        velocity[i] = m * velocity[i] - lr * gradient[i];
        updated[i] = param[i] - m * oldVelocity + (1 + m) * velocity[i];
      }
      this.state.iteration++;
      return updated;
    }
  };
  AdagradOptimizer = class AdagradOptimizer extends OptimizerBase {
    update(paramId, param, gradient) {
      let cache = this.state.cache.get(paramId);
      if (!cache) {
        cache = new Float64Array(param.length);
        this.state.cache.set(paramId, cache);
      }
      const updated = new Float64Array(param.length);
      const lr = this.params.learningRate;
      const eps = this.params.epsilon ?? EPSILON2;
      for (let i = 0;i < param.length; i++) {
        cache[i] += gradient[i] * gradient[i];
        updated[i] = param[i] - lr * gradient[i] / (Math.sqrt(cache[i]) + eps);
      }
      this.state.iteration++;
      return updated;
    }
  };
  RMSpropOptimizer = class RMSpropOptimizer extends OptimizerBase {
    update(paramId, param, gradient) {
      let cache = this.state.cache.get(paramId);
      if (!cache) {
        cache = new Float64Array(param.length);
        this.state.cache.set(paramId, cache);
      }
      const updated = new Float64Array(param.length);
      const lr = this.params.learningRate;
      const rho = this.params.rho ?? DEFAULT_RHO;
      const eps = this.params.epsilon ?? EPSILON2;
      for (let i = 0;i < param.length; i++) {
        cache[i] = rho * cache[i] + (1 - rho) * gradient[i] * gradient[i];
        updated[i] = param[i] - lr * gradient[i] / (Math.sqrt(cache[i]) + eps);
      }
      this.state.iteration++;
      return updated;
    }
  };
  AdamOptimizer = class AdamOptimizer extends OptimizerBase {
    update(paramId, param, gradient) {
      let m = this.state.momentum.get(paramId);
      let v = this.state.velocity.get(paramId);
      if (!m) {
        m = new Float64Array(param.length);
        this.state.momentum.set(paramId, m);
      }
      if (!v) {
        v = new Float64Array(param.length);
        this.state.velocity.set(paramId, v);
      }
      const updated = new Float64Array(param.length);
      const lr = this.params.learningRate;
      const beta1 = this.params.beta1 ?? DEFAULT_BETA1;
      const beta2 = this.params.beta2 ?? DEFAULT_BETA2;
      const eps = this.params.epsilon ?? EPSILON2;
      const t = this.state.iteration + 1;
      for (let i = 0;i < param.length; i++) {
        m[i] = beta1 * m[i] + (1 - beta1) * gradient[i];
        v[i] = beta2 * v[i] + (1 - beta2) * gradient[i] * gradient[i];
        const mHat = m[i] / (1 - Math.pow(beta1, t));
        const vHat = v[i] / (1 - Math.pow(beta2, t));
        updated[i] = param[i] - lr * mHat / (Math.sqrt(vHat) + eps);
      }
      this.state.iteration++;
      return updated;
    }
  };
  AdamaxOptimizer = class AdamaxOptimizer extends OptimizerBase {
    update(paramId, param, gradient) {
      let m = this.state.momentum.get(paramId);
      let v = this.state.velocity.get(paramId);
      if (!m) {
        m = new Float64Array(param.length);
        this.state.momentum.set(paramId, m);
      }
      if (!v) {
        v = new Float64Array(param.length);
        this.state.velocity.set(paramId, v);
      }
      const updated = new Float64Array(param.length);
      const lr = this.params.learningRate;
      const beta1 = this.params.beta1 ?? DEFAULT_BETA1;
      const beta2 = this.params.beta2 ?? DEFAULT_BETA2;
      const eps = this.params.epsilon ?? EPSILON2;
      const t = this.state.iteration + 1;
      for (let i = 0;i < param.length; i++) {
        m[i] = beta1 * m[i] + (1 - beta1) * gradient[i];
        v[i] = Math.max(beta2 * v[i], Math.abs(gradient[i]));
        const mHat = m[i] / (1 - Math.pow(beta1, t));
        updated[i] = param[i] - lr * mHat / (v[i] + eps);
      }
      this.state.iteration++;
      return updated;
    }
  };
  NadamOptimizer = class NadamOptimizer extends OptimizerBase {
    update(paramId, param, gradient) {
      let m = this.state.momentum.get(paramId);
      let v = this.state.velocity.get(paramId);
      if (!m) {
        m = new Float64Array(param.length);
        this.state.momentum.set(paramId, m);
      }
      if (!v) {
        v = new Float64Array(param.length);
        this.state.velocity.set(paramId, v);
      }
      const updated = new Float64Array(param.length);
      const lr = this.params.learningRate;
      const beta1 = this.params.beta1 ?? DEFAULT_BETA1;
      const beta2 = this.params.beta2 ?? DEFAULT_BETA2;
      const eps = this.params.epsilon ?? EPSILON2;
      const t = this.state.iteration + 1;
      for (let i = 0;i < param.length; i++) {
        m[i] = beta1 * m[i] + (1 - beta1) * gradient[i];
        v[i] = beta2 * v[i] + (1 - beta2) * gradient[i] * gradient[i];
        const mHat = m[i] / (1 - Math.pow(beta1, t));
        const vHat = v[i] / (1 - Math.pow(beta2, t));
        const nesterovM = m[i] / (1 - Math.pow(beta1, t)) + (1 - beta1) * gradient[i] / (1 - Math.pow(beta1, t));
        updated[i] = param[i] - lr * nesterovM / (Math.sqrt(vHat) + eps);
      }
      this.state.iteration++;
      return updated;
    }
  };
  FtrlOptimizer = class FtrlOptimizer extends OptimizerBase {
    z = new Map;
    update(paramId, param, gradient) {
      let n = this.state.cache.get(paramId);
      let z = this.z.get(paramId);
      if (!n) {
        n = new Float64Array(param.length);
        this.state.cache.set(paramId, n);
      }
      if (!z) {
        z = new Float64Array(param.length);
        this.z.set(paramId, z);
      }
      const updated = new Float64Array(param.length);
      const lr = this.params.learningRate;
      const lambda = 0.01;
      const alpha = 0.5;
      for (let i = 0;i < param.length; i++) {
        n[i] += gradient[i] * gradient[i];
        z[i] += gradient[i] - param[i] * (Math.sqrt(n[i]) / lr);
        const sign = z[i] < 0 ? -1 : 1;
        updated[i] = -sign * Math.max(Math.abs(z[i]) - lambda, 0) / (1 / lr + alpha * Math.sqrt(n[i]));
      }
      this.state.iteration++;
      return updated;
    }
  };
});

// src/neural/network.ts
class NetworkImpl {
  id;
  name;
  layers;
  lossFunction;
  optimizer;
  learningRate;
  momentum;
  decay;
  epoch;
  batchSize;
  initialized;
  optimizerInstance;
  trainingHistory;
  constructor(config) {
    this.id = v4();
    this.name = config.name;
    this.lossFunction = config.lossFunction;
    this.optimizer = config.optimizer;
    this.learningRate = config.learningRate;
    this.momentum = config.momentum ?? 0.9;
    this.decay = config.decay ?? 0.0001;
    this.batchSize = config.batchSize ?? 32;
    this.epoch = 0;
    this.initialized = false;
    this.trainingHistory = [];
    this.layers = [];
    let prevSize = 0;
    for (let i = 0;i < config.layers.length; i++) {
      const layerConfig = config.layers[i];
      if (i === 0) {
        prevSize = layerConfig.size;
      }
      const layer = new LayerImpl(layerConfig.type, layerConfig.size, prevSize, layerConfig.activation, layerConfig.dropout ?? 0);
      this.layers.push(layer);
      prevSize = layerConfig.size;
    }
    this.optimizerInstance = createOptimizer(this.optimizer, {
      learningRate: this.learningRate,
      momentum: this.momentum
    });
    this.initialized = true;
  }
  forward(inputs, training = false) {
    let currentInput = inputs;
    for (let i = 0;i < this.layers.length; i++) {
      const layer = this.layers[i];
      currentInput = layer.forward(currentInput, training);
    }
    return currentInput;
  }
  backward(inputs, targets) {
    const outputs = this.forward(inputs, true);
    const loss = computeLoss(this.lossFunction, outputs, targets);
    let gradients = computeLossGradient(this.lossFunction, outputs, targets);
    for (let i = this.layers.length - 1;i >= 0; i--) {
      const layer = this.layers[i];
      const prevLayer = i > 0 ? this.layers[i - 1] : null;
      const prevActivations = prevLayer ? prevLayer.getOutput() : inputs;
      gradients = layer.backward(gradients, prevActivations, this.learningRate);
    }
    return loss;
  }
  train(samples, config) {
    const startTime = Date.now();
    const epochLoss = [];
    let correctPredictions = 0;
    const shuffled = config.shuffle ? [...samples].sort(() => Math.random() - 0.5) : samples;
    const splitIndex = Math.floor(shuffled.length * (1 - config.validationSplit));
    const trainSamples = shuffled.slice(0, splitIndex);
    const valSamples = shuffled.slice(splitIndex);
    for (let i = 0;i < trainSamples.length; i += config.batchSize) {
      const batch = trainSamples.slice(i, i + config.batchSize);
      let batchLoss = 0;
      for (const sample of batch) {
        const loss = this.backward(sample.input, sample.target);
        batchLoss += loss;
      }
      epochLoss.push(batchLoss / batch.length);
    }
    const avgLoss = epochLoss.reduce((a, b) => a + b, 0) / epochLoss.length;
    let valLoss = 0;
    let valCorrect = 0;
    for (const sample of valSamples) {
      const output = this.forward(sample.input, false);
      valLoss += computeLoss(this.lossFunction, output, sample.target);
      const predictedIdx = this.argmax(output);
      const targetIdx = this.argmax(sample.target);
      if (predictedIdx === targetIdx) {
        valCorrect++;
      }
    }
    valLoss /= valSamples.length;
    const valAccuracy = valSamples.length > 0 ? valCorrect / valSamples.length : 0;
    const accuracy = correctPredictions / trainSamples.length;
    this.epoch++;
    const result = {
      epoch: this.epoch,
      loss: avgLoss,
      accuracy,
      validationLoss: valLoss,
      validationAccuracy: valAccuracy,
      duration: Date.now() - startTime
    };
    this.trainingHistory.push(result);
    if (this.decay > 0) {
      this.learningRate *= 1 / (1 + this.decay * this.epoch);
    }
    return result;
  }
  predict(input) {
    return this.forward(input, false);
  }
  classify(input) {
    const output = this.predict(input);
    return this.argmax(output);
  }
  argmax(arr) {
    let maxIdx = 0;
    for (let i = 1;i < arr.length; i++) {
      if (arr[i] > arr[maxIdx]) {
        maxIdx = i;
      }
    }
    return maxIdx;
  }
  getWeights() {
    const weights = [];
    for (const layer of this.layers) {
      for (const neuron of layer.neurons) {
        weights.push(neuron.weights);
      }
    }
    return weights;
  }
  setWeights(weights) {
    let idx = 0;
    for (const layer of this.layers) {
      for (const neuron of layer.neurons) {
        if (idx < weights.length) {
          neuron.weights = new Float64Array(weights[idx]);
          idx++;
        }
      }
    }
  }
  getTrainingHistory() {
    return [...this.trainingHistory];
  }
  save() {
    return {
      id: this.id,
      name: this.name,
      layers: this.layers.map((l) => l.serialize()),
      lossFunction: this.lossFunction,
      optimizer: this.optimizer,
      learningRate: this.learningRate,
      momentum: this.momentum,
      decay: this.decay,
      epoch: this.epoch,
      batchSize: this.batchSize,
      initialized: this.initialized
    };
  }
  static load(data) {
    const config = {
      name: data.name,
      layers: data.layers.map((l) => ({
        type: l.type,
        size: l.neurons.length,
        activation: l.activationFunction,
        dropout: l.dropoutRate
      })),
      lossFunction: data.lossFunction,
      optimizer: data.optimizer,
      learningRate: data.learningRate,
      momentum: data.momentum,
      decay: data.decay,
      batchSize: data.batchSize
    };
    const network = new NetworkImpl(config);
    network.id = data.id;
    network.epoch = data.epoch;
    network.initialized = data.initialized;
    for (let i = 0;i < network.layers.length && i < data.layers.length; i++) {
      const layer = network.layers[i];
      for (let j = 0;j < layer.neurons.length && j < data.layers[i].neurons.length; j++) {
        layer.neurons[j].weights = new Float64Array(data.layers[i].neurons[j].weights);
        layer.neurons[j].bias = data.layers[i].neurons[j].bias;
      }
    }
    return network;
  }
}
var TransformerNetwork, RecurrentNetwork;
var init_network = __esm(() => {
  init_wrapper();
  init_layer();
  init_loss();
  init_optimizers();
  TransformerNetwork = class TransformerNetwork extends NetworkImpl {
    embeddingLayer;
    attentionLayers;
    constructor(config) {
      super(config);
      this.embeddingLayer = new EmbeddingLayer(config.vocabSize, config.embeddingDim);
      this.attentionLayers = [];
      for (let i = 0;i < config.layers.length; i++) {
        this.attentionLayers.push(new AttentionLayer(config.layers[i].size, config.numHeads, config.embeddingDim));
      }
    }
    forwardSequence(tokenIds) {
      const embeddings = this.embeddingLayer.embedTokens(tokenIds);
      let current = embeddings;
      for (let i = 0;i < this.layers.length; i++) {
        const attention = this.attentionLayers[i];
        current = attention.computeAttention(current, current, current);
        const outputs = [];
        for (const emb of current) {
          outputs.push(this.layers[i].forward(emb, false));
        }
        current = outputs;
      }
      return current[current.length - 1] || new Float64Array(0);
    }
  };
  RecurrentNetwork = class RecurrentNetwork extends NetworkImpl {
    lstmLayers;
    constructor(config) {
      super(config);
      this.lstmLayers = [];
      for (const layerConfig of config.layers) {
        if (layerConfig.type === "lstm") {
          this.lstmLayers.push(new LSTMLayer(layerConfig.size, config.layers[0].size));
        }
      }
    }
    forwardSequence(sequence) {
      let hiddenStates = [];
      let cellStates = [];
      for (const lstm of this.lstmLayers) {
        hiddenStates.push(new Float64Array(lstm.neurons.length));
        cellStates.push(new Float64Array(lstm.neurons.length));
      }
      for (const input of sequence) {
        let currentInput = input;
        for (let i = 0;i < this.lstmLayers.length; i++) {
          const lstm = this.lstmLayers[i];
          const { hidden, cell } = lstm.forwardStep(currentInput, hiddenStates[i], cellStates[i]);
          hiddenStates[i] = hidden;
          cellStates[i] = cell;
          currentInput = hidden;
        }
      }
      return hiddenStates[hiddenStates.length - 1];
    }
  };
});

// src/memory/vector.ts
function dot(a, b) {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0;i < len; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}
function magnitude(v) {
  let sum = 0;
  for (let i = 0;i < v.length; i++) {
    sum += v[i] * v[i];
  }
  return Math.sqrt(sum);
}
function normalize(v) {
  const mag = magnitude(v);
  const result = new Float64Array(v.length);
  if (mag > EPSILON3) {
    for (let i = 0;i < v.length; i++) {
      result[i] = v[i] / mag;
    }
  }
  return result;
}
function scale(v, s) {
  const result = new Float64Array(v.length);
  for (let i = 0;i < v.length; i++) {
    result[i] = v[i] * s;
  }
  return result;
}
function add(a, b) {
  const result = new Float64Array(Math.max(a.length, b.length));
  for (let i = 0;i < result.length; i++) {
    result[i] = (a[i] || 0) + (b[i] || 0);
  }
  return result;
}
function subtract(a, b) {
  const result = new Float64Array(Math.max(a.length, b.length));
  for (let i = 0;i < result.length; i++) {
    result[i] = (a[i] || 0) - (b[i] || 0);
  }
  return result;
}
function hadamard(a, b) {
  const result = new Float64Array(Math.min(a.length, b.length));
  for (let i = 0;i < result.length; i++) {
    result[i] = a[i] * b[i];
  }
  return result;
}
function euclideanDistance(a, b) {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0;i < len; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}
function cosineDistance(a, b) {
  const dotProduct = dot(a, b);
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA < EPSILON3 || magB < EPSILON3) {
    return 1;
  }
  return 1 - dotProduct / (magA * magB);
}
function manhattanDistance(a, b) {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0;i < len; i++) {
    sum += Math.abs(a[i] - b[i]);
  }
  return sum;
}
function hammingDistance(a, b) {
  let count = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0;i < len; i++) {
    if (a[i] !== b[i]) {
      count++;
    }
  }
  return count;
}
function jaccardDistance(a, b) {
  let intersection = 0;
  let union = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0;i < len; i++) {
    if (a[i] > 0 && b[i] > 0) {
      intersection++;
    }
    if (a[i] > 0 || b[i] > 0) {
      union++;
    }
  }
  if (union === 0)
    return 1;
  return 1 - intersection / union;
}
function computeDistance(a, b, metric) {
  switch (metric) {
    case "euclidean":
      return euclideanDistance(a, b);
    case "cosine":
      return cosineDistance(a, b);
    case "manhattan":
      return manhattanDistance(a, b);
    case "hamming":
      return hammingDistance(a, b);
    case "jaccard":
      return jaccardDistance(a, b);
    default:
      return euclideanDistance(a, b);
  }
}
function cosineSimilarity(a, b) {
  const dotProduct = dot(a, b);
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA < EPSILON3 || magB < EPSILON3) {
    return 0;
  }
  return dotProduct / (magA * magB);
}
function softMax(values) {
  const max = Math.max(...values);
  const result = new Float64Array(values.length);
  let sum = 0;
  for (let i = 0;i < values.length; i++) {
    result[i] = Math.exp(values[i] - max);
    sum += result[i];
  }
  for (let i = 0;i < values.length; i++) {
    result[i] /= sum;
  }
  return result;
}
function randomVector(dimensions, scale2 = 1) {
  const v = new Float64Array(dimensions);
  for (let i = 0;i < dimensions; i++) {
    v[i] = (Math.random() * 2 - 1) * scale2;
  }
  return v;
}
function zeroVector(dimensions) {
  return new Float64Array(dimensions);
}
function onesVector(dimensions) {
  const v = new Float64Array(dimensions);
  v.fill(1);
  return v;
}
function concat(...vectors) {
  const totalLength = vectors.reduce((sum, v) => sum + v.length, 0);
  const result = new Float64Array(totalLength);
  let offset = 0;
  for (const v of vectors) {
    result.set(v, offset);
    offset += v.length;
  }
  return result;
}
function slice(v, start, end) {
  return v.slice(start, end);
}
function mean(vectors) {
  if (vectors.length === 0)
    return new Float64Array(0);
  const dimensions = vectors[0].length;
  const result = new Float64Array(dimensions);
  for (const v of vectors) {
    for (let i = 0;i < dimensions; i++) {
      result[i] += v[i];
    }
  }
  const n = vectors.length;
  for (let i = 0;i < dimensions; i++) {
    result[i] /= n;
  }
  return result;
}
function variance(vectors) {
  if (vectors.length === 0)
    return new Float64Array(0);
  const avg = mean(vectors);
  const dimensions = avg.length;
  const result = new Float64Array(dimensions);
  for (const v of vectors) {
    for (let i = 0;i < dimensions; i++) {
      const diff = v[i] - avg[i];
      result[i] += diff * diff;
    }
  }
  const n = vectors.length;
  for (let i = 0;i < dimensions; i++) {
    result[i] /= n;
  }
  return result;
}
function standardDeviation(vectors) {
  const variances = variance(vectors);
  const result = new Float64Array(variances.length);
  for (let i = 0;i < variances.length; i++) {
    result[i] = Math.sqrt(variances[i]);
  }
  return result;
}
var EPSILON3 = 0.0000000001;

// src/memory/embedding.ts
function charToEmbedding(char) {
  const code = char.charCodeAt(0);
  const embedding = new Float64Array(CHAR_EMBEDDING_DIM);
  const seed = code * 2654435761;
  for (let i = 0;i < CHAR_EMBEDDING_DIM; i++) {
    const x = Math.sin(seed + i * 12.9898) * 43758.5453;
    embedding[i] = (x - Math.floor(x)) * 2 - 1;
  }
  return embedding;
}
function wordToEmbedding(word, dimensions) {
  const charEmbeddings = [];
  for (const char of word.toLowerCase()) {
    charEmbeddings.push(charToEmbedding(char));
  }
  if (charEmbeddings.length === 0) {
    return new Float64Array(dimensions);
  }
  const avgCharEmbedding = new Float64Array(CHAR_EMBEDDING_DIM);
  for (const emb of charEmbeddings) {
    for (let i = 0;i < CHAR_EMBEDDING_DIM; i++) {
      avgCharEmbedding[i] += emb[i];
    }
  }
  for (let i = 0;i < CHAR_EMBEDDING_DIM; i++) {
    avgCharEmbedding[i] /= charEmbeddings.length;
  }
  const result = new Float64Array(dimensions);
  for (let i = 0;i < dimensions; i++) {
    let sum = 0;
    for (let j = 0;j < CHAR_EMBEDDING_DIM; j++) {
      const weight = Math.sin((i + 1) * (j + 1) * 0.1) * 0.5;
      sum += avgCharEmbedding[j] * weight;
    }
    result[i] = sum;
  }
  return normalize(result);
}

class EmbeddingEngine {
  dimensions;
  vocabulary;
  documentFrequency;
  totalDocuments;
  ngramSize;
  constructor(dimensions = DEFAULT_DIMENSIONS) {
    this.dimensions = dimensions;
    this.vocabulary = new Map;
    this.documentFrequency = new Map;
    this.totalDocuments = 0;
    this.ngramSize = 3;
  }
  tokenize(text) {
    return text.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter((w) => w.length > 0);
  }
  getNgrams(tokens) {
    const ngrams = [];
    for (let i = 0;i <= tokens.length - this.ngramSize; i++) {
      ngrams.push(tokens.slice(i, i + this.ngramSize).join("_"));
    }
    return ngrams;
  }
  embed(text) {
    const tokens = this.tokenize(text);
    const ngrams = this.getNgrams(tokens);
    const allTerms = [...new Set([...tokens, ...ngrams])];
    if (allTerms.length === 0) {
      return new Float64Array(this.dimensions);
    }
    const embedding = new Float64Array(this.dimensions);
    const tfidfWeights = [];
    for (const term of allTerms) {
      const tf = tokens.filter((t) => t === term).length / tokens.length;
      const idf = Math.log((this.totalDocuments + 1) / ((this.documentFrequency.get(term) || 0) + 1)) + 1;
      tfidfWeights.push(tf * idf);
    }
    const weightSum = tfidfWeights.reduce((a, b) => a + b, 0);
    const normalizedWeights = tfidfWeights.map((w) => w / weightSum);
    for (let i = 0;i < allTerms.length; i++) {
      const term = allTerms[i];
      let termEmbedding = this.vocabulary.get(term);
      if (!termEmbedding) {
        termEmbedding = wordToEmbedding(term, this.dimensions);
        this.vocabulary.set(term, termEmbedding);
      }
      const weight = normalizedWeights[i];
      for (let j = 0;j < this.dimensions; j++) {
        embedding[j] += weight * termEmbedding[j];
      }
    }
    this.addPositionalEncoding(embedding, tokens.length);
    return normalize(embedding);
  }
  addPositionalEncoding(embedding, length) {
    const position = length % 100;
    for (let i = 0;i < this.dimensions; i += 2) {
      const angle = position / Math.pow(1e4, i / this.dimensions);
      embedding[i] += Math.sin(angle) * 0.1;
      if (i + 1 < this.dimensions) {
        embedding[i + 1] += Math.cos(angle) * 0.1;
      }
    }
  }
  embedBatch(texts) {
    for (const text of texts) {
      const tokens = new Set(this.tokenize(text));
      for (const token of tokens) {
        this.documentFrequency.set(token, (this.documentFrequency.get(token) || 0) + 1);
      }
    }
    this.totalDocuments += texts.length;
    return texts.map((text) => this.embed(text));
  }
  similarity(a, b) {
    const embA = this.embed(a);
    const embB = this.embed(b);
    return cosineSimilarity(embA, embB);
  }
  similarityMatrix(texts) {
    const embeddings = texts.map((t) => this.embed(t));
    const matrix = [];
    for (let i = 0;i < texts.length; i++) {
      matrix[i] = [];
      for (let j = 0;j < texts.length; j++) {
        matrix[i][j] = cosineSimilarity(embeddings[i], embeddings[j]);
      }
    }
    return matrix;
  }
  getVocabulary() {
    return new Map(this.vocabulary);
  }
  setVocabulary(vocab) {
    this.vocabulary = new Map(vocab);
  }
  getDimensions() {
    return this.dimensions;
  }
}

class VectorIndexImpl {
  dimensions;
  trees;
  metric;
  nodes;
  rootNode;
  projectionVectors;
  constructor(dimensions, trees = DEFAULT_TREES, metric = "cosine") {
    this.dimensions = dimensions;
    this.trees = trees;
    this.metric = metric;
    this.nodes = new Map;
    this.rootNode = null;
    this.projectionVectors = [];
    for (let i = 0;i < trees * 10; i++) {
      const v = new Float64Array(dimensions);
      for (let j = 0;j < dimensions; j++) {
        v[j] = (Math.random() * 2 - 1) / Math.sqrt(dimensions);
      }
      this.projectionVectors.push(normalize(v));
    }
  }
  add(id, vector) {
    if (vector.length !== this.dimensions) {
      throw new Error(`Vector dimension mismatch. Expected ${this.dimensions}, got ${vector.length}`);
    }
    this.nodes.set(id, normalize(vector));
  }
  remove(id) {
    this.nodes.delete(id);
  }
  search(query, k) {
    const results = [];
    const queryNorm = normalize(query);
    for (const [id, vector] of this.nodes) {
      const distance = computeDistance(queryNorm, vector, this.metric);
      results.push({ id, distance });
    }
    results.sort((a, b) => a.distance - b.distance);
    return results.slice(0, k);
  }
  searchWithThreshold(query, maxDistance) {
    const results = [];
    const queryNorm = normalize(query);
    for (const [id, vector] of this.nodes) {
      const distance = computeDistance(queryNorm, vector, this.metric);
      if (distance <= maxDistance) {
        results.push({ id, distance });
      }
    }
    results.sort((a, b) => a.distance - b.distance);
    return results;
  }
  hash(vector) {
    const hashes = [];
    const v = normalize(vector);
    for (let t = 0;t < this.trees; t++) {
      let hash = "";
      for (let h = 0;h < 10; h++) {
        const projIdx = t * 10 + h;
        if (projIdx < this.projectionVectors.length) {
          const projection = dot(v, this.projectionVectors[projIdx]);
          hash += projection > 0 ? "1" : "0";
        }
      }
      hashes.push(hash);
    }
    return hashes;
  }
  build() {
    if (this.nodes.size === 0)
      return;
    const entries = Array.from(this.nodes.entries());
    this.rootNode = this.buildTree(entries, 0);
  }
  buildTree(entries, depth) {
    if (entries.length === 0) {
      return { id: v4(), left: null, right: null, ids: [], splitDim: 0, splitVal: 0 };
    }
    if (entries.length <= 10) {
      return {
        id: v4(),
        left: null,
        right: null,
        ids: entries.map(([id]) => id),
        splitDim: -1,
        splitVal: 0
      };
    }
    const splitDim = depth % this.dimensions;
    const values = entries.map(([, v]) => v[splitDim]).sort((a, b) => a - b);
    const splitVal = values[Math.floor(values.length / 2)];
    const left = [];
    const right = [];
    for (const [id, v] of entries) {
      if (v[splitDim] <= splitVal) {
        left.push([id, v]);
      } else {
        right.push([id, v]);
      }
    }
    return {
      id: v4(),
      left: left.length > 0 ? this.buildTree(left, depth + 1) : null,
      right: right.length > 0 ? this.buildTree(right, depth + 1) : null,
      ids: [],
      splitDim,
      splitVal
    };
  }
  size() {
    return this.nodes.size;
  }
  clear() {
    this.nodes.clear();
    this.rootNode = null;
  }
}
var DEFAULT_DIMENSIONS = 768, DEFAULT_TREES = 16, CHAR_EMBEDDING_DIM = 64;
var init_embedding = __esm(() => {
  init_wrapper();
});

// src/memory/bank.ts
class MemoryBankImpl {
  id;
  type;
  cells;
  capacity;
  index;
  decayRate;
  consolidationThreshold;
  embeddingEngine;
  accessLog;
  constructor(type, capacity = DEFAULT_CAPACITY) {
    this.id = v4();
    this.type = type;
    this.cells = new Map;
    this.capacity = capacity;
    this.decayRate = DEFAULT_DECAY_RATE;
    this.consolidationThreshold = CONSOLIDATION_THRESHOLD;
    this.index = new VectorIndexImpl(EMBEDDING_DIMENSIONS, 16, "cosine");
    this.embeddingEngine = new EmbeddingEngine(EMBEDDING_DIMENSIONS);
    this.accessLog = [];
  }
  store(content, metadata = {}) {
    const embedding = this.embeddingEngine.embed(content);
    const cell = {
      id: v4(),
      type: this.type,
      content: embedding,
      embedding,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      importance: this.calculateInitialImportance(metadata),
      decay: 1,
      associations: new Set,
      metadata: {
        ...metadata,
        text: content
      }
    };
    if (this.cells.size >= this.capacity) {
      this.evict();
    }
    this.cells.set(cell.id, cell);
    this.index.add(cell.id, embedding);
    this.findAssociations(cell);
    return cell;
  }
  storeVector(embedding, metadata = {}) {
    const cell = {
      id: v4(),
      type: this.type,
      content: embedding,
      embedding: normalize(embedding),
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      importance: this.calculateInitialImportance(metadata),
      decay: 1,
      associations: new Set,
      metadata
    };
    if (this.cells.size >= this.capacity) {
      this.evict();
    }
    this.cells.set(cell.id, cell);
    this.index.add(cell.id, embedding);
    this.findAssociations(cell);
    return cell;
  }
  retrieve(id) {
    const cell = this.cells.get(id);
    if (cell) {
      this.access(id);
      return cell;
    }
    return null;
  }
  query(queryEmbedding, k = 10) {
    const results = this.index.search(queryEmbedding, k);
    const cells = [];
    for (const result of results) {
      const cell = this.cells.get(result.id);
      if (cell) {
        this.access(cell.id);
        cells.push(cell);
      }
    }
    return cells;
  }
  queryByText(query, k = 10) {
    const embedding = this.embeddingEngine.embed(query);
    return this.query(embedding, k);
  }
  queryWithThreshold(queryEmbedding, maxDistance) {
    const results = this.index.searchWithThreshold(queryEmbedding, maxDistance);
    const cells = [];
    for (const result of results) {
      const cell = this.cells.get(result.id);
      if (cell) {
        this.access(cell.id);
        cells.push(cell);
      }
    }
    return cells;
  }
  access(id) {
    const cell = this.cells.get(id);
    if (cell) {
      cell.accessCount++;
      cell.lastAccessed = Date.now();
      cell.importance = Math.min(1, cell.importance + 0.05);
      this.accessLog.push({ id, time: Date.now() });
    }
  }
  associate(id1, id2) {
    const cell1 = this.cells.get(id1);
    const cell2 = this.cells.get(id2);
    if (cell1 && cell2) {
      cell1.associations.add(id2);
      cell2.associations.add(id1);
    }
  }
  decay() {
    const now = Date.now();
    for (const cell of this.cells.values()) {
      const age = (now - cell.timestamp) / (1000 * 60 * 60 * 24);
      const accessFactor = Math.log(1 + cell.accessCount) / 10;
      cell.decay = Math.exp(-this.decayRate * age) * (1 + accessFactor);
      cell.importance *= cell.decay;
    }
  }
  consolidate() {
    const candidates = [];
    for (const cell of this.cells.values()) {
      if (cell.importance > this.consolidationThreshold && cell.accessCount > 5) {
        candidates.push(cell);
      }
    }
    return candidates;
  }
  forget(threshold = 0.1) {
    const toRemove = [];
    for (const [id, cell] of this.cells) {
      if (cell.importance < threshold && cell.accessCount < 2) {
        toRemove.push(id);
      }
    }
    for (const id of toRemove) {
      this.cells.delete(id);
      this.index.remove(id);
    }
    return toRemove.length;
  }
  merge(other) {
    let merged = 0;
    for (const [id, cell] of other.cells) {
      if (!this.cells.has(id)) {
        this.cells.set(id, cell);
        this.index.add(id, cell.embedding);
        merged++;
      }
    }
    return merged;
  }
  calculateInitialImportance(metadata) {
    let importance = 0.5;
    if (metadata.priority) {
      importance += metadata.priority * 0.2;
    }
    if (metadata.emotional) {
      importance += 0.2;
    }
    if (metadata.novel) {
      importance += 0.1;
    }
    return Math.min(1, importance);
  }
  findAssociations(cell) {
    const similar = this.index.search(cell.embedding, 5);
    for (const result of similar) {
      if (result.id !== cell.id && result.distance < 0.3) {
        const otherCell = this.cells.get(result.id);
        if (otherCell) {
          cell.associations.add(result.id);
          otherCell.associations.add(cell.id);
        }
      }
    }
  }
  evict() {
    let minImportance = Infinity;
    let minCell = null;
    for (const [id, cell] of this.cells) {
      const score = cell.importance * cell.decay - cell.accessCount * 0.01;
      if (score < minImportance) {
        minImportance = score;
        minCell = id;
      }
    }
    if (minCell) {
      const cell = this.cells.get(minCell);
      if (cell) {
        for (const assocId of cell.associations) {
          const assocCell = this.cells.get(assocId);
          if (assocCell) {
            assocCell.associations.delete(minCell);
          }
        }
      }
      this.cells.delete(minCell);
      this.index.remove(minCell);
    }
  }
  getStats() {
    let totalImportance = 0;
    let totalAccess = 0;
    let totalDecay = 0;
    for (const cell of this.cells.values()) {
      totalImportance += cell.importance;
      totalAccess += cell.accessCount;
      totalDecay += cell.decay;
    }
    const count = this.cells.size;
    return {
      total: count,
      avgImportance: count > 0 ? totalImportance / count : 0,
      avgAccess: count > 0 ? totalAccess / count : 0,
      avgDecay: count > 0 ? totalDecay / count : 0
    };
  }
  clear() {
    this.cells.clear();
    this.accessLog = [];
    this.index = new VectorIndexImpl(EMBEDDING_DIMENSIONS, 16, "cosine");
  }
  serialize() {
    return {
      id: this.id,
      type: this.type,
      cells: this.cells,
      capacity: this.capacity,
      index: this.index,
      decayRate: this.decayRate,
      consolidationThreshold: this.consolidationThreshold
    };
  }
}
var DEFAULT_CAPACITY = 1e4, DEFAULT_DECAY_RATE = 0.01, CONSOLIDATION_THRESHOLD = 0.7, EMBEDDING_DIMENSIONS = 768, EpisodicMemory, SemanticMemory, WorkingMemory, ProceduralMemory;
var init_bank = __esm(() => {
  init_wrapper();
  init_embedding();
  init_embedding();
  EpisodicMemory = class EpisodicMemory extends MemoryBankImpl {
    constructor(capacity = DEFAULT_CAPACITY) {
      super("episodic", capacity);
    }
    storeEpisode(description, context, emotions = [], actions = []) {
      const metadata = {
        context,
        emotions,
        actions,
        timestamp: Date.now(),
        type: "episode"
      };
      return this.store(description, metadata);
    }
    recallByContext(contextQuery, k = 10) {
      return this.queryByText(contextQuery, k);
    }
    recallByTime(start, end) {
      const results = [];
      for (const cell of this.cells.values()) {
        if (cell.timestamp >= start && cell.timestamp <= end) {
          results.push(cell);
        }
      }
      return results.sort((a, b) => b.timestamp - a.timestamp);
    }
  };
  SemanticMemory = class SemanticMemory extends MemoryBankImpl {
    conceptGraph;
    constructor(capacity = DEFAULT_CAPACITY) {
      super("semantic", capacity);
      this.conceptGraph = new Map;
    }
    storeFact(concept, fact, category, related = []) {
      const metadata = {
        concept,
        category,
        related,
        confidence: 1,
        source: "learned",
        type: "fact"
      };
      const cell = this.store(fact, metadata);
      if (!this.conceptGraph.has(concept)) {
        this.conceptGraph.set(concept, new Set);
      }
      this.conceptGraph.get(concept).add(cell.id);
      for (const rel of related) {
        if (!this.conceptGraph.has(rel)) {
          this.conceptGraph.set(rel, new Set);
        }
        this.conceptGraph.get(rel).add(concept);
      }
      return cell;
    }
    queryByConcept(concept) {
      const relatedIds = this.conceptGraph.get(concept);
      if (!relatedIds)
        return [];
      const cells = [];
      for (const id of relatedIds) {
        const cell = this.retrieve(id);
        if (cell)
          cells.push(cell);
      }
      return cells;
    }
    getRelatedConcepts(concept) {
      const related = this.conceptGraph.get(concept);
      return related ? Array.from(related) : [];
    }
  };
  WorkingMemory = class WorkingMemory extends MemoryBankImpl {
    maxAge;
    attentionWeights;
    constructor(capacity = 100) {
      super("working", capacity);
      this.maxAge = 60000;
      this.attentionWeights = new Map;
    }
    focus(id, weight = 1) {
      this.attentionWeights.set(id, weight);
      this.access(id);
    }
    defocus(id) {
      this.attentionWeights.delete(id);
    }
    getAttentionFocus() {
      const focused = [];
      for (const [id, weight] of this.attentionWeights) {
        const cell = this.retrieve(id);
        if (cell) {
          focused.push({ ...cell, importance: cell.importance * weight });
        }
      }
      return focused.sort((a, b) => b.importance - a.importance);
    }
    refresh() {
      const now = Date.now();
      const toRemove = [];
      for (const [id, cell] of this.cells) {
        if (now - cell.timestamp > this.maxAge && !this.attentionWeights.has(id)) {
          toRemove.push(id);
        }
      }
      for (const id of toRemove) {
        this.cells.delete(id);
        this.index.remove(id);
        this.attentionWeights.delete(id);
      }
    }
    hold(content, duration = 30000) {
      const cell = this.store(content, { expiresAt: Date.now() + duration });
      this.focus(cell.id, 1);
      return cell;
    }
  };
  ProceduralMemory = class ProceduralMemory extends MemoryBankImpl {
    skillGraph;
    constructor(capacity = 1000) {
      super("procedural", capacity);
      this.skillGraph = new Map;
    }
    storeSkill(name, description, steps, prerequisites = [], difficulty = 1) {
      const metadata = {
        name,
        steps,
        prerequisites,
        difficulty,
        successRate: 0,
        executions: 0,
        type: "skill"
      };
      const cell = this.store(description, metadata);
      this.skillGraph.set(name, steps);
      return cell;
    }
    getSkill(name) {
      for (const cell of this.cells.values()) {
        if (cell.metadata.name === name) {
          this.access(cell.id);
          return cell;
        }
      }
      return null;
    }
    recordExecution(name, success) {
      for (const cell of this.cells.values()) {
        if (cell.metadata.name === name) {
          cell.metadata.executions = cell.metadata.executions + 1;
          if (success) {
            cell.metadata.successRate = (cell.metadata.successRate * (cell.metadata.executions - 1) + 1) / cell.metadata.executions;
          } else {
            cell.metadata.successRate = cell.metadata.successRate * (cell.metadata.executions - 1) / cell.metadata.executions;
          }
          cell.importance = cell.metadata.successRate * 0.5 + 0.5;
          return;
        }
      }
    }
    getSkillSequence(name) {
      return this.skillGraph.get(name) || [];
    }
  };
});

// src/memory/system.ts
class MemorySystemImpl {
  banks;
  consolidationQueue;
  retrievalCache;
  embeddingEngine;
  consolidationInterval;
  decayInterval;
  constructor() {
    this.banks = new Map;
    this.banks.set("episodic", new EpisodicMemory);
    this.banks.set("semantic", new SemanticMemory);
    this.banks.set("working", new WorkingMemory);
    this.banks.set("procedural", new ProceduralMemory);
    this.banks.set("priming", new MemoryBankImpl("priming", 500));
    this.consolidationQueue = [];
    this.retrievalCache = new Map;
    this.embeddingEngine = new EmbeddingEngine(EMBEDDING_DIM);
    this.consolidationInterval = null;
    this.decayInterval = null;
  }
  store(content, type = "semantic", metadata = {}) {
    const bank = this.banks.get(type);
    if (!bank) {
      throw new Error(`Unknown memory type: ${type}`);
    }
    const cell = bank.store(content, metadata);
    if (cell.importance > 0.7) {
      this.consolidationQueue.push(cell);
    }
    return cell;
  }
  storeVector(embedding, type = "semantic", metadata = {}) {
    const bank = this.banks.get(type);
    if (!bank) {
      throw new Error(`Unknown memory type: ${type}`);
    }
    return bank.storeVector(embedding, metadata);
  }
  retrieve(id, type) {
    if (type) {
      const bank = this.banks.get(type);
      return bank ? bank.retrieve(id) : null;
    }
    for (const bank of this.banks.values()) {
      const cell = bank.retrieve(id);
      if (cell)
        return cell;
    }
    return null;
  }
  query(query, k = 10, types) {
    const cacheKey = `${query}_${k}_${types?.join(",") || "all"}`;
    const cached = this.retrievalCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const queryEmbedding = this.embeddingEngine.embed(query);
    const results = [];
    const searchTypes = types || Array.from(this.banks.keys());
    for (const type of searchTypes) {
      const bank = this.banks.get(type);
      if (bank) {
        const bankResults = bank.query(queryEmbedding, Math.ceil(k / searchTypes.length) + 5);
        for (const cell of bankResults) {
          const queryNorm = this.embeddingEngine.embed(query);
          const distance = 1 - cosineSimilarity(queryNorm, cell.embedding);
          results.push({ cell, distance });
        }
      }
    }
    results.sort((a, b) => a.distance - b.distance);
    const topResults = results.slice(0, k).map((r) => r.cell);
    this.retrievalCache.set(cacheKey, topResults);
    if (this.retrievalCache.size > 100) {
      const firstKey = this.retrievalCache.keys().next().value;
      if (firstKey !== undefined) {
        this.retrievalCache.delete(firstKey);
      }
    }
    return topResults;
  }
  queryByVector(embedding, k = 10, types) {
    const results = [];
    const searchTypes = types || Array.from(this.banks.keys());
    for (const type of searchTypes) {
      const bank = this.banks.get(type);
      if (bank) {
        const bankResults = bank.query(embedding, Math.ceil(k / searchTypes.length) + 5);
        for (const cell of bankResults) {
          const distance = 1 - cosineSimilarity(embedding, cell.embedding);
          results.push({ cell, distance });
        }
      }
    }
    results.sort((a, b) => a.distance - b.distance);
    return results.slice(0, k).map((r) => r.cell);
  }
  associate(id1, id2) {
    for (const bank of this.banks.values()) {
      bank.associate(id1, id2);
    }
  }
  consolidate() {
    const consolidated = [];
    for (const cell of this.consolidationQueue) {
      if (cell.type === "working" && cell.importance > 0.8) {
        const semanticBank = this.banks.get("semantic");
        if (semanticBank) {
          const newCell = semanticBank.storeVector(cell.embedding, {
            ...cell.metadata,
            source: "consolidated",
            originalId: cell.id
          });
          consolidated.push(newCell);
        }
      }
      if (cell.associations.size > 0) {
        cell.importance = Math.min(1, cell.importance + 0.1);
      }
    }
    this.consolidationQueue = [];
    return consolidated;
  }
  decay() {
    for (const bank of this.banks.values()) {
      bank.decay();
    }
  }
  forget(threshold = 0.1) {
    let totalForgotten = 0;
    for (const bank of this.banks.values()) {
      totalForgotten += bank.forget(threshold);
    }
    return totalForgotten;
  }
  start() {
    this.consolidationInterval = setInterval(() => {
      this.consolidate();
    }, 5 * 60 * 1000);
    this.decayInterval = setInterval(() => {
      this.decay();
      this.forget(0.05);
    }, 10 * 60 * 1000);
  }
  stop() {
    if (this.consolidationInterval) {
      clearInterval(this.consolidationInterval);
      this.consolidationInterval = null;
    }
    if (this.decayInterval) {
      clearInterval(this.decayInterval);
      this.decayInterval = null;
    }
  }
  getStats() {
    const stats = {};
    for (const [type, bank] of this.banks) {
      const bankStats = bank.getStats();
      stats[type] = {
        total: bankStats.total,
        avgImportance: bankStats.avgImportance,
        avgAccess: bankStats.avgAccess
      };
    }
    return stats;
  }
  hold(content, duration) {
    const working = this.banks.get("working");
    return working.hold(content, duration);
  }
  focus(id) {
    const working = this.banks.get("working");
    working.focus(id);
  }
  getAttentionFocus() {
    const working = this.banks.get("working");
    return working.getAttentionFocus();
  }
  storeEpisode(description, context, emotions = [], actions = []) {
    const episodic = this.banks.get("episodic");
    return episodic.storeEpisode(description, context, emotions, actions);
  }
  recallEpisodes(query, k = 10) {
    const episodic = this.banks.get("episodic");
    return episodic.recallByContext(query, k);
  }
  storeFact(concept, fact, category, related = []) {
    const semantic = this.banks.get("semantic");
    return semantic.storeFact(concept, fact, category, related);
  }
  queryFacts(concept) {
    const semantic = this.banks.get("semantic");
    return semantic.queryByConcept(concept);
  }
  storeSkill(name, description, steps, prerequisites = [], difficulty = 1) {
    const procedural = this.banks.get("procedural");
    return procedural.storeSkill(name, description, steps, prerequisites, difficulty);
  }
  getSkill(name) {
    const procedural = this.banks.get("procedural");
    return procedural.getSkill(name);
  }
  recordSkillExecution(name, success) {
    const procedural = this.banks.get("procedural");
    procedural.recordExecution(name, success);
  }
  embed(text) {
    return this.embeddingEngine.embed(text);
  }
  clear() {
    for (const bank of this.banks.values()) {
      bank.clear?.();
    }
    this.consolidationQueue = [];
    this.retrievalCache.clear();
  }
}
var EMBEDDING_DIM = 768;
var init_system = __esm(() => {
  init_bank();
  init_embedding();
});

// src/thoughts/tree.ts
class ThoughtTreeImpl {
  id;
  root;
  currentBest;
  exploredPaths;
  maxDepth;
  maxBranches;
  totalThoughts;
  pruningThreshold;
  allThoughts;
  evaluationCriteria;
  embeddingEngine;
  constructor(maxDepth = MAX_DEPTH, maxBranches = MAX_BRANCHES) {
    this.id = v4();
    this.root = null;
    this.currentBest = null;
    this.exploredPaths = new Set;
    this.maxDepth = maxDepth;
    this.maxBranches = maxBranches;
    this.totalThoughts = 0;
    this.pruningThreshold = PRUNING_THRESHOLD;
    this.allThoughts = new Map;
    this.evaluationCriteria = this.getDefaultCriteria();
    this.embeddingEngine = new EmbeddingEngine(EMBEDDING_DIM2);
  }
  getDefaultCriteria() {
    return [
      {
        name: "coherence",
        weight: 0.25,
        evaluator: (thought) => this.evaluateCoherence(thought)
      },
      {
        name: "novelty",
        weight: 0.15,
        evaluator: (thought) => this.evaluateNovelty(thought)
      },
      {
        name: "relevance",
        weight: 0.3,
        evaluator: (thought) => this.evaluateRelevance(thought)
      },
      {
        name: "feasibility",
        weight: 0.2,
        evaluator: (thought) => this.evaluateFeasibility(thought)
      },
      {
        name: "completeness",
        weight: 0.1,
        evaluator: (thought) => this.evaluateCompleteness(thought)
      }
    ];
  }
  evaluateCoherence(thought) {
    const contradictions = this.findContradictions(thought);
    return Math.max(0, 1 - contradictions * 0.2);
  }
  evaluateNovelty(thought) {
    if (this.allThoughts.size < 2)
      return 0.8;
    let maxSimilarity = 0;
    for (const [id, other] of this.allThoughts) {
      if (id !== thought.id) {
        const sim = cosineSimilarity(thought.embedding, other.embedding);
        maxSimilarity = Math.max(maxSimilarity, sim);
      }
    }
    return Math.max(0, 1 - maxSimilarity);
  }
  evaluateRelevance(thought) {
    if (!this.root)
      return 0.5;
    return cosineSimilarity(thought.embedding, this.root.embedding);
  }
  evaluateFeasibility(thought) {
    const len = thought.content.length;
    const hasSpecifics = /\d+|specifically|exactly|precisely/i.test(thought.content);
    let score = Math.min(1, len / 200);
    if (hasSpecifics)
      score += 0.2;
    return Math.min(1, score);
  }
  evaluateCompleteness(thought) {
    const hasConclusion = /therefore|thus|hence|consequently|in conclusion/i.test(thought.content);
    const hasReasoning = /because|since|as|given that|assuming/i.test(thought.content);
    let score = 0.5;
    if (hasConclusion)
      score += 0.25;
    if (hasReasoning)
      score += 0.25;
    return Math.min(1, score);
  }
  findContradictions(thought) {
    let contradictions = 0;
    const negationPatterns = [
      /not\s+(\w+)/gi,
      /never\s+(\w+)/gi,
      /cannot\s+(\w+)/gi,
      /impossible\s+to\s+(\w+)/gi
    ];
    const negations = [];
    for (const pattern of negationPatterns) {
      let match;
      while ((match = pattern.exec(thought.content)) !== null) {
        negations.push(match[1].toLowerCase());
      }
    }
    for (const ancestorId of thought.path) {
      const ancestor = this.allThoughts.get(ancestorId);
      if (ancestor && ancestor.id !== thought.id) {
        for (const neg of negations) {
          if (ancestor.content.toLowerCase().includes(neg)) {
            contradictions++;
          }
        }
      }
    }
    return contradictions;
  }
  initialize(problem) {
    this.root = new ThoughtImpl(problem, 0, null, []);
    this.allThoughts.set(this.root.id, this.root);
    this.totalThoughts = 1;
    this.evaluate(this.root);
    return this.root;
  }
  expand(thoughtId, branches) {
    const parent = this.allThoughts.get(thoughtId);
    if (!parent || parent.depth >= this.maxDepth) {
      return [];
    }
    const newThoughts = [];
    for (let i = 0;i < Math.min(branches.length, this.maxBranches); i++) {
      const child = parent.addChild(branches[i]);
      this.allThoughts.set(child.id, child);
      this.totalThoughts++;
      this.evaluate(child);
      if (child.score >= this.pruningThreshold) {
        newThoughts.push(child);
      } else {
        child.state = "rejected";
      }
    }
    return newThoughts;
  }
  evaluate(thought) {
    const score = thought.evaluate(this.evaluationCriteria);
    if (this.currentBest === null || score > this.currentBest.score) {
      this.currentBest = thought;
    }
    return score;
  }
  getBestPath() {
    if (!this.currentBest)
      return null;
    const thoughts = [];
    let currentId = this.currentBest.id;
    while (currentId) {
      const thought = this.allThoughts.get(currentId);
      if (thought) {
        thoughts.unshift(thought);
        currentId = thought.parent;
      } else {
        break;
      }
    }
    return {
      id: v4(),
      thoughts,
      cumulativeScore: this.currentBest.score,
      finalConclusion: this.currentBest.content,
      valid: this.currentBest.score > 0.6
    };
  }
  explore(depth = 3) {
    if (!this.root)
      return [];
    const frontier = [this.root];
    const explored = [];
    for (let d = 0;d < depth && frontier.length > 0; d++) {
      const nextFrontier = [];
      for (const thought of frontier) {
        if (thought.state !== "rejected") {
          explored.push(thought);
          const branches = this.generateBranches(thought);
          const newThoughts = this.expand(thought.id, branches);
          nextFrontier.push(...newThoughts);
        }
      }
      frontier.length = 0;
      frontier.push(...nextFrontier);
      frontier.sort((a, b) => b.score - a.score);
      frontier.splice(10);
    }
    this.exploredPaths = new Set(explored.map((t) => t.path.join("->")));
    return explored;
  }
  generateBranches(thought) {
    const branches = [];
    const templates = [
      `Considering ${thought.content.slice(0, 50)}...`,
      `Alternatively, if we assume ${thought.content.slice(0, 30)}...`,
      `Building on this, we could ${thought.content.slice(0, 30)}...`,
      `However, there might be an issue with ${thought.content.slice(0, 30)}...`,
      `A related approach would be to ${thought.content.slice(0, 30)}...`
    ];
    for (let i = 0;i < Math.min(this.maxBranches, templates.length); i++) {
      branches.push(templates[i]);
    }
    return branches;
  }
  addEvaluationCriteria(criterion) {
    this.evaluationCriteria.push(criterion);
    for (const thought of this.allThoughts.values()) {
      this.evaluate(thought);
    }
  }
  removeEvaluationCriteria(name) {
    this.evaluationCriteria = this.evaluationCriteria.filter((c) => c.name !== name);
  }
  getThought(id) {
    return this.allThoughts.get(id) || null;
  }
  getAllThoughts() {
    return Array.from(this.allThoughts.values());
  }
  getThoughtsByState(state) {
    return Array.from(this.allThoughts.values()).filter((t) => t.state === state);
  }
  prune() {
    let pruned = 0;
    const toRemove = [];
    for (const [id, thought] of this.allThoughts) {
      if (thought.state === "rejected" || thought.score < this.pruningThreshold) {
        if (thought.id !== this.root?.id) {
          toRemove.push(id);
        }
      }
    }
    for (const id of toRemove) {
      this.allThoughts.delete(id);
      pruned++;
    }
    return pruned;
  }
  serialize() {
    return {
      id: this.id,
      root: this.root,
      currentBest: this.currentBest,
      exploredPaths: this.exploredPaths,
      maxDepth: this.maxDepth,
      maxBranches: this.maxBranches,
      totalThoughts: this.totalThoughts,
      pruningThreshold: this.pruningThreshold
    };
  }
}
var EMBEDDING_DIM2 = 512, MAX_DEPTH = 8, MAX_BRANCHES = 5, PRUNING_THRESHOLD = 0.3, ThoughtImpl;
var init_tree = __esm(() => {
  init_wrapper();
  init_embedding();
  ThoughtImpl = class ThoughtImpl {
    id;
    content;
    embedding;
    score;
    depth;
    path;
    children;
    parent;
    state;
    reasoning;
    metadata;
    static embeddingEngine = new EmbeddingEngine(EMBEDDING_DIM2);
    constructor(content, depth = 0, parent = null, path = []) {
      this.id = v4();
      this.content = content;
      this.embedding = ThoughtImpl.embeddingEngine.embed(content);
      this.score = 0;
      this.depth = depth;
      this.path = [...path, this.id];
      this.children = new Map;
      this.parent = parent;
      this.state = "pending";
      this.reasoning = "";
      this.metadata = {
        confidence: 0.5,
        coherence: 0.5,
        novelty: 0.5,
        relevance: 0.5,
        feasibility: 0.5,
        timestamp: Date.now(),
        evaluationCount: 0
      };
    }
    addChild(content, reasoning = "") {
      const child = new ThoughtImpl(content, this.depth + 1, this.id, this.path);
      child.reasoning = reasoning;
      this.children.set(child.id, child);
      return child;
    }
    evaluate(criteria) {
      let totalScore = 0;
      let totalWeight = 0;
      for (const criterion of criteria) {
        const score = criterion.evaluator(this);
        totalScore += score * criterion.weight;
        totalWeight += criterion.weight;
      }
      this.score = totalWeight > 0 ? totalScore / totalWeight : 0;
      this.metadata.evaluationCount++;
      this.state = this.score > 0.6 ? "promising" : this.score < 0.3 ? "rejected" : "evaluating";
      return this.score;
    }
    updateMetadata(updates) {
      this.metadata = { ...this.metadata, ...updates };
    }
    getAncestors() {
      const ancestors = [];
      let current = this;
      while (current && current.parent) {
        break;
      }
      return ancestors;
    }
    getDescendants() {
      const descendants = [];
      for (const child of this.children.values()) {
        descendants.push(child);
        descendants.push(...child.getDescendants());
      }
      return descendants;
    }
    serialize() {
      return {
        id: this.id,
        content: this.content,
        embedding: this.embedding,
        score: this.score,
        depth: this.depth,
        path: this.path,
        children: new Map(this.children),
        parent: this.parent,
        state: this.state,
        reasoning: this.reasoning,
        metadata: this.metadata
      };
    }
    static deserialize(data) {
      const thought = new ThoughtImpl(data.content, data.depth, data.parent, data.path.slice(0, -1));
      thought.id = data.id;
      thought.embedding = new Float64Array(data.embedding);
      thought.score = data.score;
      thought.state = data.state;
      thought.reasoning = data.reasoning;
      thought.metadata = { ...data.metadata };
      return thought;
    }
  };
});

// src/thoughts/reasoning.ts
class ReasoningEngineImpl {
  trees;
  activeTree;
  reasoningMode;
  evaluationCriteria;
  embeddingEngine;
  modeConfigs;
  constructor() {
    this.trees = new Map;
    this.activeTree = null;
    this.reasoningMode = "analytical";
    this.evaluationCriteria = [];
    this.embeddingEngine = new EmbeddingEngine(EMBEDDING_DIM3);
    this.modeConfigs = new Map;
    this.initializeModeConfigs();
  }
  initializeModeConfigs() {
    this.modeConfigs.set("analytical", {
      depthWeight: 0.8,
      breadthWeight: 0.4,
      pruningAggressive: true,
      maxBranches: 3,
      criteria: [
        { name: "coherence", weight: 0.35 },
        { name: "relevance", weight: 0.35 },
        { name: "feasibility", weight: 0.3 }
      ]
    });
    this.modeConfigs.set("creative", {
      depthWeight: 0.3,
      breadthWeight: 0.9,
      pruningAggressive: false,
      maxBranches: 7,
      criteria: [
        { name: "novelty", weight: 0.4 },
        { name: "coherence", weight: 0.2 },
        { name: "completeness", weight: 0.4 }
      ]
    });
    this.modeConfigs.set("critical", {
      depthWeight: 0.7,
      breadthWeight: 0.5,
      pruningAggressive: true,
      maxBranches: 4,
      criteria: [
        { name: "coherence", weight: 0.4 },
        { name: "feasibility", weight: 0.3 },
        { name: "relevance", weight: 0.3 }
      ]
    });
    this.modeConfigs.set("intuitive", {
      depthWeight: 0.2,
      breadthWeight: 0.3,
      pruningAggressive: false,
      maxBranches: 2,
      criteria: [
        { name: "relevance", weight: 0.5 },
        { name: "coherence", weight: 0.5 }
      ]
    });
    this.modeConfigs.set("systematic", {
      depthWeight: 0.9,
      breadthWeight: 0.6,
      pruningAggressive: true,
      maxBranches: 5,
      criteria: [
        { name: "completeness", weight: 0.25 },
        { name: "coherence", weight: 0.25 },
        { name: "relevance", weight: 0.25 },
        { name: "feasibility", weight: 0.25 }
      ]
    });
  }
  setMode(mode) {
    this.reasoningMode = mode;
    const config = this.modeConfigs.get(mode);
    if (config) {
      this.evaluationCriteria = config.criteria.map((c) => ({
        name: c.name,
        weight: c.weight,
        evaluator: this.getEvaluator(c.name)
      }));
    }
  }
  getEvaluator(name) {
    const evaluators = {
      coherence: (t) => this.evaluateCoherence(t),
      novelty: (t) => this.evaluateNovelty(t),
      relevance: (t) => this.evaluateRelevance(t),
      feasibility: (t) => this.evaluateFeasibility(t),
      completeness: (t) => this.evaluateCompleteness(t)
    };
    return evaluators[name] || (() => 0.5);
  }
  evaluateCoherence(thought) {
    const sentences = thought.content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    if (sentences.length < 2)
      return 0.7;
    let coherenceScore = 1;
    const connectors = ["therefore", "thus", "because", "since", "however", "moreover", "furthermore"];
    const hasConnectors = connectors.some((c) => thought.content.toLowerCase().includes(c));
    if (hasConnectors)
      coherenceScore += 0.1;
    const negations = ["not", "never", "cannot", "don't", "won't", "shouldn't"];
    const hasNegation = negations.some((n) => thought.content.toLowerCase().includes(n));
    if (hasNegation)
      coherenceScore -= 0.1;
    return Math.max(0, Math.min(1, coherenceScore));
  }
  evaluateNovelty(thought) {
    const emb = thought.embedding;
    const variance2 = this.calculateVariance(emb);
    return Math.min(1, variance2 * 2);
  }
  evaluateRelevance(thought) {
    if (this.trees.size === 0)
      return 0.5;
    const tree = this.trees.get(this.activeTree || "");
    if (!tree || !tree.root)
      return 0.5;
    return cosineSimilarity(thought.embedding, tree.root.embedding);
  }
  evaluateFeasibility(thought) {
    const actionVerbs = ["implement", "create", "build", "write", "design", "develop", "execute"];
    const hasAction = actionVerbs.some((v) => thought.content.toLowerCase().includes(v));
    const hasNumbers = /\d+/.test(thought.content);
    const hasDetails = thought.content.length > 100;
    let score = 0.5;
    if (hasAction)
      score += 0.2;
    if (hasNumbers)
      score += 0.1;
    if (hasDetails)
      score += 0.2;
    return Math.min(1, score);
  }
  evaluateCompleteness(thought) {
    const hasPremise = /because|since|as|given|assuming/i.test(thought.content);
    const hasConclusion = /therefore|thus|hence|so|consequently/i.test(thought.content);
    const hasEvidence = /for example|for instance|specifically|such as/i.test(thought.content);
    let score = 0.3;
    if (hasPremise)
      score += 0.25;
    if (hasConclusion)
      score += 0.25;
    if (hasEvidence)
      score += 0.2;
    return Math.min(1, score);
  }
  calculateVariance(arr) {
    if (arr.length === 0)
      return 0;
    const mean2 = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance2 = arr.reduce((sum, val) => sum + (val - mean2) ** 2, 0) / arr.length;
    return Math.sqrt(variance2);
  }
  startReasoning(problem) {
    const config = this.modeConfigs.get(this.reasoningMode);
    const tree = new ThoughtTreeImpl(config?.depthWeight ? Math.round(8 * config.depthWeight) : 6, config?.maxBranches || 5);
    tree.initialize(problem);
    for (const criterion of this.evaluationCriteria) {
      tree.addEvaluationCriteria(criterion);
    }
    this.trees.set(tree.id, tree);
    this.activeTree = tree.id;
    return tree;
  }
  generateThoughts(context, count = 5) {
    const thoughts = [];
    const embedding = this.embeddingEngine.embed(context);
    switch (this.reasoningMode) {
      case "analytical":
        thoughts.push(...this.generateAnalytical(context, count));
        break;
      case "creative":
        thoughts.push(...this.generateCreative(context, count));
        break;
      case "critical":
        thoughts.push(...this.generateCritical(context, count));
        break;
      case "intuitive":
        thoughts.push(...this.generateIntuitive(context, count));
        break;
      case "systematic":
        thoughts.push(...this.generateSystematic(context, count));
        break;
      default:
        thoughts.push(...this.generateAnalytical(context, count));
    }
    return thoughts.slice(0, count);
  }
  generateAnalytical(context, count) {
    const thoughts = [];
    thoughts.push(`Analyzing the components of: ${context.slice(0, 50)}`);
    thoughts.push(`Breaking down the problem: ${context.slice(0, 40)}`);
    thoughts.push(`Considering the logical implications of: ${context.slice(0, 35)}`);
    thoughts.push(`Examining the causal relationships in: ${context.slice(0, 30)}`);
    thoughts.push(`Evaluating the evidence for: ${context.slice(0, 45)}`);
    return thoughts.slice(0, count);
  }
  generateCreative(context, count) {
    const thoughts = [];
    thoughts.push(`What if we approached ${context.slice(0, 30)} differently?`);
    thoughts.push(`Imagine a scenario where ${context.slice(0, 30)}`);
    thoughts.push(`An unconventional approach to ${context.slice(0, 35)}`);
    thoughts.push(`Combining ideas from different domains: ${context.slice(0, 25)}`);
    thoughts.push(`A novel perspective on ${context.slice(0, 40)}`);
    return thoughts.slice(0, count);
  }
  generateCritical(context, count) {
    const thoughts = [];
    thoughts.push(`Questioning the assumption that ${context.slice(0, 30)}`);
    thoughts.push(`What are the flaws in ${context.slice(0, 40)}?`);
    thoughts.push(`Potential issues with ${context.slice(0, 45)}`);
    thoughts.push(`Counterarguments to ${context.slice(0, 45)}`);
    thoughts.push(`Validating the claims about ${context.slice(0, 35)}`);
    return thoughts.slice(0, count);
  }
  generateIntuitive(context, count) {
    const thoughts = [];
    thoughts.push(`My immediate sense about ${context.slice(0, 40)}`);
    thoughts.push(`The pattern I notice in ${context.slice(0, 35)}`);
    thoughts.push(`A gut feeling about ${context.slice(0, 45)}`);
    return thoughts.slice(0, count);
  }
  generateSystematic(context, count) {
    const thoughts = [];
    thoughts.push(`Step 1 in addressing ${context.slice(0, 40)}`);
    thoughts.push(`The systematic approach to ${context.slice(0, 35)}`);
    thoughts.push(`Following the methodology for ${context.slice(0, 30)}`);
    thoughts.push(`The checklist for ${context.slice(0, 45)}`);
    thoughts.push(`Phase one of analyzing ${context.slice(0, 35)}`);
    return thoughts.slice(0, count);
  }
  evaluateThought(thought) {
    let totalScore = 0;
    let totalWeight = 0;
    for (const criterion of this.evaluationCriteria) {
      totalScore += criterion.evaluator(thought) * criterion.weight;
      totalWeight += criterion.weight;
    }
    return totalWeight > 0 ? totalScore / totalWeight : 0.5;
  }
  findBestPath() {
    if (!this.activeTree)
      return null;
    const tree = this.trees.get(this.activeTree);
    if (!tree)
      return null;
    const path = tree.getBestPath();
    return path?.thoughts || null;
  }
  getConclusion() {
    const path = this.findBestPath();
    if (!path || path.length === 0)
      return null;
    return path[path.length - 1].content;
  }
  expandThought(thoughtId, newThoughts) {
    if (!this.activeTree)
      return [];
    const tree = this.trees.get(this.activeTree);
    if (!tree)
      return [];
    return tree.expand(thoughtId, newThoughts);
  }
  getTree(id) {
    return this.trees.get(id || this.activeTree || "") || null;
  }
  pruneTrees() {
    let totalPruned = 0;
    for (const tree of this.trees.values()) {
      totalPruned += tree.prune();
    }
    return totalPruned;
  }
  clearTrees() {
    this.trees.clear();
    this.activeTree = null;
  }
}
var EMBEDDING_DIM3 = 512;
var init_reasoning = __esm(() => {
  init_tree();
  init_embedding();
});

// src/cells/cell.ts
class CellImpl {
  id;
  type;
  nucleus;
  dendrites;
  axonTerminal;
  membrane;
  mitochondria;
  ribosomes;
  state;
  connections;
  specialization;
  embeddingEngine;
  spikeHistory;
  constructor(type, nucleusSize = 64) {
    this.id = v4();
    this.type = type;
    this.nucleus = [];
    for (let i = 0;i < nucleusSize; i++) {
      this.nucleus.push(new NeuronImpl(0, i, nucleusSize));
    }
    this.dendrites = [];
    for (let i = 0;i < 8; i++) {
      this.dendrites.push(new Float64Array(EMBEDDING_DIM4));
    }
    this.axonTerminal = new Float64Array(EMBEDDING_DIM4);
    this.membrane = {
      permeability: 0.5,
      channels: new Map([
        ["na", 0.05],
        ["k", 0.05],
        ["cl", 0.05],
        ["ca", 0.02]
      ]),
      receptors: new Map,
      potential: -70,
      threshold: -55,
      refractoryPeriod: 2,
      lastSpike: 0
    };
    this.mitochondria = {
      atp: 100,
      maxAtp: 100,
      regenerationRate: 0.1,
      consumptionRate: 0.05
    };
    this.ribosomes = {
      active: false,
      productionQueue: [],
      completed: []
    };
    this.state = {
      active: false,
      firing: false,
      restingPotential: -70,
      actionPotential: 30,
      calciumConcentration: 0.0001,
      geneExpression: new Map,
      metabolism: "resting"
    };
    this.connections = [];
    this.specialization = this.initializeSpecialization(type);
    this.embeddingEngine = new EmbeddingEngine(EMBEDDING_DIM4);
    this.spikeHistory = [];
  }
  initializeSpecialization(type) {
    const specs = {
      sensory: {
        domain: "perception",
        expertise: 0.5,
        training: ["pattern_recognition", "feature_extraction"],
        capabilities: ["detect", "sense", "filter"],
        performance: 0.5
      },
      interneuron: {
        domain: "processing",
        expertise: 0.5,
        training: ["integration", "modulation"],
        capabilities: ["integrate", "modulate", "relay"],
        performance: 0.5
      },
      motor: {
        domain: "action",
        expertise: 0.5,
        training: ["execution", "control"],
        capabilities: ["execute", "control", "output"],
        performance: 0.5
      },
      coding: {
        domain: "programming",
        expertise: 0.7,
        training: ["syntax", "semantics", "algorithms", "patterns"],
        capabilities: ["write_code", "analyze_code", "debug", "refactor"],
        performance: 0.6
      },
      security: {
        domain: "cybersecurity",
        expertise: 0.7,
        training: ["vulnerabilities", "attacks", "defenses", "cryptography"],
        capabilities: ["scan", "detect_threats", "harden", "respond"],
        performance: 0.6
      },
      reasoning: {
        domain: "logic",
        expertise: 0.6,
        training: ["deduction", "induction", "abduction"],
        capabilities: ["reason", "infer", "validate"],
        performance: 0.5
      },
      memory: {
        domain: "storage",
        expertise: 0.5,
        training: ["encoding", "storage", "retrieval"],
        capabilities: ["encode", "store", "retrieve", "forget"],
        performance: 0.5
      },
      attention: {
        domain: "focus",
        expertise: 0.5,
        training: ["selection", "sustain", "shift"],
        capabilities: ["focus", "sustain", "divide", "shift"],
        performance: 0.5
      },
      language: {
        domain: "linguistics",
        expertise: 0.6,
        training: ["syntax", "semantics", "pragmatics", "discourse"],
        capabilities: ["parse", "generate", "understand", "translate"],
        performance: 0.5
      },
      mathematical: {
        domain: "mathematics",
        expertise: 0.6,
        training: ["arithmetic", "algebra", "calculus", "statistics"],
        capabilities: ["calculate", "prove", "model", "optimize"],
        performance: 0.5
      },
      creative: {
        domain: "creativity",
        expertise: 0.5,
        training: ["divergent_thinking", "association", "synthesis"],
        capabilities: ["generate", "combine", "transform", "innovate"],
        performance: 0.5
      },
      executive: {
        domain: "control",
        expertise: 0.5,
        training: ["planning", "decision_making", "monitoring"],
        capabilities: ["plan", "decide", "monitor", "control"],
        performance: 0.5
      }
    };
    return specs[type] || specs.interneuron;
  }
  receiveInput(input, channel = 0) {
    if (channel < this.dendrites.length) {
      this.dendrites[channel] = new Float64Array(input);
      const inputStrength = this.calculateInputStrength(input);
      this.membrane.potential += inputStrength * this.membrane.permeability;
    }
  }
  calculateInputStrength(input) {
    let strength = 0;
    for (let i = 0;i < input.length; i++) {
      strength += input[i] * input[i];
    }
    return Math.sqrt(strength) / input.length;
  }
  process() {
    if (this.mitochondria.atp < 10) {
      this.state.metabolism = "stressed";
      return new Float64Array(EMBEDDING_DIM4);
    }
    this.mitochondria.atp -= this.mitochondria.consumptionRate * 10;
    if (this.membrane.potential >= this.membrane.threshold) {
      this.fire();
    }
    const aggregatedInput = this.aggregateDendrites();
    let output = new Float64Array(EMBEDDING_DIM4);
    for (let i = 0;i < this.nucleus.length && i < EMBEDDING_DIM4; i++) {
      const neuronOutput = this.nucleus[i].forward(aggregatedInput);
      if (i < output.length) {
        output[i] = neuronOutput;
      }
    }
    this.axonTerminal = output;
    this.state.active = true;
    return output;
  }
  aggregateDendrites() {
    const aggregated = new Float64Array(EMBEDDING_DIM4);
    for (const dendrite of this.dendrites) {
      for (let i = 0;i < dendrite.length && i < aggregated.length; i++) {
        aggregated[i] += dendrite[i];
      }
    }
    for (let i = 0;i < aggregated.length; i++) {
      aggregated[i] /= this.dendrites.length;
    }
    return aggregated;
  }
  fire() {
    const now = Date.now();
    if (now - this.membrane.lastSpike < this.membrane.refractoryPeriod) {
      return;
    }
    this.state.firing = true;
    this.membrane.potential = this.state.actionPotential;
    this.membrane.lastSpike = now;
    this.spikeHistory.push(now);
    for (const connection of this.connections) {
      if (connection.type === "excitatory") {
        connection.strength = Math.min(1, connection.strength + 0.01);
      } else if (connection.type === "inhibitory") {
        connection.strength = Math.max(0, connection.strength - 0.01);
      }
    }
    this.mitochondria.atp -= 5;
    setTimeout(() => {
      this.membrane.potential = this.state.restingPotential;
      this.state.firing = false;
    }, 1);
  }
  regenerate() {
    const regen = this.mitochondria.regenerationRate * this.mitochondria.maxAtp;
    this.mitochondria.atp = Math.min(this.mitochondria.maxAtp, this.mitochondria.atp + regen);
    if (this.mitochondria.atp > 50) {
      this.state.metabolism = "resting";
    }
  }
  connectTo(targetId, type = "excitatory", initialStrength = 0.5) {
    const connection = {
      sourceId: this.id,
      targetId,
      type,
      strength: initialStrength,
      weight: initialStrength,
      delay: 1,
      plasticity: 0.1
    };
    this.connections.push(connection);
    return connection;
  }
  strengthenConnections() {
    for (const connection of this.connections) {
      const recentActivity = this.spikeHistory.filter((t) => Date.now() - t < 1000).length;
      if (recentActivity > 5) {
        connection.weight = Math.min(1, connection.weight + connection.plasticity * 0.1);
      } else if (recentActivity < 2) {
        connection.weight = Math.max(0.1, connection.weight - connection.plasticity * 0.05);
      }
    }
  }
  processSpecialized(input) {
    switch (this.type) {
      case "coding":
        return this.processCoding(input);
      case "security":
        return this.processSecurity(input);
      case "reasoning":
        return this.processReasoning(input);
      case "language":
        return this.processLanguage(input);
      case "mathematical":
        return this.processMathematical(input);
      case "creative":
        return this.processCreative(input);
      case "executive":
        return this.processExecutive(input);
      default:
        return this.processGeneric(input);
    }
  }
  processCoding(input) {
    const analysis = [];
    if (input.includes("function") || input.includes("def ")) {
      analysis.push("Function detected");
    }
    if (input.includes("class ")) {
      analysis.push("Class structure identified");
    }
    if (/if\s*\(|for\s*\(|while\s*\(/.test(input)) {
      analysis.push("Control flow patterns found");
    }
    if (/import|require|from\s+\w+\s+import/.test(input)) {
      analysis.push("Dependencies detected");
    }
    if (/TODO|FIXME|HACK|XXX/.test(input)) {
      analysis.push("Code annotations found");
    }
    this.specialization.performance = Math.min(1, this.specialization.performance + 0.01);
    return analysis.length > 0 ? analysis.join(`
`) : "Code analysis complete";
  }
  processSecurity(input) {
    const threats = [];
    if (/eval\s*\(|exec\s*\(|system\s*\(/.test(input)) {
      threats.push("Potential code injection vulnerability");
    }
    if (/password|secret|key|token/i.test(input) && /=/.test(input)) {
      threats.push("Possible hardcoded credentials");
    }
    if (/SELECT.*FROM|INSERT.*INTO|UPDATE.*SET/i.test(input)) {
      if (!/\?|:|\$\d/.test(input)) {
        threats.push("Potential SQL injection");
      }
    }
    if (/innerHTML|document\.write|\.html\s*\(/.test(input)) {
      threats.push("Possible XSS vulnerability");
    }
    if (/\.\.\/|~\/|%2e%2e/i.test(input)) {
      threats.push("Path traversal attempt detected");
    }
    this.specialization.performance = Math.min(1, this.specialization.performance + 0.01);
    return threats.length > 0 ? threats.join(`
`) : "No immediate threats detected";
  }
  processReasoning(input) {
    const conclusions = [];
    if (/if.*then|implies|therefore|thus/i.test(input)) {
      conclusions.push("Deductive reasoning pattern detected");
    }
    if (/all|every|always|never/i.test(input)) {
      conclusions.push("Universal quantification present");
    }
    if (/some|exists|there is|there are/i.test(input)) {
      conclusions.push("Existential quantification present");
    }
    if (/because|since|as|given that/i.test(input)) {
      conclusions.push("Causal explanation identified");
    }
    this.specialization.performance = Math.min(1, this.specialization.performance + 0.01);
    return conclusions.length > 0 ? conclusions.join(`
`) : "Reasoning processed";
  }
  processLanguage(input) {
    const analysis = [];
    const sentences = input.split(/[.!?]+/).length;
    const words = input.split(/\s+/).length;
    const avgWordLength = words > 0 ? input.replace(/\s/g, "").length / words : 0;
    analysis.push(`Sentences: ${sentences}`);
    analysis.push(`Words: ${words}`);
    analysis.push(`Avg word length: ${avgWordLength.toFixed(1)}`);
    if (/\?/.test(input)) {
      analysis.push("Question detected");
    }
    if (/!/.test(input)) {
      analysis.push("Exclamation detected");
    }
    this.specialization.performance = Math.min(1, this.specialization.performance + 0.01);
    return analysis.join(`
`);
  }
  processMathematical(input) {
    const analysis = [];
    const numbers = input.match(/-?\d+\.?\d*/g) || [];
    if (numbers.length > 0) {
      const sum = numbers.reduce((a, b) => a + parseFloat(b), 0);
      analysis.push(`Numbers found: ${numbers.length}`);
      analysis.push(`Sum: ${sum}`);
    }
    if (/\+|-|\*|\/|\^/.test(input)) {
      analysis.push("Arithmetic operations detected");
    }
    if (/sin|cos|tan|log|exp|sqrt/i.test(input)) {
      analysis.push("Mathematical functions present");
    }
    if (/=|<|>|<=|>=/.test(input)) {
      analysis.push("Equations or inequalities found");
    }
    this.specialization.performance = Math.min(1, this.specialization.performance + 0.01);
    return analysis.length > 0 ? analysis.join(`
`) : "Mathematical analysis complete";
  }
  processCreative(input) {
    const ideas = [];
    const words = input.toLowerCase().split(/\s+/);
    const uniqueWords = [...new Set(words)];
    ideas.push(`Unique concepts: ${uniqueWords.slice(0, 5).join(", ")}`);
    ideas.push(`Potential combinations: ${this.generateCombinations(uniqueWords.slice(0, 3))}`);
    this.specialization.performance = Math.min(1, this.specialization.performance + 0.01);
    return ideas.join(`
`);
  }
  generateCombinations(words) {
    if (words.length < 2)
      return "N/A";
    return words.map((w, i) => `${w}-${words[(i + 1) % words.length]}`).join(", ");
  }
  processExecutive(input) {
    const planning = [];
    if (/goal|objective|target/i.test(input)) {
      planning.push("Goal-oriented planning detected");
    }
    if (/step|phase|stage|first|then|next/i.test(input)) {
      planning.push("Sequential structure identified");
    }
    if (/priority|important|critical|urgent/i.test(input)) {
      planning.push("Priority assessment present");
    }
    if (/deadline|due|by\s+\d|schedule/i.test(input)) {
      planning.push("Time constraints noted");
    }
    this.specialization.performance = Math.min(1, this.specialization.performance + 0.01);
    return planning.length > 0 ? planning.join(`
`) : "Executive processing complete";
  }
  processGeneric(input) {
    return `Processed: ${input.slice(0, 100)}${input.length > 100 ? "..." : ""}`;
  }
  train(input, target, learningRate = 0.01) {
    let totalError = 0;
    for (let i = 0;i < this.nucleus.length; i++) {
      const output = this.nucleus[i].forward(input);
      const error = target[i % target.length] - output;
      totalError += error * error;
      this.nucleus[i].updateWeights(input, learningRate, error);
    }
    this.specialization.expertise = Math.min(1, this.specialization.expertise + 0.001);
    return totalError / this.nucleus.length;
  }
  serialize() {
    return {
      id: this.id,
      type: this.type,
      nucleus: this.nucleus.map((n) => n.serialize()),
      dendrites: this.dendrites,
      axonTerminal: this.axonTerminal,
      membrane: this.membrane,
      mitochondria: this.mitochondria,
      ribosomes: this.ribosomes,
      state: this.state,
      connections: this.connections,
      specialization: this.specialization
    };
  }
  static deserialize(data) {
    const cell = new CellImpl(data.type, data.nucleus.length);
    cell.id = data.id;
    cell.dendrites = data.dendrites.map((d) => new Float64Array(d));
    cell.axonTerminal = new Float64Array(data.axonTerminal);
    cell.membrane = { ...data.membrane, channels: new Map(data.membrane.channels), receptors: new Map(data.membrane.receptors) };
    cell.mitochondria = { ...data.mitochondria };
    cell.ribosomes = { ...data.ribosomes, productionQueue: [...data.ribosomes.productionQueue], completed: [...data.ribosomes.completed] };
    cell.state = { ...data.state, geneExpression: new Map(data.state.geneExpression) };
    cell.connections = [...data.connections];
    cell.specialization = { ...data.specialization, training: [...data.specialization.training], capabilities: [...data.specialization.capabilities] };
    return cell;
  }
}
var EMBEDDING_DIM4 = 256;
var init_cell = __esm(() => {
  init_wrapper();
  init_neuron();
  init_embedding();
});

// src/cells/network.ts
class CellNetworkImpl {
  cells;
  regions;
  pathways;
  globalInhibition;
  embeddingEngine;
  activationLevels;
  signalQueue;
  constructor() {
    this.cells = new Map;
    this.regions = new Map;
    this.pathways = new Map;
    this.globalInhibition = 0.1;
    this.embeddingEngine = new EmbeddingEngine(EMBEDDING_DIM5);
    this.activationLevels = new Map;
    this.signalQueue = [];
    this.initializeRegions();
    this.initializeCells();
  }
  initializeRegions() {
    const regions = {
      sensory_cortex: ["sensory", "attention"],
      motor_cortex: ["motor", "executive"],
      prefrontal_cortex: ["executive", "reasoning", "creative"],
      temporal_lobe: ["language", "memory"],
      parietal_lobe: ["mathematical", "reasoning"],
      occipital_lobe: ["sensory"],
      hippocampus: ["memory"],
      amygdala: ["sensory", "memory"],
      coding_center: ["coding"],
      security_center: ["security"]
    };
    for (const [regionName, cellTypes] of Object.entries(regions)) {
      this.regions.set(regionName, new Set);
    }
  }
  initializeCells() {
    for (let i = 0;i < 10; i++) {
      const cell = new CellImpl("coding", 128);
      this.addCell(cell, "coding_center");
    }
    for (let i = 0;i < 10; i++) {
      const cell = new CellImpl("security", 128);
      this.addCell(cell, "security_center");
    }
    for (let i = 0;i < 8; i++) {
      const cell = new CellImpl("reasoning", 64);
      this.addCell(cell, "prefrontal_cortex");
    }
    for (let i = 0;i < 8; i++) {
      const cell = new CellImpl("memory", 64);
      this.addCell(cell, "hippocampus");
    }
    for (let i = 0;i < 6; i++) {
      const cell = new CellImpl("language", 64);
      this.addCell(cell, "temporal_lobe");
    }
    for (let i = 0;i < 6; i++) {
      const cell = new CellImpl("mathematical", 64);
      this.addCell(cell, "parietal_lobe");
    }
    for (let i = 0;i < 6; i++) {
      const cell = new CellImpl("creative", 64);
      this.addCell(cell, "prefrontal_cortex");
    }
    for (let i = 0;i < 8; i++) {
      const cell = new CellImpl("executive", 64);
      this.addCell(cell, "prefrontal_cortex");
    }
    for (let i = 0;i < 6; i++) {
      const cell = new CellImpl("sensory", 32);
      this.addCell(cell, "sensory_cortex");
    }
    for (let i = 0;i < 4; i++) {
      const cell = new CellImpl("attention", 32);
      this.addCell(cell, "sensory_cortex");
    }
    this.connectCells();
  }
  addCell(cell, region) {
    this.cells.set(cell.id, cell);
    this.activationLevels.set(cell.id, 0);
    const regionCells = this.regions.get(region);
    if (regionCells) {
      regionCells.add(cell.id);
    }
    this.connectCellToRegion(cell.id, region);
  }
  connectCells() {
    this.connectRegions("coding_center", "security_center", "excitatory", 0.7);
    this.connectRegions("sensory_cortex", "prefrontal_cortex", "excitatory", 0.5);
    this.connectRegions("sensory_cortex", "coding_center", "excitatory", 0.6);
    this.connectRegions("sensory_cortex", "security_center", "excitatory", 0.6);
    this.connectRegions("hippocampus", "prefrontal_cortex", "excitatory", 0.4);
    this.connectRegions("hippocampus", "temporal_lobe", "excitatory", 0.5);
    this.connectRegions("prefrontal_cortex", "motor_cortex", "excitatory", 0.6);
    this.connectRegions("prefrontal_cortex", "prefrontal_cortex", "inhibitory", 0.2);
  }
  connectCellToRegion(cellId, region) {
    const regionCells = this.regions.get(region);
    if (!regionCells)
      return;
    const cell = this.cells.get(cellId);
    if (!cell)
      return;
    const others = Array.from(regionCells).filter((id) => id !== cellId);
    const numConnections = Math.min(3, others.length);
    for (let i = 0;i < numConnections; i++) {
      const randomIdx = Math.floor(Math.random() * others.length);
      const targetId = others[randomIdx];
      const connection = cell.connectTo(targetId, "excitatory", 0.3);
      const pathway = this.pathways.get(cellId) || [];
      pathway.push(connection);
      this.pathways.set(cellId, pathway);
      others.splice(randomIdx, 1);
    }
  }
  connectRegions(from, to, type, strength) {
    const fromCells = this.regions.get(from);
    const toCells = this.regions.get(to);
    if (!fromCells || !toCells)
      return;
    const fromArray = Array.from(fromCells);
    const toArray = Array.from(toCells);
    const numConnections = Math.min(5, fromArray.length, toArray.length);
    for (let i = 0;i < numConnections; i++) {
      const sourceId = fromArray[i % fromArray.length];
      const targetId = toArray[i % toArray.length];
      const sourceCell = this.cells.get(sourceId);
      if (sourceCell) {
        const connection = sourceCell.connectTo(targetId, type, strength);
        const pathway = this.pathways.get(sourceId) || [];
        pathway.push(connection);
        this.pathways.set(sourceId, pathway);
      }
    }
  }
  process(input) {
    const results = new Map;
    const inputVector = this.embeddingEngine.embed(input);
    this.activateSensoryCells(inputVector);
    this.propagate();
    for (const [id, cell] of this.cells) {
      if (["coding", "security", "reasoning", "language", "mathematical", "creative", "executive"].includes(cell.type)) {
        const result = cell.processSpecialized(input);
        results.set(`${cell.type}_${id.slice(0, 8)}`, result);
      }
    }
    return results;
  }
  activateSensoryCells(input) {
    const sensoryRegion = this.regions.get("sensory_cortex");
    if (!sensoryRegion)
      return;
    for (const cellId of sensoryRegion) {
      const cell = this.cells.get(cellId);
      if (cell && cell.type === "sensory") {
        cell.receiveInput(input, 0);
        this.activationLevels.set(cellId, 1);
      }
    }
  }
  propagate() {
    const steps = 5;
    for (let step = 0;step < steps; step++) {
      const newActivations = new Map;
      for (const [cellId, activation] of this.activationLevels) {
        if (activation < 0.1)
          continue;
        const cell = this.cells.get(cellId);
        if (!cell)
          continue;
        const output = cell.process();
        for (const connection of cell.connections) {
          const currentActivation = newActivations.get(connection.targetId) || 0;
          const propagatedActivation = connection.type === "excitatory" ? currentActivation + activation * connection.strength : currentActivation - activation * connection.strength * this.globalInhibition;
          newActivations.set(connection.targetId, Math.max(0, Math.min(1, propagatedActivation)));
          const targetCell = this.cells.get(connection.targetId);
          if (targetCell) {
            targetCell.receiveInput(scale(output, connection.strength), Math.floor(Math.random() * 8));
          }
        }
      }
      this.activationLevels = newActivations;
    }
  }
  trainCellType(type, inputs, targets, epochs = 10, learningRate = 0.01) {
    let totalError = 0;
    let count = 0;
    for (const [id, cell] of this.cells) {
      if (cell.type === type) {
        for (let epoch = 0;epoch < epochs; epoch++) {
          for (let i = 0;i < inputs.length && i < targets.length; i++) {
            const error = cell.train(inputs[i], targets[i], learningRate);
            totalError += error;
            count++;
          }
        }
      }
    }
    return count > 0 ? totalError / count : 0;
  }
  addNewCell(type, region) {
    const cell = new CellImpl(type, 64);
    this.addCell(cell, region);
    return cell;
  }
  removeCell(cellId) {
    const cell = this.cells.get(cellId);
    if (!cell)
      return false;
    for (const regionCells of this.regions.values()) {
      regionCells.delete(cellId);
    }
    for (const [id, c] of this.cells) {
      c.connections = c.connections.filter((conn) => conn.targetId !== cellId && conn.sourceId !== cellId);
    }
    this.cells.delete(cellId);
    this.activationLevels.delete(cellId);
    this.pathways.delete(cellId);
    return true;
  }
  getCellsByType(type) {
    const cells = [];
    for (const cell of this.cells.values()) {
      if (cell.type === type) {
        cells.push(cell);
      }
    }
    return cells;
  }
  getStats() {
    let totalConnections = 0;
    let totalExpertise = 0;
    let totalPerformance = 0;
    let activeCells = 0;
    for (const cell of this.cells.values()) {
      totalConnections += cell.connections.length;
      totalExpertise += cell.specialization.expertise;
      totalPerformance += cell.specialization.performance;
      if (this.activationLevels.get(cell.id) && this.activationLevels.get(cell.id) > 0.1) {
        activeCells++;
      }
    }
    return {
      totalCells: this.cells.size,
      totalConnections,
      avgExpertise: this.cells.size > 0 ? totalExpertise / this.cells.size : 0,
      avgPerformance: this.cells.size > 0 ? totalPerformance / this.cells.size : 0,
      activeCells
    };
  }
  regenerateAll() {
    for (const cell of this.cells.values()) {
      cell.regenerate();
    }
  }
  strengthenConnections() {
    for (const cell of this.cells.values()) {
      cell.strengthenConnections();
    }
  }
  getCellsInRegion(region) {
    const cellIds = this.regions.get(region);
    if (!cellIds)
      return [];
    const cells = [];
    for (const id of cellIds) {
      const cell = this.cells.get(id);
      if (cell)
        cells.push(cell);
    }
    return cells;
  }
  getRegions() {
    return Array.from(this.regions.keys());
  }
  clearActivation() {
    for (const [id] of this.activationLevels) {
      this.activationLevels.set(id, 0);
    }
  }
  serialize() {
    return {
      cells: this.cells,
      regions: this.regions,
      pathways: this.pathways,
      globalInhibition: this.globalInhibition
    };
  }
}
var EMBEDDING_DIM5 = 256;
var init_network2 = __esm(() => {
  init_cell();
  init_embedding();
});

// src/knowledge/base.ts
class KnowledgeBase {
  nodes;
  edges;
  categories;
  index;
  embeddingEngine;
  totalAccess;
  lastAccessTime;
  constructor() {
    this.nodes = new Map;
    this.edges = new Map;
    this.categories = new Map;
    this.index = new VectorIndexImpl(EMBEDDING_DIM6, 16, "cosine");
    this.embeddingEngine = new EmbeddingEngine(EMBEDDING_DIM6);
    this.totalAccess = 0;
    this.lastAccessTime = Date.now();
    this.initializeCategories();
  }
  initializeCategories() {
    const domains = [
      "coding",
      "cybersecurity",
      "algorithms",
      "data_structures",
      "patterns",
      "best_practices",
      "vulnerabilities",
      "exploits",
      "defenses",
      "tools",
      "languages",
      "frameworks"
    ];
    for (const domain of domains) {
      this.categories.set(domain, new Set);
    }
  }
  add(content, domain, source = "unknown", metadata = {}) {
    const embedding = this.embeddingEngine.embed(content);
    const knowledge = {
      id: v4(),
      domain,
      content,
      embedding,
      source,
      confidence: metadata.confidence || 1,
      relevance: metadata.relevance || 1,
      connections: new Set,
      lastUpdated: Date.now(),
      accessCount: 0
    };
    this.nodes.set(knowledge.id, knowledge);
    this.edges.set(knowledge.id, new Set);
    const category = this.categories.get(domain);
    if (category) {
      category.add(knowledge.id);
    }
    this.index.add(knowledge.id, embedding);
    this.findRelatedKnowledge(knowledge);
    return knowledge;
  }
  addBatch(items) {
    let added = 0;
    for (const item of items) {
      this.add(item.content, item.domain, item.source, item.metadata);
      added++;
    }
    return added;
  }
  findRelatedKnowledge(knowledge) {
    const similar = this.index.search(knowledge.embedding, 10);
    for (const result of similar) {
      if (result.id !== knowledge.id && result.distance < 0.3) {
        knowledge.connections.add(result.id);
        const relatedKnowledge = this.nodes.get(result.id);
        if (relatedKnowledge) {
          relatedKnowledge.connections.add(knowledge.id);
        }
        const edges = this.edges.get(knowledge.id);
        if (edges) {
          edges.add(result.id);
        }
        const reverseEdges = this.edges.get(result.id);
        if (reverseEdges) {
          reverseEdges.add(knowledge.id);
        }
      }
    }
  }
  query(query, k = 10, domains) {
    const queryEmbedding = this.embeddingEngine.embed(query);
    let results = this.index.search(queryEmbedding, k * 2);
    if (domains && domains.length > 0) {
      const allowedIds = new Set;
      for (const domain of domains) {
        const categoryIds = this.categories.get(domain);
        if (categoryIds) {
          for (const id of categoryIds) {
            allowedIds.add(id);
          }
        }
      }
      results = results.filter((r) => allowedIds.has(r.id));
    }
    const knowledge = [];
    for (const result of results.slice(0, k)) {
      const k2 = this.nodes.get(result.id);
      if (k2) {
        k2.accessCount++;
        k2.relevance = 1 - result.distance;
        this.totalAccess++;
        this.lastAccessTime = Date.now();
        knowledge.push(k2);
      }
    }
    return knowledge;
  }
  queryByVector(embedding, k = 10) {
    const results = this.index.search(embedding, k);
    const knowledge = [];
    for (const result of results) {
      const k2 = this.nodes.get(result.id);
      if (k2) {
        k2.accessCount++;
        knowledge.push(k2);
      }
    }
    return knowledge;
  }
  get(id) {
    const knowledge = this.nodes.get(id);
    if (knowledge) {
      knowledge.accessCount++;
      this.totalAccess++;
      this.lastAccessTime = Date.now();
    }
    return knowledge || null;
  }
  getByDomain(domain) {
    const ids = this.categories.get(domain);
    if (!ids)
      return [];
    const knowledge = [];
    for (const id of ids) {
      const k = this.nodes.get(id);
      if (k)
        knowledge.push(k);
    }
    return knowledge;
  }
  getRelated(id) {
    const connections = this.edges.get(id);
    if (!connections)
      return [];
    const related = [];
    for (const relatedId of connections) {
      const k = this.nodes.get(relatedId);
      if (k)
        related.push(k);
    }
    return related;
  }
  updateConfidence(id, confidence) {
    const knowledge = this.nodes.get(id);
    if (!knowledge)
      return false;
    knowledge.confidence = Math.max(0, Math.min(1, confidence));
    knowledge.lastUpdated = Date.now();
    return true;
  }
  remove(id) {
    const knowledge = this.nodes.get(id);
    if (!knowledge)
      return false;
    const category = this.categories.get(knowledge.domain);
    if (category) {
      category.delete(id);
    }
    for (const [nodeId, edges] of this.edges) {
      edges.delete(id);
    }
    this.edges.delete(id);
    for (const [kId, k] of this.nodes) {
      k.connections.delete(id);
    }
    this.index.remove(id);
    this.nodes.delete(id);
    return true;
  }
  merge(other) {
    let merged = 0;
    for (const [id, knowledge] of other.nodes) {
      if (!this.nodes.has(id)) {
        this.nodes.set(id, {
          ...knowledge,
          connections: new Set(knowledge.connections)
        });
        const category = this.categories.get(knowledge.domain);
        if (category) {
          category.add(id);
        }
        this.index.add(id, knowledge.embedding);
        merged++;
      }
    }
    for (const [id, edges] of other.edges) {
      const myEdges = this.edges.get(id);
      if (!myEdges) {
        this.edges.set(id, new Set(edges));
      } else {
        for (const edge of edges) {
          myEdges.add(edge);
        }
      }
    }
    return merged;
  }
  getStats() {
    let totalConnections = 0;
    let totalConfidence = 0;
    let totalAccessCount = 0;
    const domainStats = {};
    for (const [domain, ids] of this.categories) {
      domainStats[domain] = ids.size;
    }
    for (const knowledge of this.nodes.values()) {
      totalConnections += knowledge.connections.size;
      totalConfidence += knowledge.confidence;
      totalAccessCount += knowledge.accessCount;
    }
    return {
      totalKnowledge: this.nodes.size,
      totalConnections: totalConnections / 2,
      domains: domainStats,
      avgConfidence: this.nodes.size > 0 ? totalConfidence / this.nodes.size : 0,
      avgAccessCount: this.nodes.size > 0 ? totalAccessCount / this.nodes.size : 0
    };
  }
  export() {
    return {
      nodes: this.nodes,
      edges: this.edges,
      categories: this.categories,
      index: this.index
    };
  }
  import(graph) {
    this.nodes = graph.nodes;
    this.edges = graph.edges;
    this.categories = graph.categories;
    this.index = graph.index;
  }
  getEmbeddingEngine() {
    return this.embeddingEngine;
  }
  getTotalAccess() {
    return this.totalAccess;
  }
  getLastAccessTime() {
    return this.lastAccessTime;
  }
  clear() {
    this.nodes.clear();
    this.edges.clear();
    for (const category of this.categories.values()) {
      category.clear();
    }
    this.index.clear();
    this.totalAccess = 0;
    this.lastAccessTime = Date.now();
  }
  size() {
    return this.nodes.size;
  }
}
var EMBEDDING_DIM6 = 768;
var init_base = __esm(() => {
  init_wrapper();
  init_embedding();
  init_embedding();
});

// src/knowledge/huggingface.ts
class HuggingFaceIngestor {
  knowledgeBase;
  embeddingEngine;
  ingestionStats;
  constructor(knowledgeBase) {
    this.knowledgeBase = knowledgeBase;
    this.embeddingEngine = new EmbeddingEngine(EMBEDDING_DIM7);
    this.ingestionStats = new Map;
  }
  generateCodingKnowledge() {
    const items = [];
    const pythonPatterns = [
      `def singleton(cls):
    """Singleton pattern decorator"""
    instances = {}
    def wrapper(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]
    return wrapper`,
      `class Observer:
    """Observer pattern implementation"""
    def __init__(self):
        self._observers = []
    
    def attach(self, observer):
        self._observers.append(observer)
    
    def detach(self, observer):
        self._observers.remove(observer)
    
    def notify(self, message):
        for observer in self._observers:
            observer.update(message)`,
      `def factory_pattern(creature_type):
    """Factory pattern for object creation"""
    creatures = {
        'dog': Dog,
        'cat': Cat,
        'bird': Bird
    }
    return creatures.get(creature_type.lower(), DefaultCreature)()`,
      `class Singleton:
    """Singleton metaclass"""
    _instances = {}
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]`,
      `def quicksort(arr):
    """QuickSort algorithm implementation"""
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)`
    ];
    for (let i = 0;i < pythonPatterns.length; i++) {
      items.push({
        content: pythonPatterns[i],
        domain: "patterns",
        source: "generated_python_patterns"
      });
    }
    const jsPatterns = [
      `const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};`,
      `const throttle = (func, limit) => {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};`,
      `const memoize = (fn) => {
    const cache = {};
    return (...args) => {
        const key = JSON.stringify(args);
        return cache[key] || (cache[key] = fn(...args));
    };
};`,
      `class EventEmitter {
    constructor() {
        this.events = {};
    }
    
    on(event, listener) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(listener);
    }
    
    emit(event, ...args) {
        if (this.events[event]) {
            this.events[event].forEach(listener => listener(...args));
        }
    }
}`,
      `const curry = (fn) => {
    return function curried(...args) {
        if (args.length >= fn.length) {
            return fn.apply(this, args);
        }
        return (...moreArgs) => curried.apply(this, args.concat(moreArgs));
    };
};`
    ];
    for (let i = 0;i < jsPatterns.length; i++) {
      items.push({
        content: jsPatterns[i],
        domain: "patterns",
        source: "generated_js_patterns"
      });
    }
    const algorithms = [
      `def binary_search(arr, target):
    """Binary search algorithm - O(log n)"""
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
      `def merge_sort(arr):
    """Merge sort algorithm - O(n log n)"""
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)`,
      `def bfs(graph, start):
    """Breadth-first search traversal"""
    visited = set()
    queue = [start]
    while queue:
        node = queue.pop(0)
        if node not in visited:
            visited.add(node)
            queue.extend(graph[node] - visited)
    return visited`,
      `def dfs(graph, start, visited=None):
    """Depth-first search traversal"""
    if visited is None:
        visited = set()
    visited.add(start)
    for next_node in graph[start] - visited:
        dfs(graph, next_node, visited)
    return visited`,
      `def dijkstra(graph, start):
    """Dijkstra's shortest path algorithm"""
    distances = {node: float('infinity') for node in graph}
    distances[start] = 0
    pq = [(0, start)]
    while pq:
        current_dist, current = heapq.heappop(pq)
        if current_dist > distances[current]:
            continue
        for neighbor, weight in graph[current].items():
            distance = current_dist + weight
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                heapq.heappush(pq, (distance, neighbor))
    return distances`
    ];
    for (let i = 0;i < algorithms.length; i++) {
      items.push({
        content: algorithms[i],
        domain: "algorithms",
        source: "generated_algorithms"
      });
    }
    const dataStructures = [
      `class LinkedList:
    """Linked list implementation"""
    class Node:
        def __init__(self, data):
            self.data = data
            self.next = None
    
    def __init__(self):
        self.head = None
    
    def append(self, data):
        if not self.head:
            self.head = self.Node(data)
        else:
            current = self.head
            while current.next:
                current = current.next
            current.next = self.Node(data)`,
      `class BinarySearchTree:
    """Binary search tree implementation"""
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None
    
    def insert(self, value):
        if value < self.value:
            if self.left is None:
                self.left = BinarySearchTree(value)
            else:
                self.left.insert(value)
        else:
            if self.right is None:
                self.right = BinarySearchTree(value)
            else:
                self.right.insert(value)`,
      `class HashMap:
    """Hash map implementation"""
    def __init__(self, size=1000):
        self.size = size
        self.map = [[] for _ in range(size)]
    
    def _hash(self, key):
        return hash(key) % self.size
    
    def set(self, key, value):
        idx = self._hash(key)
        for pair in self.map[idx]:
            if pair[0] == key:
                pair[1] = value
                return
        self.map[idx].append([key, value])`,
      `class Stack:
    """Stack implementation using list"""
    def __init__(self):
        self.items = []
    
    def push(self, item):
        self.items.append(item)
    
    def pop(self):
        return self.items.pop() if self.items else None
    
    def peek(self):
        return self.items[-1] if self.items else None`,
      `class Queue:
    """Queue implementation using collections.deque"""
    from collections import deque
    def __init__(self):
        self.items = deque()
    
    def enqueue(self, item):
        self.items.append(item)
    
    def dequeue(self):
        return self.items.popleft() if self.items else None`
    ];
    for (let i = 0;i < dataStructures.length; i++) {
      items.push({
        content: dataStructures[i],
        domain: "data_structures",
        source: "generated_data_structures"
      });
    }
    return items;
  }
  generateSecurityKnowledge() {
    const items = [];
    const vulnerabilities = [
      `# SQL Injection Prevention
def safe_query(db, query, params):
    """Prevent SQL injection using parameterized queries"""
    cursor = db.cursor()
    try:
        cursor.execute(query, params)
        return cursor.fetchall()
    except Exception as e:
        log_error(e)
        return None

# Example usage:
# safe_query(db, "SELECT * FROM users WHERE id = %s", (user_id,))`,
      `# XSS Prevention
def sanitize_html(user_input):
    """Sanitize HTML to prevent XSS attacks"""
    import html
    return html.escape(user_input)

# Content Security Policy headers
CSP_HEADERS = {
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
}`,
      `# CSRF Token Implementation
import secrets

def generate_csrf_token():
    """Generate a secure CSRF token"""
    return secrets.token_hex(32)

def validate_csrf_token(session_token, form_token):
    """Validate CSRF token using constant-time comparison"""
    return secrets.compare_digest(session_token, form_token)`,
      `# Path Traversal Prevention
import os

def safe_path_join(base_dir, user_path):
    """Prevent path traversal attacks"""
    full_path = os.path.normpath(os.path.join(base_dir, user_path))
    if not full_path.startswith(os.path.normpath(base_dir)):
        raise SecurityError("Path traversal attempt detected")
    return full_path`,
      `# Command Injection Prevention
import shlex

def safe_command(user_input):
    """Prevent command injection by sanitizing input"""
    sanitized = shlex.quote(user_input)
    return f"process {sanitized}"

# Never use: os.system(f"process {user_input}")
# Always use: subprocess.run(["process", user_input], shell=False)`
    ];
    for (let i = 0;i < vulnerabilities.length; i++) {
      items.push({
        content: vulnerabilities[i],
        domain: "vulnerabilities",
        source: "generated_vulnerability_patterns"
      });
    }
    const securityTools = [
      `# Port Scanner
import socket

def scan_port(host, port, timeout=1):
    """Scan a single port for connectivity"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except:
        return False

def scan_common_ports(host):
    """Scan common ports"""
    common_ports = [21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 3306, 5432, 8080]
    open_ports = []
    for port in common_ports:
        if scan_port(host, port):
            open_ports.append(port)
    return open_ports`,
      `# Password Hashing
import hashlib
import bcrypt

def hash_password_bcrypt(password):
    """Securely hash password using bcrypt"""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode(), salt)

def verify_password_bcrypt(password, hashed):
    """Verify password against bcrypt hash"""
    return bcrypt.checkpw(password.encode(), hashed)`,
      `# Encryption Utilities
from cryptography.fernet import Fernet

def generate_key():
    """Generate encryption key"""
    return Fernet.generate_key()

def encrypt_data(data, key):
    """Encrypt data using Fernet symmetric encryption"""
    f = Fernet(key)
    return f.encrypt(data.encode())

def decrypt_data(encrypted_data, key):
    """Decrypt data using Fernet symmetric encryption"""
    f = Fernet(key)
    return f.decrypt(encrypted_data).decode()`,
      `# Network Analysis
import subprocess
import re

def get_network_info():
    """Gather network configuration info"""
    result = subprocess.run(['ipconfig'], capture_output=True, text=True)
    return parse_network_output(result.stdout)

def detect_anomalies(network_data):
    """Detect potential network anomalies"""
    anomalies = []
    if network_data.get('suspicious_connections'):
        anomalies.append('Unusual outbound connections detected')
    if network_data.get('port_scans'):
        anomalies.append('Port scanning activity detected')
    return anomalies`,
      `# Log Analysis
import re
from datetime import datetime

def analyze_auth_logs(log_file):
    """Analyze authentication logs for suspicious activity"""
    failed_attempts = {}
    with open(log_file, 'r') as f:
        for line in f:
            if 'Failed password' in line:
                ip = extract_ip(line)
                failed_attempts[ip] = failed_attempts.get(ip, 0) + 1
    
    # Detect brute force attempts
    brute_force = [ip for ip, count in failed_attempts.items() if count > 5]
    return brute_force`
    ];
    for (let i = 0;i < securityTools.length; i++) {
      items.push({
        content: securityTools[i],
        domain: "tools",
        source: "generated_security_tools"
      });
    }
    const defenses = [
      `# Rate Limiting Implementation
from collections import defaultdict
import time

class RateLimiter:
    def __init__(self, max_requests=100, window_seconds=60):
        self.max_requests = max_requests
        self.window = window_seconds
        self.requests = defaultdict(list)
    
    def is_allowed(self, client_id):
        now = time.time()
        self.requests[client_id] = [
            t for t in self.requests[client_id] 
            if t > now - self.window
        ]
        if len(self.requests[client_id]) < self.max_requests:
            self.requests[client_id].append(now)
            return True
        return False`,
      `# Input Validation Framework
import re

class InputValidator:
    EMAIL_PATTERN = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
    PHONE_PATTERN = r'^\\+?[1-9]\\d{1,14}$'
    
    @staticmethod
    def validate_email(email):
        return bool(re.match(InputValidator.EMAIL_PATTERN, email))
    
    @staticmethod
    def validate_length(value, min_len=1, max_len=1000):
        return min_len <= len(value) <= max_len
    
    @staticmethod
    def validate_type(value, expected_type):
        return isinstance(value, expected_type)`,
      `# Security Headers Middleware
SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
}

def add_security_headers(response):
    for header, value in SECURITY_HEADERS.items():
        response.headers[header] = value
    return response`,
      `# Intrusion Detection
class IntrusionDetector:
    def __init__(self):
        self.thresholds = {
            'failed_login_attempts': 5,
            'requests_per_minute': 100,
            'payload_size_kb': 100
        }
        self.counters = defaultdict(int)
    
    def check_failed_login(self, ip):
        self.counters[f'login:{ip}'] += 1
        return self.counters[f'login:{ip}'] > self.thresholds['failed_login_attempts']
    
    def check_request_rate(self, ip):
        self.counters[f'req:{ip}'] += 1
        return self.counters[f'req:{ip}'] > self.thresholds['requests_per_minute']`,
      `# Secure Session Management
import secrets
import hashlib
from datetime import datetime, timedelta

class SessionManager:
    def __init__(self, timeout_minutes=30):
        self.sessions = {}
        self.timeout = timedelta(minutes=timeout_minutes)
    
    def create_session(self, user_id):
        session_id = secrets.token_urlsafe(32)
        self.sessions[session_id] = {
            'user_id': user_id,
            'created': datetime.now(),
            'last_activity': datetime.now()
        }
        return session_id
    
    def validate_session(self, session_id):
        if session_id not in self.sessions:
            return False
        session = self.sessions[session_id]
        if datetime.now() - session['last_activity'] > self.timeout:
            del self.sessions[session_id]
            return False
        session['last_activity'] = datetime.now()
        return True`
    ];
    for (let i = 0;i < defenses.length; i++) {
      items.push({
        content: defenses[i],
        domain: "defenses",
        source: "generated_defense_mechanisms"
      });
    }
    return items;
  }
  generateLanguageKnowledge() {
    const items = [];
    const languages = [
      {
        name: "Python",
        patterns: [
          `# Python List Comprehension
# [expression for item in iterable if condition]
squares = [x**2 for x in range(10) if x % 2 == 0]
# Result: [0, 4, 16, 36, 64]`,
          `# Python Dictionary Comprehension
# {key: value for item in iterable}
word_lengths = {word: len(word) for word in ['hello', 'world']}
# Result: {'hello': 5, 'world': 5}`,
          `# Python Generator Expression
# (expression for item in iterable)
sum_of_squares = sum(x**2 for x in range(1000000))
# Memory efficient - doesn't create full list`,
          `# Python Decorator Pattern
def timing_decorator(func):
    import time
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        print(f"{func.__name__} took {time.time()-start:.2f}s")
        return result
    return wrapper

@timing_decorator
def slow_function():
    time.sleep(1)`,
          `# Python Context Manager
class ManagedFile:
    def __init__(self, filename):
        self.filename = filename
    
    def __enter__(self):
        self.file = open(self.filename, 'r')
        return self.file
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.file.close()
        return False

with ManagedFile('data.txt') as f:
    content = f.read()`
        ]
      },
      {
        name: "JavaScript",
        patterns: [
          `// JavaScript Async/Await
async function fetchData(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}`,
          `// JavaScript Promise Patterns
const parallel = Promise.all([
    fetch('/api/users'),
    fetch('/api/posts')
]);

const race = Promise.race([
    fetch('/api/fast'),
    fetch('/api/slow')
]);`,
          `// JavaScript Destructuring
const { name, age, ...rest } = person;
const [first, second, ...remaining] = array;

// Function parameter destructuring
function greet({ name, age = 0 }) {
    return \`Hello, \${name}! You are \${age} years old.\`;
}`,
          `// JavaScript Spread Operator
const merged = { ...obj1, ...obj2 };
const copied = [...array];
const combined = [...arr1, ...arr2, newItem];

// Immutable updates
const updated = { ...state, count: state.count + 1 };`,
          `// JavaScript Module Pattern
export const utility = {
    helper: () => 'helper function',
    config: { debug: true }
};

export default class MyClass {
    constructor() { this.value = 0; }
    increment() { this.value++; }
}`
        ]
      },
      {
        name: "TypeScript",
        patterns: [
          `// TypeScript Interface
interface User {
    id: number;
    name: string;
    email: string;
    role?: 'admin' | 'user' | 'guest';
    readonly createdAt: Date;
}

function createUser(user: User): User {
    return { ...user, createdAt: new Date() };
}`,
          `// TypeScript Generic Types
function identity<T>(arg: T): T {
    return arg;
}

class Container<T> {
    private value: T;
    constructor(value: T) { this.value = value; }
    getValue(): T { return this.value; }
}`,
          `// TypeScript Utility Types
type Partial<T> = { [P in keyof T]?: T[P] };
type Required<T> = { [P in keyof T]-?: T[P] };
type Readonly<T> = { readonly [P in keyof T]: T[P] };
type Pick<T, K extends keyof T> = { [P in K]: T[P] };
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;`,
          `// TypeScript Decorators
function logged(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    descriptor.value = function(...args: any[]) {
        console.log(\`Calling \${propertyKey}\`);
        return original.apply(this, args);
    };
}

class Example {
    @logged
    method() { return 'result'; }
}`,
          `// TypeScript Type Guards
function isString(value: unknown): value is string {
    return typeof value === 'string';
}

function process(value: string | number) {
    if (isString(value)) {
        return value.toUpperCase(); // TypeScript knows it's string
    }
    return value.toFixed(2); // TypeScript knows it's number
}`
        ]
      }
    ];
    for (const lang of languages) {
      for (let i = 0;i < lang.patterns.length; i++) {
        items.push({
          content: lang.patterns[i],
          domain: "languages",
          source: `generated_${lang.name.toLowerCase()}_patterns`
        });
      }
    }
    return items;
  }
  ingestAll() {
    const allItems = [
      ...this.generateCodingKnowledge(),
      ...this.generateSecurityKnowledge(),
      ...this.generateLanguageKnowledge()
    ];
    const byDomain = {};
    for (const item of allItems) {
      this.knowledgeBase.add(item.content, item.domain, item.source);
      byDomain[item.domain] = (byDomain[item.domain] || 0) + 1;
    }
    return {
      total: allItems.length,
      byDomain
    };
  }
  getAvailableDatasets() {
    return {
      coding: CODING_DATASETS,
      security: SECURITY_DATASETS,
      algorithms: ALGORITHM_DATASETS
    };
  }
  getIngestionStats() {
    return this.ingestionStats;
  }
}
var EMBEDDING_DIM7 = 768, CODING_DATASETS, SECURITY_DATASETS, ALGORITHM_DATASETS;
var init_huggingface = __esm(() => {
  init_embedding();
  CODING_DATASETS = [
    {
      name: "code_search_net",
      description: "CodeSearchNet - Code search and documentation",
      url: "https://huggingface.co/datasets/code-search-net/code_search_net",
      domain: "coding",
      samples: 2000000,
      estimatedSize: "12GB"
    },
    {
      name: "code_alpaca",
      description: "Code Alpaca - Instruction-following code generation",
      url: "https://huggingface.co/datasets/sahil2801/CodeAlpaca-20k",
      domain: "coding",
      samples: 20000,
      estimatedSize: "50MB"
    },
    {
      name: "github_code",
      description: "GitHub Code Dataset - Source code from GitHub",
      url: "https://huggingface.co/datasets/codeparrot/github-code",
      domain: "coding",
      samples: 30000000,
      estimatedSize: "1TB"
    },
    {
      name: "mbpp",
      description: "MBPP - Mostly Basic Python Problems",
      url: "https://huggingface.co/datasets/mbpp",
      domain: "coding",
      samples: 974,
      estimatedSize: "5MB"
    },
    {
      name: "human_eval",
      description: "HumanEval - Code generation benchmark",
      url: "https://huggingface.co/datasets/openai_humaneval",
      domain: "coding",
      samples: 164,
      estimatedSize: "1MB"
    },
    {
      name: "apps",
      description: "APPS - Automated Problem Solving",
      url: "https://huggingface.co/datasets/codeparrot/apps",
      domain: "coding",
      samples: 1e4,
      estimatedSize: "7GB"
    },
    {
      name: "conala",
      description: "CoNaLa - Code/Natural Language pairs",
      url: "https://huggingface.co/datasets/neulab/conala",
      domain: "coding",
      samples: 2879,
      estimatedSize: "10MB"
    },
    {
      name: "spider",
      description: "Spider - Text-to-SQL dataset",
      url: "https://huggingface.co/datasets/spider",
      domain: "coding",
      samples: 10181,
      estimatedSize: "100MB"
    }
  ];
  SECURITY_DATASETS = [
    {
      name: "cve_cpe",
      description: "CVE/CPE - Vulnerability database",
      url: "https://huggingface.co/datasets/gpt4vcommunity/cve_cpe",
      domain: "vulnerabilities",
      samples: 200000,
      estimatedSize: "500MB"
    },
    {
      name: "security_reports",
      description: "Security Analysis Reports",
      url: "https://huggingface.co/datasets/ahmed00001/security_reports",
      domain: "cybersecurity",
      samples: 5000,
      estimatedSize: "50MB"
    },
    {
      name: "security_llm_data",
      description: "Security-focused LLM training data",
      url: "https://huggingface.co/datasets/wannaphong/llm-security-dataset",
      domain: "cybersecurity",
      samples: 1e4,
      estimatedSize: "20MB"
    },
    {
      name: "malware_samples",
      description: "Malware analysis samples",
      url: "https://huggingface.co/datasets/nanda0007/Malware-Sample-dataset",
      domain: "exploits",
      samples: 5000,
      estimatedSize: "100MB"
    },
    {
      name: "exploit_db",
      description: "Exploit Database - Security exploits",
      url: "https://huggingface.co/datasets/Aazkiya/ExploitDB-dataset",
      domain: "exploits",
      samples: 50000,
      estimatedSize: "200MB"
    },
    {
      name: "nvd_cve",
      description: "NVD CVE - National Vulnerability Database",
      url: "https://huggingface.co/datasets/Cyber-Dark/nvd-cve",
      domain: "vulnerabilities",
      samples: 1e5,
      estimatedSize: "300MB"
    },
    {
      name: "security_advisories",
      description: "Security advisories and bulletins",
      url: "https://huggingface.co/datasets/microsoft/security_advisories",
      domain: "defenses",
      samples: 3000,
      estimatedSize: "30MB"
    },
    {
      name: "penetration_testing",
      description: "Penetration testing techniques",
      url: "https://huggingface.co/datasets/fka865/penetration-testing-dataset",
      domain: "cybersecurity",
      samples: 2000,
      estimatedSize: "10MB"
    }
  ];
  ALGORITHM_DATASETS = [
    {
      name: "algorithm_problems",
      description: "Algorithm problems and solutions",
      url: "https://huggingface.co/datasets/simonbutt/algorithm_problems",
      domain: "algorithms",
      samples: 5000,
      estimatedSize: "20MB"
    },
    {
      name: "leetcode",
      description: "LeetCode problems and solutions",
      url: "https://huggingface.co/datasets/jeanlee/leetcode",
      domain: "algorithms",
      samples: 2000,
      estimatedSize: "15MB"
    },
    {
      name: "competitive_programming",
      description: "Competitive programming problems",
      url: "https://huggingface.co/datasets/mutgentin/competitive_programming",
      domain: "algorithms",
      samples: 1e4,
      estimatedSize: "50MB"
    }
  ];
});

// src/core/agent.ts
var exports_agent = {};
__export(exports_agent, {
  KaiAgentImpl: () => KaiAgentImpl
});

class KaiAgentImpl {
  id;
  name;
  version;
  brain;
  memory;
  thoughts;
  cells;
  knowledge;
  state;
  created;
  lastActive;
  embeddingEngine;
  huggingFaceIngestor;
  actionHistory;
  initialized;
  knowledgeBase;
  constructor(name = "Kai") {
    this.id = v4();
    this.name = name;
    this.version = VERSION;
    this.created = Date.now();
    this.lastActive = Date.now();
    this.initialized = false;
    this.embeddingEngine = new EmbeddingEngine(EMBEDDING_DIM8);
    this.brain = this.initializeBrain();
    this.state = {
      mode: "idle",
      task: null,
      context: new Float64Array(EMBEDDING_DIM8),
      history: [],
      goals: [],
      constraints: []
    };
    this.memory = new MemorySystemImpl;
    this.thoughts = new ReasoningEngineImpl;
    this.cells = new CellNetworkImpl;
    this.knowledgeBase = new KnowledgeBase;
    this.knowledge = this.knowledgeBase;
    this.huggingFaceIngestor = new HuggingFaceIngestor(this.knowledgeBase);
    this.actionHistory = [];
  }
  initializeBrain() {
    const networks = new Map;
    const mainNetwork = new NetworkImpl({
      name: "main_processor",
      layers: [
        { type: "input", size: EMBEDDING_DIM8, activation: "linear" },
        { type: "hidden", size: 512, activation: "relu", dropout: 0.2 },
        { type: "hidden", size: 256, activation: "relu", dropout: 0.2 },
        { type: "hidden", size: 128, activation: "relu" },
        { type: "output", size: 64, activation: "linear" }
      ],
      lossFunction: "mse",
      optimizer: "adam",
      learningRate: 0.001,
      batchSize: 32
    });
    networks.set("main", mainNetwork);
    const codingNetwork = new NetworkImpl({
      name: "coding_processor",
      layers: [
        { type: "input", size: EMBEDDING_DIM8, activation: "linear" },
        { type: "hidden", size: 256, activation: "gelu", dropout: 0.1 },
        { type: "hidden", size: 128, activation: "gelu" },
        { type: "output", size: 64, activation: "linear" }
      ],
      lossFunction: "mse",
      optimizer: "adam",
      learningRate: 0.001,
      batchSize: 16
    });
    networks.set("coding", codingNetwork);
    const securityNetwork = new NetworkImpl({
      name: "security_processor",
      layers: [
        { type: "input", size: EMBEDDING_DIM8, activation: "linear" },
        { type: "hidden", size: 256, activation: "relu", dropout: 0.15 },
        { type: "hidden", size: 128, activation: "relu" },
        { type: "output", size: 64, activation: "linear" }
      ],
      lossFunction: "mse",
      optimizer: "adam",
      learningRate: 0.001,
      batchSize: 16
    });
    networks.set("security", securityNetwork);
    return {
      networks,
      activeNetwork: "main",
      globalState: {
        consciousness: 0.5,
        focus: null,
        arousal: 0.5,
        valence: 0.5,
        attention: new Map
      }
    };
  }
  async initialize() {
    console.log("Initializing Kai Agent...");
    console.log("Ingesting knowledge...");
    const stats = this.huggingFaceIngestor.ingestAll();
    console.log(`Ingested ${stats.total} knowledge items`);
    console.log("By domain:", stats.byDomain);
    this.memory.start();
    const allKnowledge = this.knowledgeBase.query("", 1000);
    for (const k of allKnowledge) {
      this.memory.store(k.content, "semantic", { domain: k.domain, source: k.source });
    }
    this.initialized = true;
    console.log("Kai Agent initialized successfully!");
  }
  async process(input) {
    this.lastActive = Date.now();
    this.state.mode = "reasoning";
    this.state.task = input;
    const action = {
      id: v4(),
      type: "process",
      input,
      output: null,
      timestamp: Date.now(),
      success: false,
      duration: 0
    };
    const startTime = Date.now();
    try {
      const inputEmbedding = this.embeddingEngine.embed(input);
      this.state.context = inputEmbedding;
      const detectedDomains = this.detectDomains(input);
      let relevantKnowledge = detectedDomains.length > 0 ? this.knowledgeBase.query(input, 10, detectedDomains) : this.knowledgeBase.query(input, 5);
      if (relevantKnowledge.length === 0) {
        relevantKnowledge = this.knowledgeBase.query(input, 10);
      }
      const relevantMemories = this.memory.query(input, 5);
      const cellResults = this.cells.process(input);
      const thoughtTree = this.thoughts.startReasoning(input);
      const treeImpl = this.thoughts.getTree(thoughtTree.id);
      if (treeImpl) {
        treeImpl.explore(3);
      }
      const mainNetwork = this.brain.networks.get("main");
      const mainOutput = mainNetwork ? mainNetwork.predict(inputEmbedding) : new Float64Array(64);
      const response = this.generateResponse(input, relevantKnowledge, relevantMemories, cellResults, thoughtTree);
      this.memory.storeEpisode(`Processed: ${input.slice(0, 100)}`, { input, response }, ["engaged"], ["process", "reason"]);
      action.output = response;
      action.success = true;
      action.duration = Date.now() - startTime;
      return response;
    } catch (error) {
      action.success = false;
      action.duration = Date.now() - startTime;
      throw error;
    } finally {
      this.actionHistory.push(action);
      this.state.mode = "idle";
    }
  }
  generateResponse(input, knowledge, memories, cellResults, thoughtTree) {
    const parts = [];
    const conclusion = this.thoughts.getConclusion();
    if (conclusion) {
      parts.push(`Reasoning: ${conclusion}`);
    }
    if (knowledge.length > 0) {
      parts.push(`
Relevant Knowledge:`);
      for (const k of knowledge.slice(0, 2)) {
        parts.push(`- ${k.content.slice(0, 100)}...`);
      }
    }
    const cellOutputs = Array.from(cellResults.entries()).slice(0, 3);
    if (cellOutputs.length > 0) {
      parts.push(`
Cell Analysis:`);
      for (const [type, result] of cellOutputs) {
        parts.push(`[${type}]: ${result.slice(0, 50)}`);
      }
    }
    if (memories.length > 0) {
      parts.push(`
Memory Context:`);
      parts.push(`Found ${memories.length} relevant memories`);
    }
    parts.push(`

Synthesis:`);
    parts.push(this.synthesizeResponse(input, knowledge, cellResults));
    return parts.join(`
`);
  }
  synthesizeResponse(input, knowledge, cellResults) {
    if (this.isCodeRelated(input)) {
      return this.synthesizeCodeResponse(input, knowledge, cellResults);
    }
    if (this.isSecurityRelated(input)) {
      return this.synthesizeSecurityResponse(input, knowledge, cellResults);
    }
    return this.synthesizeGeneralResponse(input, knowledge, cellResults);
  }
  isCodeRelated(input) {
    const codeKeywords = ["code", "function", "class", "variable", "algorithm", "bug", "debug", "implement", "programming", "python", "javascript", "typescript"];
    return codeKeywords.some((kw) => input.toLowerCase().includes(kw));
  }
  isSecurityRelated(input) {
    const securityKeywords = ["security", "vulnerability", "attack", "exploit", "hack", "secure", "encrypt", "password", "injection", "xss", "csrf"];
    return securityKeywords.some((kw) => input.toLowerCase().includes(kw));
  }
  detectDomains(input) {
    const domains = [];
    const lower = input.toLowerCase();
    const securityKeywords = [
      "sql injection",
      "xss",
      "csrf",
      "vulnerability",
      "exploit",
      "hack",
      "security",
      "attack",
      "encrypt",
      "decrypt",
      "password",
      "hash",
      "penetration",
      "malware",
      "ransomware",
      "firewall",
      "cipher"
    ];
    if (securityKeywords.some((kw) => lower.includes(kw))) {
      domains.push("vulnerabilities", "cybersecurity", "defenses", "tools", "exploits");
    }
    const codingKeywords = [
      "code",
      "function",
      "class",
      "method",
      "algorithm",
      "variable",
      "python",
      "javascript",
      "typescript",
      "java",
      "rust",
      "go",
      "debug",
      "error",
      "exception",
      "implement",
      "refactor"
    ];
    if (codingKeywords.some((kw) => lower.includes(kw))) {
      domains.push("patterns", "algorithms", "data_structures", "languages", "coding");
    }
    return domains;
  }
  synthesizeCodeResponse(input, knowledge, cellResults) {
    const codeKnowledge = knowledge.filter((k) => ["coding", "patterns", "algorithms", "data_structures", "languages"].includes(k.domain));
    let response = `I've analyzed your code-related query: "${input.slice(0, 50)}..."`;
    if (codeKnowledge.length > 0) {
      response += `

Found ${codeKnowledge.length} relevant code patterns and examples.`;
      const example = codeKnowledge[0];
      if (example) {
        response += `

Example:
\`\`\`
${example.content.slice(0, 200)}
\`\`\``;
      }
    }
    const codingResult = Array.from(cellResults.entries()).find(([type]) => type.startsWith("coding"));
    if (codingResult) {
      response += `

Code Analysis: ${codingResult[1]}`;
    }
    return response;
  }
  synthesizeSecurityResponse(input, knowledge, cellResults) {
    const securityKnowledge = knowledge.filter((k) => ["cybersecurity", "vulnerabilities", "exploits", "defenses", "tools"].includes(k.domain));
    let response = `Security analysis for: "${input.slice(0, 50)}..."`;
    if (securityKnowledge.length > 0) {
      response += `

Identified ${securityKnowledge.length} security-related items.`;
      const example = securityKnowledge[0];
      if (example) {
        response += `

Security Pattern:
${example.content.slice(0, 200)}`;
      }
    }
    const securityResult = Array.from(cellResults.entries()).find(([type]) => type.startsWith("security"));
    if (securityResult) {
      response += `

Security Scan: ${securityResult[1]}`;
    }
    return response;
  }
  synthesizeGeneralResponse(input, knowledge, cellResults) {
    let response = `Processing your query: "${input.slice(0, 50)}..."`;
    if (knowledge.length > 0) {
      response += `

Related knowledge found: ${knowledge.length} items`;
    }
    const reasoningCellResult = Array.from(cellResults.entries()).find(([type]) => type.startsWith("reasoning"));
    if (reasoningCellResult) {
      response += `

Reasoning: ${reasoningCellResult[1]}`;
    }
    return response;
  }
  async learn(feedback) {
    const inputEmbedding = this.embeddingEngine.embed(feedback.input);
    const targetEmbedding = this.embeddingEngine.embed(feedback.expectedOutput);
    const mainNetwork = this.brain.networks.get("main");
    if (mainNetwork) {
      mainNetwork.backward(inputEmbedding, targetEmbedding);
    }
    this.memory.storeEpisode(`Learning: ${feedback.input.slice(0, 50)}`, { feedback }, ["curious"], ["learn", "adapt"]);
    this.cells.strengthenConnections();
  }
  setGoal(description, priority = 0.5) {
    const goal = {
      id: v4(),
      description,
      priority,
      progress: 0,
      subgoals: [],
      completed: false
    };
    this.state.goals.push(goal);
    return goal;
  }
  addConstraint(description, type = "soft", penalty = 0.1) {
    const constraint = {
      id: v4(),
      description,
      type,
      penalty
    };
    this.state.constraints.push(constraint);
    return constraint;
  }
  getStatus() {
    return {
      initialized: this.initialized,
      mode: this.state.mode,
      knowledgeCount: this.knowledgeBase.size(),
      memoryStats: this.memory.getStats(),
      cellStats: this.cells.getStats(),
      brainState: this.brain.globalState,
      goals: this.state.goals.length,
      uptime: Date.now() - this.created
    };
  }
  getHistory() {
    return [...this.actionHistory];
  }
  async shutdown() {
    this.memory.stop();
    this.state.mode = "idle";
    console.log("Kai Agent shut down successfully.");
  }
  serialize() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      brain: this.brain,
      memory: this.memory,
      thoughts: this.thoughts,
      cells: this.cells,
      knowledge: this.knowledgeBase,
      state: this.state,
      created: this.created,
      lastActive: this.lastActive
    };
  }
}
var VERSION = "1.0.0", EMBEDDING_DIM8 = 768;
var init_agent = __esm(() => {
  init_wrapper();
  init_network();
  init_system();
  init_reasoning();
  init_network2();
  init_base();
  init_huggingface();
  init_embedding();
});

// src/index.ts
init_agent();
init_network();
init_layer();
init_neuron();
init_system();
init_bank();
init_embedding();
init_reasoning();
init_tree();
init_cell();
init_network2();
init_base();
init_huggingface();
init_activations();
init_loss();
init_optimizers();

// src/utils/index.ts
init_wrapper();
function generateId() {
  return v4();
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}
function randomInt(min, max) {
  return Math.floor(randomRange(min, max + 1));
}
function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1;i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function chunk(array, size) {
  const result = [];
  for (let i = 0;i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}
function unique(array) {
  return [...new Set(array)];
}
function flatten(arrays) {
  return arrays.flat();
}
function groupBy(array, keyFn) {
  const result = {};
  for (const item of array) {
    const key = keyFn(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
  }
  return result;
}
function sortBy(array, keyFn, descending = false) {
  const result = [...array];
  result.sort((a, b) => {
    const diff = keyFn(a) - keyFn(b);
    return descending ? -diff : diff;
  });
  return result;
}
function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
function throttle(fn, limit) {
  let inThrottle = false;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
function memoize(fn) {
  const cache = new Map;
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}
function formatBytes(bytes) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}
function formatTime(ms) {
  if (ms < 1000)
    return `${ms}ms`;
  if (ms < 60000)
    return `${(ms / 1000).toFixed(2)}s`;
  if (ms < 3600000)
    return `${(ms / 60000).toFixed(2)}m`;
  return `${(ms / 3600000).toFixed(2)}h`;
}
function formatDate(timestamp) {
  return new Date(timestamp).toISOString();
}
function parseJson(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}
function safeAccess(obj, path, fallback) {
  const keys = path.split(".");
  let current = obj;
  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = current[key];
    } else {
      return fallback;
    }
  }
  return current ?? fallback;
}

// src/index.ts
var VERSION2 = "1.0.0";
async function createAgent(name = "Kai") {
  const { KaiAgentImpl: KaiAgentImpl2 } = await Promise.resolve().then(() => (init_agent(), exports_agent));
  const agent = new KaiAgentImpl2(name);
  await agent.initialize();
  return agent;
}
export {
  zeroVector,
  variance,
  unique,
  throttle,
  subtract,
  standardDeviation,
  sortBy,
  softmaxForward,
  softmaxBackward,
  softMax,
  slice,
  sleep,
  shuffle,
  scale,
  safeAccess,
  randomVector,
  randomRange,
  randomInt,
  parseJson,
  onesVector,
  normalize,
  memoize,
  mean,
  manhattanDistance,
  magnitude,
  lossFunctions,
  lerp,
  jaccardDistance,
  hammingDistance,
  hadamard,
  groupBy,
  generateId,
  formatTime,
  formatDate,
  formatBytes,
  flatten,
  euclideanDistance,
  dot,
  debounce,
  createOptimizer,
  createAgent,
  cosineSimilarity,
  cosineDistance,
  concat,
  computeLossGradient,
  computeLoss,
  computeDistance,
  clamp,
  chunk,
  applyActivationDerivative,
  applyActivation,
  add,
  activations,
  WorkingMemory,
  VectorIndexImpl,
  VERSION2 as VERSION,
  TransformerNetwork,
  ThoughtTreeImpl,
  ThoughtImpl,
  SemanticMemory,
  SGDOptimizer,
  SECURITY_DATASETS,
  RecurrentNetwork,
  ReasoningEngineImpl,
  RMSpropOptimizer,
  ProceduralMemory,
  OptimizerBase,
  NeuronImpl,
  NetworkImpl,
  NesterovOptimizer,
  NadamOptimizer,
  MomentumOptimizer,
  MemorySystemImpl,
  MemoryBankImpl,
  LayerImpl,
  LSTMLayer,
  KnowledgeBase,
  KaiAgentImpl,
  HuggingFaceIngestor,
  FtrlOptimizer,
  EpisodicMemory,
  EmbeddingLayer,
  EmbeddingEngine,
  CellNetworkImpl,
  CellImpl,
  CODING_DATASETS,
  AttentionLayer,
  AdamaxOptimizer,
  AdamOptimizer,
  AdagradOptimizer,
  ALGORITHM_DATASETS
};
