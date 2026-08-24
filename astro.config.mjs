import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// 도메인이 확정되면 아래 값 한 곳만 수정하세요. 비어 있어도 빌드는 정상 동작합니다.
const site = '';

export default defineConfig({
  site: site || undefined,
  output: 'static',
  integrations: site ? [sitemap()] : [],
  vite: {
    plugins: [tailwindcss()],
  },
});
