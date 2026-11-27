import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  inquirySchema,
  OCCUPANCY,
  PROPERTY_TYPES,
  TIMELINES,
} from '../src/lib/inquiry.ts';

/*
  The gate every lead passes through. A schema that is too strict loses the
  enquiry; one that is too loose lets a row through that the database then
  rejects, which is how a lead was lost silently once before.

  These tests cover the schema only. The surrounding handleInquiry() talks
  to Neon, Resend and Turnstile, so exercising it needs network doubles;
  that is still untested and worth doing.
*/

const valid = {
  name: 'Jordan Reyes',
  email: 'jordan@example.com',
  phone: '(703) 555-0184',
  consent: 'yes',
};

const parse = (over: Record<string, unknown> = {}) =>
  inquirySchema.safeParse({ ...valid, ...over });

describe('the minimum viable enquiry', () => {
  test('accepts name, email, phone and consent alone', () => {
    const r = parse();
    assert.ok(r.success, JSON.stringify(r.success ? {} : r.error.issues));
  });

  test('every optional field really is optional', () => {
    const r = parse();
    assert.ok(r.success);
    if (!r.success) return;
    for (const key of [
      'altEmail',
      'altPhone',
      'heardAbout',
      'propertyAddress',
      'propertyType',
      'occupancy',
      'timeline',
      'message',
    ] as const) {
      assert.equal(r.data[key], undefined, `${key} should default to undefined`);
    }
  });

  test('an empty property address is accepted', () => {
    /*
      Requiring one cost more leads than it gained, and a blank address once
      violated a NOT NULL column and lost an enquiry outright.
    */
    assert.ok(parse({ propertyAddress: '' }).success);
  });
});

describe('required fields', () => {
  test('rejects a missing or one-character name', () => {
    assert.ok(!parse({ name: '' }).success);
    assert.ok(!parse({ name: 'J' }).success);
    assert.ok(parse({ name: 'Jo' }).success);
  });

  test('trims surrounding whitespace rather than counting it', () => {
    const r = parse({ name: '   Jordan Reyes   ' });
    assert.ok(r.success);
    if (r.success) assert.equal(r.data.name, 'Jordan Reyes');
    assert.ok(!parse({ name: '   ' }).success);
  });

  test('rejects an address that is not an email', () => {
    for (const bad of ['', 'jordan', 'jordan@', '@example.com', 'a b@c.com']) {
      assert.ok(!parse({ email: bad }).success, `${bad} should be rejected`);
    }
    assert.ok(parse({ email: 'jordan.reyes+rental@example.co.uk' }).success);
  });

  test('a phone number needs at least seven digits, in any formatting', () => {
    assert.ok(!parse({ phone: '' }).success);
    assert.ok(!parse({ phone: '555-01' }).success);
    for (const good of [
      '7035550184',
      '(703) 555-0184',
      '+1 703 555 0184',
      '703.555.0184',
    ]) {
      assert.ok(parse({ phone: good }).success, `${good} should be accepted`);
    }
  });

  test('consent must be explicitly yes', () => {
    assert.ok(!parse({ consent: undefined }).success);
    assert.ok(!parse({ consent: 'no' }).success);
    assert.ok(!parse({ consent: 'on' }).success);
    assert.ok(parse({ consent: 'yes' }).success);
  });

  test('a rejected consent explains itself in plain words', () => {
    const r = parse({ consent: undefined });
    assert.ok(!r.success);
    if (r.success) return;
    const issue = r.error.issues.find((i) => i.path[0] === 'consent');
    assert.ok(issue);
    assert.match(issue.message, /confirm we may contact you/i);
  });
});

describe('optional fields still validate when supplied', () => {
  test('an alternate email must be an email if present', () => {
    assert.ok(parse({ altEmail: '' }).success);
    assert.ok(parse({ altEmail: 'second@example.com' }).success);
    assert.ok(!parse({ altEmail: 'not-an-email' }).success);
  });

  test('choice fields accept only their published options', () => {
    for (const [field, options] of [
      ['propertyType', PROPERTY_TYPES],
      ['occupancy', OCCUPANCY],
      ['timeline', TIMELINES],
    ] as const) {
      for (const option of options) {
        assert.ok(
          parse({ [field]: option }).success,
          `${field} should accept ${String(option)}`
        );
      }
      assert.ok(
        !parse({ [field]: 'something-we-never-offered' }).success,
        `${field} should reject an unknown option`
      );
    }
  });

  test('an unselected dropdown does not fail the form', () => {
    assert.ok(parse({ propertyType: '', occupancy: '', timeline: '' }).success);
  });
});

describe('length ceilings match what the database can store', () => {
  test('rejects oversized input instead of letting the insert fail', () => {
    assert.ok(!parse({ name: 'a'.repeat(121) }).success);
    assert.ok(!parse({ propertyAddress: 'a'.repeat(301) }).success);
    assert.ok(!parse({ message: 'a'.repeat(4001) }).success);
    assert.ok(parse({ message: 'a'.repeat(4000) }).success);
  });
});
