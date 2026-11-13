import fs from 'fs';
import { curatedJBatch1 } from './curate-j-batch1.mjs';
import { curatedJBatch2 } from './curate-j-batch2.mjs';

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
const rawJEntries = [];
entriesRaw.forEach((raw, idx) => {
  if (raw.letter === 'J') {
    const slugBase = norm(raw.nameFr).slice(0, 28) || `entry${idx + 1}`;
    const uncuratedId = `e${idx + 1}-${slugBase}`;
    rawJEntries.push({ idx: idx + 1, id: uncuratedId, raw });
  }
});

const ALL_J_ENTRIES = [...curatedJBatch1, ...curatedJBatch2];
console.log(`Loaded ${ALL_J_ENTRIES.length} curated J entries across 2 batches.`);
console.log(`Loaded ${rawJEntries.length} raw J entries from entries_1863_all.json.`);

if (ALL_J_ENTRIES.length !== rawJEntries.length) {
  throw new Error(`Count mismatch: curated=${ALL_J_ENTRIES.length}, raw=${rawJEntries.length}`);
}

// 1. Update translations_ko_cache.json
const cachePath = 'resources/translations_ko_cache.json';
const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

for (let i = 0; i < ALL_J_ENTRIES.length; i++) {
  const e = ALL_J_ENTRIES[i];
  const { id, raw } = rawJEntries[i];
  if (e.bodyKo) {
    cache[id] = e.bodyKo;
    if (raw && raw.textFr) {
      const normText = raw.textFr.trim().replace(/\s+/g, ' ');
      cache[normText] = e.bodyKo;
    }
  }
}
fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
console.log(`Updated J entries in ${cachePath}`);

// 2. Build rules for scripts-build-entries.mjs
const headwordLines = [
  '  // J entries curated headwords (p.368-383)'
];
const metaLines = [
  '  // J entries curated metadata (p.368-383)'
];

for (let i = 0; i < ALL_J_ENTRIES.length; i++) {
  const e = ALL_J_ENTRIES[i];
  const { id, raw } = rawJEntries[i];

  // Specific handling for the 4 disambiguated Jean entries on page 373
  let fullKo = '';
  let shortKo = '';
  let en = '';
  let fr = raw.nameFr;

  if (id === 'e2167-jean') {
    fullKo = '마법사 장 [Jean (Magicien) / John the Magician]';
    shortKo = '마법사 장';
    en = 'John the Magician';
    fr = 'Jean (Magicien)';
  } else if (id === 'e2168-jean') {
    fullKo = '총대주교 장 [Jean (Patriarche de Constantinople)]';
    shortKo = '총대주교 장';
    en = '';
    fr = 'Jean (Patriarche de Constantinople)';
  } else if (id === 'e2169-jeanxxii') {
    fullKo = '요한 22세 [Jean XXII / Pope John XXII]';
    shortKo = '요한 22세';
    en = 'Pope John XXII';
    fr = 'Jean XXII';
  } else if (id === 'e2170-jean') {
    fullKo = '이반 뇌제 또는 장 [Jean, Iwan Basilowitz / Ivan the Terrible]';
    shortKo = '이반 뇌제 또는 장';
    en = 'Ivan the Terrible';
    fr = 'Jean, Iwan Basilowitz';
  } else {
    const match = e.nameKo.match(/^\[(.*?) \/ (.*?)\]$/);
    if (match) {
      shortKo = match[1];
      en = match[2];
    } else {
      shortKo = e.nameKo.replace(/[\[\]]/g, '');
    }
    fullKo = `${shortKo} [${raw.nameFr} / ${en}]`;
  }

  const safeNameKo = fullKo.replace(/'/g, "\\'");
  const safeNameKoShort = shortKo.replace(/'/g, "\\'");
  const safeNameFr = fr.replace(/'/g, "\\'");
  const safeNameEn = en.replace(/'/g, "\\'");
  headwordLines.push(`  '${id}': { nameKo: '${safeNameKo}', nameKoShort: '${safeNameKoShort}', nameFr: '${safeNameFr}', nameEn: '${safeNameEn}' },`);

  const domainsStr = JSON.stringify(e.domain || []);
  const safeRank = (e.summary || '').replace(/'/g, "\\'");
  metaLines.push(`  '${id}': { category: '${e.category}', rank: '${safeRank}', domains: ${domainsStr} },`);
}

const headwordBlock = headwordLines.join('\n');
const metaBlock = metaLines.join('\n');

const buildScriptPath = 'scripts-build-entries.mjs';
let buildScript = fs.readFileSync(buildScriptPath, 'utf8');

// Insert headwords right before "// K entries curated headwords (p.383-395)"
const kHeadwordMarker = '  // K entries curated headwords (p.383-395)';
if (!buildScript.includes(kHeadwordMarker)) {
  throw new Error(`Could not find K headword marker: ${kHeadwordMarker}`);
}
buildScript = buildScript.replace(kHeadwordMarker, `${headwordBlock}\n${kHeadwordMarker}`);

// Insert metadata right before "// K entries curated metadata (p.383-395)"
const kMetaMarker = '  // K entries curated metadata (p.383-395)';
if (!buildScript.includes(kMetaMarker)) {
  throw new Error(`Could not find K meta marker: ${kMetaMarker}`);
}
buildScript = buildScript.replace(kMetaMarker, `${metaBlock}\n${kMetaMarker}`);

fs.writeFileSync(buildScriptPath, buildScript, 'utf8');
console.log(`Successfully injected J curated headwords and metadata into ${buildScriptPath}`);
