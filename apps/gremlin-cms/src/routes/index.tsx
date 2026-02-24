import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-black text-white mb-4">
          gremlin<span className="text-cyan-400">cms</span>
        </h1>
        <p className="text-lg text-gray-400">
          The course platform — powered by TanStack Start
        </p>
      </div>
    </div>
  )
}
