export type SiteSEO = {
  name: string
  url: string
  description: string
}

export function buildOrgJsonLd({ name, url, description }: SiteSEO) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    description,
    publisher: {
      '@type': 'Organization',
      name,
      url,
    },
    inLanguage: 'en',
  }
}

export const wizardshitSeo = {
  name: 'wizardshit.ai',
  url: 'https://wizardshit.ai',
  description: 'The course platform for wizards.',
}
