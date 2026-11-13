import fs from 'fs';
import { R_BATCH1 } from './curate-r-batch1.mjs';
import { R_BATCH2 } from './curate-r-batch2.mjs';

const allR = [...R_BATCH1, ...R_BATCH2];
console.log(`Loaded ${allR.length} curated R entries.`);

// 1. Update translations_ko_cache.json
const cachePath = 'resources/translations_ko_cache.json';
const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

let cacheUpdated = 0;
for (const entry of allR) {
  if (entry.translationKo) {
    cache[entry.id] = entry.translationKo;
    cacheUpdated++;
  }
}
fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
console.log(`Updated ${cacheUpdated} entries in ${cachePath}`);

// 2. Update scripts-build-entries.mjs
const buildScriptPath = 'scripts-build-entries.mjs';
let buildScript = fs.readFileSync(buildScriptPath, 'utf8');

// Build the Headword Rules code string for R
const headwordLines = [
  '  // R entries curated headwords (p.569-586)'
];
for (const e of allR) {
  const safeNameKo = e.nameKo.replace(/'/g, "\\'");
  const safeNameKoShort = e.nameKoShort.replace(/'/g, "\\'");
  const safeNameFr = e.nameFr.replace(/'/g, "\\'");
  const safeNameEn = (e.nameEn || '').replace(/'/g, "\\'");
  headwordLines.push(`  '${e.id}': { nameKo: '${safeNameKo}', nameKoShort: '${safeNameKoShort}', nameFr: '${safeNameFr}', nameEn: '${safeNameEn}' },`);
}
const headwordBlock = headwordLines.join('\n');

// Build the Meta Rules code string for R
const metaLines = [
  '  // R entries curated meta (p.569-586)'
];
for (const e of allR) {
  const domainsStr = JSON.stringify(e.domains || []);
  const safeRank = (e.rank || '').replace(/'/g, "\\'");
  const legionsStr = (e.legions !== undefined && e.legions !== null) ? `, legions: ${e.legions}` : '';
  metaLines.push(`  '${e.id}': { category: '${e.category}', rank: '${safeRank}'${legionsStr}, domains: ${domainsStr} },`);
}
const metaBlock = metaLines.join('\n');

// Remove older partial Retz / Robert overrides in CURATED_HEADWORD_RULES if present
buildScript = buildScript.replace(/\n\s*\/\/ Disambiguated Retz entries[\s\S]*?'e3212-retz': [^\n]+,\n/g, '\n');
buildScript = buildScript.replace(/\n\s*\/\/ Disambiguated Robert entries[\s\S]*?'e3234-robert': [^\n]+,\n/g, '\n');

// Remove older partial Retz / Robert overrides in CURATED_META if present
buildScript = buildScript.replace(/\n\s*'e3211-retz': [^\n]+,\n\s*'e3212-retz': [^\n]+,\n/g, '\n');
buildScript = buildScript.replace(/\n\s*'e3231-robert': [^\n]+,\n\s*'e3233-robert': [^\n]+,\n\s*'e3234-robert': [^\n]+,\n/g, '\n');

// Ensure buildEntryHeadword checks CURATED_HEADWORD_RULES before matchedPlate
const targetFunc = `function buildEntryHeadword(raw, koBase, matchedPlate = null, id = null) {
  if (matchedPlate) {
    return {
      nameKo: matchedPlate.nameKo,
      nameKoShort: matchedPlate.nameKoShort || matchedPlate.nameKo.replace(/\\s*\\[.*\\]$/, ''),
      nameFr: matchedPlate.nameFr,
      nameEn: matchedPlate.nameEn || ''
    };
  }

  const rawKey = \`\${raw.nameFr.toLowerCase()}@@\${raw.page1863}\`;
  const c = (id && CURATED_HEADWORD_RULES[id]) || CURATED_HEADWORD_RULES[rawKey];`;

const replacementFunc = `function buildEntryHeadword(raw, koBase, matchedPlate = null, id = null) {
  const rawKey = \`\${raw.nameFr.toLowerCase()}@@\${raw.page1863}\`;
  const c = (id && CURATED_HEADWORD_RULES[id]) || CURATED_HEADWORD_RULES[rawKey];
  if (c) {
    return {
      nameKo: c.nameKo,
      nameKoShort: c.nameKoShort || c.nameKo.replace(/\\s*\\[.*\\]$/, ''),
      nameFr: c.nameFr || (matchedPlate ? matchedPlate.nameFr : raw.nameFr),
      nameEn: c.nameEn || ''
    };
  }

  if (matchedPlate) {
    return {
      nameKo: matchedPlate.nameKo,
      nameKoShort: matchedPlate.nameKoShort || matchedPlate.nameKo.replace(/\\s*\\[.*\\]$/, ''),
      nameFr: matchedPlate.nameFr,
      nameEn: matchedPlate.nameEn || ''
    };
  }`;

if (buildScript.includes(targetFunc)) {
  buildScript = buildScript.replace(targetFunc, replacementFunc);
  console.log('Updated buildEntryHeadword priority in scripts-build-entries.mjs');
}

// For matchedPlate, ensure description and summary can use TRANSLATION_CACHE if present
buildScript = buildScript.replace(
  `      summary: matchedPlate.summary,\n      description: matchedPlate.description,`,
  `      summary: (TRANSLATION_CACHE && TRANSLATION_CACHE[matchedPlate.id] ? (TRANSLATION_CACHE[matchedPlate.id].slice(0, 150) + '…') : matchedPlate.summary),\n      description: (TRANSLATION_CACHE && TRANSLATION_CACHE[matchedPlate.id]) || matchedPlate.description,`
);

// Insert R rules before S entries in CURATED_HEADWORD_RULES
const sHeadwordMarker = "  // S entries curated headwords (p.586-645)";
if (buildScript.includes(sHeadwordMarker)) {
  buildScript = buildScript.replace(sHeadwordMarker, `${headwordBlock}\n\n${sHeadwordMarker}`);
  console.log('Inserted R entries into CURATED_HEADWORD_RULES');
} else {
  console.error('Could not find S headwords marker!');
}

// Insert R rules before S entries in CURATED_META
const sMetaMarker = "  // S entries curated metadata (p.586-645)";
if (buildScript.includes(sMetaMarker)) {
  buildScript = buildScript.replace(sMetaMarker, `${metaBlock}\n\n${sMetaMarker}`);
  console.log('Inserted R entries into CURATED_META');
} else {
  console.error('Could not find S meta marker!');
}

fs.writeFileSync(buildScriptPath, buildScript, 'utf8');
console.log('Saved scripts-build-entries.mjs successfully.');
