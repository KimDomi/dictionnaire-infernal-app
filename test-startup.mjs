// Execute the entire browser module graph against a minimal document surface.
// This catches module syntax/link errors and verifies startup, tabs, and modal rendering.
import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const root=new URL('./dist/',import.meta.url);

async function run(initial,native=false){
  const main={innerHTML:'',querySelectorAll:()=>[]};
  const header={textContent:''};
  const handlers={};
  const file={};
  const modal={
    open:false,
    innerHTML:'',
    querySelector:()=>({value:'아스타로트 메모'}),
    querySelectorAll:()=>[],
    showModal(){this.open=true;},
    close(){this.open=false;}
  };
  const elements=new Map([
    ['#main',main],
    ['header h1',header],
    ['#modal',modal],
    ['#backupfile',file],
    ['#toast',{style:{},classList:{add(){},remove(){}},textContent:''}]
  ]);
  const local=new Map(initial?[['dictionnaire-infernal-v1',JSON.stringify(initial)]]:[]);
  const context=vm.createContext({
    console,Date,Map,Set,Math,Number,String,Boolean,Object,JSON,Error,Array,RegExp,Promise,
    setTimeout:()=>1,
    clearTimeout:()=>{},
    localStorage:{
      getItem:k=>local.get(k)||null,
      setItem:(k,v)=>local.set(k,v)
    },
    document:{
      documentElement:{dataset:{}},
      querySelector:s=>elements.get(s)||{},
      querySelectorAll:()=>[],
      addEventListener:(name,fn)=>{handlers[name]??=[];handlers[name].push(fn);}
    }
  });
  if(native){
    context.Capacitor={
      isNativePlatform:()=>true,
      Plugins:{
        InfernalNative:{setScreenAwake:async()=>{},backgroundApp:async()=>{}},
        SystemBars:{setStyle:async()=>{}}
      }
    };
    context.window={addEventListener(){}};
  }
  const cache=new Map();
  async function load(fileUrl){
    if(cache.has(fileUrl))return cache.get(fileUrl);
    const mod=new vm.SourceTextModule(fs.readFileSync(new URL(fileUrl,root),'utf8'),{context,identifier:fileUrl});
    cache.set(fileUrl,mod);
    return mod;
  }
  const mod=await load('app.js');
  await mod.link(spec=>load(spec.slice(2).split('?')[0]));
  await mod.evaluate();

  assert.ok(main.innerHTML.includes('class="entry-list"'));
  assert.ok(main.innerHTML.includes('아스타로트'));

  const click=dataset=>{
    for(const fn of handlers.click||[]){
      fn({target:{closest:()=>({dataset})}});
    }
  };

  click({tab:'gallery'});
  assert.ok(main.innerHTML.includes('class="plate-grid"'));
  assert.equal(header.textContent,'삽화 도감');

  click({tab:'daily'});
  assert.ok(main.innerHTML.includes('오늘의 지옥사전 표제어'));
  assert.equal(header.textContent,'오늘의 악마');

  click({tab:'bookmarks'});
  assert.ok(main.innerHTML.includes('서재 열람 현황'));

  click({tab:'settings'});
  assert.equal(header.textContent,'설정');
  assert.ok(main.innerHTML.includes('data-action="backup"'));

  click({action:'backup'});
  assert.ok(modal.open);
  assert.ok(modal.innerHTML.includes('파일로 내보내기'));
  assert.equal(typeof file.onchange,'function');

  click({action:'close'});
  assert.ok(!modal.open);

  click({action:'open-entry',id:'buer'});
  assert.ok(modal.open);
  assert.ok(modal.innerHTML.includes('뷰에르'));
}

await run(null,false);
await run(null,true);
await run({bookmarks:['astaroth','buer'],readIds:['astaroth'],notes:{astaroth:'지옥의 대재무관'}});
console.log('PASS: entire module graph, dictionary startup, tabs, modal & backup dialog');
