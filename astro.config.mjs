import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import icon from "astro-icon";

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: 'https://ccheung93.github.io',
  integrations: [
    mdx({
        remarkPlugins: [remarkMath],
        rehypePlugins: [rehypeKatex]
    }), 
    sitemap(), 
    icon(), 
    tailwind()]
});