/**
 * The seven services named in MA_Website_Development_Checklist.pdf:
 * "Property oversight, rent collection, maintenance, tenant relations,
 * inspections, renewals, leasing coordination".
 *
 * Every description is built from language the client already drafted in the
 * FAQ and checklists. Nothing claims a capability he has not stated — the
 * checklist item "Confirm actual services: align descriptions with
 * operational capacity and licensed activities" is still open.
 *
 * `brokerage: true` marks the services a licensed brokerage provides, and
 * those render with BROKERAGE_DISCLOSURE attached.
 *
 * The customer-facing copy stopped naming the affiliated brokerage mid
 * sentence in November 2026, at Antonio's request - it read as a hedge in
 * the middle of an answer. The disclosure itself did not move: it is still
 * on every one of these services, in the footer of every page and in the
 * terms. This flag is that mechanism, so do not drop it when editing copy.
 */

export type IconName =
  | 'building'
  | 'banknote'
  | 'wrench'
  | 'users'
  | 'clipboard'
  | 'refresh'
  | 'key';

export interface Service {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  /**
   * What the service includes, as a checklist.
   *
   * A service carries either this or `body`, never both. Antonio rewrote
   * two of them as prose in November 2026 and prose does not survive being
   * chopped into ticks - "we evaluate market conditions, performance and
   * your objectives" is one thought, not three bullets.
   */
  readonly points?: readonly string[];
  /** The same slot as `points`, written as paragraphs instead. */
  readonly body?: readonly string[];
  readonly icon: IconName;
  readonly brokerage?: boolean;
}

export const SERVICES: readonly Service[] = [
  {
    slug: 'property-oversight',
    title: 'Property Oversight',
    summary:
      'Day-to-day responsibility for your property, with decisions measured against its long-term value.',
    points: [
      'A single point of accountability for the property',
      'Proactive planning rather than reactive repairs',
      'Owner communication',
      'Coordination with condominium associations, HOAs and building managers',
    ],
    icon: 'building',
  },
  {
    slug: 'rent-collection',
    title: 'Rent Collection & Owner Disbursements',
    summary:
      'Rent collected and your income disbursed by ACH direct deposit or paper check, whichever you prefer.',
    points: [
      'Monthly owner statements covering income, expenses and account activity',
      'Year-end accounting summaries and applicable tax documentation',
      'Coordination of recurring property bills where you authorize it',
      'Disbursement by ACH or check, according to your preference',
    ],
    icon: 'banknote',
  },
  {
    slug: 'maintenance',
    title: 'Maintenance & Emergency Coordination',
    summary:
      'Requests triaged by urgency, with emergencies affecting occupants or the property taking priority.',
    points: [
      'An established network of vetted service providers',
      'Your own preferred contractors coordinated wherever practical',
      'Authorization limits set by you in the management agreement',
      'Owners kept informed of significant repairs and expenses',
    ],
    icon: 'wrench',
  },
  {
    slug: 'tenant-relations',
    title: 'Tenant Relations',
    summary:
      'Professional, responsive communication with residents, the quiet work that keeps good tenants in place.',
    points: [
      'Clear expectations set from move-in onward',
      'Consistent handling of resident requests and notices',
      'Lease compliance monitored and addressed',
      'All decisions made in accordance with fair housing requirements',
    ],
    icon: 'users',
  },
  {
    slug: 'inspections',
    title: 'Inspections',
    summary:
      'Documented condition checks so problems surface while they are still small and inexpensive.',
    points: [
      'Move-in and move-out condition documentation',
      'Turnover coordination between residents',
      'Findings reported to you with recommended next steps',
    ],
    icon: 'clipboard',
  },
  {
    slug: 'renewals',
    title: 'Lease Renewals & Rental Pricing',
    // Antonio's wording, November 2026.
    summary:
      'A thoughtful, market-driven approach to lease renewals that balances ' +
      'rental income, tenant retention, and your long-term investment goals.',
    body: [
      'We evaluate current market conditions, property performance, and your ' +
        'individual objectives to help you make informed renewal and pricing ' +
        'decisions.',
    ],
    icon: 'refresh',
    brokerage: true,
  },
  {
    slug: 'leasing-coordination',
    title: 'Leasing & Tenant Placement',
    // Antonio's wording, November 2026.
    summary:
      'We help property owners navigate the leasing process, from preparing ' +
      'their property for the market to securing qualified tenants.',
    body: [
      'Our leasing assistance includes rental pricing recommendations, ' +
        'property marketing, showings, applicant screening, lease ' +
        'preparation, and move-in coordination.',
      /*
       * His own plain-words version of the brokerage note. It stays visible
       * in the section; the formal BROKERAGE_DISCLOSURE still renders under
       * it, because that one is the compliance text and this one is not.
       */
      'Licensed leasing services are arranged through a separate ' +
        'Virginia-licensed real estate brokerage.',
    ],
    icon: 'key',
    brokerage: true,
  },
];
