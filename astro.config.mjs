import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import devWriter from './dev-writer.integration.mjs';

export default defineConfig({
  site: 'https://joelmathys.com',
  integrations: [mdx(), devWriter()],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
  build: {
    format: 'directory',
  },
  vite: {
    server: {
      watch: {
        // Don't watch heavy non-source dirs (avoids ENOSPC file-watcher limit).
        ignored: ['**/.venv/**', '**/dist/**', '**/.astro/**', '**/node_modules/**'],
      },
    },
  },
});
