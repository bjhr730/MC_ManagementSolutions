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
/*
 * The hero, to Antonio's November 2026 mock-up.
 *
 * The headline is his: a claim about how the work is done, not a
 * description of the trade. The h1 no longer contains "Northern Virginia
 * property management" - the eyebrow directly above it carries the region,
 * and the page title and meta description still carry the full phrase, so
 * the local search signal is not lost with the literal wording.
 *
 * The county list that used to sit here has gone with it. It answered a
 * real question - am I covered? - which is now answered properly on the
 * contact page, where the service-area map and the full list of places
 * live.
 */
export const HERO = {
  eyebrow: 'MC Management Solutions · Northern Virginia',
  headline: 'We Manage It Like It’s Ours.',
  subhead:
    'Your property deserves the same attention we’d give our own. ' +
    'Experience personalized management from a local real estate broker ' +
    'and investor who understands what it means to be an owner.',
  primaryCta: {
    label: 'Let’s Talk About Your Property',
    href: '/contact#inquiry',
  },
  secondaryCta: { label: 'Explore Our Services', href: '/services' },
  /*
    The strip under the buttons. It is the one place the hero says what
    Antonio is rather than what he does, and it is deliberately two short
    lines: anything longer competes with the call to action beside it.
  */
  trust: {
    icon: 'home' as const,
    title: 'Broker-Owned. Investor-Minded.',
    body: 'Local experience. Personal attention.',
  },
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

/*
  Antonio's wording, November 2026. It still carries no door count or
  transaction count: "extensive hands-on experience" and "overseeing
  property management operations" say the same thing qualitatively, which
  is what the master checklist requires until those figures are verified.
*/
export const HOME_FOUNDER_TEASER =
  'Antonio Melendez Cabrera is a Northern Virginia real estate broker with ' +
  'extensive hands-on experience managing rental properties and overseeing ' +
  'property management operations. As a rental property owner and investor ' +
  'himself, he understands firsthand the responsibilities, challenges, and ' +
  'decisions that come with protecting a real estate investment.';

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
export const OWNER_GAINS_HEADING =
  'Experienced enough to manage a large portfolio. ' +
  'Personal enough to care about one home.';

export const OWNER_GAINS: readonly { title: string; body: string }[] = [
  {
    title: 'You talk to a real person, locally',
    body:
      'Call and you reach someone here in Northern Virginia, not a call ' +
      'center and not a queue. You are not passed between people to get ' +
      'an answer: the person who picks up runs the company and can give ' +
      'you one.',
  },
  {
    title: 'You see the numbers before you decide',
    body:
      'Rent, renewals, turnover and repairs come to you with what each ' +
      'one costs and what it earns back, so you are choosing rather than ' +
      'being told after the fact.',
  },
  {
    title: 'You get someone who knows this market',
    body:
      'Antonio is a licensed broker working here every day. He knows ' +
      'what homes like yours rent for, how long they sit and what a ' +
      'renewal is worth, so your asking rent is set against what is ' +
      'happening nearby rather than a guess.',
  },
];
