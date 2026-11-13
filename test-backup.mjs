import assert from 'node:assert/strict';
import {VALID_ENTRY_IDS} from './dist/entries.js';
import {createBackupPayload,normalizeState,parseBackupPayload} from './dist/backup.js';

const initial={
  bookmarks:['astaroth','buer','astaroth','unknown-id'],
  readIds:['bael','stolas'],
  notes:{
    astaroth:'  40개 군단을 지휘하는 대공  ',
    empty:'   '
  }
};

const clean=normalizeState(initial,VALID_ENTRY_IDS);
assert.deepEqual(clean.bookmarks,['astaroth','buer']);
assert.deepEqual(clean.readIds,['bael','stolas']);
assert.deepEqual(clean.notes,{astaroth:'40개 군단을 지휘하는 대공'});

const payload=createBackupPayload(clean,{theme:'light',fontSize:'large',showFrench:false,keepAwake:true,animations:false},'2026-11-12T00:00:00.000Z');
const parsed=parseBackupPayload(JSON.stringify(payload),VALID_ENTRY_IDS);

assert.deepEqual(parsed.state,clean);
assert.deepEqual(parsed.settings,{theme:'light',fontSize:'large',showFrench:false,keepAwake:true,animations:false});

assert.throws(()=>parseBackupPayload('{invalid json',VALID_ENTRY_IDS),/유효한 JSON/);
assert.throws(()=>parseBackupPayload(JSON.stringify({app:'other-app'}),VALID_ENTRY_IDS),/지옥사전 백업 파일/);

console.log('PASS: backup normalization, export payload, and import validation');
