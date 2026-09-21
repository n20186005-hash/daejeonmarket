import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// 도메인이 확정되면 아래 값 한 곳만 수정하세요. 비어 있으면 sitemap 통합이 로드되지 않고 canonical/절대 OG URL이 생략됩니다.
const site = 'https://daejeonmarket.com';

export default defineConfig({
  site: site || undefined,
  output: 'static',
  integrations: site ? [sitemap()] : [],
  vite: {
    plugins: [tailwindcss()],
  },
});
