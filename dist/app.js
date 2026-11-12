import {CATEGORIES,ENTRIES,ENTRY_MAP,VALID_ENTRY_IDS,filterEntries,getDailyEntry} from './entries.js?v=9ae08862b4fc';
import {icon} from './icons.js?v=6303f2853951';
import {exportNativeBackup,installNativeNavigation,requestScreenLock,screenLockAvailable,storageNotice} from './native.js?v=3197cf683a29';
import {applySettingsToDocument,loadSettings,saveSettings} from './settings.js?v=30d69e69c3cf';
import {STORAGE_KEY,createBackupPayload,normalizeState,parseBackupPayload} from './backup.js?v=a7f53b351470';

const mainEl=document.querySelector('#main');
const headerTitleEl=document.querySelector('header h1');
const modalEl=document.querySelector('#modal');
const backupFileEl=document.querySelector('#backupfile');
const toastEl=document.querySelector('#toast');

function loadUserState(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    return normalizeState(raw?JSON.parse(raw):null,VALID_ENTRY_IDS);
  }catch{
    return normalizeState(null,VALID_ENTRY_IDS);
  }
}

function saveUserState(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
}

let state=loadUserState();
let settings=loadSettings();
applySettingsToDocument(settings);

let activeTab='dictionary';
let searchQuery='';
let activeCategory='all';
let activeSort='plate';
let activeEntryId=null;
let randomOverrideId=null;
let activeWakeLock=null;
let toastTimer=null;

function escapeHtml(str){
  return String(str??'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function showToast(message){
  if(!toastEl)return;
  toastEl.textContent=message;
  toastEl.classList?.add?.('show');
  if(toastTimer)clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>{
    toastEl.classList?.remove?.('show');
  },2400);
}

async function syncWakeLock(){
  const shouldKeepAwake=settings.keepAwake&&(modalEl?.open||activeTab==='daily');
  if(!shouldKeepAwake){
    if(activeWakeLock){
      try{await activeWakeLock.release?.();}catch{}
      activeWakeLock=null;
    }
    return;
  }
  if(!activeWakeLock&&screenLockAvailable()){
    try{
      activeWakeLock=await requestScreenLock();
    }catch{
      activeWakeLock=null;
    }
  }
}

const TAB_TITLES={
  dictionary:'지옥사전',
  gallery:'삽화 도감',
  daily:'오늘의 악마',
  bookmarks:'서재 기록',
  settings:'설정'
};

function renderEntryCard(entry){
  const isBookmarked=state.bookmarks.includes(entry.id);
  const isRead=state.readIds.includes(entry.id);
  const hasNote=Boolean(state.notes[entry.id]);
  return `<article class="entry-card" data-action="open-entry" data-id="${escapeHtml(entry.id)}">
    <div class="entry-thumb-wrap">
      <img class="entry-thumb" src="${escapeHtml(entry.plate)}" alt="${escapeHtml(entry.nameKo)} 판화" loading="lazy">
    </div>
    <div class="entry-card-body">
      <div class="entry-card-top">
        <span class="entry-plate-no">No. ${entry.plateNo} · p.${entry.page1863}</span>
        <div class="entry-badges">
          ${entry.legions?`<span class="mini-badge">${entry.legions}군단</span>`:''}
          ${isBookmarked?'<span class="mini-badge accent">즐겨찾기</span>':''}
          ${hasNote?'<span class="mini-badge">노트</span>':''}
          ${isRead?'<span class="mini-badge">열람</span>':''}
        </div>
      </div>
      <h2 class="entry-title-ko">${escapeHtml(entry.nameKo)}</h2>
      <div class="entry-title-fr">${escapeHtml(entry.nameFr)}</div>
      <div class="entry-rank-line">${escapeHtml(entry.rank)}</div>
      <p class="entry-summary">${escapeHtml(entry.summary)}</p>
    </div>
  </article>`;
}

