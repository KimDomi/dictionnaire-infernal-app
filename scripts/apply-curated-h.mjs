import fs from 'fs';
import { curatedHBatch1 } from './curate-h-batch1.mjs';
import { curatedHBatch2 } from './curate-h-batch2.mjs';
import { curatedHBatch3 } from './curate-h-batch3.mjs';

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[^a-z0-9]/g, '');
}

const DISAMBIG_FR = {
  'e1976-helene': 'Hélène, Oléine',
  'e1977-helene': 'Hélène, Sélène',
  'e1989-henriiii': 'Henri III (Roi de France)',
  'e1990-henriiii': 'Henri III (Empereur d’Allemagne)',
  'e1991-henriiv': 'Henri IV (Empereur d’Allemagne)',
  'e1992-henriiv': 'Henri IV (Roi d’Angleterre)',
  'e1994-henriiv': 'Henri IV (Roi de France)',
};

const entriesRaw = JSON.parse(fs.readFileSync('resources/entries_1863_all.json', 'utf8'));
const rawHEntries = [];
entriesRaw.forEach((raw, idx) => {
  if (raw.letter === 'H') {
    const slugBase = norm(raw.nameFr).slice(0, 28) || `entry${idx + 1}`;
    const uncuratedId = `e${idx + 1}-${slugBase}`;
    rawHEntries.push({ idx: idx + 1, id: uncuratedId, raw });
  }
});

const ALL_H_ENTRIES = [...curatedHBatch1, ...curatedHBatch2, ...curatedHBatch3];
console.log(`Loaded ${ALL_H_ENTRIES.length} curated H entries across 3 batches.`);
console.log(`Loaded ${rawHEntries.length} raw H entries from entries_1863_all.json.`);

if (ALL_H_ENTRIES.length !== rawHEntries.length) {
  throw new Error(`Count mismatch: curated=${ALL_H_ENTRIES.length}, raw=${rawHEntries.length}`);
}

// 1. Update translations_ko_cache.json
const cachePath = 'resources/translations_ko_cache.json';
const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

for (let i = 0; i < ALL_H_ENTRIES.length; i++) {
  const e = ALL_H_ENTRIES[i];
  const { id, raw } = rawHEntries[i];
  if (e.id !== id) {
    throw new Error(`ID mismatch at ${i}: ${e.id} vs ${id}`);
  }
  if (e.bodyKo) {
    cache[id] = e.bodyKo;
    if (raw && raw.textFr) {
      const normText = raw.textFr.trim().replace(/\s+/g, ' ');
      cache[normText] = e.bodyKo;
    }
    if (id === 'e1938-haborym') {
      cache['haborym'] = e.bodyKo;
    }
  }
}
fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
console.log(`Updated H entries in ${cachePath}`);

// 2. Build rules for scripts-build-entries.mjs
const headwordLines = [
  '  // H entries curated headwords (p.316-350)'
];
const metaLines = [
  '  // H entries curated metadata (p.316-350)'
];

for (let i = 0; i < ALL_H_ENTRIES.length; i++) {
  const e = ALL_H_ENTRIES[i];
  const { id, raw } = rawHEntries[i];

  const match = e.nameKo.match(/^\[(.*?) \/ (.*?)\]$/);
  let shortKo = e.nameKo;
  let en = '';
  if (match) {
    shortKo = match[1];
    en = match[2];
  } else {
    shortKo = e.nameKo.replace(/[\[\]]/g, '');
  }
  const nameFrDisplay = DISAMBIG_FR[id] || raw.nameFr;
  const fullKo = `${shortKo} [${nameFrDisplay} / ${en}]`;

  const safeNameKo = fullKo.replace(/'/g, "\\'");
  const safeNameKoShort = shortKo.replace(/'/g, "\\'");
  const safeNameFr = nameFrDisplay.replace(/'/g, "\\'");
  const safeNameEn = en.replace(/'/g, "\\'");
  headwordLines.push(`  '${id}': { nameKo: '${safeNameKo}', nameKoShort: '${safeNameKoShort}', nameFr: '${safeNameFr}', nameEn: '${safeNameEn}' },`);

  const domainsStr = JSON.stringify(e.domain || []);
  const safeRank = (e.summary || '').replace(/'/g, "\\'");
  const legionsPart = e.legions !== undefined ? ` legions: ${e.legions},` : '';
  metaLines.push(`  '${id}': { category: '${e.category}', rank: '${safeRank}',${legionsPart} domains: ${domainsStr} },`);

  // Extra rule for 68-plate 'haborym'
  if (id === 'e1938-haborym') {
    headwordLines.push(`  'haborym': { nameKo: '${safeNameKo}', nameKoShort: '${safeNameKoShort}', nameFr: '${safeNameFr}', nameEn: '${safeNameEn}' },`);
    metaLines.push(`  'haborym': { category: 'demon', subCategory: 'duke', rank: '지옥의 공작·방화의 악마(Duc aux Enfers)', legions: 26, domains: ${domainsStr} },`);
  }
}

const headwordBlock = headwordLines.join('\n');
const metaBlock = metaLines.join('\n');

const buildScriptPath = 'scripts-build-entries.mjs';
let buildScript = fs.readFileSync(buildScriptPath, 'utf8');

// Remove previous H block if re-running
buildScript = buildScript.replace(/  \/\/ H entries curated headwords \(p\.316-350\)[\s\S]*?(?=  \/\/ I entries curated headwords)/, '');
buildScript = buildScript.replace(/  \/\/ H entries curated metadata \(p\.316-350\)[\s\S]*?(?=  \/\/ I entries curated metadata)/, '');

const iHeadwordMarker = '  // I entries curated headwords (p.350-368)';
if (!buildScript.includes(iHeadwordMarker)) {
  throw new Error(`Could not find I headword marker: ${iHeadwordMarker}`);
}
buildScript = buildScript.replace(iHeadwordMarker, `${headwordBlock}\n${iHeadwordMarker}`);

const iMetaMarker = '  // I entries curated metadata (p.350-368)';
if (!buildScript.includes(iMetaMarker)) {
  throw new Error(`Could not find I meta marker: ${iMetaMarker}`);
}
buildScript = buildScript.replace(iMetaMarker, `${metaBlock}\n${iMetaMarker}`);

fs.writeFileSync(buildScriptPath, buildScript, 'utf8');
console.log(`Successfully injected H curated headwords and metadata into ${buildScriptPath}`);
