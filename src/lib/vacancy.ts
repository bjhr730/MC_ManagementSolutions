/**
 * What a vacancy actually costs, and how long you can afford to hold out for
 * a higher rent.
 *
 * Imported by both the component frontmatter (so the page shows a worked
 * example before any JavaScript runs) and the browser script (so it updates
 * as you type). One implementation, so the two can never disagree.
 */

export interface VacancyInput {
  /** Monthly rent being asked. */
  rent: number;
  /** Days the property is expected to sit empty. */
  days: number;
  /** Monthly costs that keep running while it is empty: loan, HOA, insurance, utilities. */
  carrying: number;
  /** One-off turnover costs: make-ready, cleaning, leasing fee. */
  turnover: number;
  /** A rent increase you are considering holding out for, per month. */
  increase: number;
}

export interface VacancyResult {
  lostRent: number;
  carryingCost: number;
  turnoverCost: number;
  total: number;
  /** What each additional empty day costs. */
  perDay: number;
  /** Extra vacant days the rent increase would pay for, over a 12-month lease. */
  breakEvenDays: number;
}

/** Average days per month across a non-leap year. */
const DAYS_PER_MONTH = 365 / 12;

const clean = (value: number): number =>
  Number.isFinite(value) && value > 0 ? value : 0;

export function computeVacancy(input: VacancyInput): VacancyResult {
  const rent = clean(input.rent);
  const days = clean(input.days);
  const carrying = clean(input.carrying);
  const turnoverCost = clean(input.turnover);
  const increase = clean(input.increase);

  const dailyRent = rent / DAYS_PER_MONTH;
  const dailyCarrying = carrying / DAYS_PER_MONTH;

  const lostRent = dailyRent * days;
  const carryingCost = dailyCarrying * days;
  const perDay = dailyRent + dailyCarrying;

  return {
    lostRent,
    carryingCost,
    turnoverCost,
    total: lostRent + carryingCost + turnoverCost,
    perDay,
    // A higher rent earns the increase every month of the lease. Divide that
    // by what a day empty costs and you get the days of extra vacancy the
    // increase can absorb before you are worse off.
    breakEvenDays: perDay > 0 ? (increase * 12) / perDay : 0,
  };
}

/** Figures the calculator opens with, so the page is never a blank form. */
export const EXAMPLE: VacancyInput = {
  rent: 2600,
  days: 30,
  carrying: 1900,
  turnover: 800,
  increase: 100,
};

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
