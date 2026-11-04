import { z } from 'zod';

/**
 * Owner inquiry handling: validate, store, notify.
 *
 * The form posts to the /contact page itself rather than to a separate API
 * route. That is deliberate: a page that handles its own POST can re-render
 * with the submitted values intact and the errors attached to the right
 * fields, with no JavaScript involved. An API route would have to redirect,
 * and a redirect loses what the person typed.
 */

export const PROPERTY_TYPES = [
  'Single-family home',
  'Townhouse',
  'Condominium',
  'Multi-unit building',
  'Several properties',
] as const;

export const OCCUPANCY = [
  'Tenant Occupied',
  'Vacant',
  'Self Managed',
  'With Another Company',
  'Not yet Purchased',
  'Other',
] as const;

export const TIMELINES = [
  'Right away',
  'Within 1–3 months',
  'Just researching for now',
] as const;

/**
 * An unselected <select> posts an empty string, not nothing at all. Without
 * this, `.optional()` still rejects '' and the four optional dropdowns behave
 * as required fields, surfacing raw validator text to the person filling the
 * form.
 */
const optionalChoice = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.enum(values).optional()
  ) as z.ZodType<T[number] | undefined>;

export const inquirySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Please enter your name.')
    .max(120, 'That name is longer than we can store.'),
  email: z
    .string()
    .trim()
    .min(1, 'Please enter an email address so we can reply.')
    .email('That does not look like a valid email address.')
    .max(200),
  phone: z
    .string()
    .trim()
    .min(1, 'Please enter a phone number we can reach you on.')
    .max(40)
    .refine((v) => v.replace(/\D/g, '').length >= 7, {
      message: 'Please enter a valid phone number.',
    }),
  altEmail: z
    .string()
    .trim()
    .max(200)
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, {
      message: 'That does not look like a valid email address.',
    }),
  altPhone: z.string().trim().max(40).optional(),
  heardAbout: z.string().trim().max(200).optional(),
  // Optional: Antonio asked for the rental-evaluation route to work without
  // one, and requiring an address up front costs more leads than it gains.
  propertyAddress: z.string().trim().max(300).optional(),
  propertyType: optionalChoice(PROPERTY_TYPES),
  occupancy: optionalChoice(OCCUPANCY),
  timeline: optionalChoice(TIMELINES),
  message: z.string().trim().max(4000).optional(),
  consent: z.literal('yes', {
    errorMap: () => ({
      message: 'Please confirm we may contact you about your inquiry.',
    }),
  }),
});

export type InquiryInput = z.infer<typeof inquirySchema>;

/** Field name to first error message. */
export type FieldErrors = Partial<Record<keyof InquiryInput, string>>;

/** Raw strings echoed back into the form so nothing is retyped. */
export type FormValues = Record<string, string>;

export type InquiryResult =
  | { status: 'ok' }
  | { status: 'invalid'; errors: FieldErrors; values: FormValues }
  | { status: 'error'; message: string; values: FormValues };

const FIELD_NAMES = [
  'name',
  'email',
  'phone',
  'altEmail',
  'altPhone',
  'heardAbout',
  'propertyAddress',
  'propertyType',
  'occupancy',
  'timeline',
  'message',
  'consent',
] as const;

function readValues(form: FormData): FormValues {
  const values: FormValues = {};
  for (const field of FIELD_NAMES) {
    const value = form.get(field);
    values[field] = typeof value === 'string' ? value : '';
  }
  return values;
}

/**
 * Cloudflare Turnstile. Skipped entirely when no secret is configured, which
 * is how local development runs; in production a missing secret means every
 * submission is rejected rather than silently unprotected.
 */
async function verifyTurnstile(
  token: string | null,
  ip: string | null
): Promise<boolean> {
  const secret = import.meta.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (import.meta.env.PROD) {
      console.error(
        '[inquiry] TURNSTILE_SECRET_KEY is not set in production; rejecting submission.'
      );
      return false;
    }
    return true;
  }

  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      { method: 'POST', body }
    );
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch (cause) {
    console.error('[inquiry] Turnstile verification failed to run', cause);
    return false;
  }
}

