import {CATEGORIES,GALLERY_CATEGORIES,LETTERS,ENTRIES,ILLUSTRATED_ENTRIES,ENTRY_MAP,VALID_ENTRY_IDS,filterEntries,getDailyEntry} from './entries.js?v=6158cd2e25e3';
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

const PAGE_STEP=80;
let activeTab='dictionary';
let searchQuery='';
let activeCategory='all';
let activeGalleryCategory='all';
let activeLetter='ALL';
let activeSort='page';
let visibleLimit=PAGE_STEP;
let activeEntryId=null;
let savedScrollY=0;
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
  const shouldKeepAwake=settings.keepAwake&&(Boolean(activeEntryId)||modalEl?.open||activeTab==='daily');
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
  daily:'무작위 열람',
  bookmarks:'서재 기록',
  settings:'설정'
};

const TAB_BACK_LABELS={
  dictionary:'← 사전 탐색 목록으로',
  gallery:'← 삽화 도감으로',
  daily:'← 무작위 열람으로',
  bookmarks:'← 서재 기록으로',
  settings:'← 설정으로'
};

function renderEntryThumb(entry){
  if(entry.hasPlate&&entry.plate){
    return `<div class="entry-thumb-wrap">
      <img class="entry-thumb" src="${escapeHtml(entry.plate)}" alt="${escapeHtml(entry.nameKo)} 판화" loading="lazy">
    </div>`;
  }
  return `<div class="entry-thumb-wrap entry-monogram-wrap" aria-hidden="true">
    <span class="entry-monogram-letter">${escapeHtml(entry.letter||'A')}</span>
    <span class="entry-monogram-page">p.${entry.page1863}</span>
  </div>`;
}

const SUB_CATEGORY_LABELS={
  monarch:'악마 · 지옥 군주',
  duke:'악마 · 대공·후작·총재',
  spirit:'악마 · 하급 악마·괴이',
  myth:'신화 · 고대 신격·사바트'
};

const CATEGORY_TAG_LABELS={
  demon:'악마·정령',
  myth:'신화·종교',
  person:'마법사·인물',
  divination:'점술·점성술',
  superstition:'미신·민속',
  grimoire:'마도서·문헌',
  crossref:'상호참조'
};

function getEntryCategoryTag(entry){
  if(entry.hasPlate&&entry.subCategory&&SUB_CATEGORY_LABELS[entry.subCategory]){
    return SUB_CATEGORY_LABELS[entry.subCategory];
  }
  return CATEGORY_TAG_LABELS[entry.category]||'미신·민속';
}

function renderEntryCard(entry){
  const isBookmarked=state.bookmarks.includes(entry.id);
  const isRead=state.readIds.includes(entry.id);
  const metaText=entry.hasPlate?`판화 No. ${entry.plateNo} · p.${entry.page1863}`:`1863년판 ${entry.letter}부 · p.${entry.page1863}`;
  const tag=getEntryCategoryTag(entry);
  return `<article class="entry-card" data-action="open-entry" data-id="${escapeHtml(entry.id)}">
    ${renderEntryThumb(entry)}
    <div class="entry-card-body">
      <div class="entry-card-top">
        <span class="entry-plate-no">${escapeHtml(metaText)}</span>
        <div class="entry-badges">
          ${entry.hasPlate?'<span class="mini-badge accent">삽화</span>':''}
          ${isBookmarked?'<span class="mini-badge accent">즐겨찾기</span>':''}
          ${isRead?'<span class="mini-badge">열람</span>':''}
        </div>
      </div>
      <h2 class="entry-title-ko">${escapeHtml(entry.nameKo)}</h2>
      ${rankIsTitle(entry)?`<div class="entry-rank-line">${escapeHtml(entry.rank)}</div>`:''}
      <div class="domain-tags">
        <span class="domain-tag">${escapeHtml(tag)}</span>
      </div>
      <p class="entry-summary">${escapeHtml(entry.summary)}</p>
    </div>
  </article>`;
}

function getActiveContextList(){
  if(activeTab==='gallery'){
    return filterEntries({category:activeGalleryCategory,sort:'plate',onlyIllustrated:true});
  }
  if(activeTab==='bookmarks'){
    const bm=state.bookmarks.map(id=>ENTRY_MAP.get(id)).filter(Boolean);
    return bm.length?bm:ENTRIES;
  }
  const filtered=filterEntries({query:searchQuery,category:activeCategory,letter:activeLetter,sort:activeSort});
  return filtered.length?filtered:ENTRIES;
}

