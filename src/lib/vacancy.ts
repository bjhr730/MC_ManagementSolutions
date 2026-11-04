/**
 * Vacancy cost model: what an empty property exposes an owner to.
 *
 * Imported by both the component frontmatter (so the page shows a worked
 * example before any JavaScript runs) and the browser script (so it updates
 * as the inputs move). One implementation, so the two cannot disagree.
 *
 * This tool answers one question only: what the vacancy costs. The separate
 * question — whether waiting for a higher rent is worth it — belongs to the
 * rental pricing comparison in `pricing.ts`, which models it properly with
 * two scenarios over a shared window. Keeping them apart means the page never
 * shows two break-even figures that a reader has to reconcile.
 *
 * Carrying costs are reported on their own line and labelled as ongoing. A
 * mortgage, HOA fee and insurance premium are owed whether or not anyone is
 * living there, so they are not *caused* by the vacancy; what the vacancy
 * does is remove the rent that would have met them. Hence "exposure", not
 * "loss".
 */

export interface VacancyInput {
  /** Monthly asking rent. */
  rent: number;
  /** Days the property is expected to sit empty. */
  vacancyDays: number;
  /** Monthly mortgage, HOA, insurance and utilities. */
  carrying: number;
  /** One-off make-ready, cleaning and leasing spend. */
  turnover: number;
}

export interface VacancyResult {
  /** Rent not collected while empty. */
  lostRent: number;
  /** Carrying costs falling due while empty. Ongoing, not vacancy-caused. */
  carryingCost: number;
  /** One-off turnover spend. */
  turnoverCost: number;
  /** The three added together. */
  totalExposure: number;
  /** The part that exists only because the property is empty. */
  vacancyCaused: number;
  /** Rent lost for each additional empty day. */
  lostRentPerDay: number;
  /** Everything an additional empty day costs, rent plus carrying. */
  costPerDay: number;
}

/** Average month. Disclosed on the page as 30.4 days. */
const DAYS_PER_MONTH = 365 / 12;

const clean = (value: number): number =>
  Number.isFinite(value) && value > 0 ? value : 0;

export function computeVacancy(input: VacancyInput): VacancyResult {
  const rent = clean(input.rent);
  const vacancyDays = clean(input.vacancyDays);
  const carrying = clean(input.carrying);
  const turnoverCost = clean(input.turnover);

  const lostRentPerDay = rent / DAYS_PER_MONTH;
  const carryingPerDay = carrying / DAYS_PER_MONTH;

  const lostRent = lostRentPerDay * vacancyDays;
  const carryingCost = carryingPerDay * vacancyDays;

  return {
    lostRent,
    carryingCost,
    turnoverCost,
    totalExposure: lostRent + carryingCost + turnoverCost,
    vacancyCaused: lostRent + turnoverCost,
    lostRentPerDay,
    costPerDay: lostRentPerDay + carryingPerDay,
  };
}

/** Figures the calculator opens with, so the page is never a blank form. */
export const EXAMPLE: VacancyInput = {
  rent: 2600,
  vacancyDays: 30,
  carrying: 1900,
  turnover: 800,
};

/** Slider bounds, shared by the markup and the script. */
export const LIMITS = {
  vacancyDays: { min: 0, max: 120, step: 1 },
} as const;

export const money = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(value));

export const days = (value: number): string => {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded} ${rounded === 1 ? 'day' : 'days'}`;
};

/** Percentage of a total, for the breakdown bar. Guards divide-by-zero. */
export const share = (part: number, total: number): number =>
  total > 0 ? (part / total) * 100 : 0;