function renderDictionaryTab(){
  const list=filterEntries({query:searchQuery,category:activeCategory,sort:activeSort});
  const pillsHtml=CATEGORIES.map(cat=>
    `<button type="button" class="pill${activeCategory===cat.id?' active':''}" data-action="filter-category" data-category="${cat.id}">${escapeHtml(cat.label)}</button>`
  ).join('');

  return `<section class="dictionary-view">
    <div class="toolbar">
      <div class="search-row">
        <div class="search-box">
          ${icon('search')}
          <input id="search-input" type="search" placeholder="악마 이름(한글·불어), 계급, 권능 검색..." value="${escapeHtml(searchQuery)}" aria-label="사전 검색">
        </div>
        <select id="sort-select" class="sort-select" aria-label="정렬 기준">
          <option value="plate"${activeSort==='plate'?' selected':''}>원서 판화순</option>
          <option value="ko"${activeSort==='ko'?' selected':''}>가나다순</option>
          <option value="fr"${activeSort==='fr'?' selected':''}>불어 표제어순</option>
          <option value="legions"${activeSort==='legions'?' selected':''}>군단 규모순</option>
        </select>
      </div>
      <div class="category-pills" role="tablist" aria-label="분류 필터">${pillsHtml}</div>
    </div>
    <div class="summary-bar">
      <span>수록 항목 <strong>${list.length}</strong> / ${ENTRIES.length}편</span>
      <span>열람 완료 <strong>${state.readIds.length}</strong>편</span>
    </div>
    ${list.length
      ?`<div class="entry-list">${list.map(renderEntryCard).join('')}</div>`
      :`<div class="empty-state">검색 조건에 맞는 『지옥사전』 항목이 없습니다.</div>`}
  </section>`;
}

function renderGalleryTab(){
  const list=filterEntries({category:activeCategory,sort:'plate'});
  const pillsHtml=CATEGORIES.map(cat=>
    `<button type="button" class="pill${activeCategory===cat.id?' active':''}" data-action="filter-category" data-category="${cat.id}">${escapeHtml(cat.label)}</button>`
  ).join('');

  return `<section class="gallery-view">
    <div class="toolbar">
      <div class="category-pills" role="tablist" aria-label="도감 분류 필터">${pillsHtml}</div>
    </div>
    <div class="summary-bar">
      <span>루이 브르통(L. Breton) 1863년 목판화 <strong>${list.length}</strong>점</span>
      <span>항목을 누르면 상세 해제를 봅니다</span>
    </div>
    <div class="plate-grid">
      ${list.map(entry=>`<article class="plate-card" data-action="open-entry" data-id="${escapeHtml(entry.id)}">
        <div class="plate-frame">
          <img src="${escapeHtml(entry.plate)}" alt="${escapeHtml(entry.nameKo)}" loading="lazy">
        </div>
        <div class="plate-caption">
          <strong>${escapeHtml(entry.nameKo)}</strong>
          <span>No.${entry.plateNo} · ${escapeHtml(entry.nameFr.split(' ')[0])}</span>
        </div>
      </article>`).join('')}
    </div>
  </section>`;
}

function renderDailyTab(){
  const todayStr=new Date().toISOString().slice(0,10);
  const entry=randomOverrideId&&ENTRY_MAP.get(randomOverrideId)||getDailyEntry(todayStr);
  const isBookmarked=state.bookmarks.includes(entry.id);
  const isRead=state.readIds.includes(entry.id);

  return `<section class="daily-view">
    <article class="daily-hero">
      <div class="daily-header">
        <div>
          <span class="edition-tag">${randomOverrideId?'GRIMOIRE CONSULTATION · 무작위 소환':`DAILY DEMON · ${todayStr}`}</span>
          <div><strong>오늘의 지옥사전 표제어</strong></div>
        </div>
        <button type="button" class="secondary" data-action="reroll-daily">
          ${icon('shuffle')} 다른 항목 뽑기
        </button>
      </div>
      <div class="daily-content">
        <div class="daily-plate">
          <img src="${escapeHtml(entry.plate)}" alt="${escapeHtml(entry.nameKo)} 판화">
        </div>
        <div class="daily-details">
          <span class="entry-plate-no">판화 No. ${entry.plateNo} · 1863년 제6판 p.${entry.page1863}</span>
          <h2>${escapeHtml(entry.nameKo)} <small style="font-size:0.65em;color:var(--text-muted);font-weight:400">${escapeHtml(entry.nameFr)}</small></h2>
          <div class="entry-rank-line">${escapeHtml(entry.rank)}${entry.legions?` · 휘하 ${entry.legions}개 군단`:''}</div>
          <div class="domain-tags">
            ${(entry.domains||[]).map(d=>`<span class="domain-tag">${escapeHtml(d)}</span>`).join('')}
          </div>
          <p>${escapeHtml(entry.description)}</p>
          ${settings.showFrench?`<blockquote class="quote-box">“${escapeHtml(entry.quoteFr)}”</blockquote>`:''}
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">
            <button type="button" class="primary" data-action="open-entry" data-id="${escapeHtml(entry.id)}">상세 노트 및 원문 보기</button>
            <button type="button" data-action="toggle-bookmark" data-id="${escapeHtml(entry.id)}">${isBookmarked?'★ 즐겨찾기 해제':'☆ 즐겨찾기 추가'}</button>
            <button type="button" data-action="toggle-read" data-id="${escapeHtml(entry.id)}">${isRead?'✓ 열람 완료됨':'열람 완료 표시'}</button>
          </div>
        </div>
      </div>
    </article>
  </section>`;
}