async function store(data: InquiryInput, meta: { ip: string | null }) {
  const url = import.meta.env.DATABASE_URL;
  if (!url) {
    console.warn('[inquiry] DATABASE_URL not set; inquiry was not stored.');
    return;
  }

  const { neon } = await import('@neondatabase/serverless');
  const sql = neon(url);

  await sql`
    INSERT INTO inquiries (
      name, email, phone, alt_email, alt_phone, heard_about,
      property_address, property_type, occupancy, timeline,
      message, source_ip
    ) VALUES (
      ${data.name}, ${data.email}, ${data.phone},
      ${data.altEmail || null}, ${data.altPhone || null},
      ${data.heardAbout || null},
      ${data.propertyAddress || null}, ${data.propertyType ?? null},
      ${data.occupancy ?? null}, ${data.timeline ?? null},
      ${data.message || null}, ${meta.ip}
    )
  `;
}

function plainText(data: InquiryInput): string {
  return [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone}`,
    `Alt email: ${data.altEmail || '(none)'}`,
    `Alt phone: ${data.altPhone || '(none)'}`,
    `Heard about us: ${data.heardAbout || '(not specified)'}`,
    '',
    `Property: ${data.propertyAddress || '(not provided)'}`,
    `Type: ${data.propertyType ?? '(not specified)'}`,
    `Status: ${data.occupancy ?? '(not specified)'}`,
    `Timeline: ${data.timeline ?? '(not specified)'}`,
    '',
    'Message:',
    data.message || '(none)',
  ].join('\n');
}

async function notify(data: InquiryInput) {
  const apiKey = import.meta.env.RESEND_API_KEY;
  const from = import.meta.env.INQUIRY_FROM_EMAIL;
  const to = import.meta.env.INQUIRY_TO_EMAIL;

  if (!apiKey || !from || !to) {
    console.warn('[inquiry] Resend is not configured; no email sent.');
    return;
  }

  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);

  // Owner notification. replyTo means hitting reply answers the inquirer.
  await resend.emails.send({
    from,
    to,
    replyTo: data.email,
    subject: `Owner inquiry: ${data.propertyAddress || data.name}`,
    text: plainText(data),
  });

  // Acknowledgement, so nobody is left wondering if it went through.
  const firstName = data.name.split(' ')[0] ?? data.name;
  await resend.emails.send({
    from,
    to: data.email,
    subject: 'We received your inquiry — M&A Management Solutions',
    text: [
      `Hi ${firstName},`,
      '',
      'Thank you for reaching out about your property. We have received your',
      'inquiry and will be in touch shortly to arrange a consultation.',
      '',
      'For reference, this is what you sent us:',
      '',
      plainText(data),
      '',
      '— M&A Management Solutions of Virginia, LLC',
    ].join('\n'),
  });
}

/**
 * Same-origin check, replacing Astro's built-in one (see astro.config.mjs).
 *
 * Compares the Origin header against the host the browser actually addressed,
 * taking x-forwarded-host first so it is correct behind Vercel's proxy. A
 * request with no Origin header is allowed through: browsers send one on every
 * cross-site form POST, so its absence is not evidence of an attack, and
 * Turnstile plus the honeypot are the real defence here. There is no session
 * or cookie state on this site for a forged POST to act on.
 */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  const host =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!host) return true;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function handleInquiry(request: Request): Promise<InquiryResult> {
  if (!sameOrigin(request)) {
    console.warn('[inquiry] Rejected a cross-origin submission.');
    return {
      status: 'error',
      message:
        'That submission did not come from this site. Please reload the page and try again.',
      values: {},
    };
  }

  const form = await request.formData();
  const values = readValues(form);

  // Honeypot: a real person never fills a field they cannot see.
  const honeypot = form.get('company_website');
  if (typeof honeypot === 'string' && honeypot.trim() !== '') {
    console.info('[inquiry] Honeypot tripped; dropping submission silently.');
    return { status: 'ok' };
  }

  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? (forwarded.split(',')[0]?.trim() ?? null) : null;

  const parsed = inquirySchema.safeParse(values);
  if (!parsed.success) {
    const errors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof InquiryInput;
      if (key && !errors[key]) errors[key] = issue.message;
    }
    return { status: 'invalid', errors, values };
  }

  const token = form.get('cf-turnstile-response');
  const human = await verifyTurnstile(
    typeof token === 'string' ? token : null,
    ip
  );
  if (!human) {
    return {
      status: 'error',
      message:
        'We could not verify that submission. Please try again, or call us directly.',
      values,
    };
  }

  // Storing first means a Resend outage cannot lose the lead.
  try {
    await store(parsed.data, { ip });
  } catch (cause) {
    console.error('[inquiry] Failed to store inquiry', cause);
  }

  try {
    await notify(parsed.data);
  } catch (cause) {
    console.error('[inquiry] Failed to send notification email', cause);
  }

  return { status: 'ok' };
}
