import fs from 'fs';
import { M_BATCH1 } from './curate-m-batch1.mjs';
import { M_BATCH2 } from './curate-m-batch2.mjs';
import { M_BATCH3 } from './curate-m-batch3.mjs';
import { M_BATCH4 } from './curate-m-batch4.mjs';
import { M_BATCH5 } from './curate-m-batch5.mjs';

const ALL_M_ENTRIES = [...M_BATCH1, ...M_BATCH2, ...M_BATCH3, ...M_BATCH4, ...M_BATCH5];
console.log(`Loaded ${ALL_M_ENTRIES.length} curated M entries across 5 batches.`);
if (ALL_M_ENTRIES.length !== 271) {
  throw new Error(`Expected 271 entries, got ${ALL_M_ENTRIES.length}`);
}

// 1. Update translations_ko_cache.json
const cachePath = 'resources/translations_ko_cache.json';
const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

for (const entry of ALL_M_ENTRIES) {
  if (entry.translationKo) {
    cache[entry.id] = entry.translationKo;
  }
}
fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
console.log(`Updated M entries in ${cachePath}`);

// 2. Update scripts-build-entries.mjs
const buildScriptPath = 'scripts-build-entries.mjs';
let buildScript = fs.readFileSync(buildScriptPath, 'utf8');

// Build Headword Rules string
const headwordLines = [
  '  // M entries curated headwords (p.423-485)'
];
for (const e of ALL_M_ENTRIES) {
  const safeNameKo = e.nameKo.replace(/'/g, "\\'");
  const safeNameKoShort = e.nameKoShort.replace(/'/g, "\\'");
  const safeNameFr = e.nameFr.replace(/'/g, "\\'");
  const safeNameEn = (e.nameEn || '').replace(/'/g, "\\'");
  headwordLines.push(`  '${e.id}': { nameKo: '${safeNameKo}', nameKoShort: '${safeNameKoShort}', nameFr: '${safeNameFr}', nameEn: '${safeNameEn}' },`);
}
const headwordBlock = headwordLines.join('\n');

// Build Meta Rules string
const metaLines = [
  '  // M entries curated metadata (p.423-485)'
];
for (const e of ALL_M_ENTRIES) {
  const domainsStr = JSON.stringify(e.domains || []);
  const safeRank = (e.rank || '').replace(/'/g, "\\'");
  const legionsStr = (e.legions !== undefined && e.legions !== null) ? `, legions: ${e.legions}` : '';
  metaLines.push(`  '${e.id}': { category: '${e.category}', rank: '${safeRank}'${legionsStr}, domains: ${domainsStr} },`);
}
const metaBlock = metaLines.join('\n');

// Insert M rules before N entries in CURATED_HEADWORD_RULES
const nHeadwordMarker = "  // N entries curated headwords (p.486-497)";
if (buildScript.includes(nHeadwordMarker)) {
  buildScript = buildScript.replace(nHeadwordMarker, `${headwordBlock}\n\n${nHeadwordMarker}`);
  console.log('Inserted M entries into CURATED_HEADWORD_RULES');
} else {
  console.error('Could not find N headwords marker!');
}

// Insert M rules before N entries in CURATED_META
const nMetaMarker = "  // N entries curated metadata (p.486-497)";
if (buildScript.includes(nMetaMarker)) {
  buildScript = buildScript.replace(nMetaMarker, `${metaBlock}\n\n${nMetaMarker}`);
  console.log('Inserted M entries into CURATED_META');
} else {
  console.error('Could not find N meta marker!');
}

fs.writeFileSync(buildScriptPath, buildScript, 'utf8');
console.log('Saved scripts-build-entries.mjs successfully.');