function navigateEntryRelative(delta){
  if(!activeEntryId)return false;
  const entry=ENTRY_MAP.get(activeEntryId);
  if(!entry)return false;
  const contextList=getActiveContextList();
  let idx=contextList.findIndex(item=>item.id===entry.id);
  const navList=idx>=0?contextList:ENTRIES;
  if(idx<0)idx=navList.findIndex(item=>item.id===entry.id);
  const targetIdx=idx+delta;
  if(targetIdx>=0&&targetIdx<navList.length){
    openEntryPage(navList[targetIdx].id);
    return true;
  }
  return false;
}

const TITLE_RANK_PATTERN=/대공|대총재|후작|지옥 군주/;

function rankIsTitle(entry){
  return Boolean(entry.hasPlate)||(entry.category==='demon'&&TITLE_RANK_PATTERN.test(entry.rank||''));
}

function formatParagraphs(text){
  const lines=String(text??'').split(/\n+/).map(s=>s.trim()).filter(Boolean);
  if(!lines.length)return '';
  return lines.map(line=>`<p class="detail-paragraph">${escapeHtml(line)}</p>`).join('');
}

function renderEntryArticleCard(entry,extraFooterHtml=''){
  return `<article class="detail-card">
    <header class="detail-header">
      <div class="detail-meta-row">
        <span class="entry-plate-no">${entry.hasPlate?`루이 브르통 판화 No. ${entry.plateNo} · `:''}1863년 제6판 ${escapeHtml(entry.letter)}부 · 원서 p.${entry.page1863}</span>
      </div>
      <h2 class="detail-title-ko">${escapeHtml(entry.nameKo)}</h2>
      ${rankIsTitle(entry)?`<div class="detail-rank-line">${escapeHtml(entry.rank)}</div>`:''}
      <div class="domain-tags">
        <span class="domain-tag">${escapeHtml(getEntryCategoryTag(entry))}</span>
      </div>
    </header>

    ${entry.hasPlate&&entry.plate?`<figure class="detail-plate-showcase">
      <div class="detail-plate-frame">
        <img src="${escapeHtml(entry.plate)}" alt="${escapeHtml(entry.nameKo)} 루이 브르통 1863년 목판화" draggable="false">
      </div>
      <figcaption>루이 브르통 (Louis Breton) 원화 · 자로 (Jarrault) 목판 조각 (판화 No. ${entry.plateNo} · 1863년 제6판 p.${entry.page1863})</figcaption>
    </figure>`:''}

    <div class="detail-body">
      ${entry.appearance?`<div class="detail-appearance-box">
        <strong>외형 및 도상 묘사</strong>
        <p>${escapeHtml(entry.appearance)}</p>
      </div>`:''}

      <div class="detail-translation">
        ${formatParagraphs(entry.description)}
      </div>

      ${settings.showFrench?`<blockquote class="detail-french-box">
        <div class="detail-french-header">
          <strong>1863년 프랑스어 원문 (${escapeHtml(entry.nameFr)})</strong>
          <span>p.${entry.page1863}</span>
        </div>
        <p>“${escapeHtml(entry.quoteFr)}”</p>
        <footer>— J.-A.-S. Collin de Plancy, <em>Dictionnaire Infernal</em> (6e édition, 1863)</footer>
      </blockquote>`:''}
    </div>
  </article>

  ${extraFooterHtml}`;
}