function renderBookmarksTab(){
  const bookmarkedEntries=state.bookmarks.map(id=>ENTRY_MAP.get(id)).filter(Boolean);
  const notedEntries=Object.keys(state.notes).map(id=>ENTRY_MAP.get(id)).filter(Boolean);
  const readEntries=state.readIds.map(id=>ENTRY_MAP.get(id)).filter(Boolean);

  return `<section class="bookmarks-view">
    <div class="panel">
      <h2>서재 열람 현황</h2>
      <p style="margin:0;color:var(--text-muted);font-size:0.88rem">
        전체 ${ENTRIES.length}편 중 <strong>${readEntries.length}편</strong> 열람 완료 · 즐겨찾기 <strong>${bookmarkedEntries.length}편</strong> · 연구 노트 <strong>${notedEntries.length}건</strong>
      </p>
    </div>

    <div class="panel">
      <h3>즐겨찾기한 항목 (${bookmarkedEntries.length})</h3>
      ${bookmarkedEntries.length
        ?`<div class="entry-list">${bookmarkedEntries.map(renderEntryCard).join('')}</div>`
        :`<div class="empty-state">아직 즐겨찾기한 악마·표제어가 없습니다. 사전 상세 창에서 ★ 즐겨찾기를 눌러 추가해 보세요.</div>`}
    </div>

    <div class="panel">
      <h3>작성한 연구 노트 (${notedEntries.length})</h3>
      ${notedEntries.length
        ?`<div class="entry-list">${notedEntries.map(entry=>`<article class="entry-card" data-action="open-entry" data-id="${escapeHtml(entry.id)}">
          <div class="entry-thumb-wrap"><img class="entry-thumb" src="${escapeHtml(entry.plate)}" alt="${escapeHtml(entry.nameKo)}"></div>
          <div class="entry-card-body">
            <h4 class="entry-title-ko">${escapeHtml(entry.nameKo)} <span class="entry-title-fr">(${escapeHtml(entry.nameFr)})</span></h4>
            <p class="entry-summary">${escapeHtml(state.notes[entry.id])}</p>
          </div>
        </article>`).join('')}</div>`
        :`<div class="empty-state">기록한 연구 노트가 없습니다. 항목 상세 창에서 메모를 남길 수 있습니다.</div>`}
    </div>
  </section>`;
}

