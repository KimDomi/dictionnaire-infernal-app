import fs from 'fs';
import { curatedCBatch1 } from './curate-c-batch1.mjs';
import { curatedCBatch2 } from './curate-c-batch2.mjs';
import { curatedCBatch3 } from './curate-c-batch3.mjs';
import { curatedCBatch4 } from './curate-c-batch4.mjs';
import { curatedCBatch5 } from './curate-c-batch5.mjs';
import { curatedCBatch6 } from './curate-c-batch6.mjs';
import { curatedCBatch7 } from './curate-c-batch7.mjs';
import { curatedCBatch8 } from './curate-c-batch8.mjs';

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
  'e950-charlesii': 'Charles II (Duc de Lorraine)',
  'e952-charlesii': 'Charles II (Roi d’Angleterre)',
};

const PLATE_68_MAP = {
  'e743-caacrinolaas': {
    plateId: 'caacrinolaas',
    subCategory: 'duke',
    rank: '지옥의 대총재 (Grand Président)',
    legions: 36,
  },
  'e773-cali': {
    plateId: 'cali',
    subCategory: 'myth',
    rank: '인도 지옥의 여왕 (Reine des démons chez les Indiens)',
    legions: 0,
  },
  'e872-caym': {
    plateId: 'caym',
    subCategory: 'duke',
    rank: '지옥의 대총재 (Grand Président)',
    legions: 30,
  },
  'e889-cerbere': {
    plateId: 'cerbere',
    subCategory: 'duke',
    rank: '지옥의 용맹한 후작 · 나베리우스 (Marquis puissant)',
    legions: 19,
  },
  'e1173-crapaud': {
    plateId: 'crapaud',
    subCategory: 'myth',
    rank: '사바트의 사역마 두꺼비 (Animal familier du Sabbat)',
    legions: 0,
  },
};

const entriesRaw = JSON.parse(fs.readFileSync('resources/entries_1863_all.json', 'utf8'));
const rawCEntries = [];
entriesRaw.forEach((raw, idx) => {
  if (raw.letter === 'C') {
    const slugBase = norm(raw.nameFr).slice(0, 28) || `entry${idx + 1}`;
    const uncuratedId = `e${idx + 1}-${slugBase}`;
    rawCEntries.push({ idx: idx + 1, id: uncuratedId, raw });
  }
});

const ALL_C_ENTRIES = [
  ...curatedCBatch1,
  ...curatedCBatch2,
  ...curatedCBatch3,
  ...curatedCBatch4,
  ...curatedCBatch5,
  ...curatedCBatch6,
  ...curatedCBatch7,
  ...curatedCBatch8,
];
console.log(`Loaded ${ALL_C_ENTRIES.length} curated C entries across 8 batches.`);
console.log(`Loaded ${rawCEntries.length} raw C entries from entries_1863_all.json.`);

if (ALL_C_ENTRIES.length !== rawCEntries.length) {
  throw new Error(`Count mismatch: curated=${ALL_C_ENTRIES.length}, raw=${rawCEntries.length}`);
}

// Track duplicate normText so we don't store ambiguous text keys in cache
const textCounts = new Map();
for (const { raw } of rawCEntries) {
  if (raw && raw.textFr) {
    const normText = raw.textFr.trim().replace(/\s+/g, ' ');
    textCounts.set(normText, (textCounts.get(normText) || 0) + 1);
  }
}

// 1. Update translations_ko_cache.json
const cachePath = 'resources/translations_ko_cache.json';
const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

for (let i = 0; i < ALL_C_ENTRIES.length; i++) {
  const e = ALL_C_ENTRIES[i];
  const { id, raw } = rawCEntries[i];
  if (e.id !== id) {
    throw new Error(`ID mismatch at ${i}: ${e.id} vs ${id}`);
  }
  if (e.bodyKo) {
    cache[id] = e.bodyKo;
    if (raw && raw.textFr) {
      const normText = raw.textFr.trim().replace(/\s+/g, ' ');
      if (normText.length > 0 && !DISAMBIG_FR[id] && textCounts.get(normText) === 1) {
        cache[normText] = e.bodyKo;
      }
    }
    if (PLATE_68_MAP[id]) {
      cache[PLATE_68_MAP[id].plateId] = e.bodyKo;
    }
  }
}
fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
console.log(`Updated C entries in ${cachePath}`);

// 2. Build rules for scripts-build-entries.mjs
const headwordLines = [
  '  // C entries curated headwords (p.125-193)'
];
const metaLines = [
  '  // C entries curated metadata (p.125-193)'
];

for (let i = 0; i < ALL_C_ENTRIES.length; i++) {
  const e = ALL_C_ENTRIES[i];
  const { id, raw } = rawCEntries[i];

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

// Remove legacy override lines in C
buildScript = buildScript.replace(/^\s*'e973-chax':.*\n/gm, '');
buildScript = buildScript.replace(/^\s*'e95[02]-charlesii':.*\n/gm, '');

// Remove previous C blocks if re-running
buildScript = buildScript.replace(/  \/\/ C entries curated headwords \(p\.125-193\)[\s\S]*?(?=  \/\/ D entries curated headwords)/, '');
buildScript = buildScript.replace(/  \/\/ C entries curated metadata \(p\.125-193\)[\s\S]*?(?=  \/\/ D entries curated metadata)/, '');

const dHeadwordMarker = '  // D entries curated headwords (p.193-225)';
if (!buildScript.includes(dHeadwordMarker)) {
  throw new Error(`Could not find D headword marker: ${dHeadwordMarker}`);
}
buildScript = buildScript.replace(dHeadwordMarker, `${headwordBlock}\n${dHeadwordMarker}`);

const dMetaMarker = '  // D entries curated metadata (p.193-225)';
if (!buildScript.includes(dMetaMarker)) {
  throw new Error(`Could not find D meta marker: ${dMetaMarker}`);
}
buildScript = buildScript.replace(dMetaMarker, `${metaBlock}\n${dMetaMarker}`);

fs.writeFileSync(buildScriptPath, buildScript, 'utf8');
console.log(`Successfully injected C curated headwords and metadata into ${buildScriptPath}`);
