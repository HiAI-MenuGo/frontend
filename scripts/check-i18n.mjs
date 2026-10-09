/**
 * Kiểm tra tính toàn vẹn của lớp i18n (C-024):
 *  1. vi.json và en.json phải song song tuyệt đối (không lệch key chiều nào).
 *  2. Mọi key được gọi trong app/ + components/ phải có mặt trong từ điển
 *     (nếu không, mọi lần gọi sẽ rơi về fallback tiếng Việt kể cả khi người dùng chọn EN).
 *  3. Ở locale 'en', giá trị trả về không được chứa ký tự tiếng Việt.
 *
 * Chạy: npm run check:i18n   (exit 0 = đạt, exit 1 = có gap cần bổ sung)
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const VI = 'lib/i18n/locales/vi.json';
const EN = 'lib/i18n/locales/en.json';
const SCAN_DIRS = ['app', 'components'];
const HAS_VIETNAMESE = /[\u00c0-\u1ef9\u0111]/i;

const flatten = (obj, prefix = '', out = {}) => {
  for (const key of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (value && typeof value === 'object') flatten(value, path, out);
    else out[path] = value;
  }
  return out;
};

/** Sao chép nguyên văn logic t() của context/i18nContext.tsx */
const lookup = (dict, dotted) =>
  dotted.split('.').reduce(
    (cur, key) => (cur && typeof cur === 'object' && key in cur ? cur[key] : undefined),
    dict
  );

const walk = dir => {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
};

const vi = flatten(JSON.parse(readFileSync(VI, 'utf8')));
const en = flatten(JSON.parse(readFileSync(EN, 'utf8')));

const usedKeys = new Map();
const callRe = /(?<![A-Za-z0-9_$.])t\(\s*'([A-Za-z0-9_.]+)'/g;
for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    const src = readFileSync(file, 'utf8');
    let m;
    while ((m = callRe.exec(src))) if (!usedKeys.has(m[1])) usedKeys.set(m[1], file);
  }
}

const problems = [];

const onlyVi = Object.keys(vi).filter((k) => !(k in en));
const onlyEn = Object.keys(en).filter((k) => !(k in vi));
if (onlyVi.length) problems.push(`Thiếu trong en.json (${onlyVi.length}): ${onlyVi.join(', ')}`);
if (onlyEn.length) problems.push(`Thiếu trong vi.json (${onlyEn.length}): ${onlyEn.join(', ')}`);

const missing = [...usedKeys].filter(([k]) => !(k in vi));
if (missing.length) {
  problems.push(
    `Key được gọi trong code nhưng thiếu trong từ điển (${missing.length}):\n` +
      missing.map(([k, f]) => `  ${k}  <- ${f}`).join('\n')
  );
}

const untranslated = [...usedKeys]
  .filter(([k]) => k in en)
  .filter(([k]) => HAS_VIETNAMESE.test(String(en[k])))
  .map(([k]) => k);
if (untranslated.length) {
  problems.push(
    `Giá trị en.json vẫn còn tiếng Việt (${untranslated.length}):\n` +
      untranslated.map((k) => `  ${k} = ${en[k]}`).join('\n')
  );
}

console.log(`vi keys: ${Object.keys(vi).length} | en keys: ${Object.keys(en).length}`);
console.log(`keys được gọi trong code: ${usedKeys.size}`);

if (problems.length) {
  console.error('\n' + problems.join('\n\n'));
  process.exit(1);
}
console.log('OK: i18n song song tuyệt đối, không thiếu key, không sót câu tiếng Việt trong en.');