/**
 * "Why Choose Us: owner-investor perspective, experience, transparency,
 * personalized attention" (MA_Website_Development_Checklist.pdf).
 *
 * Each reason restates a claim the client already made in writing in the
 * founder bio or the FAQ. Nothing new is asserted about the business.
 */

export interface Reason {
  readonly title: string;
  readonly body: string;
}

export const REASONS: readonly Reason[] = [
  {
    title: 'An owner\u2019s perspective, not just a manager\u2019s',
    body:
      'Antonio is a rental property owner and investor himself. He ' +
      'understands protecting an investment, controlling expenses, ' +
      'minimizing vacancies, and making informed decisions that support ' +
      'long-term property value, because he makes those same decisions for ' +
      'his own properties.',
  },
  {
    title: 'Experience at both ends of the scale',
    body:
      'He began by personally overseeing day to day operations in a ' +
      'portfolio of approximately 60 residential properties, then led an ' +
      'entire management operation responsible for over 200. Neither a ' +
      'single rental home nor a growing portfolio is unfamiliar territory.',
  },
  {
    title: 'Transparency as a default, not a request',
    body:
      'Monthly owner statements, year-end summaries, fees explained clearly ' +
      'before you sign, and authorization limits you set yourself. Good ' +
      'news or bad, you always know where your property stands.',
  },
  {
    title: 'Management shaped around you',
    body:
      'Some owners want to be closely involved; others prefer to hand it ' +
      'over entirely. Both are welcome. The management approach is tailored ' +
      'to your preference rather than forced into one package.',
  },
  {
    title: 'A licensed broker on your property',
    body:
      'Antonio is a Northern Virginia real estate broker and a multi-year ' +
      'NVAR Top Producer who has participated in more than 215 real estate ' +
      'transactions. Pricing and renewal decisions are made with that ' +
      'market knowledge behind them.',
  },
  {
    title: 'No lock-in',
    body:
      'Zero property management termination fees. The relationship ' +
      'continues because it is working, not because of a penalty clause.',
  },
];
