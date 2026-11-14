import fs from 'fs';
import { curatedABatch1 } from './curate-a-batch1.mjs';
import { curatedABatch2 } from './curate-a-batch2.mjs';
import { curatedABatch3 } from './curate-a-batch3.mjs';
import { curatedABatch4 } from './curate-a-batch4.mjs';
import { curatedABatch5 } from './curate-a-batch5.mjs';
import { curatedABatch6 } from './curate-a-batch6.mjs';
import { curatedABatch7 } from './curate-a-batch7.mjs';

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
  'e224-anneeplatonique': 'Année platonique (Texte)',
  'e226-anneeplatonique': 'Année platonique (Gravure)',
  'e225-anneeclimaterique': 'Année climatérique (I : Superstition)',
  'e227-anneeclimaterique': 'Année climatérique (II : Période septénaire)',
};

const PLATE_68_MAP = {
  'e16-abigor': {
    plateId: 'abigor',
    subCategory: 'duke',
    rank: '지옥의 대공 (Grand-Duc)',
    legions: 60,
  },
  'e22-abracax': {
    plateId: 'abraxas',
    subCategory: 'monarch',
    rank: '영지주의 최고신·바실리데스파 주신 (Abraxas)',
    legions: 365,
  },
  'e56-adramelech': {
    plateId: 'adramelech',
    subCategory: 'monarch',
    rank: '지옥의 대법관·최고평의회 의장 (Grand Chancelier)',
    legions: 0,
  },
  'e74-aguares': {
    plateId: 'aguares',
    subCategory: 'duke',
    rank: '지옥 동부의 대공 (Grand-Duc)',
    legions: 31,
  },
  'e89-alastor': {
    plateId: 'alastor',
    subCategory: 'spirit',
    rank: '지옥 군주국의 최고 형집행관 (Suprême exécuteur)',
    legions: 0,
  },
  'e132-alocer': {
    plateId: 'alocer',
    subCategory: 'duke',
    rank: '지옥의 대공 (Grand-Duc)',
    legions: 36,
  },
  'e159-amduscias': {
    plateId: 'amduscias',
    subCategory: 'duke',
    rank: '지옥의 대공 (Grand-Duc)',
    legions: 29,
  },
  'e170-amon': {
    plateId: 'amon',
    subCategory: 'duke',
    rank: '지옥의 대후작 (Grand Marquis)',
    legions: 40,
  },
  'e196-andras': {
    plateId: 'andras',
    subCategory: 'duke',
    rank: '지옥의 대후작 (Grand Marquis)',
    legions: 30,
  },
  'e323-asmodee': {
    plateId: 'asmodee',
    subCategory: 'monarch',
    rank: '지옥의 강력한 왕·도박장의 총감독 (Roi puissant)',
    legions: 72,
  },
  'e335-astaroth': {
    plateId: 'astaroth',
    subCategory: 'monarch',
    rank: '지옥의 대공·최고 재무관 (Grand Trésorier)',
    legions: 40,
  },
  'e393-azazel': {
    plateId: 'azazel',
    subCategory: 'spirit',
    rank: '지옥군의 수석 기수·속죄양의 수호자 (Premier porte-étendard)',
    legions: 0,
  },
};

const entriesRaw = JSON.parse(fs.readFileSync('resources/entries_1863_all.json', 'utf8'));
const rawAEntries = [];
entriesRaw.forEach((raw, idx) => {
  if (raw.letter === 'A') {
    const slugBase = norm(raw.nameFr).slice(0, 28) || `entry${idx + 1}`;
    const uncuratedId = `e${idx + 1}-${slugBase}`;
    rawAEntries.push({ idx: idx + 1, id: uncuratedId, raw });
  }
});

const ALL_A_ENTRIES = [
  ...curatedABatch1,
  ...curatedABatch2,
  ...curatedABatch3,
  ...curatedABatch4,
  ...curatedABatch5,
  ...curatedABatch6,
  ...curatedABatch7,
];
console.log(`Loaded ${ALL_A_ENTRIES.length} curated A entries across 7 batches.`);
console.log(`Loaded ${rawAEntries.length} raw A entries from entries_1863_all.json.`);

if (ALL_A_ENTRIES.length !== rawAEntries.length) {
  throw new Error(`Count mismatch: curated=${ALL_A_ENTRIES.length}, raw=${rawAEntries.length}`);
}

const textCounts = new Map();
for (const { raw } of rawAEntries) {
  if (raw && raw.textFr) {
    const normText = raw.textFr.trim().replace(/\s+/g, ' ');
    textCounts.set(normText, (textCounts.get(normText) || 0) + 1);
  }
}

// 1. Update translations_ko_cache.json
const cachePath = 'resources/translations_ko_cache.json';
const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

for (let i = 0; i < ALL_A_ENTRIES.length; i++) {
  const e = ALL_A_ENTRIES[i];
  const { id, raw } = rawAEntries[i];
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
console.log(`Updated A entries in ${cachePath}`);

// 2. Build rules for scripts-build-entries.mjs
const headwordLines = [
  '  // A entries curated headwords (p.1-68)'
];
const metaLines = [
  '  // A entries curated metadata (p.1-68)'
];

for (let i = 0; i < ALL_A_ENTRIES.length; i++) {
  const e = ALL_A_ENTRIES[i];
  const { id, raw } = rawAEntries[i];

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

// Strip legacy A headword/meta lines for e225/e227
buildScript = buildScript.replace(/^[ \t]*'e22[57]-anneeclimaterique':.*\n/gm, '');

// Remove previous A blocks if re-running
buildScript = buildScript.replace(/  \/\/ A entries curated headwords \(p\.1-68\)[\s\S]*?(?=  \/\/ B entries curated headwords)/, '');
buildScript = buildScript.replace(/  \/\/ A entries curated metadata \(p\.1-68\)[\s\S]*?(?=  \/\/ B entries curated metadata)/, '');

const bHeadwordMarker = '  // B entries curated headwords (p.69-125)';
if (!buildScript.includes(bHeadwordMarker)) {
  throw new Error(`Could not find B headword marker: ${bHeadwordMarker}`);
}
buildScript = buildScript.replace(bHeadwordMarker, `${headwordBlock}\n${bHeadwordMarker}`);

const bMetaMarker = '  // B entries curated metadata (p.69-125)';
if (!buildScript.includes(bMetaMarker)) {
  throw new Error(`Could not find B meta marker: ${bMetaMarker}`);
}
buildScript = buildScript.replace(bMetaMarker, `${metaBlock}\n${bMetaMarker}`);

fs.writeFileSync(buildScriptPath, buildScript, 'utf8');
console.log(`Successfully injected A curated headwords and metadata into ${buildScriptPath}`);
