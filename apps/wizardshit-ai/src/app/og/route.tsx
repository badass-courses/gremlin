import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') ?? 'wizardshit.ai'
  const subtitle = searchParams.get('subtitle') ?? 'The course platform for wizards.'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a, #0ea5e9)',
          color: 'white',
          padding: '72px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: '-0.02em' }}>{title}</div>
        <div style={{ marginTop: 24, fontSize: 34, maxWidth: '90%' }}>{subtitle}</div>
        <div style={{ marginTop: 40, opacity: 0.8, fontSize: 24 }}>gremlin + TanStack + Next.js</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
