import fs from 'fs';
import { curatedBBatch1 } from './curate-b-batch1.mjs';
import { curatedBBatch2 } from './curate-b-batch2.mjs';
import { curatedBBatch3 } from './curate-b-batch3.mjs';
import { curatedBBatch4 } from './curate-b-batch4.mjs';
import { curatedBBatch5 } from './curate-b-batch5.mjs';
import { curatedBBatch6 } from './curate-b-batch6.mjs';

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
  'e426-baian': 'Baïan (Texte)',
  'e428-baian': 'Baïan (Gravure)',
};

const PLATE_68_MAP = {
  'e415-bael': {
    plateId: 'bael',
    subCategory: 'monarch',
    rank: '지옥 제국의 제1왕 (Premier Roi)',
    legions: 66,
  },
  'e434-balan': {
    plateId: 'balan',
    subCategory: 'monarch',
    rank: '지옥의 대왕 (Grand Roi)',
    legions: 40,
  },
  'e454-barbatos': {
    plateId: 'barbatos',
    subCategory: 'duke',
    rank: '지옥의 공작·백작 (Duc et Comte)',
    legions: 30,
  },
  'e508-behemoth': {
    plateId: 'behemoth',
    subCategory: 'monarch',
    rank: '지옥의 대술잔지기 (Grand Échanson)',
    legions: 0,
  },
  'e527-belphegor': {
    plateId: 'belphegor',
    subCategory: 'monarch',
    rank: '발견과 발명·나태의 악마 (Démon des découvertes)',
    legions: 0,
  },
  'e530-belzebuth': {
    plateId: 'belzebuth',
    subCategory: 'monarch',
    rank: '지옥 제국의 최고 군주 (Prince des Démons)',
    legions: 66,
  },
  'e542-berith': {
    plateId: 'berith',
    subCategory: 'duke',
    rank: '지옥의 대공 (Grand-Duc)',
    legions: 26,
  },
  'e724-buer': {
    plateId: 'buer',
    subCategory: 'duke',
    rank: '지옥의 총재 (Président)',
    legions: 50,
  },
};

const entriesRaw = JSON.parse(fs.readFileSync('resources/entries_1863_all.json', 'utf8'));
const rawBEntries = [];
entriesRaw.forEach((raw, idx) => {
  if (raw.letter === 'B') {
    const slugBase = norm(raw.nameFr).slice(0, 28) || `entry${idx + 1}`;
    const uncuratedId = `e${idx + 1}-${slugBase}`;
    rawBEntries.push({ idx: idx + 1, id: uncuratedId, raw });
  }
});

const ALL_B_ENTRIES = [
  ...curatedBBatch1,
  ...curatedBBatch2,
  ...curatedBBatch3,
  ...curatedBBatch4,
  ...curatedBBatch5,
  ...curatedBBatch6,
];
console.log(`Loaded ${ALL_B_ENTRIES.length} curated B entries across 6 batches.`);
console.log(`Loaded ${rawBEntries.length} raw B entries from entries_1863_all.json.`);

if (ALL_B_ENTRIES.length !== rawBEntries.length) {
  throw new Error(`Count mismatch: curated=${ALL_B_ENTRIES.length}, raw=${rawBEntries.length}`);
}

// Track duplicate normText so we don't store ambiguous text keys in cache
const textCounts = new Map();
for (const { raw } of rawBEntries) {
  if (raw && raw.textFr) {
    const normText = raw.textFr.trim().replace(/\s+/g, ' ');
    textCounts.set(normText, (textCounts.get(normText) || 0) + 1);
  }
}

// 1. Update translations_ko_cache.json
const cachePath = 'resources/translations_ko_cache.json';
const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

for (let i = 0; i < ALL_B_ENTRIES.length; i++) {
  const e = ALL_B_ENTRIES[i];
  const { id, raw } = rawBEntries[i];
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
console.log(`Updated B entries in ${cachePath}`);

// 2. Build rules for scripts-build-entries.mjs
const headwordLines = [
  '  // B entries curated headwords (p.69-125)'
];
const metaLines = [
  '  // B entries curated metadata (p.69-125)'
];

for (let i = 0; i < ALL_B_ENTRIES.length; i++) {
  const e = ALL_B_ENTRIES[i];
  const { id, raw } = rawBEntries[i];

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

// Remove previous B blocks if re-running
buildScript = buildScript.replace(/  \/\/ B entries curated headwords \(p\.69-125\)[\s\S]*?(?=  \/\/ C entries curated headwords)/, '');
buildScript = buildScript.replace(/  \/\/ B entries curated metadata \(p\.69-125\)[\s\S]*?(?=  \/\/ C entries curated metadata)/, '');

const cHeadwordMarker = '  // C entries curated headwords (p.125-193)';
if (!buildScript.includes(cHeadwordMarker)) {
  throw new Error(`Could not find C headword marker: ${cHeadwordMarker}`);
}
buildScript = buildScript.replace(cHeadwordMarker, `${headwordBlock}\n${cHeadwordMarker}`);

const cMetaMarker = '  // C entries curated metadata (p.125-193)';
if (!buildScript.includes(cMetaMarker)) {
  throw new Error(`Could not find C meta marker: ${cMetaMarker}`);
}
buildScript = buildScript.replace(cMetaMarker, `${metaBlock}\n${cMetaMarker}`);

fs.writeFileSync(buildScriptPath, buildScript, 'utf8');
console.log(`Successfully injected B curated headwords and metadata into ${buildScriptPath}`);
