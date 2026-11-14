import fs from 'fs';
import { curatedEBatch1 } from './curate-e-batch1.mjs';
import { curatedEBatch2 } from './curate-e-batch2.mjs';
import { curatedEBatch3 } from './curate-e-batch3.mjs';

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
  'e1557-eurynome': {
    plateId: 'eurynome',
    subCategory: 'spirit',
    rank: '죽음의 군주·파리 훈장 대십자장(Prince de la Mort, Grand-Croix de l\'ordre de la Mouche)',
    legions: 0,
  },
};

const entriesRaw = JSON.parse(fs.readFileSync('resources/entries_1863_all.json', 'utf8'));
const rawEEntries = [];
entriesRaw.forEach((raw, idx) => {
  if (raw.letter === 'E') {
    const slugBase = norm(raw.nameFr).slice(0, 28) || `entry${idx + 1}`;
    const uncuratedId = `e${idx + 1}-${slugBase}`;
    rawEEntries.push({ idx: idx + 1, id: uncuratedId, raw });
  }
});

const ALL_E_ENTRIES = [...curatedEBatch1, ...curatedEBatch2, ...curatedEBatch3];
console.log(`Loaded ${ALL_E_ENTRIES.length} curated E entries across 3 batches.`);
console.log(`Loaded ${rawEEntries.length} raw E entries from entries_1863_all.json.`);

if (ALL_E_ENTRIES.length !== rawEEntries.length) {
  throw new Error(`Count mismatch: curated=${ALL_E_ENTRIES.length}, raw=${rawEEntries.length}`);
}

// 1. Update translations_ko_cache.json
const cachePath = 'resources/translations_ko_cache.json';
const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

for (let i = 0; i < ALL_E_ENTRIES.length; i++) {
  const e = ALL_E_ENTRIES[i];
  const { id, raw } = rawEEntries[i];
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
console.log(`Updated E entries in ${cachePath}`);

// 2. Build rules for scripts-build-entries.mjs
const headwordLines = [
  '  // E entries curated headwords (p.224-257)'
];
const metaLines = [
  '  // E entries curated metadata (p.224-257)'
];

for (let i = 0; i < ALL_E_ENTRIES.length; i++) {
  const e = ALL_E_ENTRIES[i];
  const { id, raw } = rawEEntries[i];

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

buildScript = buildScript.replace(/  \/\/ E entries curated headwords \(p\.224-257\)[\s\S]*?(?=  \/\/ F entries curated headwords)/, '');
buildScript = buildScript.replace(/  \/\/ E entries curated metadata \(p\.224-257\)[\s\S]*?(?=  \/\/ F entries curated metadata)/, '');

const fHeadwordMarker = '  // F entries curated headwords (p.257-290)';
if (!buildScript.includes(fHeadwordMarker)) {
  throw new Error(`Could not find F headword marker: ${fHeadwordMarker}`);
}
buildScript = buildScript.replace(fHeadwordMarker, `${headwordBlock}\n${fHeadwordMarker}`);

const fMetaMarker = '  // F entries curated metadata (p.257-290)';
if (!buildScript.includes(fMetaMarker)) {
  throw new Error(`Could not find F meta marker: ${fMetaMarker}`);
}
buildScript = buildScript.replace(fMetaMarker, `${metaBlock}\n${fMetaMarker}`);

fs.writeFileSync(buildScriptPath, buildScript, 'utf8');
console.log(`Successfully injected E curated headwords and metadata into ${buildScriptPath}`);
