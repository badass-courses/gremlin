globalThis.__nitro_main__ = import.meta.url;
import { a as NodeResponse, s as serve } from "./_libs/srvx.mjs";
import { d as defineHandler, H as HTTPError, t as toEventHandler, a as defineLazyEventHandler, b as H3Core, c as toRequest } from "./_libs/h3.mjs";
import { d as decodePath, w as withLeadingSlash, a as withoutTrailingSlash, j as joinURL } from "./_libs/ufo.mjs";
import { promises } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import "node:http";
import "node:stream";
import "node:https";
import "node:http2";
import "./_libs/rou3.mjs";
function lazyService(loader) {
  let promise, mod;
  return {
    fetch(req) {
      if (mod) {
        return mod.fetch(req);
      }
      if (!promise) {
        promise = loader().then((_mod) => mod = _mod.default || _mod);
      }
      return promise.then((mod2) => mod2.fetch(req));
    }
  };
}
const services = {
  ["ssr"]: lazyService(() => import("./_ssr/index.mjs"))
};
globalThis.__nitro_vite_envs__ = services;
const errorHandler$1 = (error, event) => {
  const res = defaultHandler(error, event);
  return new NodeResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event, opts) {
  const isSensitive = error.unhandled;
  const status = error.status || 500;
  const url = event.url || new URL(event.req.url);
  if (status === 404) {
    const baseURL = "/";
    if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) {
      const redirectTo = `${baseURL}${url.pathname.slice(1)}${url.search}`;
      return {
        status: 302,
        statusText: "Found",
        headers: { location: redirectTo },
        body: `Redirecting...`
      };
    }
  }
  if (isSensitive && !opts?.silent) {
    const tags = [error.unhandled && "[unhandled]"].filter(Boolean).join(" ");
    console.error(`[request error] ${tags} [${event.req.method}] ${url}
`, error);
  }
  const headers2 = {
    "content-type": "application/json",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "no-referrer",
    "content-security-policy": "script-src 'none'; frame-ancestors 'none';"
  };
  if (status === 404 || !event.res.headers.has("cache-control")) {
    headers2["cache-control"] = "no-cache";
  }
  const body = {
    error: true,
    url: url.href,
    status,
    statusText: error.statusText,
    message: isSensitive ? "Server Error" : error.message,
    data: isSensitive ? void 0 : error.data
  };
  return {
    status,
    statusText: error.statusText,
    headers: headers2,
    body
  };
}
const errorHandlers = [errorHandler$1];
async function errorHandler(error, event) {
  for (const handler of errorHandlers) {
    try {
      const response = await handler(error, event, { defaultHandler });
      if (response) {
        return response;
      }
    } catch (error2) {
      console.error(error2);
    }
  }
}
const headers = ((m) => function headersRouteRule(event) {
  for (const [key2, value] of Object.entries(m.options || {})) {
    event.res.headers.set(key2, value);
  }
});
const assets = {
  "/favicon.ico": {
    "type": "image/vnd.microsoft.icon",
    "etag": '"38ae-j9V2lGbZGNij1BxRrx3q8EFqFoI"',
    "mtime": "2026-02-24T16:02:49.492Z",
    "size": 14510,
    "path": "../public/favicon.ico"
  },
  "/logo192.png": {
    "type": "image/png",
    "etag": '"14e3-f08taHgqf6/O2oRVTsq5tImHdQA"',
    "mtime": "2026-02-24T16:02:49.493Z",
    "size": 5347,
    "path": "../public/logo192.png"
  },
  "/logo512.png": {
    "type": "image/png",
    "etag": '"25c0-RpFfnQJpTtSb/HqVNJR2hBA9w/4"',
    "mtime": "2026-02-24T16:02:49.493Z",
    "size": 9664,
    "path": "../public/logo512.png"
  },
  "/manifest.json": {
    "type": "application/json",
    "etag": '"1f2-Oqn/x1R1hBTtEjA8nFhpBeFJJNg"',
    "mtime": "2026-02-24T16:02:49.493Z",
    "size": 498,
    "path": "../public/manifest.json"
  },
  "/robots.txt": {
    "type": "text/plain; charset=utf-8",
    "etag": '"43-BEzmj4PuhUNHX+oW9uOnPSihxtU"',
    "mtime": "2026-02-24T16:02:49.493Z",
    "size": 67,
    "path": "../public/robots.txt"
  },
  "/og-image.png": {
    "type": "image/png",
    "etag": '"3d1f6-7hWJdRfrHebxV3B2GDrO1X6DaEU"',
    "mtime": "2026-02-24T16:02:49.493Z",
    "size": 250358,
    "path": "../public/og-image.png"
  },
  "/tanstack-word-logo-white.svg": {
    "type": "image/svg+xml",
    "etag": '"3a9a-9TQFm/pN8AZe1ZK0G1KyCEojnYg"',
    "mtime": "2026-02-24T16:02:49.493Z",
    "size": 15002,
    "path": "../public/tanstack-word-logo-white.svg"
  },
  "/apple-touch-icon/apple-touch-icon-114x114.png": {
    "type": "image/png",
    "etag": '"46cb-dIcvkN/zyu4BmWGwyw71V+ylRU8"',
    "mtime": "2026-02-24T16:02:49.490Z",
    "size": 18123,
    "path": "../public/apple-touch-icon/apple-touch-icon-114x114.png"
  },
  "/tanstack-circle-logo.png": {
    "type": "image/png",
    "etag": '"40cab-HZ1KcYPs7tRjLe4Sd4g6CwKW+W8"',
    "mtime": "2026-02-24T16:02:49.493Z",
    "size": 265387,
    "path": "../public/tanstack-circle-logo.png"
  },
  "/apple-touch-icon/apple-touch-icon-120x120.png": {
    "type": "image/png",
    "etag": '"4cba-aI8gtRR1dIatF4ghTzv24Qf5kaI"',
    "mtime": "2026-02-24T16:02:49.490Z",
    "size": 19642,
    "path": "../public/apple-touch-icon/apple-touch-icon-120x120.png"
  },
  "/apple-touch-icon/apple-touch-icon-57x57.png": {
    "type": "image/png",
    "etag": '"14d6-+yBfSbVfn199OkWGMp3om8ipR2k"',
    "mtime": "2026-02-24T16:02:49.492Z",
    "size": 5334,
    "path": "../public/apple-touch-icon/apple-touch-icon-57x57.png"
  },
  "/apple-touch-icon/apple-touch-icon-152x152.png": {
    "type": "image/png",
    "etag": '"727e-JRpy8PsBOu7tvYFtVPGPrkWryyA"',
    "mtime": "2026-02-24T16:02:49.491Z",
    "size": 29310,
    "path": "../public/apple-touch-icon/apple-touch-icon-152x152.png"
  },
  "/apple-touch-icon/apple-touch-icon-180x180.png": {
    "type": "image/png",
    "etag": '"9777-Au3a6Urr/VxUtqcGG5S+0Qz00H4"',
    "mtime": "2026-02-24T16:02:49.491Z",
    "size": 38775,
    "path": "../public/apple-touch-icon/apple-touch-icon-180x180.png"
  },
  "/apple-touch-icon/apple-touch-icon-60x60.png": {
    "type": "image/png",
    "etag": '"16c6-XGKtoG7/bOEXdkRm8Hhjkdo+Etk"',
    "mtime": "2026-02-24T16:02:49.492Z",
    "size": 5830,
    "path": "../public/apple-touch-icon/apple-touch-icon-60x60.png"
  },
  "/apple-touch-icon/apple-touch-icon-144x144.png": {
    "type": "image/png",
    "etag": '"690a-TKDbQT52dZcI4LmbfRisjz6bgoQ"',
    "mtime": "2026-02-24T16:02:49.491Z",
    "size": 26890,
    "path": "../public/apple-touch-icon/apple-touch-icon-144x144.png"
  },
  "/apple-touch-icon/apple-touch-icon-76x76.png": {
    "type": "image/png",
    "etag": '"2274-H21HpKTRYDJmqgkLNqzS6K7IN4c"',
    "mtime": "2026-02-24T16:02:49.492Z",
    "size": 8820,
    "path": "../public/apple-touch-icon/apple-touch-icon-76x76.png"
  },
  "/apple-touch-icon/apple-touch-icon-72x72.png": {
    "type": "image/png",
    "etag": '"1f76-J+YSFRiEhcvfPsKRRF0+IStp/PY"',
    "mtime": "2026-02-24T16:02:49.492Z",
    "size": 8054,
    "path": "../public/apple-touch-icon/apple-touch-icon-72x72.png"
  },
  "/assets/index-CQ-xwVO-.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"2d2-BbuEy0KlXW/A43/QFYxJCb1fzM4"',
    "mtime": "2026-02-24T16:02:49.564Z",
    "size": 722,
    "path": "../public/assets/index-CQ-xwVO-.js"
  },
  "/favicons/favicon-16x16.png": {
    "type": "image/png",
    "etag": '"27f-X8F2cHDfcUaV3qFEV6h5aQyn4ts"',
    "mtime": "2026-02-24T16:02:49.492Z",
    "size": 639,
    "path": "../public/favicons/favicon-16x16.png"
  },
  "/assets/styles-BIlYG10K.css": {
    "type": "text/css; charset=utf-8",
    "etag": '"1998-YDhMltnmsBXxPFzEbSuxP+rfLUE"',
    "mtime": "2026-02-24T16:02:49.564Z",
    "size": 6552,
    "path": "../public/assets/styles-BIlYG10K.css"
  },
  "/favicons/favicon-48x48.png": {
    "type": "image/png",
    "etag": '"f46-aY0S9spFybzel5zFvENP9An9HDg"',
    "mtime": "2026-02-24T16:02:49.492Z",
    "size": 3910,
    "path": "../public/favicons/favicon-48x48.png"
  },
  "/favicons/favicon-32x32.png": {
    "type": "image/png",
    "etag": '"78e-EcKDPuaTcEq04qWAknnmE76vKyA"',
    "mtime": "2026-02-24T16:02:49.492Z",
    "size": 1934,
    "path": "../public/favicons/favicon-32x32.png"
  },
  "/assets/main-MNjuTRgl.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"4e63b-TI9WxCVg6BFenUsplKlXWXX2EII"',
    "mtime": "2026-02-24T16:02:49.564Z",
    "size": 321083,
    "path": "../public/assets/main-MNjuTRgl.js"
  }
};
function readAsset(id) {
  const serverDir = dirname(fileURLToPath(globalThis.__nitro_main__));
  return promises.readFile(resolve(serverDir, assets[id].path));
}
const publicAssetBases = {};
function isPublicAssetURL(id = "") {
  if (assets[id]) {
    return true;
  }
  for (const base in publicAssetBases) {
    if (id.startsWith(base)) {
      return true;
    }
  }
  return false;
}
function getAsset(id) {
  return assets[id];
}
const METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
const EncodingMap = {
  gzip: ".gz",
  br: ".br"
};
const _vG0iCy = defineHandler((event) => {
  if (event.req.method && !METHODS.has(event.req.method)) {
    return;
  }
  let id = decodePath(withLeadingSlash(withoutTrailingSlash(event.url.pathname)));
  let asset;
  const encodingHeader = event.req.headers.get("accept-encoding") || "";
  const encodings = [...encodingHeader.split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(), ""];
  if (encodings.length > 1) {
    event.res.headers.append("Vary", "Accept-Encoding");
  }
  for (const encoding of encodings) {
    for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
      const _asset = getAsset(_id);
      if (_asset) {
        asset = _asset;
        id = _id;
        break;
      }
    }
  }
  if (!asset) {
    if (isPublicAssetURL(id)) {
      event.res.headers.delete("Cache-Control");
      throw new HTTPError({ status: 404 });
    }
    return;
  }
  const ifNotMatch = event.req.headers.get("if-none-match") === asset.etag;
  if (ifNotMatch) {
    event.res.status = 304;
    event.res.statusText = "Not Modified";
    return "";
  }
  const ifModifiedSinceH = event.req.headers.get("if-modified-since");
  const mtimeDate = new Date(asset.mtime);
  if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
    event.res.status = 304;
    event.res.statusText = "Not Modified";
    return "";
  }
  if (asset.type) {
    event.res.headers.set("Content-Type", asset.type);
  }
  if (asset.etag && !event.res.headers.has("ETag")) {
    event.res.headers.set("ETag", asset.etag);
  }
  if (asset.mtime && !event.res.headers.has("Last-Modified")) {
    event.res.headers.set("Last-Modified", mtimeDate.toUTCString());
  }
  if (asset.encoding && !event.res.headers.has("Content-Encoding")) {
    event.res.headers.set("Content-Encoding", asset.encoding);
  }
  if (asset.size > 0 && !event.res.headers.has("Content-Length")) {
    event.res.headers.set("Content-Length", asset.size.toString());
  }
  return readAsset(id);
});
const findRouteRules = /* @__PURE__ */ (() => {
  const $0 = [{ name: "headers", route: "/assets/**", handler: headers, options: { "cache-control": "public, max-age=31536000, immutable" } }];
  return (m, p) => {
    let r = [];
    if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
    let s = p.split("/");
    s.length - 1;
    if (s[1] === "assets") {
      r.unshift({ data: $0, params: { "_": s.slice(2).join("/") } });
    }
    return r;
  };
})();
const _lazy_pJf0G1 = defineLazyEventHandler(() => Promise.resolve().then(function() {
  return ssrRenderer$1;
}));
const findRoute = /* @__PURE__ */ (() => {
  const data = { route: "/**", handler: _lazy_pJf0G1 };
  return ((_m, p) => {
    return { data, params: { "_": p.slice(1) } };
  });
})();
const globalMiddleware = [
  toEventHandler(_vG0iCy)
].filter(Boolean);
const APP_ID = "default";
function useNitroApp() {
  let instance = useNitroApp._instance;
  if (instance) {
    return instance;
  }
  instance = useNitroApp._instance = createNitroApp();
  globalThis.__nitro__ = globalThis.__nitro__ || {};
  globalThis.__nitro__[APP_ID] = instance;
  return instance;
}
function createNitroApp() {
  const hooks = void 0;
  const captureError = (error, errorCtx) => {
    if (errorCtx?.event) {
      const errors = errorCtx.event.req.context?.nitro?.errors;
      if (errors) {
        errors.push({
          error,
          context: errorCtx
        });
      }
    }
  };
  const h3App = createH3App({ onError(error, event) {
    return errorHandler(error, event);
  } });
  let appHandler = (req) => {
    req.context ||= {};
    req.context.nitro = req.context.nitro || { errors: [] };
    return h3App.fetch(req);
  };
  const app = {
    fetch: appHandler,
    h3: h3App,
    hooks,
    captureError
  };
  return app;
}
function createH3App(config) {
  const h3App = new H3Core(config);
  h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
  h3App["~middleware"].push(...globalMiddleware);
  {
    h3App["~getMiddleware"] = (event, route) => {
      const pathname = event.url.pathname;
      const method = event.req.method;
      const middleware = [];
      {
        const routeRules = getRouteRules(method, pathname);
        event.context.routeRules = routeRules?.routeRules;
        if (routeRules?.routeRuleMiddleware.length) {
          middleware.push(...routeRules.routeRuleMiddleware);
        }
      }
      middleware.push(...h3App["~middleware"]);
      if (route?.data?.middleware?.length) {
        middleware.push(...route.data.middleware);
      }
      return middleware;
    };
  }
  return h3App;
}
function getRouteRules(method, pathname) {
  const m = findRouteRules(method, pathname);
  if (!m?.length) {
    return { routeRuleMiddleware: [] };
  }
  const routeRules = {};
  for (const layer of m) {
    for (const rule of layer.data) {
      const currentRule = routeRules[rule.name];
      if (currentRule) {
        if (rule.options === false) {
          delete routeRules[rule.name];
          continue;
        }
        if (typeof currentRule.options === "object" && typeof rule.options === "object") {
          currentRule.options = {
            ...currentRule.options,
            ...rule.options
          };
        } else {
          currentRule.options = rule.options;
        }
        currentRule.route = rule.route;
        currentRule.params = {
          ...currentRule.params,
          ...layer.params
        };
      } else if (rule.options !== false) {
        routeRules[rule.name] = {
          ...rule,
          params: layer.params
        };
      }
    }
  }
  const middleware = [];
  for (const rule of Object.values(routeRules)) {
    if (rule.options === false || !rule.handler) {
      continue;
    }
    middleware.push(rule.handler(rule));
  }
  return {
    routeRules,
    routeRuleMiddleware: middleware
  };
}
function _captureError(error, type) {
  console.error(`[${type}]`, error);
  useNitroApp().captureError?.(error, { tags: [type] });
}
function trapUnhandledErrors() {
  process.on("unhandledRejection", (error) => _captureError(error, "unhandledRejection"));
  process.on("uncaughtException", (error) => _captureError(error, "uncaughtException"));
}
const port = Number.parseInt(process.env.NITRO_PORT || process.env.PORT || "") || 3e3;
const host = process.env.NITRO_HOST || process.env.HOST;
const cert = process.env.NITRO_SSL_CERT;
const key = process.env.NITRO_SSL_KEY;
const nitroApp = useNitroApp();
serve({
  port,
  hostname: host,
  tls: cert && key ? {
    cert,
    key
  } : void 0,
  fetch: nitroApp.fetch
});
trapUnhandledErrors();
const nodeServer = {};
function fetchViteEnv(viteEnvName, input, init) {
  const envs = globalThis.__nitro_vite_envs__ || {};
  const viteEnv = envs[viteEnvName];
  if (!viteEnv) {
    throw HTTPError.status(404);
  }
  return Promise.resolve(viteEnv.fetch(toRequest(input, init)));
}
function ssrRenderer({ req }) {
  return fetchViteEnv("ssr", req);
}
const ssrRenderer$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  default: ssrRenderer
});
export {
  nodeServer as default
};
