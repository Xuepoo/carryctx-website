// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'CarryCtx',
      description:
        'Local-first memory for coding agents — resume tasks, checkpoints, and context across windows, sessions, and worktrees.',
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        'zh-cn': { label: '简体中文', lang: 'zh-CN' },
      },
      customCss: ['./src/styles/custom.css'],
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/Xuepoo/carryctx' },
      ],
      head: [
        {
          tag: 'link',
          attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        },
        {
          tag: 'link',
          attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap',
          },
        },
      ],
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