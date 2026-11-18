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
  /** The first half of the h1. Split only so it can break cleanly. */
  headlineLead: 'Northern Virginia property management',
  /** The rest of the same sentence. */
  headlineRest: 'with an owner’s attention.',
  /*
    The positioning line, in Antonio's words. It is the first thing said
    after the headline because it is the whole proposition: the scale of a
    large operation, the attention of a single owner.

    It carries no figure on purpose. The master checklist bars the door
    count and the transaction count from the site until they are verified,
    and 'a large portfolio' says the same thing without making a claim.
  */
  positioning:
    'Experienced enough to manage a large portfolio. Personal enough to ' +
    'care about one home.',
  subhead:
    'You deal with the licensed broker who owns the company and rents out ' +
    'property of his own — not a queue, and not whoever is free.',
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
  /** The one primary action. The same on every path, by design. */
  cta: string;
  href: string;
  /** Optional quiet link to the resource that fits this situation. */
  secondary?: { label: string; href: string };
}[] = [
  {
    id: 'first-rental',
    tab: 'I’m renting out my property for the first time',
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
    tab: 'Property is rented and I want better management',
    heading: 'Switching is less disruptive than owners expect',
    body:
      'Your tenant stays, the lease stays, and we take over the day-to-day ' +
      'from wherever it currently sits. There are no termination fees on ' +
      'our side if it later turns out not to be a fit, which is the same ' +
      'standard we would want as owners ourselves.',
    cta: 'Request a consultation',
    href: '/contact',
    secondary: { label: 'See how management works', href: '/management-plans' },
  },
  {
    id: 'investor',
    tab: 'I want to maximize my rental income',
    heading: 'Run the numbers on what vacancy is costing you',
    body:
      'The costs that catch owners out are the ones between tenants. ' +
      'Work out what a vacancy actually costs on your property, then talk ' +
      'to a specialist on how to maximize profit and minimize risk.',
    cta: 'Request a consultation',
    href: '/contact',
    secondary: { label: 'Open the vacancy calculator', href: '/tools' },
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

/**
 * What the owner gets, as distinct from what property management is.
 *
 * The site had a full list of services and nothing about the gain, which
 * is the wrong way round on a page whose job is to earn a consultation.
 * Nothing here states a figure or a promise about fees: those belong in
 * the proposal, and the ones already on the site carry their own hedges.
 */
export const OWNER_GAINS_HEADING = 'What that means for your property';

export const OWNER_GAINS: readonly { title: string; body: string }[] = [
  {
    title: 'You talk to the decision maker',
    body:
      'The person who answers you is the licensed broker who runs the ' +
      'company. Nothing waits on being escalated to someone who can ' +
      'actually say yes.',
  },
  {
    title: 'You see the numbers before you decide',
    body:
      'Rent, renewals, turnover and repairs come to you with what each ' +
      'one costs and what it earns back, so you are choosing rather than ' +
      'being told after the fact.',
  },
  {
    title: 'Your home is run by someone who owns one',
    body:
      'Antonio rents out property of his own in the same market. The ' +
      'standard applied to yours is the one he applies to his, which is ' +
      'the part most owners care about.',
  },
];
