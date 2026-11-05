/**
 * Compliance and disclosure strings.
 *
 * IMPORTANT — read before launch.
 *
 * The master checklist says to "Review legal disclosures with qualified
 * Virginia professional" and to "Confirm Virginia licensing, DPOR advertising,
 * brokerage disclosures". None of that is done yet, so the entity-specific
 * strings below are placeholders rather than invented facts: a licence number
 * or brokerage name made up to look complete would be worse than a blank.
 *
 * `REVIEW_MODE = true` renders a visible banner on every page carrying
 * unreviewed disclosure text, so nothing ships silently. Set it to false only
 * once a Virginia attorney or broker has signed off on this file.
 */
export const REVIEW_MODE = true;

/**
 * Equal housing statement, in Antonio's wording. This appears in the footer,
 * which renders on every page of the site, because he asked for it on every
 * landing page rather than behind a link.
 */
export const EQUAL_HOUSING =
  'MC Management Solutions of Virginia, LLC is committed to providing ' +
  'equal housing opportunities and conducting business in accordance with ' +
  'all applicable federal, state, and local fair housing laws. We do not ' +
  'discriminate on the basis of any legally protected characteristic.';

/**
 * The full HUD statement, kept for the dedicated /fair-housing page where
 * the longer form and the protected-class list still belong.
 */
export const EQUAL_HOUSING_FULL =
  'We are committed to the letter and spirit of U.S. policy for the ' +
  'achievement of equal housing opportunity throughout the Nation. We ' +
  'encourage and support an affirmative advertising and marketing program ' +
  'in which there are no barriers to obtaining housing because of race, ' +
  'color, religion, sex, handicap, familial status, or national origin.';

/**
 * Virginia Fair Housing Law protects additional classes beyond the federal
 * list. VERIFY this list against the current Virginia Fair Housing Law before
 * launch — the statute has been amended several times in recent years.
 */
export const VA_PROTECTED_CLASSES = [
  'race',
  'color',
  'religion',
  'national origin',
  'sex',
  'pregnancy, childbirth or related medical conditions',
  'elderliness',
  'familial status',
  'disability',
  'source of funds',
  'sexual orientation',
  'gender identity',
  'military status',
] as const;

/**
 * Brokerage identification. Virginia requires licensed firm identification in
 * real estate advertising, and the FAQ states leasing and tenant placement run
 * through an affiliated licensed brokerage.
 *
 * REPLACE every field, or remove the leasing claims from the site.
 */
export const BROKERAGE = {
  name: 'REPLACE — licensed brokerage firm name',
  licenseNumber: 'REPLACE — Virginia DPOR firm licence number',
  brokerName: 'Antonio Melendez Cabrera',
  brokerLicenseNumber: 'REPLACE — Virginia DPOR broker licence number',
} as const;

/** Shown wherever the site mentions leasing or tenant placement. */
export const BROKERAGE_DISCLOSURE =
  'Leasing, tenant placement and brokerage services are provided through ' +
  'our affiliated licensed Virginia real estate brokerage, separately from ' +
  'the property management services of ' +
  'MC Management Solutions of Virginia, LLC.';

/** Shown wherever the site discusses fees or management plans. */
export const PRICING_DISCLOSURE =
  'Management services and pricing are customized to each property and owner. ' +
  'All applicable fees are disclosed in your written proposal and management ' +
  'agreement before you sign.';

/**
 * The FAQ advertises $0 management termination fees with this qualifier
 * attached. The master checklist requires every advertised commitment to match
 * the signed contract, so the qualifier travels with the claim everywhere.
 */
export const TERMINATION_QUALIFIER =
  'Reasonable notice and any outstanding obligations remain subject to the ' +
  'terms of your management agreement.';

/**
 * Last substantive review of the legal pages. Set this to a real date once an
 * attorney has signed off; until then the pages say so in plain words rather
 * than printing a placeholder at the reader.
 */
export const LEGAL_REVIEW_DATE: string | null = null;

export const LEGAL_LAST_UPDATED =
  LEGAL_REVIEW_DATE ?? 'Draft — not yet reviewed';
