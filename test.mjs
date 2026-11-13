import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ENTRIES,ILLUSTRATED_ENTRIES,VALID_ENTRY_IDS,filterEntries,getDailyEntry} from './dist/entries.js';

assert.equal(ENTRIES.length,3810,'Expected all 3,810 A-Z entries from the 1863 6th edition');
assert.ok(ILLUSTRATED_ENTRIES.length>=400,`Expected at least 400 illustrated plate entries from 1863 edition, got ${ILLUSTRATED_ENTRIES.length}`);
assert.equal(VALID_ENTRY_IDS.size,3810,'All entry IDs must be unique');

for(const entry of ENTRIES){
  assert.ok(entry.id&&entry.nameKo&&entry.nameFr,`Missing name fields for ${entry.id}`);
  assert.ok(entry.nameKo.includes('[')&&entry.nameKo.includes(']'),`Proper noun bracket notation missing in nameKo: ${entry.nameKo}`);
  if(entry.hasPlate){
    assert.ok(fs.existsSync(new URL('./dist/'+entry.plate,import.meta.url)),`Missing plate file dist/${entry.plate}`);
  }
}

// Verify the user's 9 rules examples in entries
const aigle = ENTRIES.find(e => e.nameFr === 'Aigle');
assert.ok(aigle && aigle.nameKo === '독수리 [Aigle / Eagle]', 'Rule 1: 독수리 [Aigle / Eagle]');

const accouchements = ENTRIES.find(e => e.nameFr === 'Accouchements prodigieux');
assert.ok(accouchements && accouchements.nameKo === '불가사의한 출산 [Accouchements Prodigieux / Prodigious Births]', 'Rule 1: 불가사의한 출산 [Accouchements Prodigieux / Prodigious Births]');

const adamAbbe = ENTRIES.find(e => e.nameFr === 'Adam (l’abbé)');
assert.ok(adamAbbe && adamAbbe.nameKo === '수도원장 아담 [Adam (L’Abbé)]', 'Rule 2: 수도원장 아담 [Adam (L’Abbé)]');

const abadie = ENTRIES.find(e => e.nameFr === 'Abadie (Jeannette d’)');
assert.ok(abadie && abadie.nameKo === '자네뜨 다바디 [Abadie (Jeannette d’)]', 'Rule 2: 자네뜨 다바디 [Abadie (Jeannette d’)]');

const abraxas = ENTRIES.find(e => e.id === 'abraxas');
assert.ok(abraxas && abraxas.nameKo === '아브라카스 또는 아브락사스 [Abracax, Abraxas]', 'Rule 3: 아브라카스 또는 아브락사스 [Abracax, Abraxas]');

// Verify the 4 Jean entries disambiguation on page 373
const jeanMagician = ENTRIES.find(e => e.id === 'e2167-jean');
assert.ok(jeanMagician && jeanMagician.nameKo === '마법사 장 [Jean (Magicien) / John the Magician]', 'Jean 1: 마법사 장');
assert.ok(jeanMagician.description.includes('아폴로니우스'), 'Jean 1 description contains Apollonius');

const jeanPatriarch = ENTRIES.find(e => e.id === 'e2168-jean');
assert.ok(jeanPatriarch && jeanPatriarch.nameKo === '총대주교 장 [Jean (Patriarche de Constantinople)]', 'Jean 2: 총대주교 장');
assert.ok(jeanPatriarch.description.includes('콘스탄티노폴리스'), 'Jean 2 description contains Constantinople');

const jeanXXII = ENTRIES.find(e => e.id === 'e2169-jeanxxii');
assert.ok(jeanXXII && jeanXXII.nameKo === '요한 22세 [Jean XXII / Pope John XXII]', 'Jean XXII: 요한 22세');
assert.ok(jeanXXII.description.includes('교황'), 'Jean XXII description contains pope');

const jeanIvan = ENTRIES.find(e => e.id === 'e2170-jean');
assert.ok(jeanIvan && jeanIvan.nameKo === '이반 뇌제 또는 장 [Jean, Iwan Basilowitz / Ivan the Terrible]', 'Jean 3: 이반 뇌제 또는 장');
assert.ok(jeanIvan.description.includes('이반 바실리예비치'), 'Jean 3 description contains Ivan Vasilyevich');

// Verify descriptions are unique
const jeanDescs = new Set([jeanMagician.description, jeanPatriarch.description, jeanXXII.description, jeanIvan.description]);
assert.equal(jeanDescs.size, 4, 'All four Jean entries must have distinct descriptions');

// Verify Phénix demon vs sacred bird disambiguation
const phenixDemon = ENTRIES.find(e => e.id === 'e3011-phenix');
const phenixBird = ENTRIES.find(e => e.id === 'e3012-phenix');
assert.ok(phenixDemon && phenixDemon.nameKo === '페닉스 [Phénix / Phenex]' && phenixDemon.category === 'demon', 'Phenix demon');
assert.ok(phenixBird && phenixBird.nameKo === '불사조 [Phénix / Phoenix]' && phenixBird.category === 'superstition', 'Phenix bird');

// Verify Retz Gilles de Rais vs Cardinal de Retz disambiguation
const retzGilles = ENTRIES.find(e => e.id === 'e3211-retz');
const retzCardinal = ENTRIES.find(e => e.id === 'e3212-retz');
assert.ok(retzGilles && retzGilles.nameKo.includes('질 드 레'), 'Gilles de Rais');
assert.ok(retzCardinal && retzCardinal.nameKo.includes('레츠 추기경'), 'Cardinal de Retz');

const monarchs=filterEntries({category:'monarch',onlyIllustrated:true});
assert.ok(monarchs.some(e=>e.id==='belzebuth'));
assert.ok(monarchs.some(e=>e.id==='astaroth'));

const letterZ=filterEntries({letter:'Z'});
assert.ok(letterZ.length>=15,'Expected letter Z entries');
assert.ok(letterZ.some(e=>e.id==='zaebos'));

const searchAbaris=filterEntries({query:'Abaris'});
assert.ok(searchAbaris.some(e=>e.nameKo.includes('아바리스 [Abaris]')));

const searchBuer=filterEntries({query:'Buer'});
assert.ok(searchBuer.some(e=>e.id==='buer'));

const byLegions=filterEntries({sort:'legions',onlyIllustrated:true});
assert.equal(byLegions[0].id,'abraxas');
assert.equal(byLegions[1].id,'paymon');

const dailyA=getDailyEntry('2026-11-12');
const dailyB=getDailyEntry('2026-11-12');
assert.equal(dailyA.id,dailyB.id,'Daily entry must be deterministic for a given date');

console.log('PASS: all 3,810 A-Z entries dataset, proper noun English notation, plate assets, search, filtering, sorting, and daily entry');
