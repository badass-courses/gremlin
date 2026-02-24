import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { buildOrgJsonLd, wizardshitSeo } from '@/lib/seo'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const jsonLd = buildOrgJsonLd(wizardshitSeo)

export const metadata: Metadata = {
  title: 'wizardshit.ai',
  description: wizardshitSeo.description,
  alternates: {
    canonical: wizardshitSeo.url,
  },
  metadataBase: new URL(wizardshitSeo.url),
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon/apple-touch-icon-180x180.png',
  },
  openGraph: {
    type: 'website',
    url: '/',
    title: wizardshitSeo.name,
    description: wizardshitSeo.description,
    images: [`${wizardshitSeo.url}/og?title=${encodeURIComponent(wizardshitSeo.name)}&subtitle=${encodeURIComponent(wizardshitSeo.description)}`],
  },
  twitter: {
    card: 'summary_large_image',
    title: wizardshitSeo.name,
    description: wizardshitSeo.description,
    images: [`${wizardshitSeo.url}/og?title=${encodeURIComponent(wizardshitSeo.name)}&subtitle=${encodeURIComponent(wizardshitSeo.description)}`],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en'>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <script
          type='application/ld+json'
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  )
}
