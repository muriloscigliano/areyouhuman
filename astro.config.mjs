// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import vue from '@astrojs/vue';

const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');

// https://astro.build/config
export default defineConfig({
  output: 'hybrid', // Enable server-side rendering for API routes
  integrations: [vue()],
  vite: {
    define: {
      'import.meta.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY || ''),
    },
  },
});
