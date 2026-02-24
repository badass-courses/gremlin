export const gremlinSeo = {
  name: 'gremlin-cms',
  url: 'https://gremlincms.com',
  description: 'The course platform powered by TanStack Start.',
}

export function buildWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: gremlinSeo.name,
    url: gremlinSeo.url,
    description: gremlinSeo.description,
    inLanguage: 'en',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${gremlinSeo.url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: gremlinSeo.name,
      url: gremlinSeo.url,
    },
  }
}
