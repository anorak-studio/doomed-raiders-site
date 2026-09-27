// @ts-check
import { defineConfig } from 'astro/config';

// Static site: Cloudflare Pages serves the /dist folder directly, no adapter needed.
export default defineConfig({
  site: 'https://doomedraiders.com',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
