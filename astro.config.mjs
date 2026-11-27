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
  vite: { plugins: [tailwindcss()] },
});
