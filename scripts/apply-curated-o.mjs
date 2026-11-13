import fs from 'fs';
import { O_BATCH1 } from './curate-o-batch1.mjs';
import { O_BATCH2 } from './curate-o-batch2.mjs';

const ALL_O_ENTRIES = [...O_BATCH1, ...O_BATCH2];
console.log(`Loaded ${ALL_O_ENTRIES.length} curated O entries across 2 batches.`);
if (ALL_O_ENTRIES.length !== 104) {
  throw new Error(`Expected 104 entries, got ${ALL_O_ENTRIES.length}`);
}

// 1. Update translations_ko_cache.json
const cachePath = 'resources/translations_ko_cache.json';
const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

for (const entry of ALL_O_ENTRIES) {
  if (entry.translationKo) {
    cache[entry.id] = entry.translationKo;
  }
}
fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
console.log(`Updated O entries in ${cachePath}`);

// 2. Update scripts-build-entries.mjs
const buildScriptPath = 'scripts-build-entries.mjs';
let buildScript = fs.readFileSync(buildScriptPath, 'utf8');

// Build Headword Rules string
const headwordLines = [
  '  // O entries curated headwords (p.497-512)'
];
for (const e of ALL_O_ENTRIES) {
  const safeNameKo = e.nameKo.replace(/'/g, "\\'");
  const safeNameKoShort = e.nameKoShort.replace(/'/g, "\\'");
  const safeNameFr = e.nameFr.replace(/'/g, "\\'");
  const safeNameEn = (e.nameEn || '').replace(/'/g, "\\'");
  headwordLines.push(`  '${e.id}': { nameKo: '${safeNameKo}', nameKoShort: '${safeNameKoShort}', nameFr: '${safeNameFr}', nameEn: '${safeNameEn}' },`);
}
const headwordBlock = headwordLines.join('\n');

// Build Meta Rules string
const metaLines = [
  '  // O entries curated metadata (p.497-512)'
];
for (const e of ALL_O_ENTRIES) {
  const domainsStr = JSON.stringify(e.domains || []);
  const safeRank = (e.rank || '').replace(/'/g, "\\'");
  const legionsStr = (e.legions !== undefined && e.legions !== null) ? `, legions: ${e.legions}` : '';
  metaLines.push(`  '${e.id}': { category: '${e.category}', rank: '${safeRank}'${legionsStr}, domains: ${domainsStr} },`);
}
const metaBlock = metaLines.join('\n');

// Insert O rules before P entries in CURATED_HEADWORD_RULES
const pHeadwordMarker = "  // P entries curated headwords (p.507-567)";
if (buildScript.includes(pHeadwordMarker)) {
  buildScript = buildScript.replace(pHeadwordMarker, `${headwordBlock}\n\n${pHeadwordMarker}`);
  console.log('Inserted O entries into CURATED_HEADWORD_RULES');
} else {
  console.error('Could not find P headwords marker!');
}

// Insert O rules before P entries in CURATED_META
const pMetaMarker = "  // P entries curated metadata (p.507-567)";
if (buildScript.includes(pMetaMarker)) {
  buildScript = buildScript.replace(pMetaMarker, `${metaBlock}\n\n${pMetaMarker}`);
  console.log('Inserted O entries into CURATED_META');
} else {
  console.error('Could not find P meta marker!');
}

fs.writeFileSync(buildScriptPath, buildScript, 'utf8');
console.log('Saved scripts-build-entries.mjs successfully.');