function renderEntryDetailPage(entry){
  const isBookmarked=state.bookmarks.includes(entry.id);
  const isRead=state.readIds.includes(entry.id);
  const backLabel=TAB_BACK_LABELS[activeTab]||'← 목록으로 돌아가기';

  const contextList=getActiveContextList();
  let idx=contextList.findIndex(item=>item.id===entry.id);
  const navList=idx>=0?contextList:ENTRIES;
  if(idx<0)idx=navList.findIndex(item=>item.id===entry.id);
  const prevEntry=idx>0?navList[idx-1]:null;
  const nextEntry=idx>=0&&idx<navList.length-1?navList[idx+1]:null;

  const prevNextHtml=`<nav class="detail-prev-next" aria-label="이전 및 다음 표제어 이동">
    ${prevEntry
      ?`<button type="button" class="prev-next-btn prev" data-action="open-entry" data-id="${escapeHtml(prevEntry.id)}">
          <span class="pn-dir">← 이전 항목 (p.${prevEntry.page1863})</span>
          <strong>${escapeHtml(prevEntry.nameKo)}</strong>
        </button>`
      :`<div class="prev-next-spacer"></div>`}
    ${nextEntry
      ?`<button type="button" class="prev-next-btn next" data-action="open-entry" data-id="${escapeHtml(nextEntry.id)}">
          <span class="pn-dir">다음 항목 (p.${nextEntry.page1863}) →</span>
          <strong>${escapeHtml(nextEntry.nameKo)}</strong>
        </button>`
      :`<div class="prev-next-spacer"></div>`}
  </nav>
  <div style="text-align:center;margin-top:2px"><span class="swipe-guide">← 좌우로 밀어서 이전 / 다음 항목 넘기기 →</span></div>`;

  return `<section class="entry-detail-page">
    <div class="detail-topbar">
      <button type="button" class="detail-back-btn" data-action="close-entry">
        ${escapeHtml(backLabel)}
      </button>
      <div class="detail-top-actions">
        <button type="button" class="${isBookmarked?'primary':''}" data-action="toggle-bookmark" data-id="${escapeHtml(entry.id)}">
          ${isBookmarked?'★ 즐겨찾기됨':'☆ 즐겨찾기'}
        </button>
        <button type="button" data-action="toggle-read" data-id="${escapeHtml(entry.id)}">
          ${isRead?'✓ 열람 완료':'열람 표시'}
        </button>
        <button type="button" class="secondary" data-action="toggle-french">
          ${settings.showFrench?'불문 원문 숨김':'불문 원문 함께 보기'}
        </button>
      </div>
    </div>

    ${renderEntryArticleCard(entry,prevNextHtml)}
  </section>`;
}

function renderDictionaryTab(){
  const list=filterEntries({query:searchQuery,category:activeCategory,letter:activeLetter,sort:activeSort});
  const shown=list.slice(0,visibleLimit);
  const remaining=Math.max(0,list.length-shown.length);

  const pillsHtml=CATEGORIES.map(cat=>
    `<button type="button" class="pill${activeCategory===cat.id?' active':''}" data-action="filter-category" data-category="${cat.id}">${escapeHtml(cat.label)}</button>`
  ).join('');

  const lettersHtml=LETTERS.map(letId=>
    `<button type="button" class="letter-pill${activeLetter===letId?' active':''}" data-action="filter-letter" data-letter="${letId}">${letId}</button>`
  ).join('');

  return `<section class="dictionary-view">
    <div class="toolbar">
      <div class="search-row">
        <div class="search-box">
          ${icon('search')}
          <input id="search-input" type="search" placeholder="표제어(한글·영문/불어), 인물, 점술, 악마 검색..." value="${escapeHtml(searchQuery)}" aria-label="사전 검색">
        </div>
        <select id="sort-select" class="sort-select" aria-label="정렬 기준">
          <option value="page"${activeSort==='page'?' selected':''}>1863 원서 페이지순 (A–Z)</option>
          <option value="plate"${activeSort==='plate'?' selected':''}>판화 우선순</option>
          <option value="ko"${activeSort==='ko'?' selected':''}>한글 가나다순</option>
          <option value="fr"${activeSort==='fr'?' selected':''}>원문 알파벳순</option>
          <option value="legions"${activeSort==='legions'?' selected':''}>군단 규모순</option>
        </select>
      </div>
      <div class="category-pills" role="tablist" aria-label="분류 필터">${pillsHtml}</div>
      <div class="letter-pills" role="tablist" aria-label="알파벳 색인">${lettersHtml}</div>
    </div>
    <div class="summary-bar">
      <span>조건 일치 <strong>${list.length.toLocaleString()}</strong> / 전체 ${ENTRIES.length.toLocaleString()}편 (현재 ${shown.length.toLocaleString()}편 표시)</span>
      <span>열람 완료 <strong>${state.readIds.length.toLocaleString()}</strong>편</span>
    </div>
    ${shown.length
      ?`<div class="entry-list">${shown.map(renderEntryCard).join('')}</div>
        ${remaining>0?`<div class="load-more-wrap">
          <button type="button" class="secondary load-more-btn" data-action="load-more">다음 항목 더 보기 (+${Math.min(PAGE_STEP,remaining)}편 / 남은 ${remaining.toLocaleString()}편)</button>
        </div>`:''}`
      :`<div class="empty-state">검색 조건에 맞는 『지옥사전』 항목이 없습니다.</div>`}
  </section>`;
}

