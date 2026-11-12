// The Android bridge is injected before modules execute. The website uses browser APIs.
const capacitor=globalThis.Capacitor;
export const isNativeApp=()=>!!capacitor?.isNativePlatform?.();
export const storageNotice=()=>isNativeApp()
  ?'열람 기록·즐겨찾기·연구 노트는 이 기기 앱에만 저장돼요. 자동 동기화되지 않으며 앱 데이터를 지우거나 삭제하면 사라지니 백업해 주세요.'
  :'열람 기록·즐겨찾기·연구 노트는 이 브라우저에만 저장돼요. 자동 동기화되지 않으며 브라우저 데이터를 지우면 사라지니 백업해 주세요.';

// Android injects plugin proxies directly; registerPlugin belongs to the optional JS core bundle.
const native=isNativeApp()?capacitor.Plugins?.InfernalNative:null;
const systemBars=isNativeApp()?capacitor.Plugins?.SystemBars:null;

export async function exportNativeBackup(filename,data){
  if(!native){
    if(isNativeApp())throw Error('파일 저장 기능에 연결하지 못했어요. 앱을 다시 열어 주세요.');
    return null;
  }
  return native.exportBackup({filename,data});
}

export function screenLockAvailable(){
  return !!native||!!globalThis.navigator?.wakeLock;
}

export async function requestScreenLock(){
  if(!native)return globalThis.navigator.wakeLock.request('screen');
  await native.setScreenAwake({enabled:true});
  return {release:()=>native.setScreenAwake({enabled:false})};
}

export function syncSystemBars(theme){
  if(!systemBars)return;
  Promise.resolve().then(()=>systemBars.setStyle({style:theme==='dark'?'DARK':'LIGHT'})).catch(()=>{});
}

export function installNativeNavigation(onBack,onResume){
  if(!native)return;
  window.addEventListener('infernal-back',()=>{
    if(!onBack())native.backgroundApp().catch(()=>{});
  });
  window.addEventListener('infernal-app-resume',onResume);
}
