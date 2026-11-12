import assert from 'node:assert/strict';

const originalNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator');
const originalWindow=globalThis.window,originalCapacitor=globalThis.Capacitor;
try{
  Object.defineProperty(globalThis,'navigator',{value:{},configurable:true});
  const web=await import('./dist/native.js?test=web');
  assert.equal(web.isNativeApp(),false);
  assert.equal(web.screenLockAvailable(),false);
  assert.equal(await web.exportNativeBackup('backup.json','{}'),null);
  let released=0;
  navigator.wakeLock={request:async kind=>{assert.equal(kind,'screen');return {release:async()=>released++};}};
  assert.equal(web.screenLockAvailable(),true);
  await (await web.requestScreenLock()).release();
  assert.equal(released,1);

  const calls=[],events=new EventTarget();let backs=0,resumes=0,handled=true;
  const plugins={
    InfernalNative:{
      exportBackup:async data=>{calls.push(data);return {cancelled:true};},
      setScreenAwake:async data=>calls.push(data),
      backgroundApp:async()=>backs++
    },
    SystemBars:{setStyle:async data=>calls.push(data)}
  };
  globalThis.Capacitor={isNativePlatform:()=>true,Plugins:plugins};
  globalThis.window=events;
  const native=await import('./dist/native.js?test=android');
  assert.equal(native.isNativeApp(),true);
  assert.equal(native.screenLockAvailable(),true);
  assert.deepEqual(await native.exportNativeBackup('backup.json','{"bookmarks":[]}'),{cancelled:true});
  assert.deepEqual(calls.shift(),{filename:'backup.json',data:'{"bookmarks":[]}'});
  const lock=await native.requestScreenLock();await lock.release();
  assert.deepEqual(calls.splice(0),[{enabled:true},{enabled:false}]);
  native.syncSystemBars('dark');native.syncSystemBars('light');
  await Promise.resolve();
  assert.deepEqual(calls.splice(0),[{style:'DARK'},{style:'LIGHT'}]);
  native.installNativeNavigation(()=>handled,()=>resumes++);
  window.dispatchEvent(new Event('infernal-back'));assert.equal(backs,0);
  handled=false;window.dispatchEvent(new Event('infernal-back'));assert.equal(backs,1);
  window.dispatchEvent(new Event('infernal-app-resume'));assert.equal(resumes,1);
  console.log('PASS: native/browser isolation, cancelled export, screen lock release, theme, back and resume');
}finally{
  if(originalNavigator)Object.defineProperty(globalThis,'navigator',originalNavigator);else delete globalThis.navigator;
  if(originalWindow===undefined)delete globalThis.window;else globalThis.window=originalWindow;
  if(originalCapacitor===undefined)delete globalThis.Capacitor;else globalThis.Capacitor=originalCapacitor;
}
