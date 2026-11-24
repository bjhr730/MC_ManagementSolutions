/**
 * Management plans page, rewritten to Antonio's November 2026 notes.
 *
 * He removed the three-way "How involved do you want to be?" breakdown and
 * replaced it with a single statement that the plan is tailored, then gave
 * exact wording for the services list and the fees section. The copy below is
 * his.
 *
 * The no-public-rate-card rule still holds and is not his to waive casually —
 * both checklists say so:
 *   "Customized Management Plans section (no public rate chart)"
 *   "Do not publish a fixed fee chart. Explain that management services and
 *    pricing are customized, disclose all applicable fees in each proposal,
 *    and invite owners to request a personalized management proposal."
 * Fee categories are named here; no numbers appear.
 */

/*
 * Antonio's wording, November 2026.
 *
 * This is where the checklist's "pricing is customized" point is made:
 * "a management approach and pricing structure that makes sense for you".
 * The other two parts of that rule are made once each elsewhere - the fee
 * disclosure in FEES, the invitation to request a proposal in the closing
 * call to action - so the page states each point once.
 *
 * The heading no longer says "not a rate card". It does not need to: the
 * rule is that no fixed fee chart may be published, and none is anywhere
 * on the site. Saying pricing is customized is what the rule asks for.
 */
export const PLANS_INTRO =
  'Every property is unique, and so are the needs of its owner. We take ' +
  'the time to understand your property, expectations, and long-term ' +
  'goals to find a management approach and pricing structure that makes ' +
  'sense for you.';

/** Sends the owner straight to the inquiry form, not just to the page. */
export const PLANS_HEADER_CTA = {
  label: 'Let’s Talk About Your Property.',
  href: '/contact#inquiry',
} as const;

export const COVERAGE = {
  heading: 'What Our Management Services Cover',
  intro:
    'Whether you prefer to stay closely involved or take a more hands-off ' +
    'approach, these are the parts we handle.',
  items: [
    'Rent collection and owner payments by ACH or check',
    'Monthly financial statements and annual tax reporting',
    'Maintenance requests and coordination with trusted vendors',
    'Coordination of urgent maintenance and property emergencies',
    'Tenant communication and lease compliance',
    'Move-in, move-out, and property condition documentation',
    'Condominium association and HOA coordination',
    'Rental pricing guidance and lease renewal recommendations',
  ],
} as const;

export const FEES = {
  heading: 'Straightforward Fees. No Surprises.',
  intro:
    'No rate card does not mean no clarity. Every fee that applies to your ' +
    'property is named in writing, in your proposal, before you commit to ' +
    'anything.',
  lead: 'Which of these apply depends on the services you choose:',
  items: [
    { label: 'Monthly Property Management' },
    { label: 'Leasing & Tenant Placement' },
    { label: 'Lease Renewals' },
    {
      label: 'Additional Services',
      note: 'only when mutually agreed upon in writing',
    },
  ],
} as const;

export const NO_TERMINATION_FEE = {
  headline: '$0 management termination fees',
  body:
    'We don’t believe in holding clients hostage. If you decide it’s time ' +
    'to move on, no hard feelings — just a handshake and a thank-you for ' +
    'the opportunity.',
};