function renderGalleryTab(){
  const list=filterEntries({category:activeGalleryCategory,sort:'plate',onlyIllustrated:true});
  const pillsHtml=GALLERY_CATEGORIES.map(cat=>
    `<button type="button" class="pill${activeGalleryCategory===cat.id?' active':''}" data-action="filter-gallery-category" data-category="${cat.id}">${escapeHtml(cat.label)}</button>`
  ).join('');

  return `<section class="gallery-view">
    <div class="toolbar">
      <div class="category-pills" role="tablist" aria-label="도감 분류 필터">${pillsHtml}</div>
    </div>
    <div class="summary-bar">
      <span>루이 브르통 (Louis Breton) 1863년 목판화 <strong>${list.length}</strong>점</span>
      <span>항목을 누르면 상세 페이지로 이동합니다</span>
    </div>
    <div class="plate-grid">
      ${list.map(entry=>`<article class="plate-card" data-action="open-entry" data-id="${escapeHtml(entry.id)}">
        <div class="plate-frame">
          <img src="${escapeHtml(entry.plate)}" alt="${escapeHtml(entry.nameKo)}" loading="lazy">
        </div>
        <div class="plate-caption">
          <strong>${escapeHtml(entry.nameKo)}</strong>
          <span>No.${entry.plateNo} · p.${entry.page1863}</span>
        </div>
      </article>`).join('')}
    </div>
  </section>`;
}

function markEntryAsRead(entryId){
  if(!entryId||!ENTRY_MAP.has(entryId))return;
  if(!state.readIds.includes(entryId)){
    state.readIds.push(entryId);
    saveUserState();
  }
}

function getCurrentRandomEntry(){
  const todayStr=new Date().toISOString().slice(0,10);
  return randomOverrideId&&ENTRY_MAP.get(randomOverrideId)||getDailyEntry(todayStr);
}

function advanceRandomEntry(){
  const current=getCurrentRandomEntry();
  if(current)markEntryAsRead(current.id);
  let pick=ENTRIES[Math.floor(Math.random()*ENTRIES.length)];
  if(ENTRIES.length>1&&current&&pick.id===current.id){
    pick=ENTRIES[(ENTRIES.indexOf(pick)+1)%ENTRIES.length];
  }
  randomOverrideId=pick.id;
  markEntryAsRead(pick.id);
  render();
  if(typeof window!=='undefined'){
    window.scrollTo?.({top:0,behavior:'instant'});
  }
}

function renderDailyTab(){
  const entry=getCurrentRandomEntry();
  markEntryAsRead(entry.id);
  const isBookmarked=state.bookmarks.includes(entry.id);
  const isRead=state.readIds.includes(entry.id);

  return `<section class="entry-detail-page daily-view" aria-label="무작위 지옥사전 표제어">
    <div class="detail-topbar">
      <span class="swipe-guide">← 좌우로 밀어서 다음 무작위 항목 넘기기 →</span>
      <div class="detail-top-actions">
        <button type="button" class="${isBookmarked?'primary':''}" data-action="toggle-bookmark" data-id="${escapeHtml(entry.id)}">
          ${isBookmarked?'★ 즐겨찾기됨':'☆ 즐겨찾기'}
        </button>
        <button type="button" data-action="toggle-read" data-id="${escapeHtml(entry.id)}">
          ${isRead?'✓ 열람 완료됨':'열람 표시'}
        </button>
        <button type="button" class="secondary" data-action="toggle-french">
          ${settings.showFrench?'불문 원문 숨김':'불문 원문 함께 보기'}
        </button>
      </div>
    </div>

    ${renderEntryArticleCard(entry)}
  </section>`;
}

