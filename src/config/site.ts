/**
 * Single source of truth for every real-world fact about the business.
 *
 * Everything marked REPLACE is a placeholder that must be filled in before
 * launch. Nothing here is invented: no phone number, address, licence number
 * or statistic is guessed at. Search the repo for "REPLACE" to find them all.
 */

/**
 * Search engines are kept out until this is explicitly turned on.
 *
 * The site carries placeholder contact details and unreviewed legal text
 * before launch, and a staging deployment is a real, crawlable origin. An
 * indexed pre-launch copy competes with the real site and puts draft
 * disclosures in front of the public, so the safe default is "no".
 *
 * Set SITE_INDEXABLE="true" in the production environment at launch.
 */
export const INDEXABLE: boolean = import.meta.env.SITE_INDEXABLE === 'true';

export const SITE_URL: string = (
  import.meta.env.SITE_URL ?? 'https://replace-me.example.com'
).replace(/\/$/, '');

/** Public-facing brand name, used in headings and nav. */
export const BRAND = 'M&A Management Solutions';

/** Full legal entity. Required in advertising alongside the brand name. */
export const LEGAL_ENTITY = 'M&A Management Solutions of Virginia, LLC';

export const TAGLINE = 'Your Property. Our Responsibility.';

/** Name, address, phone — also feeds the LocalBusiness structured data. */
export const CONTACT = {
  phone: '(703) 869-5034',
  phoneHref: 'tel:+17038695034',
  /** REPLACE with the real business inbox. */
  email: 'info@replace-me.example.com',
  address: {
    street: '801 N. Pitt St. 120',
    city: 'Alexandria',
    region: 'VA',
    postalCode: '22314',
    country: 'US',
  },
} as const;

/** The address as it is written out, one line per line. */
export const ADDRESS_LINES: readonly string[] = [
  CONTACT.address.street,
  `${CONTACT.address.city}, ${CONTACT.address.region} ${CONTACT.address.postalCode}`,
];

/** Hours of operation, as Antonio worded them. */
export const HOURS = {
  heading: 'Business Hours',
  lines: [
    'Monday – Friday: 9:00 AM – 5:00 PM',
    'Saturday – Sunday: By Appointment',
  ],
  flexibility: 'Flexible appointments available outside regular business hours.',
  appointments:
    'For your convenience, meetings are scheduled by appointment. Existing ' +
    'residents may submit maintenance requests through our online resident ' +
    'portal, with emergency maintenance assistance available 24/7.',
} as const;

export const SERVICE_AREA_HEADING =
  'Locally Experienced. Proudly Serving Northern Virginia.';

/**
 * Counties and the communities served within them. Confirm against where the
 * business is actually licensed and willing to operate before launch.
 */
export interface ServiceArea {
  readonly county: string;
  readonly places: readonly string[];
  /** Appended after the place list, e.g. "and surrounding communities". */
  readonly suffix?: string;
}

export const SERVICE_AREAS: readonly ServiceArea[] = [
  {
    county: 'Arlington County',
    places: ['Arlington', 'Rosslyn', 'Clarendon', 'Ballston', 'Crystal City'],
  },
  {
    county: 'City of Alexandria',
    places: [],
    suffix: 'Alexandria and surrounding communities',
  },
  {
    county: 'Fairfax County',
    places: [
      'Fairfax',
      'McLean',
      'Tysons',
      'Vienna',
      'Falls Church',
      'Reston',
      'Herndon',
      'Springfield',
      'Burke',
      'Centreville',
      'Chantilly',
    ],
  },
  {
    county: 'Loudoun County',
    places: ['Ashburn', 'Sterling', 'Leesburg'],
    suffix: 'and surrounding communities',
  },
  {
    county: 'Prince William County',
    places: ['Manassas', 'Gainesville', 'Haymarket', 'Woodbridge'],
    suffix: 'and surrounding communities',
  },
];

/** Flat county list, for structured data and short prose mentions. */
export const SERVICE_COUNTIES: readonly string[] = SERVICE_AREAS.map(
  (area) => area.county
);

/**
 * Buildium owner and tenant portals are not live yet. The master checklist is
 * explicit: "Add portal links and Buildium mention only when live." While this
 * is false the portal links in the utility bar point at /portals, which
 * explains that they are coming and how to reach us meanwhile. Flip it to true
 * and fill in the URLs below and the links go straight to the real portals.
 */
export const PORTALS_LIVE = false;

export const PORTALS = {
  owner: 'REPLACE — owner portal URL',
  tenant: 'REPLACE — resident portal URL',
} as const;

/** Resolved portal destinations: the real thing, or the holding page. */
export const PORTAL_LINKS = [
  {
    label: 'Owner Portal',
    href: PORTALS_LIVE ? PORTALS.owner : '/portals',
  },
  {
    label: 'Tenant Portal',
    href: PORTALS_LIVE ? PORTALS.tenant : '/portals',
  },
] as const;

/**
 * Antonio's separate real estate brokerage site, cross-linked from Meet the
 * Founder and the footer.
 *
 * `href` must point at the brokerage's own site and `brokerage` must name the
 * licensed firm. Virginia advertising rules require the firm to be identified,
 * and both principal brokers should approve this wording before it is public.
 * While `href` is null nothing renders.
 */
export const BROKERAGE_SITE: {
  href: string | null;
  brokerage: string;
} = {
  href: null, // REPLACE with the real estate website URL
  brokerage: 'REPLACE — licensed brokerage firm name',
};

/** Set to a real profile URL to show the link; leave null to hide it. */
export const SOCIAL: { label: string; href: string | null }[] = [
  { label: 'Instagram', href: null }, // REPLACE when the account is ready
];

export const NAV = [
  { href: '/services', label: 'Services' },
  { href: '/management-plans', label: 'Management Plans' },
  { href: '/why-us', label: 'Why Choose Us' },
  { href: '/about', label: 'About' },
  { href: '/tools', label: 'Tools' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact Us' },
] as const;

export const FOOTER_NAV = {
  company: [
    { href: '/about', label: 'About Us' },
    { href: '/founder', label: 'Meet the Founder' },
    { href: '/philosophy', label: 'Our Philosophy' },
    { href: '/why-us', label: 'Why Choose Us' },
  ],
  services: [
    { href: '/services', label: 'Our Services' },
    { href: '/management-plans', label: 'Management Plans' },
    { href: '/tools', label: 'Vacancy Calculator' },
    { href: '/faq', label: 'Frequently Asked Questions' },
    { href: '/portals', label: 'Owner & Resident Portals' },
  ],
  legal: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Website Terms' },
    { href: '/fair-housing', label: 'Fair Housing' },
    { href: '/accessibility', label: 'Accessibility' },
  ],
} as const;
