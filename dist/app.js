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

const tabEntryIds={
  dictionary:null,
  gallery:null,
  bookmarks:null
};

const tabScrollY={
  dictionary:0,
  gallery:0,
  daily:0,
  bookmarks:0,
  settings:0
};

const savedPillScrolls={
  category:0,
  letter:0,
  galleryCategory:0
};

function restorePillScrolls(){
  if(!mainEl)return;
  const catPills=mainEl.querySelector?.('.category-pills');
  if(catPills){
    catPills.scrollLeft=activeTab==='gallery'?savedPillScrolls.galleryCategory:savedPillScrolls.category;
  }
  const letPills=mainEl.querySelector?.('.letter-pills');
  if(letPills){
    letPills.scrollLeft=savedPillScrolls.letter;
  }
}
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
        <span class="back-text-full">${escapeHtml(backLabel)}</span>
        <span class="back-text-short">← 목록</span>
      </button>
      <div class="detail-top-actions">
        <button type="button" class="${isBookmarked?'primary':''}" data-action="toggle-bookmark" data-id="${escapeHtml(entry.id)}">
          ${isBookmarked?'★ 즐겨찾기':'☆ 즐겨찾기'}
        </button>
        <button type="button" data-action="toggle-read" data-id="${escapeHtml(entry.id)}">
          ${isRead?'✓ 열람 완료':'열람'}
        </button>
        <button type="button" class="secondary" data-action="toggle-french">
          ${settings.showFrench?'FR 닫기':'FR 원문'}
        </button>
      </div>
    </div>

    ${renderEntryArticleCard(entry,prevNextHtml)}
  </section>`;
}

function renderDictionaryResults(){
  const list=filterEntries({query:searchQuery,category:activeCategory,letter:activeLetter,sort:activeSort});
  const shown=list.slice(0,visibleLimit);
  const remaining=Math.max(0,list.length-shown.length);

  return `<div class="summary-bar">
    <span>조건 일치 <strong>${list.length.toLocaleString()}</strong> / 전체 ${ENTRIES.length.toLocaleString()}편 (현재 ${shown.length.toLocaleString()}편 표시)</span>
    <span>열람 완료 <strong>${state.readIds.length.toLocaleString()}</strong>편</span>
  </div>
  ${shown.length
    ?`<div class="entry-list">${shown.map(renderEntryCard).join('')}</div>
      ${remaining>0?`<div class="load-more-wrap">
        <button type="button" class="secondary load-more-btn" data-action="load-more">다음 항목 더 보기 (+${Math.min(PAGE_STEP,remaining)}편 / 남은 ${remaining.toLocaleString()}편)</button>
      </div>`:''}`
    :`<div class="empty-state">검색 조건에 맞는 『지옥사전』 항목이 없습니다.</div>`}`;
}

function renderDictionaryTab(){
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
    <div id="dict-results">
      ${renderDictionaryResults()}
    </div>
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
    <div class="detail-topbar" style="justify-content:flex-end">
      <div class="detail-top-actions">
        <button type="button" class="${isBookmarked?'primary':''}" data-action="toggle-bookmark" data-id="${escapeHtml(entry.id)}">
          ${isBookmarked?'★ 즐겨찾기':'☆ 즐겨찾기'}
        </button>
        <button type="button" data-action="toggle-read" data-id="${escapeHtml(entry.id)}">
          ${isRead?'✓ 열람 완료됨':'열람'}
        </button>
        <button type="button" class="secondary" data-action="toggle-french">
          ${settings.showFrench?'FR 닫기':'FR 원문'}
        </button>
      </div>
    </div>

    ${renderEntryArticleCard(entry)}
    <div style="text-align:center;margin-top:2px"><span class="swipe-guide">← 좌우로 밀어서 이전 / 다음 항목 넘기기 →</span></div>
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
  const curCat=mainEl.querySelector?.('.category-pills');
  if(curCat){
    if(activeTab==='gallery')savedPillScrolls.galleryCategory=curCat.scrollLeft;
    else savedPillScrolls.category=curCat.scrollLeft;
  }
  const curLet=mainEl.querySelector?.('.letter-pills');
  if(curLet){
    savedPillScrolls.letter=curLet.scrollLeft;
  }

  for(const btn of document.querySelectorAll?.('nav button[data-tab]')||[]){
    btn.classList?.toggle?.('active',btn.dataset?.tab===activeTab);
  }
  if(headerTitleEl)headerTitleEl.textContent=TAB_TITLES[activeTab]||'지옥사전';
  const activeEntry=activeEntryId?ENTRY_MAP.get(activeEntryId):null;
  if(activeEntry){
    mainEl.innerHTML=renderEntryDetailPage(activeEntry);
    syncWakeLock();
    return;
  }
  if(activeTab==='dictionary'){
    const resultsEl=mainEl?.querySelector?.('#dict-results');
    const inputEl=mainEl?.querySelector?.('#search-input');
    if(resultsEl&&inputEl&&document.activeElement===inputEl){
      resultsEl.innerHTML=renderDictionaryResults();
    }else{
      mainEl.innerHTML=renderDictionaryTab();
    }
  }
  else if(activeTab==='gallery')mainEl.innerHTML=renderGalleryTab();
  else if(activeTab==='daily')mainEl.innerHTML=renderDailyTab();
  else if(activeTab==='bookmarks')mainEl.innerHTML=renderBookmarksTab();
  else if(activeTab==='settings')mainEl.innerHTML=renderSettingsTab();
  restorePillScrolls();
  syncWakeLock();
}

function openEntryPage(entryId,pushHistory=true){
  const entry=ENTRY_MAP.get(entryId);
  if(!entry)return;
  if(!activeEntryId&&typeof window!=='undefined'){
    tabScrollY[activeTab]=window.scrollY||0;
  }
  activeEntryId=entry.id;
  if(activeTab in tabEntryIds){
    tabEntryIds[activeTab]=entry.id;
  }
  if(!state.readIds.includes(entry.id)){
    state.readIds.push(entry.id);
    saveUserState();
  }
  if(pushHistory&&typeof window!=='undefined'&&window.history?.pushState){
    try{
      window.history.pushState({entryId:entry.id,tab:activeTab},'',`#entry=${encodeURIComponent(entry.id)}`);
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
  if(activeTab in tabEntryIds){
    tabEntryIds[activeTab]=null;
  }
  if(!fromPopState&&typeof window!=='undefined'&&window.location?.hash?.startsWith('#entry=')){
    try{
      window.history?.replaceState?.(null,'',window.location.pathname+window.location.search);
    }catch{}
  }
  render();
  if(typeof window!=='undefined'){
    window.scrollTo?.({top:tabScrollY[activeTab]||0,behavior:'instant'});
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

function openHelpModal(){
  if(!modalEl)return;
  let title='도움말';
  let bodyHtml='';

  if(activeEntryId){
    title='상세 열람 안내';
    bodyHtml=`<p style="margin:0">
      선택한 표제어의 1863년 제6판 전문 번역과 상세 정보를 열람하는 화면입니다.
    </p>
    <ul style="margin:0;padding-left:18px;font-size:0.88rem;color:var(--text-muted);display:flex;flex-direction:column;gap:6px">
      <li><strong>좌우 넘기기</strong>: 화면을 좌우로 스와이프하거나 마우스 드래그, 좌우 화살표 키로 이전·다음 항목으로 바로 이동할 수 있습니다.</li>
      <li><strong>불문 원문 함께 보기</strong>: 상단의 버튼으로 자크 콜랭 드 플랑시의 1863년 프랑스어 오리지널 원문을 펼쳐 대조할 수 있습니다.</li>
      <li><strong>즐겨찾기 및 열람 표시</strong>: 상단 버튼으로 서재에 저장하거나 읽음 상태를 관리합니다.</li>
      <li><strong>목록 복귀</strong>: 상단 '← 목록으로 돌아가기' 버튼이나 브라우저 뒤로가기를 누르면 이전에 보던 목록 위치로 그대로 복귀합니다.</li>
    </ul>`;
  }else if(activeTab==='dictionary'){
    title='사전 탐색 안내';
    bodyHtml=`<p style="margin:0">
      1863년 제6판 『지옥사전』 A–Z 전 항목(${ENTRIES.length.toLocaleString()}편)을 색인·검색할 수 있는 사전입니다.
    </p>
    <ul style="margin:0;padding-left:18px;font-size:0.88rem;color:var(--text-muted);display:flex;flex-direction:column;gap:6px">
      <li><strong>검색</strong>: 한글 표제어뿐만 아니라 원문 표기(라틴어/불어/영어), 본문 속 인물·용어로 검색할 수 있습니다.</li>
      <li><strong>분류 및 알파벳 색인</strong>: 상단 태그 줄과 A–Z 알파벳 줄을 좌우로 드래그(또는 마우스 휠)하여 원하는 분류로 빠르게 압축합니다.</li>
      <li><strong>정렬</strong>: 원서 페이지순, 가나다순, 알파벳순, 군단 많은 순으로 목록을 정렬할 수 있습니다.</li>
      <li><strong>항목 열람</strong>: 카드를 누르면 전문 상세 페이지가 열리며, 좌우 스와이프로 연속 열람이 가능합니다.</li>
    </ul>`;
  }else if(activeTab==='gallery'){
    title='삽화 도감 안내';
    bodyHtml=`<p style="margin:0">
      1863년 초판본에서 추출한 화가 루이 브르통 (Louis Breton)의 오리지널 목판화 68점을 감상하는 도감입니다.
    </p>
    <ul style="margin:0;padding-left:18px;font-size:0.88rem;color:var(--text-muted);display:flex;flex-direction:column;gap:6px">
      <li><strong>위계별 세분화</strong>: 상단 태그를 통해 지옥 군주, 대공·후작·총재, 하급 악마·괴이, 고대 신격·사바트로 나누어 감상할 수 있습니다.</li>
      <li><strong>도상 및 묘사</strong>: 카드를 열면 각 악마의 형상 묘사와 루이 브르통의 세밀한 목판화를 크게 감상할 수 있습니다.</li>
      <li><strong>연속 감상</strong>: 상세 페이지에서 좌우로 스와이프하면 도감 순서대로 다음 판화로 바로 넘어갑니다.</li>
    </ul>`;
  }else if(activeTab==='daily'){
    title='무작위 열람 안내';
    bodyHtml=`<p style="margin:0">
      3,810편의 방대한 악마·미신·오컬트 표제어 중 하나를 무작위로 탐색하는 공간입니다.
    </p>
    <ul style="margin:0;padding-left:18px;font-size:0.88rem;color:var(--text-muted);display:flex;flex-direction:column;gap:6px">
      <li><strong>스와이프 넘기기</strong>: 화면을 좌우로 밀거나 마우스 드래그, 좌우 화살표 키를 누르면 다음 무작위 항목으로 즉시 전환됩니다.</li>
      <li><strong>자동 열람 완료</strong>: 페이지를 넘기며 읽은 항목은 자동으로 서재의 '열람 완료'에 기록됩니다.</li>
      <li><strong>즐겨찾기 저장</strong>: 흥미로운 악마나 전승을 발견하면 상단 ★ 즐겨찾기를 눌러 서재에 보관하세요.</li>
    </ul>`;
  }else if(activeTab==='bookmarks'){
    title='서재 기록 안내';
    bodyHtml=`<p style="margin:0">
      지금까지의 독서 진도와 마음에 드는 표제어를 모아 관리하는 개인 서재입니다.
    </p>
    <ul style="margin:0;padding-left:18px;font-size:0.88rem;color:var(--text-muted);display:flex;flex-direction:column;gap:6px">
      <li><strong>열람 현황</strong>: 전체 3,810편 중 몇 편을 읽었는지 진도율을 확인할 수 있습니다.</li>
      <li><strong>즐겨찾기 모아보기</strong>: 상세 페이지에서 ★를 누른 항목들이 여기에 보관됩니다.</li>
      <li><strong>데이터 안전 보관</strong>: 설정 탭의 내보내기 기능을 이용하면 기기를 변경해도 서재 기록을 그대로 복원할 수 있습니다.</li>
    </ul>`;
  }else if(activeTab==='settings'){
    title='설정 안내';
    bodyHtml=`<p style="margin:0">
      지옥사전의 화면 테마와 독서 환경, 서재 데이터를 관리합니다.
    </p>
    <ul style="margin:0;padding-left:18px;font-size:0.88rem;color:var(--text-muted);display:flex;flex-direction:column;gap:6px">
      <li><strong>테마 모드</strong>: 어두운 흑요석(다크) 또는 고서 양피지(라이트) 모드를 지원합니다.</li>
      <li><strong>글자 크기</strong>: 본문 및 번역문의 글씨 크기를 조절합니다.</li>
      <li><strong>1863년 불문 원문</strong>: 자크 콜랭 드 플랑시의 1863년 프랑스어 전문을 함께 표시할지 선택합니다.</li>
      <li><strong>화면 켜짐 유지</strong>: 독서 중 화면이 자동으로 꺼지지 않도록 방지합니다.</li>
      <li><strong>서재 정보 관리</strong>: ${escapeHtml(storageNotice())}</li>
    </ul>`;
  }

  modalEl.innerHTML=`<div class="modal-inner">
    <div class="modal-top">
      <h2>${escapeHtml(title)}</h2>
      <button type="button" data-action="close" aria-label="닫기">${icon('close')}</button>
    </div>
    ${bodyHtml}
    <div class="modal-actions">
      <button type="button" class="primary" data-action="close">확인</button>
    </div>
  </div>`;
  if(!modalEl.open)modalEl.showModal?.();
}

function openSettingsHelpModal(){
  openHelpModal();
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
    if(tab===activeTab){
      if(tab==='daily'){
        advanceRandomEntry();
      }
      return;
    }
    if(typeof window!=='undefined'){
      tabScrollY[activeTab]=window.scrollY||0;
    }
    activeTab=tab;
    activeEntryId=tabEntryIds[tab]||null;
    render();
    if(typeof window!=='undefined'){
      const targetY=activeEntryId?0:(tabScrollY[tab]||0);
      window.scrollTo?.({top:targetY,behavior:'instant'});
    }
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
    updateDictionaryResults();
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

function updateDictionaryResults(){
  const resultsEl=document.querySelector?.('#dict-results');
  if(resultsEl&&resultsEl.tagName){
    resultsEl.innerHTML=renderDictionaryResults();
  }else{
    render();
  }
}

document.addEventListener('input',event=>{
  if(event?.target?.id==='search-input'){
    searchQuery=event.target.value||'';
    visibleLimit=PAGE_STEP;
    updateDictionaryResults();
  }
});

document.addEventListener('change',event=>{
  if(event?.target?.id==='sort-select'){
    activeSort=event.target.value||'page';
    visibleLimit=PAGE_STEP;
    updateDictionaryResults();
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
      if(row.classList.contains('category-pills')){
        if(activeTab==='gallery')savedPillScrolls.galleryCategory=row.scrollLeft;
        else savedPillScrolls.category=row.scrollLeft;
      }else if(row.classList.contains('letter-pills')){
        savedPillScrolls.letter=row.scrollLeft;
      }
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
      if(r.classList.contains('category-pills')){
        if(activeTab==='gallery')savedPillScrolls.galleryCategory=r.scrollLeft;
        else savedPillScrolls.category=r.scrollLeft;
      }else if(r.classList.contains('letter-pills')){
        savedPillScrolls.letter=r.scrollLeft;
      }
      event.preventDefault?.();
    }
  },{passive:false});

  document.addEventListener('scroll',event=>{
    const target=event?.target;
    if(!target?.classList)return;
    if(target.classList.contains('category-pills')){
      if(activeTab==='gallery')savedPillScrolls.galleryCategory=target.scrollLeft;
      else savedPillScrolls.category=target.scrollLeft;
    }else if(target.classList.contains('letter-pills')){
      savedPillScrolls.letter=target.scrollLeft;
    }
  },{capture:true,passive:true});
})();