function renderSettingsTab(){
  return `<section class="settings-view">
    <div class="panel">
      <h2>화면 및 독서 환경</h2>
      <div class="setting-row">
        <div class="setting-label">
          <strong>테마 모드</strong>
          <span>어두운 흑요석 테마 또는 고서 양피지 테마</span>
        </div>
        <div class="segmented" role="group" aria-label="테마 선택">
          <button type="button" class="${settings.theme==='dark'?'active':''}" data-action="set-theme" data-theme="dark">다크</button>
          <button type="button" class="${settings.theme==='light'?'active':''}" data-action="set-theme" data-theme="light">양피지</button>
          <button type="button" class="${settings.theme==='system'?'active':''}" data-action="set-theme" data-theme="system">시스템</button>
        </div>
      </div>

      <div class="setting-row">
        <div class="setting-label">
          <strong>글자 크기</strong>
          <span>본문 및 해설 가독성 조절</span>
        </div>
        <div class="segmented" role="group" aria-label="글자 크기">
          <button type="button" class="${settings.fontSize==='normal'?'active':''}" data-action="set-fontsize" data-fontsize="normal">기본</button>
          <button type="button" class="${settings.fontSize==='large'?'active':''}" data-action="set-fontsize" data-fontsize="large">크게</button>
        </div>
      </div>

      <div class="setting-row">
        <div class="setting-label">
          <strong>1863년 프랑스어 원문 병기</strong>
          <span>자크 콜랭 드 플랑시의 불어 원문 발췌문 표시</span>
        </div>
        <button type="button" class="${settings.showFrench?'primary':''}" data-action="toggle-french">
          ${settings.showFrench?'표시 중':'숨김'}
        </button>
      </div>

      <div class="setting-row">
        <div class="setting-label">
          <strong>열람 중 화면 켜짐 유지</strong>
          <span>상세 열람 및 오늘의 악마 화면에서 꺼짐 방지</span>
        </div>
        <button type="button" class="${settings.keepAwake?'primary':''}" data-action="toggle-awake">
          ${settings.keepAwake?'켜짐':'꺼짐'}
        </button>
      </div>
    </div>

    <div class="panel">
      <h2>서재 정보 관리</h2>
      <p style="margin:0 0 12px;font-size:0.84rem;color:var(--text-muted)">${escapeHtml(storageNotice())}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="primary" data-action="backup">내보내기 / 가져오기</button>
      </div>
    </div>

    <div class="panel">
      <h2>원전 및 판본 정보</h2>
      <p style="margin:0;font-size:0.84rem;color:var(--text-muted)">
        • 원제: <em>Dictionnaire Infernal</em> (제6판, 1863년 파리 Henri Plon 간행)<br>
        • 저자: 자크 알뱅 시몽 콜랭 드 플랑시 (J.-A.-S. Collin de Plancy, 1794–1881)<br>
        • 삽화: 루이 브르통 (Louis Breton) 원화 · 자로(Jarrault) 목판 조각<br>
        • 라이선스: 퍼블릭 도메인 (Public Domain, Internet Archive &amp; BnF Gallica)
      </p>
    </div>
  </section>`;
}

function render(){
  if(!mainEl)return;
  if(headerTitleEl)headerTitleEl.textContent=TAB_TITLES[activeTab]||'지옥사전';
  for(const btn of document.querySelectorAll?.('nav button[data-tab]')||[]){
    btn.classList?.toggle?.('active',btn.dataset?.tab===activeTab);
  }
  if(activeTab==='dictionary')mainEl.innerHTML=renderDictionaryTab();
  else if(activeTab==='gallery')mainEl.innerHTML=renderGalleryTab();
  else if(activeTab==='daily')mainEl.innerHTML=renderDailyTab();
  else if(activeTab==='bookmarks')mainEl.innerHTML=renderBookmarksTab();
  else if(activeTab==='settings')mainEl.innerHTML=renderSettingsTab();
  syncWakeLock();
}

function openEntryModal(entryId){
  const entry=ENTRY_MAP.get(entryId);
  if(!entry||!modalEl)return;
  activeEntryId=entry.id;
  if(!state.readIds.includes(entry.id)){
    state.readIds.push(entry.id);
    saveUserState();
  }
  const isBookmarked=state.bookmarks.includes(entry.id);
  const isRead=state.readIds.includes(entry.id);
  const noteText=state.notes[entry.id]||'';

  modalEl.innerHTML=`<div class="modal-inner">
    <div class="modal-top">
      <div>
        <span class="entry-plate-no">판화 No. ${entry.plateNo} · 1863년 제6판 p.${entry.page1863}</span>
        <h2>${escapeHtml(entry.nameKo)} <small style="font-size:0.65em;color:var(--text-muted);font-weight:400">${escapeHtml(entry.nameFr)}</small></h2>
        <div class="entry-rank-line">${escapeHtml(entry.rank)}${entry.legions?` · 휘하 ${entry.legions}개 군단`:''}</div>
      </div>
      <button type="button" data-action="close" aria-label="닫기">${icon('close')}</button>
    </div>

    <div class="modal-detail-grid">
      <div class="modal-plate-box">
        <img src="${escapeHtml(entry.plate)}" alt="${escapeHtml(entry.nameKo)} 루이 브르통 판화">
      </div>
      <div style="flex:1">
        <div class="domain-tags">
          ${(entry.domains||[]).map(d=>`<span class="domain-tag">${escapeHtml(d)}</span>`).join('')}
        </div>
        <p style="margin:8px 0"><strong>외형 묘사:</strong> ${escapeHtml(entry.appearance)}</p>
        <p style="margin:8px 0">${escapeHtml(entry.description)}</p>
        ${settings.showFrench?`<blockquote class="quote-box">“${escapeHtml(entry.quoteFr)}”<br><small>— J. Collin de Plancy, Dictionnaire Infernal (1863), p.${entry.page1863}</small></blockquote>`:''}
      </div>
    </div>

    <div>
      <label for="entry-note-input" style="display:block;font-size:0.84rem;font-weight:600;margin-bottom:6px">개인 연구 노트</label>
      <textarea id="entry-note-input" class="note-editor" placeholder="이 악마·항목에 대한 메모나 번역 노트를 기록하세요...">${escapeHtml(noteText)}</textarea>
    </div>

    <div class="modal-actions">
      <button type="button" data-action="toggle-bookmark" data-id="${escapeHtml(entry.id)}">${isBookmarked?'★ 즐겨찾기됨':'☆ 즐겨찾기'}</button>
      <button type="button" data-action="toggle-read" data-id="${escapeHtml(entry.id)}">${isRead?'✓ 열람 완료':'열람 표시'}</button>
      <button type="button" class="primary" data-action="save-note" data-id="${escapeHtml(entry.id)}">노트 저장</button>
      <button type="button" data-action="close">닫기</button>
    </div>
  </div>`;

  if(!modalEl.open)modalEl.showModal?.();
  syncWakeLock();
}

