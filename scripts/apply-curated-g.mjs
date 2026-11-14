import fs from 'fs';
import { curatedGBatch1 } from './curate-g-batch1.mjs';
import { curatedGBatch2 } from './curate-g-batch2.mjs';
import { curatedGBatch3 } from './curate-g-batch3.mjs';
import { curatedGBatch4 } from './curate-g-batch4.mjs';

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
  'e1846-godwin': 'Godwin (Comte de Kent)',
  'e1847-godwin': 'Godwin (William)',
};

const PLATE_68_MAP = {
  'e1743-gangagramma': { plateId: 'ganga-gramma', subCategory: 'myth', rank: '인도 민간신앙의 역병·두창 여신(Ganga-Gramma)', legions: 0 },
  'e1759-garuda': { plateId: 'garuda', subCategory: 'myth', rank: '인도 신화의 신조(神鳥) 왕(Garuda)', legions: 0 },
  'e1855-gomory': { plateId: 'gomory', subCategory: 'duke', rank: '지옥의 강대한 공작(Puissant Duc)', legions: 26 },
};

const entriesRaw = JSON.parse(fs.readFileSync('resources/entries_1863_all.json', 'utf8'));
const rawGEntries = [];
entriesRaw.forEach((raw, idx) => {
  if (raw.letter === 'G') {
    const slugBase = norm(raw.nameFr).slice(0, 28) || `entry${idx + 1}`;
    const uncuratedId = `e${idx + 1}-${slugBase}`;
    rawGEntries.push({ idx: idx + 1, id: uncuratedId, raw });
  }
});

const ALL_G_ENTRIES = [...curatedGBatch1, ...curatedGBatch2, ...curatedGBatch3, ...curatedGBatch4];
console.log(`Loaded ${ALL_G_ENTRIES.length} curated G entries across 4 batches.`);
console.log(`Loaded ${rawGEntries.length} raw G entries from entries_1863_all.json.`);

if (ALL_G_ENTRIES.length !== rawGEntries.length) {
  throw new Error(`Count mismatch: curated=${ALL_G_ENTRIES.length}, raw=${rawGEntries.length}`);
}

// 1. Update translations_ko_cache.json
const cachePath = 'resources/translations_ko_cache.json';
const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

for (let i = 0; i < ALL_G_ENTRIES.length; i++) {
  const e = ALL_G_ENTRIES[i];
  const { id, raw } = rawGEntries[i];
  if (e.id !== id) {
    throw new Error(`ID mismatch at ${i}: ${e.id} vs ${id}`);
  }
  if (e.bodyKo) {
    cache[id] = e.bodyKo;
    if (raw && raw.textFr) {
      const normText = raw.textFr.trim().replace(/\s+/g, ' ');
      cache[normText] = e.bodyKo;
    }
    if (PLATE_68_MAP[id]) {
      cache[PLATE_68_MAP[id].plateId] = e.bodyKo;
    }
  }
}
fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
console.log(`Updated G entries in ${cachePath}`);

// 2. Build rules for scripts-build-entries.mjs
const headwordLines = [
  '  // G entries curated headwords (p.290-316)'
];
const metaLines = [
  '  // G entries curated metadata (p.290-316)'
];

for (let i = 0; i < ALL_G_ENTRIES.length; i++) {
  const e = ALL_G_ENTRIES[i];
  const { id, raw } = rawGEntries[i];

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

  if (PLATE_68_MAP[id]) {
    const p = PLATE_68_MAP[id];
    const safePlateRank = p.rank.replace(/'/g, "\\'");
    headwordLines.push(`  '${p.plateId}': { nameKo: '${safeNameKo}', nameKoShort: '${safeNameKoShort}', nameFr: '${safeNameFr}', nameEn: '${safeNameEn}' },`);
    metaLines.push(`  '${p.plateId}': { category: '${e.category}', subCategory: '${p.subCategory}', rank: '${safePlateRank}', legions: ${p.legions}, domains: ${domainsStr} },`);
  }
}

const headwordBlock = headwordLines.join('\n');
const metaBlock = metaLines.join('\n');

const buildScriptPath = 'scripts-build-entries.mjs';
let buildScript = fs.readFileSync(buildScriptPath, 'utf8');

buildScript = buildScript.replace(/  \/\/ G entries curated headwords \(p\.290-316\)[\s\S]*?(?=  \/\/ H entries curated headwords)/, '');
buildScript = buildScript.replace(/  \/\/ G entries curated metadata \(p\.290-316\)[\s\S]*?(?=  \/\/ H entries curated metadata)/, '');

const hHeadwordMarker = '  // H entries curated headwords (p.316-350)';
if (!buildScript.includes(hHeadwordMarker)) {
  throw new Error(`Could not find H headword marker: ${hHeadwordMarker}`);
}
buildScript = buildScript.replace(hHeadwordMarker, `${headwordBlock}\n${hHeadwordMarker}`);

const hMetaMarker = '  // H entries curated metadata (p.316-350)';
if (!buildScript.includes(hMetaMarker)) {
  throw new Error(`Could not find H meta marker: ${hMetaMarker}`);
}
buildScript = buildScript.replace(hMetaMarker, `${metaBlock}\n${hMetaMarker}`);

fs.writeFileSync(buildScriptPath, buildScript, 'utf8');
console.log(`Successfully injected G curated headwords and metadata into ${buildScriptPath}`);
