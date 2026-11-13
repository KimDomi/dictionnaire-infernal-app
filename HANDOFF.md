# 『지옥사전 (Dictionnaire Infernal, 1863)』 프로젝트 인수인계 문서 (AI & 개발자용)

이 문서는 다른 AI 모델(Claude, GPT, Gemini 등)이나 새로운 채팅 세션에서 프로젝트를 즉시 파악하고 후속 작업(번역 고도화, UI/UX 개편, 기능 추가, 안드로이드 APK 빌드 등)을 이어갈 수 있도록 작성된 **컨텍스트 인수인계 문서(Handoff Guide)** 입니다.

---

## 1. 프로젝트 개요 (Project Overview)

- **원전**: 자크 콜랭 드 플랑시(Jacques Collin de Plancy)의 **『지옥사전 (Dictionnaire Infernal)』 1863년 제6판** (루이 브르통 Louis Breton 원화 68점 및 A–Z 전체 표제어 **3,810개** 수록 판본)
- **GitHub 저장소**: `https://github.com/KimDomi/dictionnaire-infernal-app`
- **배포 환경**:
  - **웹 (Cloudflare Workers / Static Assets)**: [wrangler.jsonc](./wrangler.jsonc) 기반 정적 에셋 배포 (`dist/` 디렉터리)
    - Build command: `node scripts-versions.mjs`
    - Deploy command: `npx wrangler deploy`
  - **안드로이드 (Capacitor Android APK)**: [capacitor.config.json](./capacitor.config.json) 및 `.github/workflows/android-debug-apk.yml` (GitHub Actions 자동 빌드)
- **기술 스택**:
  - 프레임워크 없는 순수 **Vanilla ES Modules (`dist/*.js`) + HTML5 + CSS3** (번들러 없이 브라우저와 Capacitor WebView에서 즉시 동작)
  - Node.js 24 LTS 기반 데이터 빌드 및 검증 스크립트 (`scripts-*.mjs`, `test*.mjs`)

---

## 2. 핵심 사용자 요구사항 및 절대 준수 규칙 (Strict User Constraints)

다른 AI 모델이 데이터를 수정하거나 UI/번역을 다듬을 때 **반드시 지켜야 할 핵심 원칙**입니다.

1. **전체 표제어 완역 수록 (3,810개 A–Z 전 항목)**
   - 판화가 있는 68개 악마 항목뿐만 아니라, 1863년 원서 A부터 Z까지의 **3,810개 전체 표제어**가 모두 빠져서는 안 됩니다.
2. **고유명사 영문(원어) 병기 필수 (`한글 표기 (Original)`)**
   - 모든 표제어(`nameKo`)와 본문(`summary`, `description`) 내 고유명사(인명, 악마명, 신격, 지명, 문헌명 등)는 반드시 **`한글 (영문/원문)`** 형태로 표기해야 합니다.
   - 예시: `아바리스 (Abaris)`, `피에르 드 랑크르 (Delancre)`, `『솔로몬의 열쇠 (Clavicules de Salomon)』`, `사바트 (Sabbat)`
3. **번역 외의 메타 설명·안내 문구 절대 금지**
   - `summary`와 `description`에는 **1863년 원문의 순수 한국어 번역문만** 들어가야 합니다.
   - 예컨대 *"~분야 표제어이다"*, *"아래의 1863년 프랑스어 교정 원문 전문을 통해 당대의 상세한 묘사와 인용 문헌을 함께 확인할 수 있다"* 같은 편집자 주석이나 안내용 상투구는 절대 넣지 마세요.
