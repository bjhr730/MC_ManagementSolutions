import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// Placeholder until the real domain is registered. Set SITE_URL in the
// environment (and in Vercel) and nothing else needs to change: canonical
// tags, sitemap.xml, robots.txt and Open Graph URLs all read from here.
const site = process.env.SITE_URL || 'https://replace-me.example.com';

export default defineConfig({
  site,
  // Static by default. Only `src/pages/api/inquiry.ts` opts out with
  // `export const prerender = false`, so every page is plain HTML on the CDN.
  output: 'static',
  adapter: vercel(),
  integrations: [
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
