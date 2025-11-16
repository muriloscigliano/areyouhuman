// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import vue from '@astrojs/vue';
import vercel from '@astrojs/vercel';

const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');

// https://astro.build/config
export default defineConfig({
  output: 'server', // Enable server-side rendering for API routes
  adapter: vercel(), // Vercel adapter for deployment
  integrations: [vue()],
  vite: {
    // Security: API keys should NOT be exposed to client-side code
    // OpenAI calls are made server-side only via API routes
    ssr: {
      noExternal: ['gsap'],
    },
    optimizeDeps: {
      include: ['gsap/ScrollTrigger', 'gsap/ScrambleTextPlugin', 'gsap/SplitText'],
    },
  },
});
