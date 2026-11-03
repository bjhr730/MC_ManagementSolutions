import { FAQ } from '~/content/faq';
import { BROKERAGE } from '~/config/compliance';
import {
  BRAND,
  CONTACT,
  LEGAL_ENTITY,
  SERVICE_COUNTIES,
  SITE_URL,
} from '~/config/site';

/**
 * Structured data builders.
 *
 * Only facts the client has actually stated go in here. The address and phone
 * are placeholders in site.ts, so `localBusiness` omits a field rather than
 * publishing a fake one: bad structured data is worse for local search than
 * none, and Google cross-checks it against the Business Profile.
 */

const org = `${SITE_URL}/#organization`;
const person = `${SITE_URL}/#antonio-melendez`;

const isPlaceholder = (value: string) =>
  value.includes('REPLACE') || value.includes('000-0000');

export function localBusiness() {
  const address = CONTACT.address;
  const hasRealAddress = !isPlaceholder(address.street);

  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': org,
    name: LEGAL_ENTITY,
    alternateName: BRAND,
    url: `${SITE_URL}/`,
    description:
      'Residential property management for Northern Virginia owners: ' +
      'property oversight, rent collection, maintenance coordination, ' +
      'tenant relations, inspections and lease renewals.',
    ...(isPlaceholder(CONTACT.phone) ? {} : { telephone: CONTACT.phone }),
    ...(isPlaceholder(CONTACT.email) ? {} : { email: CONTACT.email }),
    ...(hasRealAddress
      ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: address.street,
            addressLocality: address.city,
            addressRegion: address.region,
            postalCode: address.postalCode,
            addressCountry: address.country,
          },
        }
      : {}),
    areaServed: SERVICE_COUNTIES.map((area) => ({
      '@type': 'AdministrativeArea',
      name: `${area}, Virginia`,
    })),
    founder: { '@id': person },
    knowsLanguage: ['en'],
  };
}

export function founderPerson() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': person,
    name: 'Antonio Melendez',
    jobTitle: 'Founder and Real Estate Broker',
    worksFor: { '@id': org },
    url: `${SITE_URL}/founder`,
    description:
      'Northern Virginia real estate broker, property manager and real ' +
      'estate investor.',
    ...(isPlaceholder(BROKERAGE.brokerLicenseNumber)
      ? {}
      : {
          hasCredential: {
            '@type': 'EducationalOccupationalCredential',
            credentialCategory: 'Virginia real estate broker license',
            identifier: BROKERAGE.brokerLicenseNumber,
          },
        }),
  };
}

export function faqPage() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((entry) => ({
      '@type': 'Question',
      name: entry.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: entry.a.join(' '),
      },
    })),
  };
}

export function breadcrumbs(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', path: '/' }, ...trail].map(
      (item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: `${SITE_URL}${item.path}`,
      })
    ),
  };
}
