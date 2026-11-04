/**
 * Rental pricing comparison: rent sooner at a lower price, or wait for a
 * higher one.
 *
 * ---------------------------------------------------------------------------
 * The point of the model
 * ---------------------------------------------------------------------------
 *
 * The mistake this tool exists to prevent is comparing twelve months of rent
 * under each scenario. That quietly ignores the waiting: a lease that starts
 * three weeks later still runs a full twelve months, so on that basis a higher
 * rent always wins. It never loses, which makes the comparison useless.
 *
 * So both scenarios are measured over **one fixed window that starts today**.
 * Days spent empty are days inside that window earning nothing, which is what
 * makes waiting cost something.
 *
 *   horizon H   = comparison window in days, from today
 *   rent R      = monthly rent for that scenario
 *   vacancy D   = days before a tenant moves in
 *   lease L     = lease length in months
 *
 *   earning days = min(L in days, H - D), floored at zero
 *   income       = (R / 30.4) * earning days
 *
 * The `min` matters: if a lease ends inside the window, the days after it are
 * not counted as income, because what happens then depends on a re-let this
 * model does not try to predict. That is disclosed on the page. With both
 * leases at twelve months and a twelve-month window — the default — the cap
 * never binds and the comparison is a clean like-for-like.
 *
 * ---------------------------------------------------------------------------
 * Break-even
 * ---------------------------------------------------------------------------
 *
 * How many *extra* empty days scenario B can absorb before its higher rent
 * stops being worth it. Income under B falls as it waits longer:
 *
 *   income_B(x) = (R_B / 30.4) * (H - D_B - x)
 *
 * Setting that equal to income_A and solving:
 *
 *   x = (H - D_B) - income_A / (R_B / 30.4)
 *
 * Carrying costs, mortgage and HOA fees appear nowhere. They are the same
 * under both scenarios, so they cancel; including them would be double
 * counting and would understate how long an owner can afford to wait.
 */

export interface Scenario {
  /** Monthly rent for this scenario. */
  rent: number;
  /** Days before a tenant moves in. */
  vacancyDays: number;
  /** Lease length in months. */
  leaseMonths: number;
}

export interface ScenarioResult {
  rent: number;
  vacancyDays: number;
  /** Rent forgone while empty, inside the comparison window. */
  lostToVacancy: number;
  /** Days inside the window that actually earn rent. */
  earningDays: number;
  /** Rental income across the comparison window. */
  income: number;
  /** True when the lease ends before the window does. */
  leaseEndsInsideWindow: boolean;
}

export interface Comparison {
  horizonMonths: number;
  horizonDays: number;
  a: ScenarioResult;
  b: ScenarioResult;
  /** Positive when B earns more. */
  difference: number;
  winner: 'a' | 'b' | 'tie';
  /** Extra empty days B can absorb before it stops beating A. */
  breakEvenExtraDays: number;
  /** True when B is already behind at its stated vacancy. */
  bAlreadyBehind: boolean;
}

/** Average month. Disclosed on the page as 30.4 days. */
export const DAYS_PER_MONTH = 365 / 12;

const clean = (value: number): number =>
  Number.isFinite(value) && value > 0 ? value : 0;

function runScenario(input: Scenario, horizonDays: number): ScenarioResult {
  const rent = clean(input.rent);
  const vacancyDays = Math.min(clean(input.vacancyDays), horizonDays);
  const leaseDays = clean(input.leaseMonths) * DAYS_PER_MONTH;

  const daily = rent / DAYS_PER_MONTH;
  const remaining = Math.max(0, horizonDays - vacancyDays);
  const earningDays = Math.min(leaseDays, remaining);

  return {
    rent,
    vacancyDays,
    lostToVacancy: daily * vacancyDays,
    earningDays,
    income: daily * earningDays,
    leaseEndsInsideWindow: leaseDays < remaining,
  };
}

export function compare(
  a: Scenario,
  b: Scenario,
  horizonMonths = 12
): Comparison {
  const months = clean(horizonMonths) || 12;
  const horizonDays = months * DAYS_PER_MONTH;

  const resultA = runScenario(a, horizonDays);
  const resultB = runScenario(b, horizonDays);

  const difference = resultB.income - resultA.income;

  // Ties are only interesting to the nearest dollar; below that it is noise.
  let winner: 'a' | 'b' | 'tie' = 'tie';
  if (Math.abs(difference) >= 1) winner = difference > 0 ? 'b' : 'a';

  const dailyB = resultB.rent / DAYS_PER_MONTH;
  const breakEvenExtraDays =
    dailyB > 0
      ? Math.max(
          0,
          horizonDays - resultB.vacancyDays - resultA.income / dailyB
        )
      : 0;

  return {
    horizonMonths: months,
    horizonDays,
    a: resultA,
    b: resultB,
    difference,
    winner,
    breakEvenExtraDays,
    bAlreadyBehind: difference < 0,
  };
}

/** The worked example the tool opens with, from Antonio's brief. */
export const EXAMPLE_A: Scenario = { rent: 2400, vacancyDays: 5, leaseMonths: 12 };
export const EXAMPLE_B: Scenario = { rent: 2550, vacancyDays: 25, leaseMonths: 12 };

export const HORIZON_MONTHS = 12;

export const LEASE_TERMS = [6, 12, 18, 24] as const;

export const SLIDER = { vacancyDays: { min: 0, max: 120, step: 1 } } as const;

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

/** Bar height as a percentage of the larger of the two incomes. */
export const barShare = (value: number, max: number): number =>
  max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
