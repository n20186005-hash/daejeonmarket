# 대전중앙시장 여행안내

대전중앙시장(대전광역시 동구 대전로 783)을 소개하는 독립 비영리 관광 정보 사이트입니다. Astro + Tailwind CSS + TypeScript로 정적 생성하며 Cloudflare Workers Static Assets로 배포합니다.

## 기술 구성

- Astro `7.2.4`
- Tailwind CSS `4.3.3` + `@tailwindcss/vite` `4.3.3`
- TypeScript `6.0.3` (`@astrojs/check` `0.9.10`의 `^5.0.0 || ^6.0.0` 범위 충족)
- pnpm `11.23.0`
- Node.js `24.19.0` LTS
- Wrangler 배포 명령 `4.125.0` 고정 (`pnpm dlx wrangler@4.125.0`)
- 데이터베이스·로그인·CMS 없음

## 설치 및 개발

```bash
corepack enable
corepack prepare pnpm@11.23.0 --activate
pnpm install --frozen-lockfile
pnpm dev
```

## 검사 및 빌드

```bash
pnpm check
pnpm build
pnpm run audit
pnpm run audit:language
```

도메인이 아직 없으면 `astro.config.mjs`의 `site` 값은 비워 둡니다. 이 상태에서도 빌드는 정상 동작하며 canonical, 절대 Open Graph URL, sitemap은 생성하지 않습니다. 실제 도메인이 정해지면 `astro.config.mjs` 안의 `site` 한 곳만 설정하고 다시 빌드하세요.

## Cloudflare Workers Static Assets

루트의 `wrangler.jsonc`가 배포의 단일 Wrangler 구성입니다.

```jsonc
{
  "name": "daejeon-jungang-market-guide",
  "compatibility_date": "2026-08-24",
  "assets": { "directory": "./dist", "not_found_handling": "404-page" }
}
```

배포:

```bash
pnpm build
pnpm deploy
```

또는 Wrangler가 이미 설치된 CI에서는 루트에서 `npx wrangler deploy`를 실행해도 `assets.directory` 설정만으로 `dist`를 사용합니다. `--assets` 같은 CLI 전용 옵션에 의존하지 않습니다.

### Pages / Wrangler 고빈도 오류를 피한 구조

1. **핵심 구성 누락 방지**: `name`, `compatibility_date`, `assets.directory`가 루트 구성에 모두 존재합니다.
2. **Pages의 `dist/client/wrangler.json` 리다이렉트 비사용**: 이 프로젝트는 Astro 정적 출력 + Workers Static Assets 방식이며 `@astrojs/cloudflare` SSR 어댑터나 Pages 빌드 결과를 사용하지 않습니다. 빌드 스크립트가 `dist/client/wrangler.json`을 만들거나 삭제하지 않습니다.
3. **상대경로 가중 문제 방지**: Wrangler 구성은 루트에서만 유지하며 `dist/client/`로 복사하지 않습니다. 따라서 `./dist`가 `dist/client/dist`로 재해석될 여지가 없습니다.
4. **CLI와 구성 동등성**: `deploy` 스크립트는 별도의 `--assets`를 전달하지 않습니다. 자산 경로는 항상 `wrangler.jsonc`에서 읽습니다.
5. **JSONC 처리**: 배포용 구성은 루트 `wrangler.jsonc` 하나뿐입니다. `dist` 내부에 별도 Wrangler 구성 JSON을 생성하지 않으므로 주석·후행 쉼표 제거 문제도 발생하지 않습니다.

## GA4와 쿠키 동의

GA4 측정 ID는 `G-HXM22WWPKP`입니다. 분석 스크립트는 이용자가 분석 기능을 허용한 뒤에만 동적으로 로드합니다. `/cookies/`에서 선택을 변경할 수 있습니다.

## 이미지 라이선스

시장 실사 사진은 대한민국역사박물관 현대사아카이브 소장 기록사진이며 위키미디어 공용에서 공공누리 제1유형(출처표시)으로 공개된 파일을 로컬에 포함했습니다. 자세한 내용은 `IMAGE-CREDITS.md`를 확인하세요.

## 배포 전 권장 검증

```bash
rm -rf node_modules dist .astro
CI=1 corepack pnpm install --frozen-lockfile
pnpm check
pnpm build

grep -RInE 'example\\.com|localhost|chrome-extension://' dist && exit 1 || true
```

`site`가 비어 있으면 sitemap을 의도적으로 생성하지 않습니다. 실제 도메인을 설정한 뒤에는 생성된 sitemap의 URL이 모두 해당 도메인을 사용하는지 확인하세요.

## 콘텐츠 검토

전문 비영리 관광 랜딩페이지로서의 편집 원칙과 운영 단계 권고사항은 `CONTENT-REVIEW.md`에 정리했습니다.
