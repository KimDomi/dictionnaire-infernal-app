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
  assert.ok(main.innerHTML.includes('아론 [Aaron]'));
  assert.ok(main.innerHTML.includes('아바리스 [Abaris]'));

  // Test search input without destroying active input
  for(const fn of handlers.input||[]){
    fn({target:{id:'search-input',value:'Buer'}});
  }
  assert.ok(main.innerHTML.includes('부에르 [Buer]'));
  for(const fn of handlers.input||[]){
    fn({target:{id:'search-input',value:''}});
  }

  const click=dataset=>{
    for(const fn of handlers.click||[]){
      fn({target:{closest:()=>({dataset})}});
    }
  };

  click({tab:'gallery'});
  assert.ok(main.innerHTML.includes('class="plate-grid"'));
  assert.equal(header.textContent,'삽화 도감');

  click({action:'help'});
  assert.ok(modal.innerHTML.includes('삽화 도감 안내'));
  click({action:'close'});

  click({tab:'daily'});
  assert.ok(main.innerHTML.includes('무작위 지옥사전 표제어'));
  assert.ok(!main.innerHTML.includes('← 좌우로 밀어서 이전 / 다음 항목 넘기기 →'));
  assert.ok(!main.innerHTML.includes('전체 화면으로 상세 보기'));
  assert.ok(!main.innerHTML.includes('다른 항목 뽑기'));
  assert.equal(header.textContent,'무작위 열람');

  click({action:'help'});
  assert.ok(modal.innerHTML.includes('무작위 열람 안내'));
  click({action:'close'});

  for(const fn of handlers.touchstart||[])fn({changedTouches:[{clientX:240,clientY:200}]});
  for(const fn of handlers.touchend||[])fn({changedTouches:[{clientX:60,clientY:205}]});
  assert.ok(main.innerHTML.includes('header-read-btn active'));

  click({tab:'bookmarks'});
  assert.ok(main.innerHTML.includes('서재 열람 현황'));

  click({tab:'settings'});
  assert.equal(header.textContent,'설정');
  assert.ok(main.innerHTML.includes('data-action="backup"'));
  assert.ok(main.innerHTML.includes('data-action="toggle-animations"'));
  click({action:'toggle-animations'});
  assert.ok(main.innerHTML.includes('data-action="toggle-animations"'));

  click({action:'help'});
  assert.ok(modal.innerHTML.includes('설정 안내'));
  click({action:'close'});

  click({action:'open-attribution-modal'});
  assert.ok(modal.open);
  assert.ok(modal.innerHTML.includes('원전 및 출처 표기 (Attribution & Sources)'));
  assert.ok(modal.innerHTML.includes('루이 르 브르통'));
  assert.ok(modal.innerHTML.includes('428점'));
  click({action:'close'});
  assert.ok(!modal.open);

  click({action:'backup'});
  assert.ok(modal.open);
  assert.ok(modal.innerHTML.includes('파일로 내보내기'));
  assert.equal(typeof file.onchange,'function');

  click({action:'close'});
  assert.ok(!modal.open);

  click({tab:'gallery'});
  assert.equal(header.textContent,'삽화 도감');

  click({action:'open-entry',id:'buer'});
  assert.ok(!modal.open);
  assert.equal(header.textContent,'삽화 도감','Header must stay fixed as tab title');
  assert.ok(main.innerHTML.includes('class="entry-detail-page"'));
  assert.ok(main.innerHTML.includes('Buer'));
  assert.ok(main.innerHTML.indexOf('detail-header')<main.innerHTML.indexOf('detail-plate-showcase'));
  assert.ok(main.innerHTML.indexOf('detail-plate-showcase')<main.innerHTML.indexOf('detail-body'));
  assert.ok(main.innerHTML.includes('detail-french-card'),'Collapsible French card must be present');
  assert.ok(main.innerHTML.includes('french-card-trigger'),'French card trigger button must be present');
  assert.ok(main.innerHTML.includes('불문 원문'),'Button title must be shortened to 불문 원문');
  assert.ok(!main.innerHTML.includes('불문 원문 함께 보기'),'Old verbose button text must not exist');

  // Tab switching retains open entry page in gallery
  click({tab:'bookmarks'});
  assert.ok(main.innerHTML.includes('서재 열람 현황'));
  click({tab:'gallery'});
  assert.ok(main.innerHTML.includes('class="entry-detail-page"'),'Returning to gallery should preserve open entry page');
  assert.equal(header.textContent,'삽화 도감');

  // Swipe left to next entry in detail page
  for(const fn of handlers.touchstart||[])fn({changedTouches:[{clientX:240,clientY:200}]});
  for(const fn of handlers.touchend||[])fn({changedTouches:[{clientX:60,clientY:205}]});
  assert.ok(main.innerHTML.includes('entry-detail-page'));
  assert.ok(!main.innerHTML.includes('<h2>부에르 [Buer]</h2>'));

  // Swipe right back to previous entry
  for(const fn of handlers.touchstart||[])fn({changedTouches:[{clientX:60,clientY:200}]});
  for(const fn of handlers.touchend||[])fn({changedTouches:[{clientX:240,clientY:205}]});
  assert.ok(main.innerHTML.includes('entry-detail-page'));

  click({action:'close-entry'});
  assert.equal(header.textContent,'삽화 도감');
}

await run(null,false);
await run(null,true);
await run({bookmarks:['astaroth','buer'],readIds:['astaroth'],notes:{astaroth:'지옥의 대재무관'}});
console.log('PASS: entire module graph, dictionary startup, tabs, full-page entry view & backup dialog');
