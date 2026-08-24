# Cloudflare Workers Static Assets 배포 메모

이 프로젝트는 **Astro 정적 출력(`dist/`) + Cloudflare Workers Static Assets** 방식으로 배포합니다. Pages용 산출물 구조나 `@astrojs/cloudflare` SSR 어댑터를 사용하지 않습니다.

## 확정 구조

```text
project/
├─ wrangler.jsonc        # Wrangler 구성의 단일 원본
├─ astro.config.mjs
├─ package.json
├─ pnpm-lock.yaml
└─ dist/                 # `pnpm build`가 생성하는 정적 산출물
```

루트 `wrangler.jsonc`:

```json
{
  "name": "daejeon-jungang-market-guide",
  "compatibility_date": "2026-08-24",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "404-page"
  }
}
```

`.jsonc` 확장자를 쓰지만 내용은 순수 JSON 하위집합으로 유지해 주석이나 후행 쉼표 변환 문제를 없앴습니다.

## 고빈도 오류 5종과 이 프로젝트의 처리

1. **Wrangler 핵심 구성 누락** — `name`, `compatibility_date`, `assets.directory`를 루트 구성에 모두 둡니다. 정적 자산 전용 Worker이므로 `main` 대신 `assets.directory`가 배포 소스입니다.
2. **Pages CI 리다이렉트 포인터 혼용** — 이 저장소는 Pages 산출물인 `dist/client/wrangler.json`을 만들거나 복사하거나 삭제하지 않습니다. Pages 파이프라인이 해당 파일을 강제로 전제로 한다면 배포 대상이 Workers가 아니라 Pages로 설정된 것이므로, Cloudflare 프로젝트의 배포 방식을 Workers Static Assets로 맞춰야 합니다.
3. **상대경로 가중** — `assets.directory`는 Wrangler 구성 파일 위치 기준입니다. 따라서 루트의 `./dist`를 그대로 사용하고 구성 파일을 `dist/client/`로 복사하지 않습니다. 복사하면 `dist/client/dist`처럼 경로가 중복 해석될 수 있습니다.
4. **CLI 옵션과 구성 불일치** — 자산 경로를 `--assets` 인자에만 두지 않습니다. 루트 구성 자체에 `assets.directory`가 있으므로 CI가 루트에서 `npx wrangler deploy`를 실행해도 같은 배포 소스를 봅니다. 프로젝트 제공 `pnpm deploy`는 Wrangler `4.125.0`을 정확히 고정해 실행합니다.
5. **JSONC 변환 오류** — `dist`에 Wrangler 구성 파일을 생성하지 않으며 루트 파일도 순수 JSON 형식으로 작성했습니다. 따라서 빌드 후 주석 제거·후행 쉼표 정리 단계가 필요 없습니다.

## 권장 배포

```bash
corepack enable
corepack prepare pnpm@11.23.0 --activate
CI=1 pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm deploy
```

CI에서 Wrangler를 별도로 관리한다면 루트에서 다음도 가능합니다.

```bash
npx wrangler deploy
```

단, 재현성을 위해 기본 경로는 버전이 고정된 `pnpm deploy`를 권장합니다.

## 도메인과 sitemap

도메인은 `astro.config.mjs`의 `site` 한 곳에서만 설정합니다. `site`가 비어 있으면 sitemap 통합이 로드되지 않고 canonical/절대 Open Graph URL도 생략됩니다. 실제 도메인을 입력한 뒤 다시 빌드하면 해당 값에서 URL이 파생됩니다.
