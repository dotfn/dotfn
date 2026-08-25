// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://dotfn.dev',
  output: 'static',
  // imageService: the home/CV/links/about/contact/privacy pages are on-demand
  // (prerender = false, for markdown content negotiation), so their <Image>
  // transforms run per-request instead of at build time and need a runtime
  // image service — Vercel's own Image Optimization API covers that in prod.
  adapter: vercel({ imageService: true }),
  integrations: [react(), sitemap()],
  build: {
    inlineStylesheets: 'always',
  },
  fonts: [
    {
      name: 'Bricolage Grotesque',
      cssVariable: '--font-display',
      provider: fontProviders.google(),
      weights: [400, 600, 800],
      styles: ['normal'],
    },
    {
      name: 'DM Sans',
      cssVariable: '--font-body',
      provider: fontProviders.google(),
      weights: [300, 400, 500],
      styles: ['normal', 'italic'],
    }
  ]
});