function renderBookmarksTab(){
  const bookmarkedEntries=state.bookmarks.map(id=>ENTRY_MAP.get(id)).filter(Boolean);
  const readEntries=state.readIds.map(id=>ENTRY_MAP.get(id)).filter(Boolean);

  return `<section class="bookmarks-view">
    <div class="panel">
      <h2>서재 열람 현황</h2>
      <p style="margin:0;color:var(--text-muted);font-size:0.88rem">
        전체 ${ENTRIES.length.toLocaleString()}편 중 <strong>${readEntries.length.toLocaleString()}편</strong> 열람 완료 · 즐겨찾기 <strong>${bookmarkedEntries.length.toLocaleString()}편</strong>
      </p>
    </div>

    <div class="panel">
      <h3>즐겨찾기한 항목 (${bookmarkedEntries.length})</h3>
      ${bookmarkedEntries.length
        ?`<div class="entry-list">${bookmarkedEntries.map(renderEntryCard).join('')}</div>`
        :`<div class="empty-state">아직 즐겨찾기한 악마·표제어가 없습니다. 항목 상세 페이지에서 ★ 즐겨찾기를 눌러 추가해 보세요.</div>`}
    </div>

  </section>`;
}

function renderSettingsTab(){
  return `<section class="settings-view">
    <div class="panel">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><h2 style="margin:0">화면 및 독서 환경</h2><button type="button" class="help" data-action="settings-help" aria-label="설정 도움말">?</button></div>
      <div class="setting-row">
        <div class="setting-label">
          <strong>테마 모드</strong>
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
        </div>
        <div class="segmented" role="group" aria-label="글자 크기">
          <button type="button" class="${settings.fontSize==='normal'?'active':''}" data-action="set-fontsize" data-fontsize="normal">기본</button>
          <button type="button" class="${settings.fontSize==='large'?'active':''}" data-action="set-fontsize" data-fontsize="large">크게</button>
        </div>
      </div>

      <div class="setting-row">
        <div class="setting-label">
          <strong>1863년 프랑스어 원문 전문 병기</strong>
        </div>
        <button type="button" class="${settings.showFrench?'primary':''}" data-action="toggle-french">
          ${settings.showFrench?'표시 중':'숨김'}
        </button>
      </div>

      <div class="setting-row">
        <div class="setting-label">
          <strong>열람 중 화면 켜짐 유지</strong>
        </div>
        <button type="button" class="${settings.keepAwake?'primary':''}" data-action="toggle-awake">
          ${settings.keepAwake?'켜짐':'꺼짐'}
        </button>
      </div>
    </div>

    <div class="panel">
      <h2>서재 정보 관리</h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="primary" data-action="backup">내보내기 / 가져오기</button>
      </div>
    </div>

    <div class="panel">
      <h2>원전 및 판본 정보</h2>
      <p style="margin:0;font-size:0.84rem;color:var(--text-muted)">
        • 원제: <em>Dictionnaire Infernal</em> (제6판, 1863년 파리 Henri Plon 간행 · 전 3,810개 표제어 완역/수록)<br>
        • 저자: 자크 알뱅 시몽 콜랭 드 플랑시 (J.-A.-S. Collin de Plancy, 1794–1881)<br>
        • 삽화: 루이 브르통 (Louis Breton) 원화 · 자로 (Jarrault) 목판 조각<br>
        • 라이선스: 퍼블릭 도메인 (Public Domain, Internet Archive, BnF Gallica &amp; Wikisource)
      </p>
    </div>
  </section>`;
}

function render(){
  if(!mainEl)return;
  for(const btn of document.querySelectorAll?.('nav button[data-tab]')||[]){
    btn.classList?.toggle?.('active',btn.dataset?.tab===activeTab);
  }
  const activeEntry=activeEntryId?ENTRY_MAP.get(activeEntryId):null;
  if(activeEntry){
    if(headerTitleEl)headerTitleEl.textContent=activeEntry.nameKo;
    mainEl.innerHTML=renderEntryDetailPage(activeEntry);
    syncWakeLock();
    return;
  }
  if(headerTitleEl)headerTitleEl.textContent=TAB_TITLES[activeTab]||'지옥사전';
  if(activeTab==='dictionary')mainEl.innerHTML=renderDictionaryTab();
  else if(activeTab==='gallery')mainEl.innerHTML=renderGalleryTab();
  else if(activeTab==='daily')mainEl.innerHTML=renderDailyTab();
  else if(activeTab==='bookmarks')mainEl.innerHTML=renderBookmarksTab();
  else if(activeTab==='settings')mainEl.innerHTML=renderSettingsTab();
  syncWakeLock();
}

