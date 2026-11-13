import fs from 'fs';
import { P_BATCH1 } from './curate-p-batch1.mjs';
import { P_BATCH2 } from './curate-p-batch2.mjs';
import { P_BATCH3 } from './curate-p-batch3.mjs';
import { P_BATCH4 } from './curate-p-batch4.mjs';

const ALL_P_ENTRIES = [...P_BATCH1, ...P_BATCH2, ...P_BATCH3, ...P_BATCH4];
console.log(`Loaded ${ALL_P_ENTRIES.length} curated P entries across 4 batches.`);
if (ALL_P_ENTRIES.length !== 238) {
  throw new Error(`Expected 238 entries, got ${ALL_P_ENTRIES.length}`);
}

// 1. Update translations_ko_cache.json
const cachePath = 'resources/translations_ko_cache.json';
const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

for (const entry of ALL_P_ENTRIES) {
  if (entry.translationKo) {
    cache[entry.id] = entry.translationKo;
  }
}
fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
console.log(`Updated P entries in ${cachePath}`);

// 2. Update scripts-build-entries.mjs
const buildScriptPath = 'scripts-build-entries.mjs';
let buildScript = fs.readFileSync(buildScriptPath, 'utf8');

// Build Headword Rules string
const headwordLines = [
  '  // P entries curated headwords (p.507-567)'
];
for (const e of ALL_P_ENTRIES) {
  const safeNameKo = e.nameKo.replace(/'/g, "\\'");
  const safeNameKoShort = e.nameKoShort.replace(/'/g, "\\'");
  const safeNameFr = e.nameFr.replace(/'/g, "\\'");
  const safeNameEn = (e.nameEn || '').replace(/'/g, "\\'");
  headwordLines.push(`  '${e.id}': { nameKo: '${safeNameKo}', nameKoShort: '${safeNameKoShort}', nameFr: '${safeNameFr}', nameEn: '${safeNameEn}' },`);
}
const headwordBlock = headwordLines.join('\n');

// Build Meta Rules string
const metaLines = [
  '  // P entries curated metadata (p.507-567)'
];
for (const e of ALL_P_ENTRIES) {
  const domainsStr = JSON.stringify(e.domains || []);
  const safeRank = (e.rank || '').replace(/'/g, "\\'");
  const legionsStr = (e.legions !== undefined && e.legions !== null) ? `, legions: ${e.legions}` : '';
  metaLines.push(`  '${e.id}': { category: '${e.category}', rank: '${safeRank}'${legionsStr}, domains: ${domainsStr} },`);
}
const metaBlock = metaLines.join('\n');

// Insert P rules before Q entries in CURATED_HEADWORD_RULES
const qHeadwordMarker = "  // Q entries curated headwords (p.567-568)";
if (buildScript.includes(qHeadwordMarker)) {
  buildScript = buildScript.replace(qHeadwordMarker, `${headwordBlock}\n\n${qHeadwordMarker}`);
  console.log('Inserted P entries into CURATED_HEADWORD_RULES');
} else {
  console.error('Could not find Q headwords marker!');
}

// Insert P rules before Q entries in CURATED_META
const qMetaMarker = "  // Q entries curated metadata (p.567-568)";
if (buildScript.includes(qMetaMarker)) {
  buildScript = buildScript.replace(qMetaMarker, `${metaBlock}\n\n${qMetaMarker}`);
  console.log('Inserted P entries into CURATED_META');
} else {
  console.error('Could not find Q meta marker!');
}

fs.writeFileSync(buildScriptPath, buildScript, 'utf8');
console.log('Saved scripts-build-entries.mjs successfully.');
