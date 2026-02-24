import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
  head: () => ({
    links: [
      {
        rel: 'alternate',
        href: 'https://gremlincms.com/og-image?title=gremlin-cms&subtitle=The+course+platform+powered+by+TanStack+Start',
      },
    ],
  }),
})

function Home() {
  return (
    <div className='min-h-screen bg-slate-950 text-slate-100'>
      <div className='mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-8 py-24 text-center'>
        <p className='mb-4 text-sm uppercase tracking-[0.2em] text-cyan-300'>gremlin-cms</p>
        <h1 className='text-5xl font-black'>
          Course infrastructure for modern learning teams
        </h1>
        <p className='mt-6 max-w-2xl text-lg text-slate-300'>
          Built with TanStack Start, this reference platform is optimized for static-first delivery,
          structured metadata, and production-ready SEO signals.
        </p>
      </div>
    </div>
  )
}
