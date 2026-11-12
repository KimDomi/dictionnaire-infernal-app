import fs from 'node:fs';

const entries = JSON.parse(fs.readFileSync('resources/entries_1863_all.json', 'utf8'));
const cachePath = 'resources/translations_ko_cache.json';
let cache = {};
if (fs.existsSync(cachePath)) {
  try {
    cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  } catch {
    cache = {};
  }
}

// Clear any previously merged/corrupted cache entries that don't match single-entry boundaries
for (const [k, v] of Object.entries(cache)) {
  if (v.includes('[#') || v.includes('@@SEP@@')) {
    delete cache[k];
  }
}

function preprocessFr(nameFr, textFr) {
  let s = `${nameFr} — ${textFr}`;
  if (/^Voy(?:\.|ez)\b/i.test(textFr)) {
    s = `${nameFr} — ${textFr}`;
  }
  s = s
    .replace(/\bClavicules de Salomon\b/gi, 'livre magique « Clavicules de Salomon »')
    .replace(/\bau sabbat\b/gi, 'au sabbat des sorciers')
    .replace(/\ble sabbat\b/gi, 'le sabbat des sorciers')
    .replace(/\bdu sabbat\b/gi, 'du sabbat des sorciers')
    .replace(/\bde la suite de\b/gi, 'du cortège de')
    .replace(/\bVoy\.\s*ce mot\.?/gi, 'Voir cet article.')
    .replace(/\bVoy(?:\.|ez)\s+/gi, 'Voir : ');
  return s;
}

const ENDPOINTS = [
  'https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=fr&tl=ko'
];

let epIdx = 0;

async function translateText(text, retries = 6) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const ep = ENDPOINTS[(epIdx++) % ENDPOINTS.length];
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
        },
        body: new URLSearchParams({ q: text }).toString()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        return data[0].map(x => (Array.isArray(x) ? x[0] : x)).join('');
      }
      if (Array.isArray(data) && typeof data[0] === 'string') {
        return data[0];
      }
      throw new Error('Unexpected response format');
    } catch (err) {
      if (attempt === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1200 * (attempt + 1)));
    }
  }
}

// Group entries into batches of ~6,500 chars
const batches = [];
let currentBatch = [];
let currentLen = 0;

for (let i = 0; i < entries.length; i++) {
  const e = entries[i];
  const key = `${e.nameFr}@@${e.page1863}`;
  if (cache[key]) continue;

  const prep = preprocessFr(e.nameFr, e.textFr);
  if (prep.length > 6500) {
    if (currentBatch.length) {
      batches.push(currentBatch);
      currentBatch = [];
      currentLen = 0;
    }
    batches.push([{ idx: i, key, prep }]);
  } else if (currentLen + prep.length > 6500) {
    batches.push(currentBatch);
    currentBatch = [{ idx: i, key, prep }];
    currentLen = prep.length;
  } else {
    currentBatch.push({ idx: i, key, prep });
    currentLen += prep.length + 20;
  }
}
if (currentBatch.length) batches.push(currentBatch);

console.log(`Total entries: ${entries.length}, Already cached: ${Object.keys(cache).length}, Remaining batches: ${batches.length}`);

const CONCURRENCY = 5;
let completedBatches = 0;

async function processBatch(batch) {
  if (batch.length === 1 && batch[0].prep.length > 6500) {
    const item = batch[0];
    const sentences = item.prep.match(/[^\.!\?]+[\.!\?]+|\s*[^\.!\?]+$/g) || [item.prep];
    const chunks = [];
    let cur = '';
    for (const sent of sentences) {
      if ((cur + sent).length > 3400 && cur) {
        chunks.push(cur);
        cur = sent;
      } else {
        cur += sent;
      }
    }
    if (cur) chunks.push(cur);
    const translatedChunks = [];
    for (const c of chunks) {
      translatedChunks.push(await translateText(c));
    }
    cache[item.key] = translatedChunks.join(' ').replace(/\s+/g, ' ').trim();
  } else {
    // Use unique numeric tags like ((9000)) that never get translated or merged
    const joined = batch.map((b, idx) => `((90${String(idx).padStart(2, '0')})) ${b.prep}`).join('\n\n');
    const trans = await translateText(joined);
    const parts = trans.split(/\(\(\s*90(\d{2})\s*\)\)/);
    for (let k = 1; k < parts.length; k += 2) {
      const bIdx = Number(parts[k]);
      const content = (parts[k + 1] || '').trim();
      if (batch[bIdx] && content) {
        cache[batch[bIdx].key] = content.replace(/\s+/g, ' ').trim();
      }
    }
    for (const b of batch) {
      if (!cache[b.key]) {
        const single = await translateText(b.prep);
        cache[b.key] = single.replace(/\s+/g, ' ').trim();
      }
    }
  }
  completedBatches++;
  if (completedBatches % 20 === 0 || completedBatches === batches.length) {
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
    console.log(`Progress: ${completedBatches} / ${batches.length} batches (${Object.keys(cache).length} entries translated)`);
  }
}

let cursor = 0;
async function worker() {
  while (cursor < batches.length) {
    const b = batches[cursor++];
    await processBatch(b);
    await new Promise(r => setTimeout(r, 150));
  }
}

const start = Date.now();
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
console.log(`Done in ${((Date.now() - start) / 1000).toFixed(1)}s! Total translated: ${Object.keys(cache).length}`);
