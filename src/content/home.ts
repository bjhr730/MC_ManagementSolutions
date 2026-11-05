/**
 * Home page copy.
 *
 * Not lifted from a PDF: the checklist asks for a home page but none was
 * drafted. Everything is assembled from claims the client has already made in
 * his own materials, so nothing new is asserted about the business.
 *
 * Rebuilt in November 2026 to Antonio's note: "more interactive and less
 * cluttered". The generic three-benefit block became the path chooser, the
 * stat strip and the standalone philosophy and service-area bands came out,
 * and the vacancy calculator gives people something to do rather than read.
 */

/**
 * The headline is split rather than written as one string so the place can
 * carry the accent colour without putting markup inside the copy.
 *
 * Revised November 2026 to Antonio's note: make the home page catchier on
 * arrival and emphasise property management in Northern Virginia. Both the
 * category and the region were previously only in the small eyebrow above
 * the headline; they now open the h1, which is the first thing read aloud by
 * a screen reader and the line search engines weigh most heavily. The
 * counties moved up into the eyebrow so the service area is visible without
 * scrolling.
 */
export const HERO = {
  /** Rendered as the lead of the h1, in the accent colour. */
  headlineLead: 'Northern Virginia property management',
  /** The rest of the same sentence. */
  headlineRest: 'with an owner’s attention.',
  subhead:
    'MC Management Solutions is run by a licensed broker who manages ' +
    'rental property of his own. Reliable, transparent management whether ' +
    'you have one rental home or a growing portfolio.',
  primaryCta: { label: 'Request a consultation', href: '/contact' },
  secondaryCta: { label: 'See what we handle', href: '/services' },
} as const;

/**
 * The three situations owners arrive in. Each one answers the question that
 * situation actually raises, then points at the single most useful next step
 * rather than at everything.
 */
export const PATHS: readonly {
  id: string;
  tab: string;
  heading: string;
  body: string;
  cta: string;
  href: string;
}[] = [
  {
    id: 'first-rental',
    tab: 'I’m renting it out for the first time',
    heading: 'Start with what it should rent for',
    body:
      'Before anything else you need a realistic rent and a realistic time ' +
      'to lease. We look at what comparable homes nearby are actually ' +
      'renting for, what the property needs first, and what the whole thing ' +
      'will cost you to get occupied.',
    cta: 'Request a rental evaluation',
    href: '/contact',
  },
  {
    id: 'already-rented',
    tab: 'It’s rented and I want better management',
    heading: 'Switching is less disruptive than owners expect',
    body:
      'Your tenant stays, the lease stays, and we take over the day-to-day ' +
      'from wherever it currently sits. There are no termination fees on ' +
      'our side if it later turns out not to be a fit, which is the same ' +
      'standard we would want as owners ourselves.',
    cta: 'See how management works',
    href: '/management-plans',
  },
  {
    id: 'investor',
    tab: 'I want to maximize my rental income',
    heading: 'Run the numbers on what vacancy is costing you',
    body:
      'The costs that catch owners out are the ones between tenants. ' +
      'Work out what a vacancy actually costs on your property, then talk ' +
      'to a specialist on how to maximize profit and minimize risk.',
    cta: 'Open the vacancy calculator',
    href: '/tools',
  },
];

export const HOME_FOUNDER_TEASER =
  'Antonio Melendez Cabrera is a Northern Virginia real estate broker who has ' +
  'personally managed rental homes and led an entire property management ' +
  'operation. He is also a rental property owner himself, which is the ' +
  'part most owners care about.';

export const TOOLS_TEASER = {
  eyebrow: 'Owner tools',
  heading: 'What is a vacancy actually costing you?',
  body:
    'An empty property costs rent and carrying costs every single day. Our ' +
    'calculator works out the real figure, and tells you how long you can ' +
    'afford to hold out for a higher rent before the wait cancels out the ' +
    'gain.',
  cta: 'Open the vacancy calculator',
  href: '/tools',
};
