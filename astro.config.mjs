// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://dotfn.dev',
  output: 'static',
  adapter: vercel(),
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