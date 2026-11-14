import fs from 'fs';
import { curatedFBatch1 } from './curate-f-batch1.mjs';
import { curatedFBatch2 } from './curate-f-batch2.mjs';
import { curatedFBatch3 } from './curate-f-batch3.mjs';

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[^a-z0-9]/g, '');
}

const DISAMBIG_FR = {};

const PLATE_68_MAP = {
  'e1645-flaga': { plateId: 'flaga', subCategory: 'myth', rank: '스칸디나비아 전승의 폭풍 요정(Flaga)', legions: 0 },
  'e1649-flauros': { plateId: 'flauros', subCategory: 'duke', rank: '지옥의 대장군(Grand Général)', legions: 20 },
  'e1676-forcas': { plateId: 'forcas', subCategory: 'duke', rank: '지옥의 기사 겸 대총재(Chevalier et Grand Président)', legions: 29 },
  'e1714-furfur': { plateId: 'furfur', subCategory: 'duke', rank: '지옥의 백작(Comte aux Enfers)', legions: 26 },
};

const entriesRaw = JSON.parse(fs.readFileSync('resources/entries_1863_all.json', 'utf8'));
const rawFEntries = [];
entriesRaw.forEach((raw, idx) => {
  if (raw.letter === 'F') {
    const slugBase = norm(raw.nameFr).slice(0, 28) || `entry${idx + 1}`;
    const uncuratedId = `e${idx + 1}-${slugBase}`;
    rawFEntries.push({ idx: idx + 1, id: uncuratedId, raw });
  }
});

const ALL_F_ENTRIES = [...curatedFBatch1, ...curatedFBatch2, ...curatedFBatch3];
console.log(`Loaded ${ALL_F_ENTRIES.length} curated F entries across 3 batches.`);
console.log(`Loaded ${rawFEntries.length} raw F entries from entries_1863_all.json.`);

if (ALL_F_ENTRIES.length !== rawFEntries.length) {
  throw new Error(`Count mismatch: curated=${ALL_F_ENTRIES.length}, raw=${rawFEntries.length}`);
}

// 1. Update translations_ko_cache.json
const cachePath = 'resources/translations_ko_cache.json';
const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

for (let i = 0; i < ALL_F_ENTRIES.length; i++) {
  const e = ALL_F_ENTRIES[i];
  const { id, raw } = rawFEntries[i];
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
console.log(`Updated F entries in ${cachePath}`);

// 2. Build rules for scripts-build-entries.mjs
const headwordLines = [
  '  // F entries curated headwords (p.257-290)'
];
const metaLines = [
  '  // F entries curated metadata (p.257-290)'
];

for (let i = 0; i < ALL_F_ENTRIES.length; i++) {
  const e = ALL_F_ENTRIES[i];
  const { id, raw } = rawFEntries[i];

  const match = e.nameKo.match(/^\[(.*?) \/ (.*?)\]$/);
  if (!match) {
    throw new Error(`Invalid nameKo format at ${id}: ${e.nameKo}`);
  }
  const shortKo = match[1];
  const en = match[2];
  if (shortKo.includes(' / ') || en.includes(' / ') || /[가-힣]/.test(en)) {
    throw new Error(`Invalid slash or Korean in nameEn at ${id}: ${e.nameKo}`);
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

buildScript = buildScript.replace(/  \/\/ F entries curated headwords \(p\.257-290\)[\s\S]*?(?=  \/\/ G entries curated headwords)/, '');
buildScript = buildScript.replace(/  \/\/ F entries curated metadata \(p\.257-290\)[\s\S]*?(?=  \/\/ G entries curated metadata)/, '');

const gHeadwordMarker = '  // G entries curated headwords (p.290-316)';
if (!buildScript.includes(gHeadwordMarker)) {
  throw new Error(`Could not find G headword marker: ${gHeadwordMarker}`);
}
buildScript = buildScript.replace(gHeadwordMarker, `${headwordBlock}\n${gHeadwordMarker}`);

const gMetaMarker = '  // G entries curated metadata (p.290-316)';
if (!buildScript.includes(gMetaMarker)) {
  throw new Error(`Could not find G meta marker: ${gMetaMarker}`);
}
buildScript = buildScript.replace(gMetaMarker, `${metaBlock}\n${gMetaMarker}`);

fs.writeFileSync(buildScriptPath, buildScript, 'utf8');
console.log(`Successfully injected F curated headwords and metadata into ${buildScriptPath}`);
