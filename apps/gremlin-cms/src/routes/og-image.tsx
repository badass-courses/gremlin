import { createFileRoute } from '@tanstack/react-router'

const jsonResponse = (value: string, init?: ResponseInit) =>
  new Response(value, {
    headers: {
      'content-type': 'image/svg+xml',
      ...(init?.headers || {}),
    },
    ...init,
  })

export const Route = createFileRoute('/og-image')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url)
        const title = url.searchParams.get('title') || 'gremlin-cms'
        const subtitle =
          url.searchParams.get('subtitle') || 'The course platform powered by TanStack Start.'

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
        `

        return jsonResponse(svg, {
          status: 200,
          headers: {
            'cache-control': 'public, max-age=300',
          },
        })
      },
    },
  },
})

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
