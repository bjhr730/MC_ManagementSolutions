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

export const PLANS_INTRO =
  'There is no one-size-fits-all management fee here, and no rate card to ' +
  'squeeze your property into. A single condominium with an HOA, a ' +
  'townhouse that needs a turnover, and a small portfolio of rentals are ' +
  'three different jobs. We look at your property and your goals, then put ' +
  'a written proposal in front of you with every applicable fee disclosed.';

export const COVERAGE = {
  heading: 'What Our Management Services Cover',
  intro:
    'Our services are tailored to your property and your preferences. ' +
    'Whether you prefer to stay closely involved or take a more hands-off ' +
    'approach, we work with you to establish a management plan that fits ' +
    'your needs.',
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
    'We believe property management fees should be clear and easy to ' +
    'understand. Our pricing is tailored to your property and the services ' +
    'you need, with all applicable fees discussed upfront and clearly ' +
    'outlined in writing before you commit.',
  lead: 'Depending on your needs, services may include:',
  items: [
    { label: 'Monthly Property Management' },
    {
      label: 'Leasing & Tenant Placement',
      note: 'through our affiliated brokerage',
    },
    { label: 'Lease Renewals' },
    {
      label: 'Additional Services',
      note: 'only when mutually agreed upon in writing',
    },
  ],
  closing:
    'No termination fees. No surprises. Just Straightforward Management.',
} as const;

export const NO_TERMINATION_FEE = {
  headline: '$0 management termination fees',
  body:
    'We don’t believe in holding clients hostage. If you decide it’s time ' +
    'to move on, no hard feelings — just a handshake and a thank-you for ' +
    'the opportunity.',
};
