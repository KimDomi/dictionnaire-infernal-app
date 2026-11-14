import {CATEGORIES,GALLERY_CATEGORIES,LETTERS,ENTRIES,ILLUSTRATED_ENTRIES,ENTRY_MAP,VALID_ENTRY_IDS,filterEntries,getDailyEntry} from './entries.js?v=8f70c7d5e503';
import {icon} from './icons.js?v=6303f2853951';
import {exportNativeBackup,installNativeNavigation,requestScreenLock,screenLockAvailable,storageNotice} from './native.js?v=3197cf683a29';
import {applySettingsToDocument,loadSettings,saveSettings} from './settings.js?v=a25a7982980e';
import {STORAGE_KEY,createBackupPayload,normalizeState,parseBackupPayload} from './backup.js?v=ce6c73ab474c';

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
let pendingPageTurnDirection=null;

const tabEntryIds={
  dictionary:null,
  gallery:null,
  bookmarks:null
};

const tabOpenedEntryIds={
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

function navigateEntryRelative(delta,dir=null){
  if(!activeEntryId)return false;
  const entry=ENTRY_MAP.get(activeEntryId);
  if(!entry)return false;
  const contextList=getActiveContextList();
  let idx=contextList.findIndex(item=>item.id===entry.id);
  const navList=idx>=0?contextList:ENTRIES;
  if(idx<0)idx=navList.findIndex(item=>item.id===entry.id);
  const targetIdx=idx+delta;
  if(targetIdx>=0&&targetIdx<navList.length){
    openEntryPage(navList[targetIdx].id,true,dir||(delta>0?'next':'prev'));
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

function splitEntryName(nameKo){
  if(!nameKo) return { ko: '', orig: '', isBracket: true, isLong: false };
  const bracketIdx = nameKo.indexOf('[');
  if(bracketIdx !== -1) {
    const ko = nameKo.slice(0, bracketIdx).trim();
    let orig = nameKo.slice(bracketIdx).trim();
    if(orig.startsWith('[') && orig.endsWith(']')){
      orig = orig.slice(1, -1).trim();
    }
    const isLong = nameKo.length >= 18 || ko.length >= 9 || orig.length >= 14;
    return { ko, orig, isBracket: true, isLong };
  }
  const lastHangulIdx = nameKo.search(/[가-힣][^가-힣]*$/);
  if(lastHangulIdx === -1) return { ko: nameKo, orig: '', isBracket: false, isLong: nameKo.length >= 18 };
  const parenIdx = nameKo.indexOf('(', lastHangulIdx);
  if(parenIdx === -1) return { ko: nameKo, orig: '', isBracket: false, isLong: nameKo.length >= 18 };
  const ko = nameKo.slice(0, parenIdx).trim();
  let orig = nameKo.slice(parenIdx).trim();
  if(orig.startsWith('(') && orig.endsWith(')')){
    orig = orig.slice(1, -1).trim();
  }
  const isLong = nameKo.length >= 18 || ko.length >= 9 || orig.length >= 12;
  return { ko, orig, isBracket: false, isLong };
}

function renderDetailTitle(entry){
  const split = splitEntryName(entry.nameKo);
  if(!split.orig){
    return `<h2 class="detail-title-ko">${escapeHtml(entry.nameKo)}</h2>`;
  }
  const formattedOrig = split.isBracket ? `[${escapeHtml(split.orig)}]` : `(${escapeHtml(split.orig)})`;
  return `<h2 class="detail-title-ko${split.isLong ? ' is-long-title' : ''}">
    <span class="title-name-ko">${escapeHtml(split.ko)}</span>
    <span class="title-name-en">${formattedOrig}</span>
  </h2>`;
}

function renderEntryArticleCard(entry,extraFooterHtml=''){
  const isBookmarked=state.bookmarks.includes(entry.id);
  const isRead=state.readIds.includes(entry.id);

  return `<article class="detail-card">
    <header class="detail-header">
      <div class="detail-header-top">
        <button type="button" class="header-read-btn${isRead?' active':''}" data-action="toggle-read" data-id="${escapeHtml(entry.id)}" aria-label="${isRead?'열람 완료 해제':'열람 완료 표시'}" title="${isRead?'열람 완료됨 (클릭 시 해제)':'열람 완료 표시'}">✓</button>
        <span class="entry-plate-no">${entry.hasPlate?`판화 No. ${entry.plateNo} · `:''}1863년 제6판 ${escapeHtml(entry.letter)}부 · 원서 p.${entry.page1863}</span>
        <button type="button" class="header-bookmark-btn${isBookmarked?' active':''}" data-action="toggle-bookmark" data-id="${escapeHtml(entry.id)}" aria-label="${isBookmarked?'즐겨찾기 해제':'즐겨찾기 추가'}" title="${isBookmarked?'즐겨찾기 해제':'즐겨찾기 추가'}">${isBookmarked?'★':'☆'}</button>
      </div>
      ${renderDetailTitle(entry)}
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

      ${entry.quoteFr?`<blockquote class="detail-french-card${settings.showFrench?' expanded':''}">
        <button type="button" class="french-card-trigger" data-action="toggle-french" aria-expanded="${settings.showFrench?'true':'false'}">
          <div class="french-trigger-left">
            <strong class="french-trigger-title">불문 원문 <span class="french-entry-name">(${escapeHtml(entry.nameFr)})</span></strong>
          </div>
          <div class="french-trigger-right">
            <span class="french-page-no">p.${entry.page1863}</span>
            <span class="french-trigger-action">
              <span class="french-trigger-label">${settings.showFrench?'접기':'펼치기'}</span>
              <span class="french-trigger-arrow" aria-hidden="true">${settings.showFrench?'▴':'▾'}</span>
            </span>
          </div>
        </button>
        <div class="french-card-collapse">
          <div class="french-card-inner">
            <p class="french-quote-text">“${escapeHtml(entry.quoteFr)}”</p>
            <footer class="french-quote-footer">— J.-A.-S. Collin de Plancy, <em>Dictionnaire Infernal</em> (6e édition, 1863)</footer>
          </div>
        </div>
      </blockquote>`:''}
    </div>
  </article>

  ${extraFooterHtml}`;
}

function renderEntryDetailPage(entry){
  const backLabel=TAB_BACK_LABELS[activeTab]||'← 목록으로 돌아가기';

  const contextList=getActiveContextList();
  let idx=contextList.findIndex(item=>item.id===entry.id);
  const navList=idx>=0?contextList:ENTRIES;
  if(idx<0)idx=navList.findIndex(item=>item.id===entry.id);
  const prevEntry=idx>0?navList[idx-1]:null;
  const nextEntry=idx>=0&&idx<navList.length-1?navList[idx+1]:null;

  const extraFooterHtml=`
    <div class="detail-footer">
      <nav class="detail-prev-next" aria-label="이전 및 다음 표제어 이동">
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
      <div class="detail-bottom-back">
        <button type="button" class="detail-back-btn" data-action="close-entry">
          ${escapeHtml(backLabel)}
        </button>
      </div>
    </div>`;

  const animClass='';
  pendingPageTurnDirection=null;
  return `<section class="entry-detail-page${animClass}">
    ${renderEntryArticleCard(entry,extraFooterHtml)}
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

function advanceRandomEntry(dir='next'){
  const current=getCurrentRandomEntry();
  if(current)markEntryAsRead(current.id);
  let pick=ENTRIES[Math.floor(Math.random()*ENTRIES.length)];
  if(ENTRIES.length>1&&current&&pick.id===current.id){
    pick=ENTRIES[(ENTRIES.indexOf(pick)+1)%ENTRIES.length];
  }
  randomOverrideId=pick.id;
  markEntryAsRead(pick.id);
  if(settings.animations)pendingPageTurnDirection=dir;
  render();
  if(typeof window!=='undefined'){
    window.scrollTo?.({top:0,behavior:'instant'});
  }
}

function renderDailyTab(){
  const entry=getCurrentRandomEntry();
  markEntryAsRead(entry.id);

  const animClass='';
  pendingPageTurnDirection=null;
  return `<section class="entry-detail-page daily-view${animClass}" aria-label="무작위 지옥사전 표제어">
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
        <button type="button" class="setting-toggle${settings.showFrench?' primary':''}" data-action="toggle-french" aria-pressed="${settings.showFrench?'true':'false'}">
          ${settings.showFrench?'표시 중':'숨김'}
        </button>
      </div>

      <div class="setting-row">
        <div class="setting-label">
          <strong>열람 중 화면 켜짐 유지</strong>
        </div>
        <button type="button" class="setting-toggle${settings.keepAwake?' primary':''}" data-action="toggle-awake" aria-pressed="${settings.keepAwake?'true':'false'}">
          ${settings.keepAwake?'켜짐':'꺼짐'}
        </button>
      </div>

      <div class="setting-row">
        <div class="setting-label">
          <strong>페이지 넘김 및 화면 애니메이션</strong>
        </div>
        <button type="button" class="setting-toggle${settings.animations?' primary':''}" data-action="toggle-animations" aria-pressed="${settings.animations?'true':'false'}">
          ${settings.animations?'켜짐':'꺼짐'}
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
      <h2>원전 및 출처 표기 (Sources & Attributions)</h2>
      <p style="margin:0 0 10px;font-size:0.84rem;color:var(--text-muted);line-height:1.6">
        • 원제: <em>Dictionnaire Infernal</em> (제6판, 1863년 파리 Henri Plon 간행 · 전 3,810개 표제어 완역/수록)<br>
        • 저자: 자크 알뱅 시몽 콜랭 드 플랑시 (J.-A.-S. Collin de Plancy, 1794–1881)<br>
        • 삽화: 루이 브르통 (Louis Breton) 원화 · 1863년 원본 목판화 총 428점 수록<br>
        • 아카이브: 프랑스 국립도서관(BnF/Gallica), 위키미디어 공용(Wikimedia Commons), 인터넷 아카이브<br>
        • 라이선스: 퍼블릭 도메인 (Public Domain)
      </p>
      <button type="button" class="secondary" data-action="open-attribution-modal" style="width:100%;font-size:0.86rem;padding:8px 12px">
        📜 원전·삽화·사료 출처 상세 보기
      </button>
    </div>
  </section>`;
}

/* ---------- Realistic paper page-flip ----------
 * The outgoing .entry-detail-page (including .detail-footer buttons) is snapshotted
 * before re-render along with its viewport scroll position. A fixed viewport-bound 3D
 * paper leaf flips around the book spine without jumping the outgoing page to top:0
 * or omitting bottom controls, revealing the top of the incoming page underneath.
 *  next: outgoing page lifts from right edge, arches, and turns over to left.
 *  prev: previous page swings back from left stack onto the right.
 */
const PAGE_FLIP_MS=440;
let activePageFlip=null;

function capturePageForFlip(node){
  if(!node||typeof node.getBoundingClientRect!=='function'||typeof node.cloneNode!=='function')return null;
  try{
    const rect=node.getBoundingClientRect();
    if(!rect||!rect.width||!rect.height)return null;
    const scrollY=typeof window!=='undefined'?(window.scrollY??window.pageYOffset??0):0;
    const appEl=typeof document!=='undefined'?document.querySelector?.('.app'):null;
    const headerEl=typeof document!=='undefined'?document.querySelector?.('header'):null;
    const navEl=typeof document!=='undefined'?document.querySelector?.('nav[aria-label="주 메뉴"]'):null;
    const appRect=appEl?.getBoundingClientRect?.()||mainEl?.getBoundingClientRect?.()||rect;
    const headerRect=headerEl?.getBoundingClientRect?.()||null;
    const mainRect=mainEl?.getBoundingClientRect?.()||rect;
    const navRect=navEl?.getBoundingClientRect?.()||null;
    let headerClone=null;
    if(headerEl&&typeof headerEl.cloneNode==='function'){
      headerClone=headerEl.cloneNode(true);
      headerClone.removeAttribute?.('id');
      headerClone.querySelectorAll?.('[id]')?.forEach?.(el=>el.removeAttribute('id'));
      headerClone.setAttribute?.('aria-hidden','true');
    }
    return {
      clone:node.cloneNode(true),
      rect,
      scrollY,
      appRect,
      headerRect,
      headerClone,
      mainRect,
      navRect
    };
  }catch{return null;}
}

function buildFlipFace(page,extraClass,{includeHeader=false,scrollOffset=0}={}){
  const face=document.createElement('div');
  face.className=`page-flip-face ${extraClass}`;

  const wrap=document.createElement('div');
  wrap.className='page-flip-scroll-wrap';
  if(scrollOffset){
    wrap.style.transform=`translateY(${scrollOffset}px)`;
  }

  if(includeHeader&&page.headerClone){
    const hdr=page.headerClone.cloneNode(true);
    if(page.headerRect?.height){
      hdr.style.height=`${page.headerRect.height}px`;
    }
    wrap.appendChild(hdr);
  }

  const mirror=document.createElement('div');
  mirror.className='page-flip-main-mirror';

  const clone=page.clone.cloneNode(true);
  clone.classList?.remove?.('page-turn-next','page-turn-prev');
  clone.setAttribute?.('aria-hidden','true');
  clone.style.margin='0';
  clone.style.width='100%';
  if(page.rect?.height){
    clone.style.minHeight=`${page.rect.height}px`;
  }
  mirror.appendChild(clone);
  wrap.appendChild(mirror);
  face.appendChild(wrap);

  const sheen=document.createElement('div');
  sheen.className='page-flip-sheen';
  face.appendChild(sheen);
  return face;
}

function cancelPageFlip(){
  if(!activePageFlip)return;
  clearTimeout(activePageFlip.timer);
  activePageFlip.stage?.remove?.();
  activePageFlip=null;
}

function schedulePageFlip(dir,oldPage){
  if(typeof document==='undefined'||typeof document.createElement!=='function'||!mainEl)return;
  try{runPageFlip(dir,oldPage);}catch{cancelPageFlip();}
}

function runPageFlip(dir,oldPage){
  cancelPageFlip();
  if(!mainEl)return;
  const newTarget=mainEl.querySelector?.('.entry-detail-page')||mainEl.querySelector?.('.detail-card');
  if(!newTarget)return;
  const newPage=capturePageForFlip(newTarget);
  if(!newPage)return;

  const isScrolled=oldPage.scrollY>1||Boolean(oldPage.headerRect&&oldPage.headerRect.top<-1);
  const includeHeader=isScrolled&&Boolean(oldPage.headerClone);
  const stageTop=isScrolled?0:Math.max(0,oldPage.mainRect.top);
  const navTop=(newPage.navRect&&newPage.navRect.top>stageTop)
    ?newPage.navRect.top
    :((oldPage.navRect&&oldPage.navRect.top>stageTop)?oldPage.navRect.top:null);
  const fallbackBottom=(typeof window!=='undefined'&&window.innerHeight)?window.innerHeight:oldPage.mainRect.bottom;
  const stageHeight=Math.max(100,(navTop??fallbackBottom)-stageTop);
  const targetAppRect=newPage.appRect||oldPage.appRect;
  const mainPadTop=typeof getComputedStyle==='function'?(parseFloat(getComputedStyle(mainEl).paddingTop)||16):16;
  const headerHeight=includeHeader&&oldPage.headerRect?oldPage.headerRect.height:0;
  const oldOffset=oldPage.rect.top-(stageTop+headerHeight+mainPadTop);

  const stage=document.createElement('div');
  stage.className=`page-flip-stage page-flip-${dir}${isScrolled?' is-scrolled':''}`;
  stage.setAttribute('aria-hidden','true');
  stage.style.left=`${targetAppRect.left}px`;
  stage.style.top=`${stageTop}px`;
  stage.style.width=`${targetAppRect.width}px`;
  stage.style.height=`${stageHeight}px`;
  stage.style.setProperty('--flip-ms',`${PAGE_FLIP_MS}ms`);

  const underPage=dir==='prev'?oldPage:newPage;
  const underOffset=dir==='prev'?oldOffset:0;
  const under=buildFlipFace(underPage,'page-flip-under',{includeHeader,scrollOffset:underOffset});
  const underShadow=document.createElement('div');
  underShadow.className='page-flip-under-shadow';
  under.appendChild(underShadow);
  stage.appendChild(under);

  const leaf=document.createElement('div');
  leaf.className='page-flip-leaf';
  const frontSrc=dir==='prev'?newPage:oldPage;
  const frontOffset=dir==='prev'?0:oldOffset;
  leaf.appendChild(buildFlipFace(frontSrc,'page-flip-front',{includeHeader,scrollOffset:frontOffset}));

  const back=document.createElement('div');
  back.className='page-flip-face page-flip-back';
  const watermark=document.createElement('div');
  watermark.className='parchment-watermark';
  watermark.innerHTML=`<div class="wm-fleur">⚜</div><div class="wm-title">DICTIONNAIRE INFERNAL</div><div class="wm-sub">COLLIN DE PLANCY · 1863</div>`;
  back.appendChild(watermark);
  const backSheen=document.createElement('div');
  backSheen.className='page-flip-sheen';
  back.appendChild(backSheen);
  leaf.appendChild(back);

  stage.appendChild(leaf);
  mainEl.appendChild(stage);
  activePageFlip={stage,timer:setTimeout(cancelPageFlip,PAGE_FLIP_MS+50)};
}

function render(){
  if(!mainEl)return;
  const flipDir=settings.animations?pendingPageTurnDirection:null;
  cancelPageFlip();
  const flipTarget=mainEl.querySelector?.('.entry-detail-page')||mainEl.querySelector?.('.detail-card');
  const flipOldPage=flipDir?capturePageForFlip(flipTarget):null;
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
    if(flipOldPage)schedulePageFlip(flipDir,flipOldPage);
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
  else if(activeTab==='daily'){
    mainEl.innerHTML=renderDailyTab();
    if(flipOldPage)schedulePageFlip(flipDir,flipOldPage);
  }
  else if(activeTab==='bookmarks')mainEl.innerHTML=renderBookmarksTab();
  else if(activeTab==='settings')mainEl.innerHTML=renderSettingsTab();
  restorePillScrolls();
  syncWakeLock();
}

function openEntryPage(entryId,pushHistory=true,dir=null){
  const entry=ENTRY_MAP.get(entryId);
  if(!entry)return;
  const wasInList=!activeEntryId;
  if(wasInList&&typeof window!=='undefined'){
    tabScrollY[activeTab]=window.scrollY||0;
  }
  activeEntryId=entry.id;
  if(activeTab in tabEntryIds){
    tabEntryIds[activeTab]=entry.id;
    if(wasInList)tabOpenedEntryIds[activeTab]=entry.id;
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
  if(dir&&settings.animations)pendingPageTurnDirection=dir;
  render();
  if(typeof window!=='undefined'){
    window.scrollTo?.({top:0,behavior:'instant'});
  }
}

function scrollToListEntry(entryId){
  if(!mainEl||typeof mainEl.querySelectorAll!=='function')return false;
  const cards=mainEl.querySelectorAll('[data-action="open-entry"]');
  let targetCard=null;
  for(const el of cards||[]){
    if(el?.dataset?.id===entryId){
      targetCard=el;
      break;
    }
  }
  if(!targetCard||typeof targetCard.getBoundingClientRect!=='function')return false;
  if(typeof window==='undefined')return false;
  const rect=targetCard.getBoundingClientRect();
  const navEl=typeof document!=='undefined'?document.querySelector?.('nav[aria-label="주 메뉴"]'):null;
  const navHeight=navEl?.getBoundingClientRect?.()?.height||76;
  const viewportH=window.innerHeight||800;
  const usableH=Math.max(200,viewportH-navHeight);
  const currentScroll=window.scrollY??window.pageYOffset??0;
  const targetTop=Math.max(0,currentScroll+rect.top-Math.max(16,(usableH-rect.height)/2));
  window.scrollTo?.({top:targetTop,behavior:'instant'});
  tabScrollY[activeTab]=window.scrollY??targetTop;
  return true;
}

function closeEntryPage(fromPopState=false){
  if(!activeEntryId)return;
  const lastEntryId=activeEntryId;
  const openedEntryId=activeTab in tabOpenedEntryIds?tabOpenedEntryIds[activeTab]:null;
  const movedEntry=Boolean(lastEntryId&&(!openedEntryId||lastEntryId!==openedEntryId));
  activeEntryId=null;
  if(activeTab in tabEntryIds){
    tabEntryIds[activeTab]=null;
    tabOpenedEntryIds[activeTab]=null;
  }
  if(movedEntry&&activeTab==='dictionary'){
    const list=filterEntries({query:searchQuery,category:activeCategory,letter:activeLetter,sort:activeSort});
    const idx=list.findIndex(item=>item.id===lastEntryId);
    if(idx>=visibleLimit){
      visibleLimit=Math.ceil((idx+1)/PAGE_STEP)*PAGE_STEP;
    }
  }
  if(!fromPopState&&typeof window!=='undefined'&&window.location?.hash?.startsWith('#entry=')){
    try{
      window.history?.replaceState?.(null,'',window.location.pathname+window.location.search);
    }catch{}
  }
  render();
  if(movedEntry&&scrollToListEntry(lastEntryId))return;
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
      1863년 제6판 완본에 수록된 화가 루이 브르통 (Louis Breton)의 오리지널 목판화 428점을 감상하는 도감입니다.
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
      <li><strong>페이지 넘김 및 애니메이션</strong>: 스와이프 시 1863년 고서 종이 넘김 효과와 화면 전환 애니메이션을 켜거나 끕니다.</li>
      <li><strong>서재 정보 관리</strong>: ${escapeHtml(storageNotice())}</li>
    </ul>`;
  }

  bodyHtml+=`<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border)">
    <button type="button" class="secondary" data-action="open-attribution-modal" style="width:100%;font-size:0.86rem;padding:8px 10px;display:flex;align-items:center;justify-content:center;gap:6px">
      📜 원전 및 출처 표기 (Attribution & Sources)
    </button>
  </div>`;

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

function openAttributionModal(){
  if(!modalEl)return;
  modalEl.innerHTML=`<div class="modal-inner">
    <div class="modal-top">
      <h2>원전 및 출처 표기 (Attribution & Sources)</h2>
      <button type="button" data-action="close" aria-label="닫기">${icon('close')}</button>
    </div>
    <div style="font-size:0.86rem;line-height:1.65;color:var(--text-muted);display:flex;flex-direction:column;gap:14px">
      <div style="background:var(--bg-soft);padding:12px 14px;border-radius:10px;border-left:3px solid var(--gold);color:var(--text)">
        본 웹 애플리케이션은 자크 알뱅 시몽 콜랭 드 플랑시(J.-A.-S. Collin de Plancy)가 1863년 파리에서 간행한 『지옥사전』 제6판 완본(全 3,810개 표제어) 및 화가 루이 브르통(Louis Breton)의 1863년 오리지널 목판화 전수(428점)를 공공 디지털 아카이브로부터 집대성하여 학술·문화 보급을 위해 편찬한 국문 디지털 백과사전입니다.
      </div>

      <div>
        <h3 style="margin:0 0 6px;color:var(--text);font-size:0.95rem;font-family:var(--font-serif)">📖 1. 1863년 프랑스어 텍스트 원전 (Text Sources)</h3>
        <ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px">
          <li><strong>원서명</strong>: <em>Dictionnaire Infernal, ou Répertoire universel des êtres, des personnages, des livres, des faits et des choses qui tiennent aux esprits, aux démons, aux sorciers, au commerce de l'enfer...</em> (제6판 완본, 1863년)</li>
          <li><strong>저자</strong>: 자크 알뱅 시몽 콜랭 드 플랑시 (Jacques Albin Simon Collin de Plancy, 1794–1881)</li>
          <li><strong>간행</strong>: 파리 앙리 플롱(Henri Plon) 출판사, 1863년 (총 723페이지, A–Z 전 3,810편 완역 및 대조 수록)</li>
          <li><strong>프랑스 국립도서관(BnF Gallica)</strong>: 원서 무손실 스캔 마스터 코퍼스 (ark:/12148/bpt6k5724590n)</li>
          <li><strong>인터넷 아카이브 (Internet Archive)</strong>: 1863 Dictionnaire Infernal Complete Master Archive</li>
          <li><strong>위키문헌 (Wikisource Francophone)</strong>: <em>Dictionnaire infernal (6e éd., 1863)</em> 원문 전사본</li>
        </ul>
      </div>

      <div>
        <h3 style="margin:0 0 6px;color:var(--text);font-size:0.95rem;font-family:var(--font-serif)">🖼️ 2. 목판화 삽화 428점 아카이브 (Illustrations & Plates)</h3>
        <ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px">
          <li><strong>원화 작가</strong>: 루이 르 브르통 (Louis Le Breton, 1818–1866)</li>
          <li><strong>목판 조각가</strong>: 조제프 알프레드 자로 (Joseph-Alfred Jarrault, S.A.J.) 외 19세기 판화 공방</li>
          <li><strong>수록 규모</strong>: 총 428점 (원서 주요 68대 악마 판화 + 1863년 제6판 본문 목판화 360점 전수 수록)</li>
          <li><strong>디지털 아카이브 출처</strong>: 위키미디어 공용 (Wikimedia Commons)
            <br>• <code>Category:Illustrations from Dictionnaire Infernal, 6th edition</code>
            <br>• <code>Category:Drawings of demons from Dictionnaire Infernal, 6th edition</code></li>
          <li><strong>디지털 복원 규격</strong>: 프랑스 국립도서관(BnF) 고해상도 무손실 스캔본을 기반으로 최대 변 1,100px LANCZOS 보간 리사이즈, 그레이스케일 오토콘트라스트 보정, 고품질 JPEG 최적화를 적용하여 목판화 원형의 세밀한 해칭선 질감을 복원하였습니다.</li>
        </ul>
      </div>

      <div>
        <h3 style="margin:0 0 6px;color:var(--text);font-size:0.95rem;font-family:var(--font-serif)">📜 3. 악마학 및 고문헌 사료 (Historical References)</h3>
        <ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px">
          <li><strong>요한 바이어 (Johann Weyer / Wierus)</strong>: 《의사악마왕국(Pseudomonarchia Daemonum)》 (1577/1583)</li>
          <li><strong>레메게톤 (Lemegeton)</strong>: 솔로몬의 작은 열쇠 (Clavicula Salomonis / Goetia 72 악마 체계)</li>
          <li><strong>레지날드 스콧 (Reginald Scot)</strong>: 《마술의 발견(The Discoverie of Witchcraft)》 (1584)</li>
          <li><strong>몽포콩 드 빌라르 (Abbé N. de Montfaucon de Villars)</strong>: 《가발리스 백작(Le Comte de Gabalis)》 (1670)</li>
          <li><strong>마르틴 델리오 (Martin Delrio)</strong>: 《마법 논의(Disquisitionum Magicarum)》 (1599)</li>
          <li><strong>피에르 드 랑크르 (Pierre de Lancre)</strong>: 《악령과 마법사의 무상함(Tableau de l'inconstance des mauvais anges)》 (1612)</li>
          <li><strong>동방 및 아랍 사료</strong>: 쿠란(القرآن الكريم, 지옥의 마목 자쿰 전승) 및 이븐 할둔의 《역사서설(Muqaddimah, 자이라자 점술)》</li>
        </ul>
      </div>

      <div>
        <h3 style="margin:0 0 6px;color:var(--text);font-size:0.95rem;font-family:var(--font-serif)">⚖️ 4. 저작권 및 라이선스 고지 (License & Public Domain Notice)</h3>
        <ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px">
          <li><strong>1863년 원작 텍스트 및 삽화</strong>: 원저자 및 화가 사후 100년 이상 경과하여 대한민국 저작권법 및 전 세계 베른 협약에 따라 저작재산권 보호 기간이 만료된 <strong>퍼블릭 도메인(Public Domain / 공유마당)</strong> 저작물입니다.</li>
          <li><strong>디지털 복원본 및 한글 역주·데이터베이스</strong>: 학술·비영리 연구 및 문화 향유를 위해 <strong>크리에이티브 커먼즈 저작자표시-동일조건변경허락 4.0(CC BY-SA 4.0)</strong> 및 공공 데이터 가이드라인을 준수합니다.</li>
        </ul>
      </div>
    </div>
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
      if(activeEntryId){
        closeEntryPage();
      }else if(tab==='daily'){
        advanceRandomEntry();
      }
      return;
    }
    if(!activeEntryId&&typeof window!=='undefined'){
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
    const btn=target?.closest?.('.prev-next-btn');
    const dir=btn?.classList?.contains('next')?'next':btn?.classList?.contains('prev')?'prev':null;
    openEntryPage(id,true,dir);
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
  if(action==='open-attribution-modal'){openAttributionModal();return;}
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
    const card=target?.closest?.('.detail-french-card');
    if(card){
      const isExpanding=!card.classList.contains('expanded');
      card.classList.toggle('expanded',isExpanding);
      const btn=card.querySelector('.french-card-trigger');
      if(btn){
        btn.setAttribute('aria-expanded',isExpanding?'true':'false');
        const label=btn.querySelector('.french-trigger-label');
        if(label)label.textContent=isExpanding?'접기':'펼치기';
        const arrow=btn.querySelector('.french-trigger-arrow');
        if(arrow)arrow.textContent=isExpanding?'▴':'▾';
      }
      settings=saveSettings({...settings,showFrench:isExpanding});
      return;
    }
    settings=saveSettings({...settings,showFrench:!settings.showFrench});
    render();
    return;
  }

  if(action==='toggle-awake'){
    settings=saveSettings({...settings,keepAwake:!settings.keepAwake});
    render();
    return;
  }

  if(action==='toggle-animations'){
    settings=saveSettings({...settings,animations:!settings.animations});
    applySettingsToDocument(settings);
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
        if(!navigateEntryRelative(1,'next'))showToast('마지막 항목입니다.');
      }else{
        if(!navigateEntryRelative(-1,'prev'))showToast('첫 번째 항목입니다.');
      }
    }else if(activeTab==='daily'){
      advanceRandomEntry(dx<0?'next':'prev');
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
        if(!navigateEntryRelative(1,'next'))showToast('마지막 항목입니다.');
      }else{
        if(!navigateEntryRelative(-1,'prev'))showToast('첫 번째 항목입니다.');
      }
    }else if(activeTab==='daily'){
      advanceRandomEntry(dx<0?'next':'prev');
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
        if(!navigateEntryRelative(1,'next'))showToast('마지막 항목입니다.');
      }else{
        if(!navigateEntryRelative(-1,'prev'))showToast('첫 번째 항목입니다.');
      }
    }else if(activeTab==='daily'){
      advanceRandomEntry(event.key==='ArrowRight'?'next':'prev');
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

if(typeof window!=='undefined'&&window.location?.hash){
  const h=window.location.hash.replace(/^#/,'');
  if(['gallery','daily','bookmarks','settings'].includes(h)){
    activeTab=h;
  }else if(h.startsWith('entry/')){
    const eid=h.slice(6);
    if(VALID_ENTRY_IDS.has(eid))activeEntryId=eid;
  }
}

if(typeof window!=='undefined'){
  window.addEventListener?.('hashchange',()=>{
    const h=window.location.hash.replace(/^#/,'');
    if(['gallery','daily','bookmarks','settings'].includes(h)){
      activeTab=h;
      activeEntryId=null;
      render();
    }else if(h.startsWith('entry/')){
      const eid=h.slice(6);
      if(VALID_ENTRY_IDS.has(eid)){
        openEntryPage(eid,false);
      }
    }
  });
}

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
