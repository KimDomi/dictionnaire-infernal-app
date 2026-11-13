import fs from 'fs';
import { L_BATCH1 } from './curate-l-batch1.mjs';
import { L_BATCH2 } from './curate-l-batch2.mjs';
import { L_BATCH3 } from './curate-l-batch3.mjs';

const ALL_L_ENTRIES = [...L_BATCH1, ...L_BATCH2, ...L_BATCH3];
console.log(`Loaded ${ALL_L_ENTRIES.length} curated L entries across 3 batches.`);
if (ALL_L_ENTRIES.length !== 169) {
  throw new Error(`Expected 169 entries, got ${ALL_L_ENTRIES.length}`);
}

// 1. Update translations_ko_cache.json
const cachePath = 'resources/translations_ko_cache.json';
const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

for (const entry of ALL_L_ENTRIES) {
  if (entry.translationKo) {
    cache[entry.id] = entry.translationKo;
  }
}
fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
console.log(`Updated L entries in ${cachePath}`);

// 2. Update scripts-build-entries.mjs
const buildScriptPath = 'scripts-build-entries.mjs';
let buildScript = fs.readFileSync(buildScriptPath, 'utf8');

// Build Headword Rules string
const headwordLines = [
  '  // L entries curated headwords (p.395-423)'
];
for (const e of ALL_L_ENTRIES) {
  const safeNameKo = e.nameKo.replace(/'/g, "\\'");
  const safeNameKoShort = e.nameKoShort.replace(/'/g, "\\'");
  const safeNameFr = e.nameFr.replace(/'/g, "\\'");
  const safeNameEn = (e.nameEn || '').replace(/'/g, "\\'");
  headwordLines.push(`  '${e.id}': { nameKo: '${safeNameKo}', nameKoShort: '${safeNameKoShort}', nameFr: '${safeNameFr}', nameEn: '${safeNameEn}' },`);
}
const headwordBlock = headwordLines.join('\n');

// Build Meta Rules string
const metaLines = [
  '  // L entries curated metadata (p.395-423)'
];
for (const e of ALL_L_ENTRIES) {
  const domainsStr = JSON.stringify(e.domains || []);
  const safeRank = (e.rank || '').replace(/'/g, "\\'");
  const legionsStr = (e.legions !== undefined && e.legions !== null) ? `, legions: ${e.legions}` : '';
  metaLines.push(`  '${e.id}': { category: '${e.category}', rank: '${safeRank}'${legionsStr}, domains: ${domainsStr} },`);
}
const metaBlock = metaLines.join('\n');

// Insert headwords right before "// M entries curated headwords (p.423-485)"
const mHeadwordMarker = '  // M entries curated headwords (p.423-485)';
if (!buildScript.includes(mHeadwordMarker)) {
  throw new Error(`Could not find M headword marker: ${mHeadwordMarker}`);
}
buildScript = buildScript.replace(mHeadwordMarker, `${headwordBlock}\n${mHeadwordMarker}`);

// Insert metadata right before "// M entries curated metadata (p.423-485)"
const mMetaMarker = '  // M entries curated metadata (p.423-485)';
if (!buildScript.includes(mMetaMarker)) {
  throw new Error(`Could not find M meta marker: ${mMetaMarker}`);
}
buildScript = buildScript.replace(mMetaMarker, `${metaBlock}\n${mMetaMarker}`);

fs.writeFileSync(buildScriptPath, buildScript, 'utf8');
console.log(`Successfully injected L curated headwords and metadata into ${buildScriptPath}`);
