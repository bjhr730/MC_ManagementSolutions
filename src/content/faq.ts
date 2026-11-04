/**
 * The owner FAQ, grouped into the five sections Antonio set out in November
 * 2026, with his revised wording and his ordering within each section.
 *
 * Two deliberate departures from the text he sent, both flagged to him:
 *
 * 1. His draft of the leasing answer reads "MC Management Solutions of
 *    Virginia, LLC". The company is M&A. Publishing the wrong legal entity
 *    name in a brokerage disclosure is exactly the kind of error the DPOR
 *    advertising rules exist to catch, so it is spelled correctly here.
 *
 * 2. His screening answer ends with "Internal note: Review and finalize this
 *    answer before publishing." That is a note to himself, not copy, so it
 *    lives as a comment on that entry rather than on the website.
 *
 * Also worth knowing: his rewrite of the fees answer drops the old hedge
 * ("not to suggest that property ownership never involves unexpected
 * expenses"). The master checklist asks for every advertised commitment to be
 * checked against the signed contract, and the replacement wording leans on
 * the management agreement instead, which covers the same ground.
 */

export interface FaqEntry {
  readonly q: string;
  readonly a: readonly string[];
  /** Pulled onto the home page. */
  readonly featured?: boolean;
}

export interface FaqSection {
  readonly title: string;
  readonly entries: readonly FaqEntry[];
}

export const FAQ_INTRO =
  'At M&A Management Solutions, we believe property owners deserve ' +
  'straightforward answers, clear communication, and transparency. Below are ' +
  'answers to common questions about our services.';

export const FAQ_SECTIONS: readonly FaqSection[] = [
  {
    title: 'Getting Started',
    entries: [
      {
        q: 'How involved do I need to be in managing my property?',
        a: [
          'As involved as you’d like! Every property owner has different preferences. Some enjoy being closely involved, while others prefer a more hands-off experience. We tailor our management approach to your needs, keeping you informed while handling the day-to-day responsibilities of your investment.',
        ],
        featured: true,
      },
      {
        q: 'How are your property management fees structured?',
        a: [
          'We believe in transparent, straightforward pricing. Management fees, leasing-related charges, renewal fees, and any additional agreed-upon services are clearly explained before you sign.',
          'Our goal is simple: to ensure you understand what you’re paying for and what to expect. Any additional costs are handled in accordance with your management agreement, with communication and approval when required.',
        ],
        featured: true,
      },
      {
        q: 'Do you charge termination fees?',
        a: [
          'No. We believe in earning your business, not locking you into a relationship you’re unhappy with. That’s why we charge $0 in property management termination fees.',
          'If you’re happy, we’d love to continue working together. If you decide it’s time to move on, no hard feelings. Just a handshake and a thank-you for the opportunity.',
          'Your property. Your choice.',
          'Reasonable notice and any outstanding obligations remain subject to the management agreement.',
        ],
        featured: true,
      },
    ],
  },
  {
    title: 'Property Management & Maintenance',
    entries: [
      {
        q: 'How do you handle maintenance requests and emergencies?',
        a: [
          'We evaluate maintenance requests based on urgency and coordinate appropriate service providers. Emergencies involving immediate risks to occupants or the property receive priority attention.',
          'We keep owners informed of repairs and expenses while following the authorization limits established in the management agreement.',
        ],
      },
      {
        q: 'Do you work with preferred vendors, or can I use my own contractors?',
        a: [
          'We maintain an established network of service providers for maintenance, repairs, and property improvements.',
          'We’re also happy to coordinate with your preferred contractors whenever practical. Our priority is quality workmanship, responsible costs, and protecting the best interests of your property.',
        ],
      },
      {
        q: 'Do you coordinate with condominium associations and homeowners associations?',
        a: [
          'Yes. We coordinate with condominium associations, HOAs, building managers, and their representatives on matters such as move-in and move-out requirements, building access, maintenance, association notices, and required documentation.',
        ],
      },
      {
        q: 'Can you pay my condominium fees, insurance, and other property-related bills?',
        a: [
          'We can tailor the management agreement to your needs, including coordination of condominium or HOA fees, insurance premiums, utilities, and other recurring property expenses.',
          'Payments are subject to available funds, agreed authorization, and sufficient lead time for processing.',
        ],
      },
    ],
  },
  {
    title: 'Leasing & Tenant Screening',
    entries: [
      {
        q: 'Do you provide leasing and tenant placement services?',
        a: [
          'Yes. Leasing and tenant placement services are available through our affiliated licensed Virginia real estate brokerage.',
          'Brokerage services are provided separately from the property management operations of M&A Management Solutions of Virginia, LLC.',
        ],
      },
      {
        // Antonio's note on this one: "Review and finalize this answer before
        // publishing." Still outstanding — the wording below is the original.
        q: 'How do you screen prospective tenants?',
        a: [
          'Tenant screening is coordinated through our affiliated brokerage and applicable screening providers using consistent, legally compliant criteria.',
          'Depending on the application and applicable law, screening may include income and employment verification, credit history, rental history, and landlord references.',
          'All decisions are made in accordance with fair housing and other applicable requirements.',
        ],
      },
    ],
  },
  {
    title: 'Financial Reporting & Owner Payments',
    entries: [
      {
        q: 'Will I receive monthly financial statements and year-end reports?',
        a: [
          'We provide monthly owner statements detailing rental income, expenses, and relevant account activity, along with year-end accounting summaries and applicable tax documentation to make reporting to your CPA or tax professional easier.',
        ],
      },
      {
        q: 'How will I receive my rental income?',
        a: [
          'Owner disbursements are available by ACH direct deposit or paper check, according to your preference.',
          'We intend to offer both methods without an additional disbursement fee.',
        ],
      },
    ],
  },
  {
    title: 'Working With Remote Owners',
    entries: [
      {
        q: 'Do you work with out-of-state and international property owners?',
        a: [
          'Absolutely! Whether you live locally, elsewhere in the United States, or overseas, we’re here to help you manage your Northern Virginia investment property with confidence.',
          'We understand the importance of having someone you can trust when you’re not physically nearby. Through regular communication, detailed financial reporting, and day-to-day property oversight, we help you stay informed and connected to your investment.',
          'We’re available to communicate by email, phone, or WhatsApp, making it easy to stay in touch wherever you call home.',
        ],
        featured: true,
      },
    ],
  },
];

/** Flat list, for the FAQPage structured data and the home page selection. */
export const FAQ: readonly FaqEntry[] = FAQ_SECTIONS.flatMap(
  (section) => section.entries
);

export const FEATURED_FAQ = FAQ.filter((entry) => entry.featured);
