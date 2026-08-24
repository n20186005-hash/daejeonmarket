import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const fail = (message) => { throw new Error(message); };
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const pkg = JSON.parse(read('package.json'));
for (const group of ['dependencies', 'devDependencies']) {
  for (const [name, version] of Object.entries(pkg[group] || {})) {
    if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) fail(`${name} 버전이 정확히 고정되지 않았습니다: ${version}`);
  }
}
if (pkg.packageManager !== 'pnpm@11.23.0') fail('packageManager가 pnpm@11.23.0이 아닙니다.');
if (pkg.engines?.node !== '24.19.0') fail('Node.js 버전이 정확히 고정되지 않았습니다.');
if (pkg.devDependencies?.typescript !== '6.0.3') fail('TypeScript 버전을 확인하세요.');

// frozen-lockfile 재현성을 위해 package.json의 모든 직접 의존성 specifier가 lock importer와 일치하는지 확인합니다.
const lock = read('pnpm-lock.yaml');
if (!/^lockfileVersion:\s*['"]?9\.0['"]?/m.test(lock)) fail('pnpm-lock.yaml lockfileVersion을 확인하세요.');
for (const group of ['dependencies', 'devDependencies']) {
  for (const [name, version] of Object.entries(pkg[group] || {})) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`['\"]?${escaped}['\"]?:\\s*\\n\\s+specifier:\\s*${version.replaceAll('.', '\\.')}(?:\\s|$)`);
    if (!pattern.test(lock)) fail(`pnpm-lock.yaml importer에 ${name}@${version} specifier가 없습니다.`);
  }
}

const wrangler = JSON.parse(read('wrangler.jsonc'));
if (!wrangler.name || !wrangler.compatibility_date || !wrangler.assets?.directory) fail('Wrangler 핵심 구성이 누락되었습니다.');
if (wrangler.compatibility_date !== '2026-08-24') fail('Wrangler compatibility_date를 확인하세요.');
if (wrangler.assets.directory !== './dist') fail('assets.directory는 루트 기준 ./dist여야 합니다.');

const workspace = path.join(root, 'pnpm-workspace.yaml');
if (fs.existsSync(workspace)) {
  const text = fs.readFileSync(workspace, 'utf8');
  if (!/packages\s*:\s*[\s\S]*['"]\.['"]/.test(text)) fail('pnpm-workspace.yaml packages에 현재 패키지가 없습니다.');
}

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});
const sourceFiles = [...walk(path.join(root, 'src')), ...walk(path.join(root, 'public'))].filter((f) => !/\.(png|jpg|jpeg|webp|ico)$/i.test(f));
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const forbidden of ['example.com', 'localhost', 'chrome-extension://', 'zh-CN']) {
    if (text.includes(forbidden)) fail(`${path.relative(root, file)}에 금지 문자열이 있습니다: ${forbidden}`);
  }
}

for (const required of ['src/pages/privacy.astro', 'src/pages/terms.astro', 'src/pages/cookies.astro']) {
  if (!fs.existsSync(path.join(root, required))) fail(`${required}가 없습니다.`);
}
for (const image of ['market-front.jpg','fabric-stall.jpg','arcade.jpg','noodle-alley.jpg','seafood.jpg']) {
  const file = path.join(root, 'public/images', image);
  if (!fs.existsSync(file) || fs.statSync(file).size < 100_000) fail(`실사 이미지가 없거나 비정상입니다: ${image}`);
}

const mapPage = read('src/pages/index.astro');
if (!mapPage.includes('!1sko!2skr')) fail('구글 지도 언어/지역이 한국어/대한민국으로 설정되지 않았습니다.');

const dist = path.join(root, 'dist');
if (fs.existsSync(dist)) {
  const distFiles = walk(dist).filter((f) => !/\.(png|jpg|jpeg|webp|ico)$/i.test(f));
  for (const file of distFiles) {
    const text = fs.readFileSync(file, 'utf8');
    for (const forbidden of ['example.com', 'localhost', 'chrome-extension://']) {
      if (text.includes(forbidden)) fail(`빌드 산출물에 금지 문자열이 있습니다: ${path.relative(root, file)} → ${forbidden}`);
    }
  }
  const sitemapFiles = distFiles.filter((f) => /sitemap.*\.xml$/.test(path.basename(f)));
  for (const file of sitemapFiles) {
    const text = fs.readFileSync(file, 'utf8');
    if (/<lastmod>/i.test(text)) fail('sitemap에 수동 lastmod가 포함되어 있습니다.');
    if (/example\.com|localhost/i.test(text)) fail('sitemap에 자리표시자 도메인이 있습니다.');
  }
}

console.log('소스/구성 감사 통과');
