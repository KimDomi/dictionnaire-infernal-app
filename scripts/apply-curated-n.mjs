import fs from 'fs';
import { N_BATCH1 } from './curate-n-batch1.mjs';
import { N_BATCH2 } from './curate-n-batch2.mjs';

const ALL_N_ENTRIES = [...N_BATCH1, ...N_BATCH2];
console.log(`Loaded ${ALL_N_ENTRIES.length} curated N entries across 2 batches.`);
if (ALL_N_ENTRIES.length !== 91) {
  throw new Error(`Expected 91 entries, got ${ALL_N_ENTRIES.length}`);
}

// 1. Update translations_ko_cache.json
const cachePath = 'resources/translations_ko_cache.json';
const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

for (const entry of ALL_N_ENTRIES) {
  if (entry.translationKo) {
    cache[entry.id] = entry.translationKo;
  }
}
fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
console.log(`Updated N entries in ${cachePath}`);

// 2. Update scripts-build-entries.mjs
const buildScriptPath = 'scripts-build-entries.mjs';
let buildScript = fs.readFileSync(buildScriptPath, 'utf8');

// Build Headword Rules string
const headwordLines = [
  '  // N entries curated headwords (p.486-497)'
];
for (const e of ALL_N_ENTRIES) {
  const safeNameKo = e.nameKo.replace(/'/g, "\\'");
  const safeNameKoShort = e.nameKoShort.replace(/'/g, "\\'");
  const safeNameFr = e.nameFr.replace(/'/g, "\\'");
  const safeNameEn = (e.nameEn || '').replace(/'/g, "\\'");
  headwordLines.push(`  '${e.id}': { nameKo: '${safeNameKo}', nameKoShort: '${safeNameKoShort}', nameFr: '${safeNameFr}', nameEn: '${safeNameEn}' },`);
}
const headwordBlock = headwordLines.join('\n');

// Build Meta Rules string
const metaLines = [
  '  // N entries curated metadata (p.486-497)'
];
for (const e of ALL_N_ENTRIES) {
  const domainsStr = JSON.stringify(e.domains || []);
  const safeRank = (e.rank || '').replace(/'/g, "\\'");
  const legionsStr = (e.legions !== undefined && e.legions !== null) ? `, legions: ${e.legions}` : '';
  metaLines.push(`  '${e.id}': { category: '${e.category}', rank: '${safeRank}'${legionsStr}, domains: ${domainsStr} },`);
}
const metaBlock = metaLines.join('\n');

// Insert N rules before O entries in CURATED_HEADWORD_RULES
const oHeadwordMarker = "  // O entries curated headwords (p.497-512)";
if (buildScript.includes(oHeadwordMarker)) {
  buildScript = buildScript.replace(oHeadwordMarker, `${headwordBlock}\n\n${oHeadwordMarker}`);
  console.log('Inserted N entries into CURATED_HEADWORD_RULES');
} else {
  console.error('Could not find O headwords marker!');
}

// Insert N rules before O entries in CURATED_META
const oMetaMarker = "  // O entries curated metadata (p.497-512)";
if (buildScript.includes(oMetaMarker)) {
  buildScript = buildScript.replace(oMetaMarker, `${metaBlock}\n\n${oMetaMarker}`);
  console.log('Inserted N entries into CURATED_META');
} else {
  console.error('Could not find O meta marker!');
}

fs.writeFileSync(buildScriptPath, buildScript, 'utf8');
console.log('Saved scripts-build-entries.mjs successfully.');
