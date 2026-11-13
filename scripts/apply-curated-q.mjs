import fs from 'fs';
import { Q_ENTRIES } from './curate-q.mjs';

console.log(`Loaded ${Q_ENTRIES.length} curated Q entries.`);

// 1. Update translations_ko_cache.json
const cachePath = 'resources/translations_ko_cache.json';
const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

for (const entry of Q_ENTRIES) {
  if (entry.translationKo) {
    cache[entry.id] = entry.translationKo;
  }
}
fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
console.log(`Updated Q entries in ${cachePath}`);

// 2. Update scripts-build-entries.mjs
const buildScriptPath = 'scripts-build-entries.mjs';
let buildScript = fs.readFileSync(buildScriptPath, 'utf8');

// Build the Headword Rules code string for Q
const headwordLines = [
  '  // Q entries curated headwords (p.567-568)'
];
for (const e of Q_ENTRIES) {
  const safeNameKo = e.nameKo.replace(/'/g, "\\'");
  const safeNameKoShort = e.nameKoShort.replace(/'/g, "\\'");
  const safeNameFr = e.nameFr.replace(/'/g, "\\'");
  const safeNameEn = (e.nameEn || '').replace(/'/g, "\\'");
  headwordLines.push(`  '${e.id}': { nameKo: '${safeNameKo}', nameKoShort: '${safeNameKoShort}', nameFr: '${safeNameFr}', nameEn: '${safeNameEn}' },`);
}
const headwordBlock = headwordLines.join('\n');

// Build the Meta Rules code string for Q
const metaLines = [
  '  // Q entries curated metadata (p.567-568)'
];
for (const e of Q_ENTRIES) {
  const domainsStr = JSON.stringify(e.domains || []);
  const safeRank = (e.rank || '').replace(/'/g, "\\'");
  const legionsStr = (e.legions !== undefined && e.legions !== null) ? `, legions: ${e.legions}` : '';
  metaLines.push(`  '${e.id}': { category: '${e.category}', rank: '${safeRank}'${legionsStr}, domains: ${domainsStr} },`);
}
const metaBlock = metaLines.join('\n');

// Insert Q rules before R entries in CURATED_HEADWORD_RULES
const rHeadwordMarker = "  // R entries curated headwords (p.569-586)";
if (buildScript.includes(rHeadwordMarker)) {
  buildScript = buildScript.replace(rHeadwordMarker, `${headwordBlock}\n\n${rHeadwordMarker}`);
  console.log('Inserted Q entries into CURATED_HEADWORD_RULES');
} else {
  console.error('Could not find R headwords marker!');
}

// Insert Q rules before R entries in CURATED_META
const rMetaMarker = "  // R entries curated meta (p.569-586)";
if (buildScript.includes(rMetaMarker)) {
  buildScript = buildScript.replace(rMetaMarker, `${metaBlock}\n\n${rMetaMarker}`);
  console.log('Inserted Q entries into CURATED_META');
} else {
  console.error('Could not find R meta marker!');
}

fs.writeFileSync(buildScriptPath, buildScript, 'utf8');
console.log('Saved scripts-build-entries.mjs successfully.');
