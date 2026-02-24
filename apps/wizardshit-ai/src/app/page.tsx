const SITE_NAME = 'wizardshit.ai'
const SITE_DESC = 'The course platform for wizards.'

export default function Home() {
  return (
    <main className='flex min-h-screen flex-col items-start justify-center gap-6 px-8'>
      <h1 className='text-5xl font-black tracking-tight'>
        {SITE_NAME}
      </h1>
      <p className='max-w-xl text-lg text-zinc-600'>{SITE_DESC}</p>
      <p className='max-w-xl text-zinc-500'>
        A production foundation for building fast, discoverable learning experiences.
      </p>
    </main>
  )
}

