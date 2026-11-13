import {normalizeSettings} from './settings.js?v=8d4afa2f8c16';

export const STORAGE_KEY='dictionnaire-infernal-v1';

export function normalizeState(raw,validIds){
  const src=raw&&typeof raw==='object'?raw:{};
  const valid=validIds instanceof Set?validIds:null;
  const filterId=id=>typeof id==='string'&&id.trim()&&(!valid||valid.has(id));
  const bookmarks=Array.isArray(src.bookmarks)?[...new Set(src.bookmarks.filter(filterId))]:[];
  const readIds=Array.isArray(src.readIds)?[...new Set(src.readIds.filter(filterId))]:[];
  const notes={};
  if(src.notes&&typeof src.notes==='object'){
    for(const [k,v] of Object.entries(src.notes)){
      if(filterId(k)&&typeof v==='string'&&v.trim()){
        notes[k]=v.trim().slice(0,2000);
      }
    }
  }
  return {
    bookmarks,
    readIds,
    notes
  };
}

export function createBackupPayload(state,settings,exportedAt=new Date().toISOString()){
  const cleanState=normalizeState(state);
  const cleanSettings=normalizeSettings(settings);
  return {
    app:'dictionnaire-infernal',
    version:1,
    exportedAt,
    state:cleanState,
    settings:cleanSettings
  };
}

export function parseBackupPayload(jsonText,validIds){
  let parsed;
  try{
    parsed=typeof jsonText==='string'?JSON.parse(jsonText):jsonText;
  }catch{
    throw Error('유효한 JSON 백업 파일이 아니에요.');
  }
  if(!parsed||typeof parsed!=='object')throw Error('백업 파일 형식을 읽을 수 없어요.');
  if(parsed.app&&parsed.app!=='dictionnaire-infernal')throw Error('지옥사전 백업 파일이 아니에요.');
  const stateSource=parsed.state&&typeof parsed.state==='object'?parsed.state:parsed;
  if(!Array.isArray(stateSource.bookmarks)&&!Array.isArray(stateSource.readIds)&&typeof stateSource.notes!=='object'){
    throw Error('백업 데이터에 서재 기록(즐겨찾기·열람·노트)이 없어요.');
  }
  return {
    state:normalizeState(stateSource,validIds),
    settings:parsed.settings?normalizeSettings(parsed.settings):null
  };
}
