import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ENTRIES,VALID_ENTRY_IDS,filterEntries,getDailyEntry} from './dist/entries.js';

assert.equal(ENTRIES.length,68,'Expected 68 illustrated entries from the 1863 edition');
assert.equal(VALID_ENTRY_IDS.size,68,'All entry IDs must be unique');

for(const entry of ENTRIES){
  assert.ok(entry.id&&entry.nameKo&&entry.nameFr,`Missing name fields for ${entry.id}`);
  assert.ok(fs.existsSync(new URL('./dist/'+entry.plate,import.meta.url)),`Missing plate file dist/${entry.plate}`);
}

const monarchs=filterEntries({category:'monarch'});
assert.ok(monarchs.some(e=>e.id==='belzebuth'));
assert.ok(monarchs.some(e=>e.id==='astaroth'));

const searchBuer=filterEntries({query:'뷰에르'});
assert.equal(searchBuer.length,1);
assert.equal(searchBuer[0].id,'buer');

const byLegions=filterEntries({sort:'legions'});
assert.equal(byLegions[0].id,'abraxas');
assert.equal(byLegions[1].id,'paymon');

const dailyA=getDailyEntry('2026-11-12');
const dailyB=getDailyEntry('2026-11-12');
assert.equal(dailyA.id,dailyB.id,'Daily entry must be deterministic for a given date');

console.log('PASS: entries dataset, plate assets, search, filtering, sorting, and daily entry');
