import { defineConfig, fontProviders } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// Every page is rendered on request: each one depends on whose job it is.
export default defineConfig({
  site: 'https://build.mrkwp.com',
  output: 'server',
  // No pictures are resized here, so no Cloudflare Images binding is asked for.
  adapter: cloudflare({ imageService: 'passthrough' }),
  // Same fonts as www.mrkwp.com, downloaded at build time and served from this app.
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Outfit',
      cssVariable: '--font-outfit',
      weights: [400, 600, 700],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Space Grotesk',
      cssVariable: '--font-space-grotesk',
      weights: [700],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
  ],
  // A strict content security policy on every page (built pages only; Astro can't apply it under
  // `astro dev`). Nothing loads from anywhere but this app, except pictures over https: the client's
  // own logo, shown back to them on "Here's what we found".
  security: {
    csp: {
      directives: ["default-src 'none'", "img-src 'self' data: https:", "font-src 'self'", "connect-src 'self'", "form-action 'self'", "base-uri 'none'"],
    },
  },
  vite: { plugins: [tailwindcss()] },
});