function openBackupModal(){
  if(!modalEl)return;
  activeEntryId=null;
  modalEl.innerHTML=`<div class="modal-inner">
    <div class="modal-top">
      <h2>서재 기록 내보내기 / 가져오기</h2>
      <button type="button" data-action="close" aria-label="닫기">${icon('close')}</button>
    </div>
    <p style="margin:0;font-size:0.88rem;color:var(--text-muted)">
      즐겨찾기(${state.bookmarks.length}건), 열람 기록(${state.readIds.length}건), 연구 노트(${Object.keys(state.notes).length}건) 및 환경 설정을 JSON 파일로 백업하거나 복원합니다.
    </p>
    <div class="modal-actions">
      <button type="button" class="primary" data-action="export-backup">파일로 내보내기</button>
      <button type="button" data-action="import-backup">파일에서 가져오기</button>
      <button type="button" data-action="close">닫기</button>
    </div>
  </div>`;
  if(backupFileEl){
    backupFileEl.onchange=async event=>{
      const selected=event?.target?.files?.[0];
      if(!selected)return;
      try{
        const text=await selected.text();
        const imported=parseBackupPayload(text,VALID_ENTRY_IDS);
        state=imported.state;
        saveUserState();
        if(imported.settings){
          settings=saveSettings(imported.settings);
          applySettingsToDocument(settings);
        }
        modalEl.close?.();
        render();
        showToast('서재 백업 기록을 복원했어요.');
      }catch(error){
        showToast(error.message||'백업 파일을 읽지 못했어요.');
      }
    };
  }
  if(!modalEl.open)modalEl.showModal?.();
}

function openHelpModal(){
  if(!modalEl)return;
  activeEntryId=null;
  modalEl.innerHTML=`<div class="modal-inner">
    <div class="modal-top">
      <h2>『지옥사전 (Dictionnaire Infernal)』 안내</h2>
      <button type="button" data-action="close" aria-label="닫기">${icon('close')}</button>
    </div>
    <p style="margin:0">
      프랑스의 문필가 자크 콜랭 드 플랑시(1794–1881)가 저술하고 루이 브르통이 삽화를 그린 1863년 제6판 『지옥사전』을 웹과 안드로이드 앱에서 오프라인으로 탐색할 수 있도록 구성한 도감형 사전입니다.
    </p>
    <ul style="margin:0;padding-left:18px;font-size:0.88rem;color:var(--text-muted)">
      <li><strong>사전 탐색</strong>: 한글·프랑스어 이름, 계급, 군단 수, 권능 키워드로 즉시 검색합니다.</li>
      <li><strong>삽화 도감</strong>: 1863년 초판본에서 추출한 루이 브르통의 오리지널 목판화를 감상합니다.</li>
      <li><strong>오늘의 악마</strong>: 매일 날짜에 따라 선정된 항목을 읽거나 무작위로 새 항목을 소환합니다.</li>
      <li><strong>서재 기록</strong>: 즐겨찾기·열람 완료 항목과 개인 연구 노트를 모아 보고 JSON으로 백업합니다.</li>
    </ul>
    <div class="modal-actions">
      <button type="button" class="primary" data-action="close">확인</button>
    </div>
  </div>`;
  if(!modalEl.open)modalEl.showModal?.();
}