4. **백과사전 평서체(`~다 / ~는다 / ~이다`) 통일 및 오컬트 전문용어 준수**
   - 번역투 존댓말(`~습니다 / ~입니다 / ~해요`)을 쓰지 않고, 한국어 백과사전 문체(`~다 / ~이다`)로 통일합니다.
   - 19세기 프랑스어 오컬트 용어가 현대 일반 명사로 오역되지 않도록 주의합니다:
     - `sabbat` → **`사바트 (Sabbat)`** (*"안식일"* 오역 금지)
     - `Clavicules de Salomon` → **`『솔로몬의 열쇠 (Clavicules de Salomon)』`** (*"솔로몬의 빗장뼈/쇄골"* 오역 금지)
     - `cabale / cabaliste` → **`카발라 (Cabale)` / `카발라 학자 (Cabaliste)`** (*"유대인 도당"* 오역 금지)
     - `préservatif` (19세기 불어의 ‘수호물·액막이’) → **`수호 부적(호신부, Préservatif)`** (*"방부제 / 콘돔"* 오역 금지)
     - `démonomanie` → **`악마학 (Démonomanie)`** (*"악마광"* 오역 금지)
     - `esprit familier / démon familier` → **`사역마(패밀리어, Esprit familier)`** (*"친숙한 정신/요정"* 오역 금지)
     - `noueur d’aiguillettes / ligatures` → **`매듭 주술사 (Noueur d’aiguillettes)` / `결박 주술 (Ligatures)`** (*"바늘 묶는 사람 / 합자"* 오역 금지)
     - `astrologie judiciaire` → **`판단 점성술 (Astrologie judiciaire)`** (*"사법 점성술"* 오역 금지)

---

## 3. 디렉터리 및 파일 구조 (Architecture & File Map)

```text
dictionnaire-infernal-app/
├── dist/                                  # 실제 배포되는 프론트엔드 정적 파일 (Cloudflare & Capacitor 공용)
│   ├── index.html                         # 메인 엔트리 HTML (사전 탐색 / 원화 갤러리 / 즐겨찾기 / 독서 기록 / 설정)
│   ├── style.css                          # 고서(Grimoire) 테마 다크/세피아/라이트 스타일시트
│   ├── app.js                             # 메인 애플리케이션 상태 관리, 검색, A-Z 필터, 80개 단위 페이지네이션, 모달
│   ├── entries.js                         # [자동 생성 파일] 3,810개 전체 항목 데이터 및 검색/필터/정렬 함수
│   ├── backup.js                          # 북마크·독서노트·설정 JSON 백업 내보내기/가져오기 모듈
│   ├── settings.js                        # 테마(dark/parchment/light), 글자 크기, 불어 원문 표시 설정 모듈
│   ├── native.js                          # Capacitor 네이티브 브리지 (파일 공유, 화면 꺼짐 방지, 뒤로가기 제어)
│   ├── icons.js                           # 인라인 SVG 아이콘 정의
│   └── plates/                            # 루이 브르통(Louis Breton)의 1863년판 오리지널 판화 이미지 68장 (*.jpg)
├── resources/                             # 원문 데이터 및 번역 캐시 (dist/entries.js 빌드의 원천 데이터)
│   ├── entries_1863_all.json              # 위키문헌(Wikisource) 1863년판 731쪽에서 추출·정제한 3,810개 불어 원문 데이터
│   ├── entries_68_plates.json             # 68개 판화 수록 악마 항목의 상세 수작업 번역 및 메타데이터 원본
│   ├── translations_ko_cache.json         # 3,810개 표제어(Key: "표제어@@페이지")의 1차 한국어 번역 캐시
│   ├── curated_ko_overrides.json          # 정밀 교정·윤문 완료된 표제어 번역 오버라이드 사전 (최우선 적용됨)
│   ├── dictionnaire_infernal_1863_full.pdf          # 1863년 프랑스어 원서 전체 스캔본 PDF
│   ├── dictionnaire_infernal_1863_wikisource_pages.json # 1863년 원서 731페이지 위키문헌 교정 텍스트 원본
│   └── dictionnaire_infernal_illustrations.pdf      # 68개 판화 도판 모음 PDF
├── scripts-build-entries.mjs              # [핵심 빌드 스크립트] resources/* 를 결합·교정하여 dist/entries.js 생성
├── scripts-versions.mjs                   # dist/*.js 의 import 쿼리 버전(?v=...)을 동기화하는 빌드 스크립트
├── scripts-translate-all.mjs              # 불어 원문 일괄 번역 캐시 생성용 유틸리티 스크립트
├── scripts-plates.mjs                     # PDF에서 판화 이미지를 추출하는 유틸리티 스크립트
├── serve.mjs                              # 로컬 개발 서버 (node serve.mjs 8080)
├── test-startup.mjs                       # 앱 부팅, 탭 전환, A-Z 필터, 모달, 백업 다이얼로그 통합 테스트
├── test.mjs                               # 3,810개 데이터셋 무결성, 영문 병기, 판화 파일, 검색/필터 단위 테스트
├── test-backup.mjs                        # 백업 JSON 직렬화/역직렬화 및 유효성 검증 테스트
├── test-native.mjs                        # 브라우저/Capacitor 네이티브 격리 및 뒤로가기/화면잠금 테스트
├── wrangler.jsonc                         # Cloudflare 배포 설정 파일
└── capacitor.config.json                  # Capacitor Android 앱 설정 파일
```

