/**
 * Verbatim from MA_Meet_the_Founder_Final.pdf.
 *
 * NOTE for review: the earlier draft (MA_Meet_the_Founder.pdf) says
 * "approximately 60-85 residential properties"; this final version says
 * "approximately 60". The final version is used here, and it also adds the
 * "More Than a Business Relationship" section and the full LLC name. A
 * published door count is a factual claim, so confirm the number before
 * launch.
 */

export interface FounderSection {
  readonly heading?: string;
  readonly paragraphs: readonly string[];
  /** Pull-quote rendered after the paragraphs. */
  readonly quote?: string;
}

export const FOUNDER_NAME = 'Antonio Melendez Cabrera';

export const FOUNDER_ROLE = 'Founder | Real Estate Broker | Property Investor';

export const FOUNDER_SECTIONS: readonly FounderSection[] = [
  {
    paragraphs: [
      'Antonio Melendez Cabrera is a Northern Virginia real estate broker, property manager, and real estate investor with extensive experience in residential sales, leasing, and property management.',
      'Over the course of his career, Antonio has helped buyers, sellers, landlords, and investors navigate the Northern Virginia real estate market.',
      'His property management experience began with personally overseeing a portfolio of approximately 60 residential properties, handling the day-to-day responsibilities of leasing, tenant relations, maintenance coordination, and owner communications. As his career progressed, Antonio assumed a leadership role overseeing an entire property management operation, leading a team responsible for a substantially larger portfolio.',
      'This progression provided him with a comprehensive understanding of property management, from the smallest day-to-day details to the operational demands of managing a substantial portfolio.',
      'As a real estate investor and rental property owner himself, Antonio also understands property management from an owner\u2019s perspective. He recognizes the importance of protecting an investment, controlling expenses, minimizing vacancies, and making informed decisions that support long-term property value.',
    ],
  },
  {
    heading: 'More Than a Business Relationship',
    paragraphs: [
      'For Antonio, real estate has always been about more than properties and contracts. While delivering strong results is essential, the trust earned and relationships maintained are what define lasting success.',
    ],
    quote:
      'I believe the relationships we build are more valuable than the transactions we complete.',
  },
  {
    heading: 'The Vision Behind MC Management Solutions',
    paragraphs: [
      'Antonio founded MC Management Solutions of Virginia, LLC with a simple objective: to provide property owners with experienced, reliable, and transparent property management services built on a foundation of integrity and accountability.',
      'Drawing on years of hands-on experience and leadership, Antonio believes that successful property management requires more than collecting rent and coordinating repairs. It requires proactive planning, sound judgment, clear communication, and a genuine commitment to the owner\u2019s best interests.',
      'His philosophy is rooted in three guiding principles: integrity over profit, honesty and transparency in every interaction, and treating each property with the same care and responsibility he would give his own.',
    ],
    quote:
      'Your property deserves the same attention, care, and commitment I would give my own.',
  },
  {
    paragraphs: [
      'Through MC Management Solutions, Antonio brings together his experience as a real estate broker, property management professional, and investor to help Northern Virginia property owners protect their investments and pursue their long-term real estate goals.',
    ],
  },
];
