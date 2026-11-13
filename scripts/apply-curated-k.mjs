import fs from 'fs';
import { K_BATCH1 } from './curate-k-batch1.mjs';
import { K_BATCH2 } from './curate-k-batch2.mjs';

const ALL_K_ENTRIES = [...K_BATCH1, ...K_BATCH2];
console.log(`Loaded ${ALL_K_ENTRIES.length} curated K entries across 2 batches.`);
if (ALL_K_ENTRIES.length !== 69) {
  throw new Error(`Expected 69 entries, got ${ALL_K_ENTRIES.length}`);
}

// 1. Update translations_ko_cache.json
const cachePath = 'resources/translations_ko_cache.json';
const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

for (const entry of ALL_K_ENTRIES) {
  if (entry.translationKo) {
    cache[entry.id] = entry.translationKo;
  }
}
fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
console.log(`Updated K entries in ${cachePath}`);

// 2. Update scripts-build-entries.mjs
const buildScriptPath = 'scripts-build-entries.mjs';
let buildScript = fs.readFileSync(buildScriptPath, 'utf8');

// Build Headword Rules string
const headwordLines = [
  '  // K entries curated headwords (p.383-395)'
];
for (const e of ALL_K_ENTRIES) {
  const safeNameKo = e.nameKo.replace(/'/g, "\\'");
  const safeNameKoShort = e.nameKoShort.replace(/'/g, "\\'");
  const safeNameFr = e.nameFr.replace(/'/g, "\\'");
  const safeNameEn = (e.nameEn || '').replace(/'/g, "\\'");
  headwordLines.push(`  '${e.id}': { nameKo: '${safeNameKo}', nameKoShort: '${safeNameKoShort}', nameFr: '${safeNameFr}', nameEn: '${safeNameEn}' },`);
}
const headwordBlock = headwordLines.join('\n');

// Build Meta Rules string
const metaLines = [
  '  // K entries curated metadata (p.383-395)'
];
for (const e of ALL_K_ENTRIES) {
  const domainsStr = JSON.stringify(e.domains || []);
  const safeRank = (e.rank || '').replace(/'/g, "\\'");
  const legionsStr = (e.legions !== undefined && e.legions !== null) ? `, legions: ${e.legions}` : '';
  metaLines.push(`  '${e.id}': { category: '${e.category}', rank: '${safeRank}'${legionsStr}, domains: ${domainsStr} },`);
}
const metaBlock = metaLines.join('\n');

// Insert headwords right before "// L entries curated headwords (p.395-423)"
const lHeadwordMarker = '  // L entries curated headwords (p.395-423)';
if (!buildScript.includes(lHeadwordMarker)) {
  throw new Error(`Could not find L headword marker: ${lHeadwordMarker}`);
}
buildScript = buildScript.replace(lHeadwordMarker, `${headwordBlock}\n${lHeadwordMarker}`);

// Insert metadata right before "// L entries curated metadata (p.395-423)"
const lMetaMarker = '  // L entries curated metadata (p.395-423)';
if (!buildScript.includes(lMetaMarker)) {
  throw new Error(`Could not find L meta marker: ${lMetaMarker}`);
}
buildScript = buildScript.replace(lMetaMarker, `${metaBlock}\n${lMetaMarker}`);

fs.writeFileSync(buildScriptPath, buildScript, 'utf8');
console.log(`Successfully injected K curated headwords and metadata into ${buildScriptPath}`);