---

## 4. 데이터 구조 (`dist/entries.js` 내 `ENTRIES` 배열)

각 항목 객체는 아래와 같은 스키마를 가집니다:

```js
{
  id: "e1-aaron",                  // 고유 ID (판화 항목은 "bael", "astaroth" 등 고정 슬러그)
  letter: "A",                     // A–Z 알파벳 색인 문자
  plate: "",                       // 판화 이미지 경로 (판화 있는 68개 항목만 "plates/01-bael.jpg" 등)
  plateNo: 0,                      // 판화 번호 (1~68, 판화 없는 항목은 0)
  hasPlate: false,                 // 판화 포함 여부 (true: 68개, false: 3,742개)
  nameKo: "아론 (Aaron)",           // 한글 표제어 + (원문 표제어) 병기
  nameKoShort: "아론",              // 괄호 제외한 한글 표제어
  nameFr: "Aaron",                 // 1863년 프랑스어 원문 표제어
  rank: "마법사·비술사 (Magicien)", // 분류 직위/성격
  legions: 0,                      // 지휘 군단 수 (악마 항목에서 언급된 경우 숫자)
  category: "person",              // 대분류: "demon" | "person" | "divination" | "superstition" | "myth" | "grimoire" | "crossref"
  subCategory: "person",           // 판화 갤러리 세부 분류 ("monarch" | "duke" | "spirit" | "myth" 등)
  domains: ["인물·역사 (Personnage)", "12세기"], // 관련 태그 배열
  appearance: "",                  // 외형 요약 (판화 항목 위주)
  summary: "아론 (Aaron)은 마누엘 콤네노스 (Manuel Comnène) 황제 치세에 활동한 동로마(비잔티움) 제국의 마법사이다.", // 카드 미리보기용 첫 문장
  description: "아론 (Aaron)은 ... (한국어 완역 본문 전체)", // 상세 모달에 표시되는 한국어 번역 전문
  quoteFr: "magicien du Bas-Empire, qui vivait sous l’empereur Manuel Comnène...", // 1863년 프랑스어 원문 전문
  page1863: 1                      // 1863년 제6판 원서 페이지 번호 (1 ~ 723)
}
```

---

## 5. 주요 작업 워크플로우 및 명령어 (Workflows & Commands)

