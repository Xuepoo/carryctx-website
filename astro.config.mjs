// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'CarryCtx',
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        {
          label: 'Getting Started',
          items: [{ autogenerate: { directory: '1-getting-started' } }],
        },
        {
          label: 'CLI Reference',
          items: [{ autogenerate: { directory: '2-cli-reference' } }],
        },
        {
          label: 'Ecosystem',
          items: [{ autogenerate: { directory: '3-ecosystem' } }],
        },
      ],
    }),
  ],
});