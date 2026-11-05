/**
 * The three guiding principles, verbatim from MA_Company_Philosophy.pdf.
 * Used by /philosophy and echoed on the home page.
 */

export interface Principle {
  readonly number: string;
  readonly title: string;
  readonly statement: string;
  readonly body: string;
}

export const PHILOSOPHY_HEADING =
  'The Principles Behind MC Management Solutions';

export const PRINCIPLES: readonly Principle[] = [
  {
    number: '01',
    title: 'Integrity Over Profit',
    statement: 'Money without integrity is meaningless.',
    body:
      'We believe in earning your trust, not just your business. ' +
      'Zero surprises.',
  },
  {
    number: '02',
    title: 'Honesty. Communication. Transparency.',
    statement: 'Good news or bad, you\u2019ll always know where we stand.',
    body:
      'We believe owners deserve straightforward answers, consistent ' +
      'communication, and complete visibility into their investment. We ' +
      'value open dialogue and believe trust is built through honesty, ' +
      'transparency, and accountability.',
  },
  {
    number: '03',
    title: 'Your Property. Our Responsibility.',
    statement: 'We treat every property as if it were our own.',
    body:
      'Every decision is made with your property\u2019s long-term value in ' +
      'mind. From maintenance to tenant relations, we approach your ' +
      'investment with the same care, attention, and accountability we\u2019d ' +
      'expect for our own.',
  },
];