### A. 로컬 서버 실행 및 전체 테스트 검증
```bash
# 1. 로컬 미리보기 서버 실행 (기본 포트 8080)
node serve.mjs 8080

# 2. 데이터 재빌드 + 캐시 버전 동기화 + 4종 자동화 테스트 실행
node scripts-build-entries.mjs && node scripts-versions.mjs && npm run check
```
> **중요**: `dist/entries.js`를 직접 수동 편집하지 마세요. 반드시 `resources/curated_ko_overrides.json` 또는 `scripts-build-entries.mjs`를 수정한 뒤 `node scripts-build-entries.mjs && node scripts-versions.mjs`를 실행하여 재생성해야 합니다.

### B. 번역 품질 추가 개선 방법 (윤문 작업 이어하기)
현재 3,810개 항목은 두 계층으로 관리됩니다:
1. **정밀 윤문 오버라이드 (`resources/curated_ko_overrides.json`)**:
   - `"표제어@@페이지번호"`(예: `"Aaron@@1"`, `"Abrahel@@4"`)를 키로 하여 사람이 다듬은 고품질 백과사전 번역문을 넣으면, `scripts-build-entries.mjs` 실행 시 기계번역 캐시보다 **최우선으로 적용**됩니다.
   - 현재 첫 페이지 주요 항목 82개(`Aaron@@1` ~ `Akbaba@@12`) 및 판화 68개 항목(`resources/entries_68_plates.json`)이 정밀 윤문되어 있습니다.
   - 특정 알파벳 구간이나 카테고리의 번역을 더 매끄럽게 다듬고 싶을 때는 `resources/entries_1863_all.json`의 원문(`textFr`)을 참고하여 `resources/curated_ko_overrides.json`에 항목을 추가한 뒤 `node scripts-build-entries.mjs`를 실행하면 됩니다.
2. **전체 항목 자동 교정 파이프라인 (`scripts-build-entries.mjs` 내 `polishTranslation`)**:
   - 나머지 항목들은 `resources/translations_ko_cache.json`의 초벌 번역을 읽어 들여 `polishTranslation()`에서 ① 문체 평서형 변환(`convertEnding`), ② 오컬트 용어 교정, ③ 고유명사 `한글 (Original)` 병기(`BODY_PROPER_REPLACEMENTS`), ④ 받침 유무에 따른 한국어 조사 자동 보정(`fixKoreanParticles`)을 거쳐 생성됩니다.

### C. UI / UX 구조 및 개편 가이드
- **항목 상세 보기 (전체 페이지 뷰 전환 완료)**:
  - 기존의 좁은 모달 팝업 대신, 항목 카드를 클릭하면 `<main id="main">` 전체가 **전용 상세 페이지(`.entry-detail-page`, `renderEntryDetailPage()`)**로 전환되어 넓은 화면에서 판화와 전문 번역을 읽을 수 있습니다.
  - 최상단 헤더 제목은 상세 페이지 진입 시에도 탭 이름(지옥사전 / 삽화 도감 등)으로 고정되어 흔들림 없이 안정적으로 유지됩니다.
  - 카드 내 배치는 **표제어(이름) → 삽화 판화(루이 브르통) → 본문(글)** 순서로 정렬되어 있습니다.
  - **상세 헤더 사각 구분선 & 액션 축약 임베드**: 상단바(`.detail-topbar`)를 제거하고, 클래식한 사각 헤더(`.detail-header`)에 하단 구분선(`border-bottom: 1px solid var(--border)`)을 배치했습니다. 헤더 최상단 좌측에는 열람완료 버튼(`[✓ 열람 완료됨]`), 우측에는 축약 별모양 버튼(`★`/`☆`), 중앙에는 서지 정보가 들어갑니다.
  - **하단 컨트롤 재배치**: 불문 원문 토글 버튼(`[불문 원문 함께 보기 / 닫기]`)과 목록 복귀 버튼(`[← 사전 탐색 목록으로 돌아가기]`)을 상세 페이지 본문 하단(이전/다음 버튼 영역)으로 이동하여, 상단이 깔끔하게 표제어에 집중되도록 구성했습니다.
  - **입력창 비파괴 검색 방식**: 검색어 입력 시 화면 전체를 다시 그리지 않고 결과 목록(`#dict-results`)만 교체하여, 모바일 한글 키보드(삼성/Gboard/천지인 등)의 한글 조합 세션이 깨지거나 역순으로 타이핑되는 현상을 완전히 해결했습니다.
  - **좌우 드래그/스와이프 이동**: 일반 상세 페이지와 무작위 열람 모두 하단에 통일된 안내 문구(`← 좌우로 밀어서 이전 / 다음 항목 넘기기 →`)와 함께 모바일 터치 스와이프, 마우스 좌우 드래그, 좌우 화살표 키로 페이지를 넘길 수 있습니다.
  - **탭 간 열람 상태 & 스크롤 유지**: 사전 탐색이나 삽화 도감에서 항목을 읽거나 스크롤하다가 다른 탭(서재, 설정 등)을 다녀와도 보던 항목과 스크롤 위치가 그대로 보존됩니다 (`tabEntryIds`, `tabScrollY`).
  - **상단 태그/알파벳 스크롤 위치 유지**: 상단 분류 태그나 A-Z 알파벳 줄을 드래그한 뒤 특정 버튼을 눌러도 첫 위치로 튕기지 않고 드래그한 위치가 그대로 유지됩니다 (`restorePillScrolls()`).
  - `<dialog id="modal">`은 백업 다이얼로그(`openBackupModal`)와 각 탭별 맞춤 도움말(`openHelpModal` - 사전 탐색/삽화 도감/무작위 열람/서재 기록/설정/상세 열람 각각 전용 설명 제공)로 사용됩니다.