function openEntryPage(entryId,pushHistory=true){
  const entry=ENTRY_MAP.get(entryId);
  if(!entry)return;
  if(!activeEntryId&&typeof window!=='undefined'){
    savedScrollY=window.scrollY||0;
  }
  activeEntryId=entry.id;
  if(!state.readIds.includes(entry.id)){
    state.readIds.push(entry.id);
    saveUserState();
  }
  if(pushHistory&&typeof window!=='undefined'&&window.history?.pushState){
    try{
      window.history.pushState({entryId:entry.id},'',`#entry=${encodeURIComponent(entry.id)}`);
    }catch{}
  }
  render();
  if(typeof window!=='undefined'){
    window.scrollTo?.({top:0,behavior:'instant'});
  }
}

function closeEntryPage(fromPopState=false){
  if(!activeEntryId)return;
  activeEntryId=null;
  if(!fromPopState&&typeof window!=='undefined'&&window.location?.hash?.startsWith('#entry=')){
    try{
      window.history?.replaceState?.(null,'',window.location.pathname+window.location.search);
    }catch{}
  }
  render();
  if(typeof window!=='undefined'){
    window.scrollTo?.({top:savedScrollY,behavior:'instant'});
  }
}

if(typeof window!=='undefined'&&window.addEventListener){
  window.addEventListener('popstate',event=>{
    const entryId=event?.state?.entryId;
    if(entryId&&ENTRY_MAP.has(entryId)){
      openEntryPage(entryId,false);
    }else if(activeEntryId){
      closeEntryPage(true);
    }
  });
}

