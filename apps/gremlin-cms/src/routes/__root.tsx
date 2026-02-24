import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { buildWebsiteJsonLd, gremlinSeo } from '../lib/seo'

import appCss from '../styles.css?url'

const jsonLd = buildWebsiteJsonLd()

export const Route = createRootRoute({
  head: () => ({
    title: 'gremlin-cms',
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        name: 'description',
        content: gremlinSeo.description,
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:title',
        content: gremlinSeo.name,
      },
      {
        property: 'og:description',
        content: gremlinSeo.description,
      },
      {
        property: 'og:url',
        content: gremlinSeo.url,
      },
      {
        property: 'og:image',
        content: `${gremlinSeo.url}/og-image?title=${encodeURIComponent(gremlinSeo.name)}&subtitle=${encodeURIComponent(gremlinSeo.description)}`,
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: gremlinSeo.name,
      },
      {
        name: 'twitter:description',
        content: gremlinSeo.description,
      },
      {
        name: 'twitter:image',
        content: `${gremlinSeo.url}/og-image?title=${encodeURIComponent(gremlinSeo.name)}&subtitle=${encodeURIComponent(gremlinSeo.description)}`,
      },
      {
        name: 'robots',
        content: 'index, follow',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'canonical',
        href: gremlinSeo.url,
      },
      {
        rel: 'icon',
        type: 'image/x-icon',
        href: '/favicon.ico',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon/apple-touch-icon-180x180.png',
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          suppressHydrationWarning
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
