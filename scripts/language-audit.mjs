import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src');
const files = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (full.endsWith('.astro')) files.push(full);
  }
};
walk(root);

const problems = [];
for (const file of files) {
  let text = fs.readFileSync(file, 'utf8');
  text = text.replace(/^---[\s\S]*?---\s*/, '');
  text = text.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/\{[\s\S]*?\}/g, ' ');
  if (/[\u4E00-\u9FFF]/.test(text)) problems.push(`${path.relative(root, file)}: 한글 본문에 한자가 섞여 있습니다.`);
  const latin = text.match(/\b[A-Za-z]{3,}\b/g);
  if (latin?.length) problems.push(`${path.relative(root, file)}: 화면 본문에 영문 단어가 남았습니다: ${[...new Set(latin)].join(', ')}`);
}
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log('화면 노출 문구 한국어 일관성 감사 통과');