async function handleExportBackup(){
  const payload=JSON.stringify(createBackupPayload(state,settings),null,2);
  const filename=`dictionnaire-infernal-backup-${new Date().toISOString().slice(0,10)}.json`;
  try{
    const nativeResult=await exportNativeBackup(filename,payload);
    if(nativeResult){
      if(!nativeResult.cancelled)showToast('백업 파일을 저장했어요.');
      return;
    }
    if(typeof Blob!=='undefined'&&typeof URL?.createObjectURL==='function'){
      const blob=new Blob([payload],{type:'application/json'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement?.('a');
      if(a){
        a.href=url;
        a.download=filename;
        a.click?.();
      }
      URL.revokeObjectURL?.(url);
    }
    showToast('백업 파일을 내려받았어요.');
  }catch(error){
    showToast(error.message||'백업 저장에 실패했어요.');
  }
}

document.addEventListener('click',event=>{
  const target=event?.target?.closest?.('[data-tab],[data-action]');
  if(!target)return;
  const {tab,action,id,category,theme,fontsize}=target.dataset||{};

  if(tab){
    activeTab=tab;
    render();
    return;
  }

  if(action==='open-entry'&&id){
    openEntryModal(id);
    render();
    return;
  }

  if(action==='close'){
    modalEl?.close?.();
    activeEntryId=null;
    syncWakeLock();
    return;
  }

  if(action==='random'||action==='reroll-daily'){
    const pick=ENTRIES[Math.floor(Math.random()*ENTRIES.length)];
    randomOverrideId=pick.id;
    if(action==='random')openEntryModal(pick.id);
    render();
    return;
  }

  if(action==='help'){
    openHelpModal();
    return;
  }

  if(action==='filter-category'&&category){
    activeCategory=category;
    render();
    return;
  }

  if(action==='toggle-bookmark'&&id){
    const idx=state.bookmarks.indexOf(id);
    if(idx>=0){
      state.bookmarks.splice(idx,1);
      showToast('즐겨찾기에서 해제했어요.');
    }else{
      state.bookmarks.push(id);
      showToast('즐겨찾기에 추가했어요.');
    }
    saveUserState();
    if(modalEl?.open&&activeEntryId===id)openEntryModal(id);
    render();
    return;
  }

  if(action==='toggle-read'&&id){
    const idx=state.readIds.indexOf(id);
    if(idx>=0){
      state.readIds.splice(idx,1);
      showToast('열람 미완료로 변경했어요.');
    }else{
      state.readIds.push(id);
      showToast('열람 완료로 기록했어요.');
    }
    saveUserState();
    if(modalEl?.open&&activeEntryId===id)openEntryModal(id);
    render();
    return;
  }

  if(action==='save-note'&&id){
    const noteEl=modalEl?.querySelector?.('#entry-note-input');
    const text=String(noteEl?.value||'').trim();
    if(text)state.notes[id]=text.slice(0,2000);
    else delete state.notes[id];
    saveUserState();
    showToast('연구 노트를 저장했어요.');
    render();
    return;
  }

  if(action==='set-theme'&&theme){
    settings=saveSettings({...settings,theme});
    applySettingsToDocument(settings);
    render();
    return;
  }

  if(action==='set-fontsize'&&fontsize){
    settings=saveSettings({...settings,fontSize:fontsize});
    applySettingsToDocument(settings);
    render();
    return;
  }

  if(action==='toggle-french'){
    settings=saveSettings({...settings,showFrench:!settings.showFrench});
    render();
    return;
  }

  if(action==='toggle-awake'){
    settings=saveSettings({...settings,keepAwake:!settings.keepAwake});
    render();
    return;
  }

  if(action==='backup'){
    openBackupModal();
    return;
  }

  if(action==='export-backup'){
    handleExportBackup();
    return;
  }

  if(action==='import-backup'){
    backupFileEl?.click?.();
  }
});

document.addEventListener('input',event=>{
  if(event?.target?.id==='search-input'){
    searchQuery=event.target.value||'';
    render();
    const input=document.querySelector?.('#search-input');
    input?.focus?.();
  }
});

document.addEventListener('change',event=>{
  if(event?.target?.id==='sort-select'){
    activeSort=event.target.value||'plate';
    render();
  }
});

installNativeNavigation(
  ()=>{
    if(modalEl?.open){
      modalEl.close?.();
      activeEntryId=null;
      syncWakeLock();
      return true;
    }
    if(activeTab!=='dictionary'){
      activeTab='dictionary';
      render();
      return true;
    }
    return false;
  },
  ()=>{
    applySettingsToDocument(settings);
    syncWakeLock();
  }
);

render();