- UI/UX를 추가 수정할 때 참고할 파일:
  - **[dist/index.html](./dist/index.html)**: 상단 헤더, 메인 영역(`#main`), 하단 탭 내비게이션(`nav[aria-label="주 메뉴"]`), 유틸리티 다이얼로그(`#modal`) 마크업
  - **[dist/style.css](./dist/style.css)**: CSS 변수 기반 테마(`:root` 다크, `[data-theme="light"]` 양피지 고서), 최대 너비 `960px` 레이아웃, 상세 페이지(`.entry-detail-page`, `.detail-card`, `.detail-plate-showcase`) 스타일
  - **[dist/app.js](./dist/app.js)**: 렌더링 로직(`renderDictionaryTab`, `renderGalleryTab`, `renderDailyTab`, `renderBookmarksTab`, `renderEntryDetailPage`, `openEntryPage`, `closeEntryPage`), 80개 단위 페이지네이션(`PAGE_STEP = 80`)

> **UI/UX 수정 시 주의사항**: `test-startup.mjs`에서 초기 부팅, 탭 전환, 전체 페이지 상세 뷰(`.entry-detail-page`), 백업 모달 등을 검증하므로 UI 구조 변경 시 `test-startup.mjs`도 함께 업데이트해야 `npm run check`가 통과합니다.

---

## 6. 다음 채팅방 / 다른 AI 모델에 바로 붙여넣을 수 있는 시작 프롬프트

다른 AI나 새 채팅방에서 작업을 이어갈 때 아래 블록을 복사해 전달하면 즉시 문맥을 파악합니다:

```markdown
GitHub 저장소 `https://github.com/KimDomi/dictionnaire-infernal-app` 프로젝트 작업을 이어서 진행하려고 해.
저장소 루트의 `HANDOFF.md` 파일을 먼저 읽고 전체 아키텍처와 데이터 빌드 파이프라인(`scripts-build-entries.mjs`, `resources/curated_ko_overrides.json`), 그리고 번역/표기 절대 규칙(고유명사 영문 병기 필수, 번역 외 메타 안내문 금지, 백과사전 평서체 통일)을 파악해 줘.
변경 후에는 항상 `node scripts-build-entries.mjs && node scripts-versions.mjs && npm run check`가 통과하는지 확인해 줘.
```
