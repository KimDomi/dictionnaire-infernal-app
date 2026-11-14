import fs from 'fs';
import { curatedDBatch1 } from './curate-d-batch1.mjs';
import { curatedDBatch2 } from './curate-d-batch2.mjs';
import { curatedDBatch3 } from './curate-d-batch3.mjs';

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
  'e1231-dansedesfees': 'Danse des fées (Texte)',
  'e1234-dansedesfees': 'Danse des fées (Gravure)',
  'e1233-dansedesmorts': 'Danse des morts I',
  'e1235-dansedesmorts': 'Danse des morts II',
  'e1248-david': 'David (Roi d’Israël)',
  'e1249-david': 'David (Prêtre apostat)',
  'e1291-desbordes': 'Desbordes (Texte)',
  'e1295-desbordes': 'Desbordes (Gravure)',
  'e1294-desfontaines': 'Desfontaines (Pacte I)',
  'e1296-desfontaines': 'Desfontaines (Apparition II)',
  'e1389-duergars': 'Duergars (Gravure)',
  'e1390-leslaponsdisentquedieu': 'Dualisme (Suite : Les Lapons)',
  'e1392-duergars': 'Duergars (Texte)',
};

const PLATE_68_MAP = {
  'e1237-dansedusabbat': {
    plateId: 'sabbath',
    subCategory: 'magic',
    rank: '마녀 사바트의 광란 윤무(Danse du Sabbat)',
    legions: 0,
  },
  'e1305-deumus': {
    plateId: 'deumus',
    subCategory: 'idol',
    rank: '말라바르 칼리쿠트 우상 악신(Divinité infernale de Calicut)',
    legions: 0,
  },
};

const entriesRaw = JSON.parse(fs.readFileSync('resources/entries_1863_all.json', 'utf8'));
const rawDEntries = [];
entriesRaw.forEach((raw, idx) => {
  if (raw.letter === 'D') {
    const slugBase = norm(raw.nameFr).slice(0, 28) || `entry${idx + 1}`;
    const uncuratedId = `e${idx + 1}-${slugBase}`;
    rawDEntries.push({ idx: idx + 1, id: uncuratedId, raw });
  }
});

const ALL_D_ENTRIES = [...curatedDBatch1, ...curatedDBatch2, ...curatedDBatch3];
console.log(`Loaded ${ALL_D_ENTRIES.length} curated D entries across 3 batches.`);
console.log(`Loaded ${rawDEntries.length} raw D entries from entries_1863_all.json.`);

if (ALL_D_ENTRIES.length !== rawDEntries.length) {
  throw new Error(`Count mismatch: curated=${ALL_D_ENTRIES.length}, raw=${rawDEntries.length}`);
}

// 1. Update translations_ko_cache.json
const cachePath = 'resources/translations_ko_cache.json';
const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

for (let i = 0; i < ALL_D_ENTRIES.length; i++) {
  const e = ALL_D_ENTRIES[i];
  const { id, raw } = rawDEntries[i];
  if (e.id !== id) {
    throw new Error(`ID mismatch at ${i}: ${e.id} vs ${id}`);
  }
  if (e.bodyKo) {
    cache[id] = e.bodyKo;
    if (raw && raw.textFr) {
      const normText = raw.textFr.trim().replace(/\s+/g, ' ');
      if (normText.length > 0 && !DISAMBIG_FR[id]) {
        cache[normText] = e.bodyKo;
      }
    }
    if (PLATE_68_MAP[id]) {
      cache[PLATE_68_MAP[id].plateId] = e.bodyKo;
    }
  }
}
fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
console.log(`Updated D entries in ${cachePath}`);

// 2. Build rules for scripts-build-entries.mjs
const headwordLines = [
  '  // D entries curated headwords (p.193-225)'
];
const metaLines = [
  '  // D entries curated metadata (p.193-225)'
];

for (let i = 0; i < ALL_D_ENTRIES.length; i++) {
  const e = ALL_D_ENTRIES[i];
  const { id, raw } = rawDEntries[i];

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

// Remove legacy duplicate override lines for David and Desfontaines
buildScript = buildScript.replace(/^\s*'e124[89]-david':.*\n/gm, '');
buildScript = buildScript.replace(/^\s*'e129[46]-desfontaines':.*\n/gm, '');

// Remove previous D blocks if re-running
buildScript = buildScript.replace(/  \/\/ D entries curated headwords \(p\.193-225\)[\s\S]*?(?=  \/\/ E entries curated headwords)/, '');
buildScript = buildScript.replace(/  \/\/ D entries curated metadata \(p\.193-225\)[\s\S]*?(?=  \/\/ E entries curated metadata)/, '');

const eHeadwordMarker = '  // E entries curated headwords (p.224-257)';
if (!buildScript.includes(eHeadwordMarker)) {
  throw new Error(`Could not find E headword marker: ${eHeadwordMarker}`);
}
buildScript = buildScript.replace(eHeadwordMarker, `${headwordBlock}\n${eHeadwordMarker}`);

const eMetaMarker = '  // E entries curated metadata (p.224-257)';
if (!buildScript.includes(eMetaMarker)) {
  throw new Error(`Could not find E meta marker: ${eMetaMarker}`);
}
buildScript = buildScript.replace(eMetaMarker, `${metaBlock}\n${eMetaMarker}`);

fs.writeFileSync(buildScriptPath, buildScript, 'utf8');
console.log(`Successfully injected D curated headwords and metadata into ${buildScriptPath}`);
