/**
 * Vacancy cost model.
 *
 * Imported by both the component frontmatter (so the page shows a worked
 * example before any JavaScript runs) and the browser script (so it updates
 * as the inputs move). One implementation, so the two cannot disagree.
 *
 * ---------------------------------------------------------------------------
 * Two separate questions, deliberately not mixed
 * ---------------------------------------------------------------------------
 *
 * A. What does the vacancy expose me to in cash terms?
 *    Lost rent for the empty days, plus the carrying costs that fall due in
 *    that window, plus the one-off turnover spend. The carrying costs are
 *    reported separately and labelled, because a mortgage, HOA fee and
 *    insurance premium are owed whether or not anyone is living there. They
 *    are a cash-flow exposure during a vacancy, not a cost *caused* by it.
 *
 * B. Is holding out for a higher rent worth the extra empty time?
 *    This compares two outcomes over one fixed period, so the comparison is
 *    like for like:
 *
 *      Let P = the comparison period in days (the lease term)
 *          D = expected vacancy days
 *          R = current asking rent, I = the proposed increase
 *
 *      Take it now:   earn R over (P - D) days
 *      Hold out:      earn (R + I) over (P - D - X) days, X extra days empty
 *
 *      Setting the two equal and solving for X:
 *
 *        R(P - D)           = (R + I)(P - D - X)
 *        (P - D) - X        = R(P - D) / (R + I)
 *        X                  = (P - D) * I / (R + I)
 *
 *    Carrying costs do not appear, and that is the point: they are the same
 *    in both scenarios, so they cancel. Charging them against the wait, as
 *    the first version of this calculator did, understated how long an owner
 *    can afford to hold out. The formula does account for the fact that days
 *    spent waiting are days not earning inside the same fixed period.
 *
 *    The assumption worth stating plainly, and the page does state it: the
 *    only incremental cost of waiting is the rent not collected. If a longer
 *    marketing period carries real extra spend, that is not modelled here.
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
  /** A monthly rent increase being considered. */
  increase: number;
  /** Comparison period, in months. */
  leaseMonths: number;
}

export interface VacancyResult {
  /** A: rent not collected while empty. */
  lostRent: number;
  /** A: carrying costs falling due while empty. Ongoing, not vacancy-caused. */
  carryingCost: number;
  /** A: one-off turnover spend. */
  turnoverCost: number;
  /** A: the three added together. */
  totalExposure: number;
  /** A: the part that exists only because the property is empty. */
  vacancyCaused: number;
  /** A: rent lost for each additional empty day. */
  lostRentPerDay: number;

  /** B: the comparison period in days. */
  periodDays: number;
  /** B: rent-earning days if it is let now at the current rent. */
  earningDaysNow: number;
  /** B: extra empty days the increase can absorb before it stops paying. */
  breakEvenDays: number;
  /** B: what the increase is worth over the period if it costs no extra time. */
  increaseOverPeriod: number;
}

/** Average days per month across a non-leap year. */
const DAYS_PER_MONTH = 365 / 12;

const clean = (value: number): number =>
  Number.isFinite(value) && value > 0 ? value : 0;

export function computeVacancy(input: VacancyInput): VacancyResult {
  const rent = clean(input.rent);
  const vacancyDays = clean(input.vacancyDays);
  const carrying = clean(input.carrying);
  const turnoverCost = clean(input.turnover);
  const increase = clean(input.increase);
  const leaseMonths = clean(input.leaseMonths) || 12;

  const lostRentPerDay = rent / DAYS_PER_MONTH;
  const carryingPerDay = carrying / DAYS_PER_MONTH;

  const lostRent = lostRentPerDay * vacancyDays;
  const carryingCost = carryingPerDay * vacancyDays;

  const periodDays = leaseMonths * DAYS_PER_MONTH;
  // Days inside the period that actually earn rent if it is let now.
  const earningDaysNow = Math.max(0, periodDays - vacancyDays);

  // X = (P - D) * I / (R + I). Carrying costs cancel between the two
  // scenarios, so they are deliberately absent.
  const breakEvenDays =
    rent + increase > 0 ? (earningDaysNow * increase) / (rent + increase) : 0;

  return {
    lostRent,
    carryingCost,
    turnoverCost,
    totalExposure: lostRent + carryingCost + turnoverCost,
    vacancyCaused: lostRent + turnoverCost,
    lostRentPerDay,

    periodDays,
    earningDaysNow,
    breakEvenDays,
    increaseOverPeriod: increase * leaseMonths,
  };
}

/** Figures the calculator opens with, so the page is never a blank form. */
export const EXAMPLE: VacancyInput = {
  rent: 2600,
  vacancyDays: 30,
  carrying: 1900,
  turnover: 800,
  increase: 100,
  leaseMonths: 12,
};

/** Slider bounds, shared by the markup and the script. */
export const LIMITS = {
  vacancyDays: { min: 0, max: 120, step: 1 },
  increase: { min: 0, max: 1000, step: 25 },
} as const;

export const LEASE_TERMS = [6, 12, 18, 24] as const;

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
