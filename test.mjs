import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ENTRIES,ILLUSTRATED_ENTRIES,VALID_ENTRY_IDS,filterEntries,getDailyEntry} from './dist/entries.js';

assert.equal(ENTRIES.length,3810,'Expected all 3,810 A-Z entries from the 1863 6th edition');
assert.equal(ILLUSTRATED_ENTRIES.length,68,'Expected 68 illustrated plate entries');
assert.equal(VALID_ENTRY_IDS.size,3810,'All entry IDs must be unique');

for(const entry of ENTRIES){
  assert.ok(entry.id&&entry.nameKo&&entry.nameFr,`Missing name fields for ${entry.id}`);
  assert.ok(entry.nameKo.includes('(')&&entry.nameKo.includes(')'),`Proper noun English/original notation missing in nameKo: ${entry.nameKo}`);
  if(entry.hasPlate){
    assert.ok(fs.existsSync(new URL('./dist/'+entry.plate,import.meta.url)),`Missing plate file dist/${entry.plate}`);
  }
}

const monarchs=filterEntries({category:'monarch',onlyIllustrated:true});
assert.ok(monarchs.some(e=>e.id==='belzebuth'));
assert.ok(monarchs.some(e=>e.id==='astaroth'));

const letterZ=filterEntries({letter:'Z'});
assert.ok(letterZ.length>=15,'Expected letter Z entries');
assert.ok(letterZ.some(e=>e.id==='zaebos'));

const searchAbaris=filterEntries({query:'Abaris'});
assert.ok(searchAbaris.some(e=>e.nameKo.includes('아바리스 (Abaris)')));

const searchBuer=filterEntries({query:'Buer'});
assert.ok(searchBuer.some(e=>e.id==='buer'));

const byLegions=filterEntries({sort:'legions',onlyIllustrated:true});
assert.equal(byLegions[0].id,'abraxas');
assert.equal(byLegions[1].id,'paymon');

const dailyA=getDailyEntry('2026-11-12');
const dailyB=getDailyEntry('2026-11-12');
assert.equal(dailyA.id,dailyB.id,'Daily entry must be deterministic for a given date');

console.log('PASS: all 3,810 A-Z entries dataset, proper noun English notation, plate assets, search, filtering, sorting, and daily entry');
