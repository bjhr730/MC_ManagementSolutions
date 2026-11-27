import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  compare,
  COMPARISON_PERIODS,
  DAYS_PER_MONTH,
  days,
  EXAMPLE_A,
  EXAMPLE_B,
  money,
  SLIDER,
} from '../src/lib/pricing.ts';

/*
  Rent sooner at a lower price, or hold out for a higher one. An owner can
  leave this tool having decided to turn down a tenant, so the comparison
  has to be right and has to stay right.
*/

const near = (actual: number, expected: number, tolerance = 0.01) =>
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`
  );

describe('compare', () => {
  test('matches the worked figures the live tool shows', () => {
    /*
      $2,400 let in 14 days against $2,600 let in 45, over 12 months.
      Production renders $27,695 / $27,353 and "$342 in favor of renting
      sooner" for exactly this input.
    */
    const c = compare(
      { rent: 2400, vacancyDays: 14, leaseMonths: 12 },
      { rent: 2600, vacancyDays: 45, leaseMonths: 12 },
      12
    );

    assert.equal(money(c.a.income), '$27,695');
    assert.equal(money(c.b.income), '$27,353');
    assert.equal(money(Math.abs(c.difference)), '$342');
    assert.equal(c.winner, 'a');
    assert.ok(c.bAlreadyBehind);
  });

  test('the higher rent wins when it lets quickly enough', () => {
    const c = compare(
      { rent: 2400, vacancyDays: 14, leaseMonths: 12 },
      { rent: 2600, vacancyDays: 20, leaseMonths: 12 },
      12
    );

    assert.equal(c.winner, 'b');
    assert.ok(c.difference > 0, 'difference is positive when B earns more');
    assert.ok(!c.bAlreadyBehind);
  });

  test('breakEvenExtraDays is the days B can still absorb, and zero once behind', () => {
    const ahead = compare(
      { rent: 2400, vacancyDays: 14, leaseMonths: 12 },
      { rent: 2600, vacancyDays: 20, leaseMonths: 12 },
      12
    );
    assert.ok(ahead.breakEvenExtraDays > 0);

    // Waiting that many extra days should land on roughly a dead heat.
    const atBreakEven = compare(
      { rent: 2400, vacancyDays: 14, leaseMonths: 12 },
      {
        rent: 2600,
        vacancyDays: 20 + ahead.breakEvenExtraDays,
        leaseMonths: 12,
      },
      12
    );
    near(atBreakEven.difference, 0, 1);

    const behind = compare(
      { rent: 2400, vacancyDays: 14, leaseMonths: 12 },
      { rent: 2600, vacancyDays: 45, leaseMonths: 12 },
      12
    );
    assert.equal(behind.breakEvenExtraDays, 0, 'never offers negative slack');
  });

  test('a difference under a dollar is a tie, not a winner', () => {
    const c = compare(
      { rent: 2000, vacancyDays: 10, leaseMonths: 12 },
      { rent: 2000, vacancyDays: 10, leaseMonths: 12 },
      12
    );
    assert.equal(c.winner, 'tie');
    near(c.difference, 0);
  });

  test('vacancy longer than the window cannot invent negative earning days', () => {
    const c = compare(
      { rent: 2400, vacancyDays: 9999, leaseMonths: 12 },
      { rent: 2600, vacancyDays: 500, leaseMonths: 12 },
      12
    );

    assert.equal(c.a.earningDays, 0);
    assert.equal(c.a.income, 0);
    assert.ok(c.a.vacancyDays <= c.horizonDays, 'vacancy clamps to the window');
    assert.ok(c.b.income >= 0);
  });

  test('a lease shorter than the window caps the earning days', () => {
    const c = compare(
      { rent: 2400, vacancyDays: 0, leaseMonths: 6 },
      { rent: 2400, vacancyDays: 0, leaseMonths: 12 },
      12
    );

    near(c.a.earningDays, 6 * DAYS_PER_MONTH);
    assert.ok(c.a.leaseEndsInsideWindow);
    assert.ok(!c.b.leaseEndsInsideWindow);
    assert.ok(c.a.income < c.b.income);
  });

  test('every comparison period the dropdown offers gives a usable result', () => {
    /*
      Three of four options once produced identical output because the lease
      length capped the window before the period could change anything.
    */
    const incomes = COMPARISON_PERIODS.map((months) => {
      const c = compare(
        { rent: 2400, vacancyDays: 14, leaseMonths: months },
        { rent: 2600, vacancyDays: 30, leaseMonths: months },
        months
      );
      assert.equal(c.horizonMonths, months);
      assert.ok(Number.isFinite(c.difference));
      return Math.round(c.a.income);
    });

    assert.equal(
      new Set(incomes).size,
      COMPARISON_PERIODS.length,
      'each period must produce a different projection'
    );
  });

  test('an invalid horizon falls back to twelve months', () => {
    for (const bad of [0, -3, Number.NaN]) {
      const c = compare(EXAMPLE_A, EXAMPLE_B, bad);
      assert.equal(c.horizonMonths, 12);
    }
  });

  test('negative and non-finite rents are clamped, never rendered', () => {
    const c = compare(
      { rent: -2400, vacancyDays: -5, leaseMonths: 12 },
      { rent: Number.NaN, vacancyDays: Number.NaN, leaseMonths: 12 },
      12
    );

    for (const side of [c.a, c.b]) {
      for (const [key, value] of Object.entries(side)) {
        if (typeof value !== 'number') continue;
        assert.ok(Number.isFinite(value), `${key} was ${value}`);
        assert.ok(value >= 0, `${key} was negative`);
      }
    }
    assert.ok(Number.isFinite(c.difference));
  });

  test('the slider bounds stay inside the model', () => {
    const { min, max } = SLIDER.vacancyDays;
    for (const vacancyDays of [min, max]) {
      const c = compare({ ...EXAMPLE_A, vacancyDays }, EXAMPLE_B, 12);
      assert.ok(Number.isFinite(c.a.income));
      assert.ok(c.a.income >= 0);
    }
  });
});

describe('formatting helpers', () => {
  test('money rounds to whole dollars', () => {
    assert.equal(money(27695.4), '$27,695');
    assert.equal(money(0), '$0');
  });

  test('days is singular only at exactly one', () => {
    assert.equal(days(1), '1 day');
    assert.equal(days(0), '0 days');
    assert.equal(days(30.44), '30.4 days');
  });
});
