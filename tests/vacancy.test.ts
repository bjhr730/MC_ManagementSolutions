import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  computeVacancy,
  days,
  EXAMPLE,
  LIMITS,
  money,
  share,
} from '../src/lib/vacancy.ts';

/*
  What an empty property costs. These figures are published to owners who
  make real pricing decisions on them, so the point of this file is that the
  arithmetic cannot drift silently.

  A month is 365/12 = 30.4166... days, disclosed on the page as 30.4. Every
  expected value below is derived from that, not copied out of the
  implementation, so a change to the constant fails here rather than quietly
  restating itself.
*/

const DAYS_PER_MONTH = 365 / 12;
const near = (actual: number, expected: number, tolerance = 0.01) =>
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`
  );

describe('computeVacancy', () => {
  test('matches the worked figures the live calculator shows', () => {
    // $2,500/mo, 30 days empty, nothing else entered. Production renders
    // "$2,466" and "$82" per day for exactly this input.
    const r = computeVacancy({
      rent: 2500,
      vacancyDays: 30,
      carrying: 0,
      turnover: 0,
    });

    near(r.lostRentPerDay, 2500 / DAYS_PER_MONTH);
    near(r.lostRent, (2500 / DAYS_PER_MONTH) * 30);
    assert.equal(money(r.lostRent), '$2,466');
    assert.equal(money(r.lostRentPerDay), '$82');
  });

  test('vacancyCaused excludes carrying costs; totalExposure includes them', () => {
    /*
      This is the distinction the page is built on. Carrying costs fall due
      whether or not anyone lives there, so they are exposure but not caused
      by the vacancy. The headline once used totalExposure and overstated
      the cost of an empty month by the whole mortgage.
    */
    const r = computeVacancy({
      rent: 3000,
      vacancyDays: 30,
      carrying: 1800,
      turnover: 500,
    });

    near(r.vacancyCaused, r.lostRent + r.turnoverCost);
    near(r.totalExposure, r.lostRent + r.carryingCost + r.turnoverCost);
    assert.ok(
      r.vacancyCaused < r.totalExposure,
      'carrying costs must not be counted as vacancy-caused'
    );
    near(r.totalExposure - r.vacancyCaused, r.carryingCost);
  });

  test('lostRentPerDay is rent only; costPerDay adds carrying', () => {
    const r = computeVacancy({
      rent: 2400,
      vacancyDays: 10,
      carrying: 1200,
      turnover: 0,
    });

    near(r.lostRentPerDay, 2400 / DAYS_PER_MONTH);
    near(r.costPerDay, (2400 + 1200) / DAYS_PER_MONTH);
    assert.ok(r.costPerDay > r.lostRentPerDay);
  });

  test('turnover is a one-off, not scaled by the days empty', () => {
    const short = computeVacancy({
      rent: 2000,
      vacancyDays: 5,
      carrying: 0,
      turnover: 900,
    });
    const long = computeVacancy({
      rent: 2000,
      vacancyDays: 90,
      carrying: 0,
      turnover: 900,
    });

    assert.equal(short.turnoverCost, 900);
    assert.equal(long.turnoverCost, 900);
  });

  test('zero days empty costs nothing but the turnover spend', () => {
    const r = computeVacancy({
      rent: 2600,
      vacancyDays: 0,
      carrying: 1900,
      turnover: 800,
    });

    assert.equal(r.lostRent, 0);
    assert.equal(r.carryingCost, 0);
    assert.equal(r.vacancyCaused, 800);
    assert.equal(r.totalExposure, 800);
  });

  test('negative, NaN and infinite inputs are clamped rather than propagated', () => {
    /*
      The fields are type="number", so a browser can hand this code -5 or
      NaN. Producing "-$411" or "$NaN" on a marketing page would be worse
      than producing nothing.
    */
    for (const bad of [-5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const r = computeVacancy({
        rent: bad,
        vacancyDays: bad,
        carrying: bad,
        turnover: bad,
      });

      for (const [key, value] of Object.entries(r)) {
        assert.ok(
          Number.isFinite(value),
          `${key} was ${value} for input ${String(bad)}`
        );
        assert.ok(value >= 0, `${key} was negative for input ${String(bad)}`);
      }
    }
  });

  test('scales linearly in the days empty', () => {
    const base = { rent: 2200, carrying: 1000, turnover: 0 };
    const ten = computeVacancy({ ...base, vacancyDays: 10 });
    const thirty = computeVacancy({ ...base, vacancyDays: 30 });

    near(thirty.lostRent, ten.lostRent * 3);
    near(thirty.carryingCost, ten.carryingCost * 3);
  });
});

describe('formatting helpers', () => {
  test('money rounds to whole dollars', () => {
    assert.equal(money(2465.75), '$2,466');
    assert.equal(money(0), '$0');
    assert.equal(money(1), '$1');
  });

  test('days is singular only at exactly one', () => {
    assert.equal(days(1), '1 day');
    assert.equal(days(0), '0 days');
    assert.equal(days(2), '2 days');
    assert.equal(days(1.04), '1 day');
    assert.equal(days(1.25), '1.3 days');
  });

  test('share guards divide-by-zero instead of returning NaN', () => {
    assert.equal(share(5, 0), 0);
    assert.equal(share(0, 0), 0);
    assert.equal(share(25, 100), 25);
  });
});

describe('published constants', () => {
  test('the worked example is internally sensible', () => {
    assert.ok(EXAMPLE.rent > 0);
    assert.ok(EXAMPLE.vacancyDays > 0);
    assert.ok(EXAMPLE.vacancyDays <= LIMITS.vacancyDays.max);
  });

  test('the slider cannot produce a value the model rejects', () => {
    const { min, max } = LIMITS.vacancyDays;
    for (const vacancyDays of [min, max]) {
      const r = computeVacancy({ ...EXAMPLE, vacancyDays });
      assert.ok(Number.isFinite(r.totalExposure));
      assert.ok(r.totalExposure >= 0);
    }
  });
});
