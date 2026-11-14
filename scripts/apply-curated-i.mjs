import fs from 'fs';
import { curatedIBatch1 } from './curate-i-batch1.mjs';
import { curatedIBatch2 } from './curate-i-batch2.mjs';

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[^a-z0-9]/g, '');
}

const entriesRaw = JSON.parse(fs.readFileSync('resources/entries_1863_all.json', 'utf8'));
const rawIEntries = [];
entriesRaw.forEach((raw, idx) => {
  if (raw.letter === 'I') {
    const slugBase = norm(raw.nameFr).slice(0, 28) || `entry${idx + 1}`;
    const uncuratedId = `e${idx + 1}-${slugBase}`;
    rawIEntries.push({ idx: idx + 1, id: uncuratedId, raw });
  }
});

const ALL_I_ENTRIES = [...curatedIBatch1, ...curatedIBatch2];
console.log(`Loaded ${ALL_I_ENTRIES.length} curated I entries across 2 batches.`);
console.log(`Loaded ${rawIEntries.length} raw I entries from entries_1863_all.json.`);

if (ALL_I_ENTRIES.length !== rawIEntries.length) {
  throw new Error(`Count mismatch: curated=${ALL_I_ENTRIES.length}, raw=${rawIEntries.length}`);
}

// 1. Update translations_ko_cache.json
const cachePath = 'resources/translations_ko_cache.json';
const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

for (let i = 0; i < ALL_I_ENTRIES.length; i++) {
  const e = ALL_I_ENTRIES[i];
  const { id, raw } = rawIEntries[i];
  if (e.bodyKo) {
    cache[id] = e.bodyKo;
    if (raw && raw.textFr) {
      const normText = raw.textFr.trim().replace(/\s+/g, ' ');
      cache[normText] = e.bodyKo;
    }
    // Also map plate ID if this is Ipes
    if (id === 'e2133-ipes') {
      cache['ipes'] = e.bodyKo;
    }
  }
}
fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
console.log(`Updated I entries in ${cachePath}`);

// 2. Build rules for scripts-build-entries.mjs
const headwordLines = [
  '  // I entries curated headwords (p.350-368)'
];
const metaLines = [
  '  // I entries curated metadata (p.350-368)'
];

for (let i = 0; i < ALL_I_ENTRIES.length; i++) {
  const e = ALL_I_ENTRIES[i];
  const { id, raw } = rawIEntries[i];

  const match = e.nameKo.match(/^\[(.*?) \/ (.*?)\]$/);
  let shortKo = e.nameKo;
  let en = '';
  if (match) {
    shortKo = match[1];
    en = match[2];
  } else {
    shortKo = e.nameKo.replace(/[\[\]]/g, '');
  }
  const fullKo = `${shortKo} [${raw.nameFr} / ${en}]`;

  const safeNameKo = fullKo.replace(/'/g, "\\'");
  const safeNameKoShort = shortKo.replace(/'/g, "\\'");
  const safeNameFr = raw.nameFr.replace(/'/g, "\\'");
  const safeNameEn = en.replace(/'/g, "\\'");
  headwordLines.push(`  '${id}': { nameKo: '${safeNameKo}', nameKoShort: '${safeNameKoShort}', nameFr: '${safeNameFr}', nameEn: '${safeNameEn}' },`);

  const domainsStr = JSON.stringify(e.domain || []);
  const safeRank = (e.summary || '').replace(/'/g, "\\'");
  metaLines.push(`  '${id}': { category: '${e.category}', rank: '${safeRank}', domains: ${domainsStr} },`);

  // Extra rule for 68-plate 'ipes'
  if (id === 'e2133-ipes') {
    headwordLines.push(`  'ipes': { nameKo: '${safeNameKo}', nameKoShort: '${safeNameKoShort}', nameFr: '${safeNameFr}', nameEn: '${safeNameEn}' },`);
    metaLines.push(`  'ipes': { category: 'demon', subCategory: 'duke', rank: '지옥의 군주·백작(Prince et Comte)', legions: 36, domains: ${domainsStr} },`);
  }
}

const headwordBlock = headwordLines.join('\n');
const metaBlock = metaLines.join('\n');

const buildScriptPath = 'scripts-build-entries.mjs';
let buildScript = fs.readFileSync(buildScriptPath, 'utf8');

// Insert headwords right before "// J entries curated headwords (p.368-383)"
const jHeadwordMarker = '  // J entries curated headwords (p.368-383)';
if (!buildScript.includes(jHeadwordMarker)) {
  throw new Error(`Could not find J headword marker: ${jHeadwordMarker}`);
}
buildScript = buildScript.replace(jHeadwordMarker, `${headwordBlock}\n${jHeadwordMarker}`);

// Insert metadata right before "// J entries curated metadata (p.368-383)"
const jMetaMarker = '  // J entries curated metadata (p.368-383)';
if (!buildScript.includes(jMetaMarker)) {
  throw new Error(`Could not find J meta marker: ${jMetaMarker}`);
}
buildScript = buildScript.replace(jMetaMarker, `${metaBlock}\n${jMetaMarker}`);

fs.writeFileSync(buildScriptPath, buildScript, 'utf8');
console.log(`Successfully injected I curated headwords and metadata into ${buildScriptPath}`);
