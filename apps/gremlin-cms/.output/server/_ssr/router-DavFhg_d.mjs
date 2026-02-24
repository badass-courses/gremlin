import { c as createRouter, a as createRootRoute, b as createFileRoute, l as lazyRouteComponent, H as HeadContent, S as Scripts } from "../_chunks/_libs/@tanstack/react-router.mjs";
import { j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import "../_chunks/_libs/@tanstack/router-core.mjs";
import "../_chunks/_libs/@tanstack/history.mjs";
import "../_libs/tiny-invariant.mjs";
import "node:stream/web";
import "node:stream";
import "../_chunks/_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/tiny-warning.mjs";
const gremlinSeo = {
  name: "gremlin-cms",
  url: "https://gremlincms.com",
  description: "The course platform powered by TanStack Start."
};
function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: gremlinSeo.name,
    url: gremlinSeo.url,
    description: gremlinSeo.description,
    inLanguage: "en",
    potentialAction: {
      "@type": "SearchAction",
      target: `${gremlinSeo.url}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    },
    publisher: {
      "@type": "Organization",
      name: gremlinSeo.name,
      url: gremlinSeo.url
    }
  };
}
const appCss = "/assets/styles-yUPp7V4s.css";
const jsonLd = buildWebsiteJsonLd();
const Route$2 = createRootRoute({
  head: () => ({
    title: "gremlin-cms",
    meta: [
      {
        charSet: "utf-8"
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      },
      {
        name: "description",
        content: gremlinSeo.description
      },
      {
        property: "og:type",
        content: "website"
      },
      {
        property: "og:title",
        content: gremlinSeo.name
      },
      {
        property: "og:description",
        content: gremlinSeo.description
      },
      {
        property: "og:url",
        content: gremlinSeo.url
      },
      {
        property: "og:image",
        content: `${gremlinSeo.url}/og-image?title=${encodeURIComponent(gremlinSeo.name)}&subtitle=${encodeURIComponent(gremlinSeo.description)}`
      },
      {
        name: "twitter:card",
        content: "summary_large_image"
      },
      {
        name: "twitter:title",
        content: gremlinSeo.name
      },
      {
        name: "twitter:description",
        content: gremlinSeo.description
      },
      {
        name: "twitter:image",
        content: `${gremlinSeo.url}/og-image?title=${encodeURIComponent(gremlinSeo.name)}&subtitle=${encodeURIComponent(gremlinSeo.description)}`
      },
      {
        name: "robots",
        content: "index, follow"
      }
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss
      },
      {
        rel: "canonical",
        href: gremlinSeo.url
      },
      {
        rel: "icon",
        type: "image/x-icon",
        href: "/favicon.ico"
      },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon/apple-touch-icon-180x180.png"
      }
    ]
  }),
  shellComponent: RootDocument
});
function RootDocument({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("head", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "script",
        {
          suppressHydrationWarning: true,
          type: "application/ld+json",
          dangerouslySetInnerHTML: { __html: JSON.stringify(jsonLd) }
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
const jsonResponse = (value, init) => new Response(value, {
  headers: {
    "content-type": "image/svg+xml",
    ...init?.headers || {}
  },
  ...init
});
const Route$1 = createFileRoute("/og-image")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url);
        const title = url.searchParams.get("title") || "gremlin-cms";
        const subtitle = url.searchParams.get("subtitle") || "The course platform powered by TanStack Start.";
        const svg = `
          <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stop-color="#020617" />
                <stop offset="100%" stop-color="#0891b2" />
              </linearGradient>
            </defs>
            <rect width="1200" height="630" fill="url(#bg)" />
            <text x="64" y="250" fill="#ffffff" font-size="72" font-family="Arial, sans-serif" font-weight="700">${escapeXml(title)}</text>
            <text x="64" y="335" fill="#dbeafe" font-size="34" font-family="Arial, sans-serif" width="1072">${escapeXml(subtitle)}</text>
            <text x="64" y="520" fill="#93c5fd" font-size="28" font-family="Arial, sans-serif">gremlin + TanStack Start</text>
          </svg>
        `;
        return jsonResponse(svg, {
          status: 200,
          headers: {
            "cache-control": "public, max-age=300"
          }
        });
      }
    }
  }
});
function escapeXml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
const $$splitComponentImporter = () => import("./index-DHrDGvqi.mjs");
const Route = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter, "component"),
  head: () => ({
    links: [{
      rel: "alternate",
      href: "https://gremlincms.com/og-image?title=gremlin-cms&subtitle=The+course+platform+powered+by+TanStack+Start"
    }]
  })
});
const OgImageRoute = Route$1.update({
  id: "/og-image",
  path: "/og-image",
  getParentRoute: () => Route$2
});
const IndexRoute = Route.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$2
});
const rootRouteChildren = {
  IndexRoute,
  OgImageRoute
};
const routeTree = Route$2._addFileChildren(rootRouteChildren)._addFileTypes();
function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0
  });
  return router;
}
export {
  getRouter
};
