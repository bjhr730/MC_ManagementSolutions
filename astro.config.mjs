import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// Placeholder until the real domain is registered. Set SITE_URL in the
// environment (and in Vercel) and nothing else needs to change: canonical
// tags, sitemap.xml, robots.txt and Open Graph URLs all read from here.
const site = process.env.SITE_URL || 'https://replace-me.example.com';

/**
 * Launch preflight.
 *
 * SITE_INDEXABLE="true" is the switch that makes this site public to search
 * engines, so it is the moment to check the things that silently lose
 * business if they are wrong. Nothing here runs while the flag is off, so
 * staging builds are untouched.
 *
 * It fails the build rather than warning, because every condition below
 * produces a site that looks fine and quietly does the wrong thing: an
 * inquiry nobody is told about, or a spam filter that lets everything
 * through. A failed deploy is recoverable in a minute; a fortnight of lost
 * leads is not.
 */
const CLOUDFLARE_TEST_SECRETS = [
  '1x0000000000000000000000000000000AA',
  '2x0000000000000000000000000000000AA',
  '3x0000000000000000000000000000000AA',
];

function launchPreflight() {
  return {
    name: 'launch-preflight',
    hooks: {
      'astro:build:start': () => {
        if (process.env.SITE_INDEXABLE !== 'true') return;

        const problems = [];
        const env = process.env;

        if (!env.RESEND_API_KEY || !env.INQUIRY_FROM_EMAIL || !env.INQUIRY_TO_EMAIL) {
          problems.push(
            'Resend is not configured (RESEND_API_KEY, INQUIRY_FROM_EMAIL, INQUIRY_TO_EMAIL). ' +
              'Inquiries would be stored but nobody would be told about them.'
          );
        }

        if (!env.DATABASE_URL) {
          problems.push(
            'DATABASE_URL is not set, so inquiries would not be stored.'
          );
        }

        if (!env.TURNSTILE_SECRET_KEY) {
          problems.push(
            'TURNSTILE_SECRET_KEY is not set. In production every submission is rejected.'
          );
        } else if (CLOUDFLARE_TEST_SECRETS.includes(env.TURNSTILE_SECRET_KEY)) {
          problems.push(
            "TURNSTILE_SECRET_KEY is still Cloudflare's always-pass test key, so the form has no spam protection."
          );
        }

        if (!env.SITE_URL || env.SITE_URL.includes('replace-me')) {
          problems.push(
            'SITE_URL is missing or still the placeholder, so canonical tags and the sitemap would be wrong.'
          );
        }

        if (problems.length > 0) {
          // NL via fromCharCode so no escape sequence has to survive the
          // trip through whatever writes this file.
          const NL = String.fromCharCode(10);
          throw new Error(
            [
              'Launch preflight failed. SITE_INDEXABLE is "true", which makes this site public, but:',
              '',
              ...problems.map((problem) => '  - ' + problem),
              '',
              'Fix these, or unset SITE_INDEXABLE to keep the deploy private.',
            ].join(NL)
          );
        }
      },
    },
  };
}

export default defineConfig({
  site,
  // Static by default. Only `src/pages/api/inquiry.ts` opts out with
  // `export const prerender = false`, so every page is plain HTML on the CDN.
  output: 'static',
  adapter: vercel(),
  integrations: [
    launchPreflight(),
    sitemap({
      filter: (page) =>
        // Utility pages that should not appear in search results.
        !page.includes('/thank-you'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  experimental: {
    // Astro hashes every script and style it inlines and writes them into the
    // policy itself. Doing this by hand was already wrong once: a hand-written
    // script-src blocked the mobile menu on /contact, because Astro inlines
    // that script on on-demand rendered pages but bundles it on static ones.
    // A hash list maintained here would silently rot the next time the script
    // changes; a generated one cannot.
    csp: {
      directives: [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "form-action 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        // Turnstile renders in an iframe and calls home from the client.
        'frame-src https://challenges.cloudflare.com',
        "connect-src 'self' https://challenges.cloudflare.com",
      ],
      scriptDirective: {
        resources: ["'self'", 'https://challenges.cloudflare.com'],
      },
      styleDirective: {
        resources: ["'self'"],
      },
    },
  },
  security: {
    // Astro's built-in cross-origin POST check compares the Origin header
    // against the host it sees, which behind Vercel's proxy is not the host
    // the browser addressed. The result is a 403 on every form submission,
    // including same-origin ones. We do the equivalent check ourselves in
    // src/lib/inquiry.ts, against the forwarded host, so it survives the proxy.
    checkOrigin: false,
  },
  build: {
    inlineStylesheets: 'auto',
  },
  image: {
    // Keep the generated set small; these are the only widths the layout uses.
    responsiveStyles: true,
  },
  prefetch: {
    prefetchAll: false,
  },
});