function openBackupModal(){
  if(!modalEl)return;
  modalEl.innerHTML=`<div class="modal-inner">
    <div class="modal-top">
      <h2>서재 기록 내보내기 / 가져오기</h2>
      <button type="button" data-action="close" aria-label="닫기">${icon('close')}</button>
    </div>
    <p style="margin:0;font-size:0.88rem;color:var(--text-muted)">
      즐겨찾기(${state.bookmarks.length}건), 열람 기록(${state.readIds.length}건) 및 환경 설정을 JSON 파일로 백업하거나 복원합니다.
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

function openSettingsHelpModal(){
  if(!modalEl)return;
  modalEl.innerHTML=`<div class="modal-inner">
    <div class="modal-top">
      <h2>설정 도움말</h2>
      <button type="button" data-action="close" aria-label="닫기">${icon('close')}</button>
    </div>
    <ul style="margin:0;padding-left:18px;font-size:0.9rem;color:var(--text-muted);display:flex;flex-direction:column;gap:6px">
      <li><strong>테마 모드</strong>: 어두운 흑요석 테마 또는 고서 양피지 테마</li>
      <li><strong>글자 크기</strong>: 본문 및 해설 가독성 조절</li>
      <li><strong>1863년 프랑스어 원문 전문 병기</strong>: 자크 콜랭 드 플랑시 (Collin de Plancy)의 1863년 원문 표시</li>
      <li><strong>열람 중 화면 켜짐 유지</strong>: 상세 열람 및 무작위 열람 화면에서 꺼짐 방지</li>
      <li><strong>서재 정보 관리</strong>: ${escapeHtml(storageNotice())}</li>
    </ul>
    <div class="modal-actions">
      <button type="button" class="primary" data-action="close">확인</button>
    </div>
  </div>`;
  if(!modalEl.open)modalEl.showModal?.();
}

function openHelpModal(){
  if(!modalEl)return;
  modalEl.innerHTML=`<div class="modal-inner">
    <div class="modal-top">
      <h2>『지옥사전 (Dictionnaire Infernal)』 안내</h2>
      <button type="button" data-action="close" aria-label="닫기">${icon('close')}</button>
    </div>
    <p style="margin:0">
      프랑스의 문필가 자크 콜랭 드 플랑시 (Collin de Plancy, 1794–1881)가 저술하고 루이 브르통 (Louis Breton)이 삽화를 그린 1863년 제6판 『지옥사전 (Dictionnaire Infernal)』의 A–Z 전 항목(${ENTRIES.length.toLocaleString()}편)을 웹과 안드로이드 앱에서 오프라인으로 탐색할 수 있도록 구성한 백과사전입니다.
    </p>
    <ul style="margin:0;padding-left:18px;font-size:0.88rem;color:var(--text-muted)">
      <li><strong>A–Z 전 항목 수록</strong>: 악마뿐만 아니라 마법사, 점성술사, 연금술, 점술, 민간 미신, 전설, 마도서 등 A부터 Z까지 3,810개 표제어 전체를 수록했습니다.</li>
      <li><strong>고유명사 영문/원문 병기</strong>: 모든 표제어와 주요 고유명사에 한글 표기와 영문/원어 표기(예: 아바리스 (Abaris))를 함께 표시합니다.</li>
      <li><strong>삽화 도감</strong>: 1863년 초판본에서 추출한 루이 브르통의 오리지널 목판화 68점을 감상합니다.</li>
      <li><strong>서재 기록</strong>: 즐겨찾기·열람 완료 항목을 모아 보고 JSON으로 백업합니다.</li>
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
  const {tab,action,id,category,letter,theme,fontsize}=target.dataset||{};

  if(tab){
    activeEntryId=null;
    if(tab==='daily'){
      activeTab='daily';
      advanceRandomEntry();
      return;
    }
    activeTab=tab;
    render();
    return;
  }

  if(action==='open-entry'&&id){
    openEntryPage(id);
    return;
  }

  if(action==='close-entry'){
    closeEntryPage();
    return;
  }

  if(action==='close'){
    if(modalEl?.open){
      modalEl.close?.();
      syncWakeLock();
    }else if(activeEntryId){
      closeEntryPage();
    }
    return;
  }

  if(action==='random'||action==='reroll-daily'){
    if(action==='random'){
      const pick=ENTRIES[Math.floor(Math.random()*ENTRIES.length)];
      randomOverrideId=pick.id;
      openEntryPage(pick.id);
      return;
    }
    advanceRandomEntry();
    return;
  }

  if(action==='settings-help'){openSettingsHelpModal();return;}
  if(action==='help'){
    openHelpModal();
    return;
  }

  if(action==='filter-category'&&category){
    activeCategory=category;
    visibleLimit=PAGE_STEP;
    render();
    return;
  }

  if(action==='filter-gallery-category'&&category){
    activeGalleryCategory=category;
    render();
    return;
  }

  if(action==='filter-letter'&&letter){
    activeLetter=letter;
    visibleLimit=PAGE_STEP;
    render();
    return;
  }

  if(action==='load-more'){
    visibleLimit+=PAGE_STEP;
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

let swipeStartX=null;
let swipeStartY=null;

function isInteractiveInput(target){
  const tag=String(target?.tagName||'').toUpperCase();
  return tag==='TEXTAREA'||tag==='INPUT'||tag==='SELECT'||tag==='BUTTON';
}

document.addEventListener('touchstart',event=>{
  if(modalEl?.open)return;
  if(!activeEntryId&&activeTab!=='daily')return;
  if(isInteractiveInput(event?.target))return;
  const touch=event?.changedTouches?.[0]||event?.touches?.[0];
  if(!touch)return;
  swipeStartX=touch.clientX;
  swipeStartY=touch.clientY;
},{passive:true});

document.addEventListener('touchend',event=>{
  if(swipeStartX===null||swipeStartY===null)return;
  const startX=swipeStartX;
  const startY=swipeStartY;
  swipeStartX=null;
  swipeStartY=null;
  if(modalEl?.open)return;
  if(!activeEntryId&&activeTab!=='daily')return;
  const touch=event?.changedTouches?.[0];
  if(!touch)return;
  const dx=touch.clientX-startX;
  const dy=touch.clientY-startY;
  if(Math.abs(dx)>=48&&Math.abs(dx)>Math.abs(dy)*1.25){
    if(activeEntryId){
      if(dx<0){
        if(!navigateEntryRelative(1))showToast('마지막 항목입니다.');
      }else{
        if(!navigateEntryRelative(-1))showToast('첫 번째 항목입니다.');
      }
    }else if(activeTab==='daily'){
      advanceRandomEntry();
    }
  }
},{passive:true});

let mouseDownX=null;
let mouseDownY=null;

document.addEventListener('mousedown',event=>{
  if(modalEl?.open)return;
  if(!activeEntryId&&activeTab!=='daily')return;
  if(isInteractiveInput(event?.target))return;
  mouseDownX=event?.clientX??null;
  mouseDownY=event?.clientY??null;
});

document.addEventListener('mouseup',event=>{
  if(mouseDownX===null||mouseDownY===null)return;
  const startX=mouseDownX;
  const startY=mouseDownY;
  mouseDownX=null;
  mouseDownY=null;
  if(modalEl?.open)return;
  if(!activeEntryId&&activeTab!=='daily')return;
  if(typeof window!=='undefined'&&window.getSelection?.()?.toString()?.trim()?.length){
    return;
  }
  const dx=(event?.clientX??startX)-startX;
  const dy=(event?.clientY??startY)-startY;
  if(Math.abs(dx)>=60&&Math.abs(dx)>Math.abs(dy)*1.25){
    if(activeEntryId){
      if(dx<0){
        if(!navigateEntryRelative(1))showToast('마지막 항목입니다.');
      }else{
        if(!navigateEntryRelative(-1))showToast('첫 번째 항목입니다.');
      }
    }else if(activeTab==='daily'){
      advanceRandomEntry();
    }
  }
});

document.addEventListener('keydown',event=>{
  if(modalEl?.open)return;
  if(isInteractiveInput(event?.target))return;
  if(!activeEntryId&&activeTab!=='daily')return;
  if(event?.key==='ArrowLeft'||event?.key==='ArrowRight'){
    if(activeEntryId){
      if(event.key==='ArrowRight'){
        if(!navigateEntryRelative(1))showToast('마지막 항목입니다.');
      }else{
        if(!navigateEntryRelative(-1))showToast('첫 번째 항목입니다.');
      }
    }else if(activeTab==='daily'){
      advanceRandomEntry();
    }
  }
});

let searchComposing=false;

function applySearchInput(value){
  searchQuery=value||'';
  visibleLimit=PAGE_STEP;
  render();
  const input=document.querySelector?.('#search-input');
  if(input){
    input.focus?.();
    const end=String(input.value||'').length;
    try{input.setSelectionRange?.(end,end);}catch{}
  }
}

document.addEventListener('compositionstart',event=>{
  if(event?.target?.id==='search-input')searchComposing=true;
});

document.addEventListener('compositionend',event=>{
  if(event?.target?.id==='search-input'){
    searchComposing=false;
    applySearchInput(event.target.value);
  }
});

document.addEventListener('input',event=>{
  if(event?.target?.id==='search-input'){
    if(searchComposing||event.isComposing)return;
    applySearchInput(event.target.value);
  }
});

document.addEventListener('change',event=>{
  if(event?.target?.id==='sort-select'){
    activeSort=event.target.value||'page';
    visibleLimit=PAGE_STEP;
    render();
  }
});

installNativeNavigation(
  ()=>{
    if(modalEl?.open){
      modalEl.close?.();
      syncWakeLock();
      return true;
    }
    if(activeEntryId){
      closeEntryPage();
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

// PC: drag-to-scroll and wheel-to-horizontal for pill rows (category / letter)
(function setupPillRowDragScroll(){
  let row=null;
  let startX=0;
  let startScroll=0;
  let moved=false;
  const findRow=target=>target?.closest?.('.category-pills, .letter-pills')||null;

  document.addEventListener('mousedown',event=>{
    if(event.button!==undefined&&event.button!==0)return;
    row=findRow(event?.target);
    if(!row)return;
    startX=event.clientX;
    startScroll=row.scrollLeft;
    moved=false;
  });

  document.addEventListener('mousemove',event=>{
    if(!row)return;
    const dx=event.clientX-startX;
    if(!moved&&Math.abs(dx)>5){
      moved=true;
      row.classList?.add('dragging');
    }
    if(moved){
      row.scrollLeft=startScroll-dx;
      event.preventDefault?.();
    }
  });

  document.addEventListener('mouseup',()=>{
    if(!row)return;
    row.classList?.remove('dragging');
    row=null;
  });

  // Swallow the click that ends a drag so a pill isn't selected accidentally
  document.addEventListener('click',event=>{
    if(moved){
      moved=false;
      if(findRow(event?.target)){
        event.stopPropagation();
        event.preventDefault();
      }
    }
  },true);

  document.addEventListener('wheel',event=>{
    const r=findRow(event?.target);
    if(!r||r.scrollWidth<=r.clientWidth)return;
    if(Math.abs(event.deltaY)>Math.abs(event.deltaX)){
      r.scrollLeft+=event.deltaY;
      event.preventDefault?.();
    }
  },{passive:false});
})();
