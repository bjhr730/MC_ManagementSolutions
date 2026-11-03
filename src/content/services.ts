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
 * `brokerage: true` marks services the FAQ says run through the affiliated
 * licensed brokerage; those render with the brokerage disclosure attached.
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
  readonly points: readonly string[];
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
    summary:
      'A strategic, market-driven approach to renewals that balances rental income, occupancy and your goals.',
    points: [
      'Renewal recommendations grounded in current market data',
      'Rental income weighed against the cost of a vacancy',
      'Your individual investment goals factored into the decision',
    ],
    icon: 'refresh',
    brokerage: true,
  },
  {
    slug: 'leasing-coordination',
    title: 'Leasing & Tenant Placement',
    summary:
      'Marketing, showings, screening and lease preparation, delivered through our affiliated licensed brokerage.',
    points: [
      'Rental pricing recommendations and property marketing',
      'Showings and applicant screening against consistent, compliant criteria',
      'Income and employment verification, credit, rental history and references',
      'Lease preparation and move-in coordination',
    ],
    icon: 'key',
    brokerage: true,
  },
];
