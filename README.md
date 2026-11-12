# 지옥사전 — Dictionnaire Infernal (1863)

자크 콜랭 드 플랑시(Jacques Collin de Plancy, 1794–1881)의 오컬트·악마학 백과사전 **『지옥사전(*Dictionnaire Infernal*, 1863년 제6판)』**을 웹과 Android(APK)에서 오프라인으로 탐색할 수 있도록 만든 도감형 사전 앱입니다.

`reading-calendar(독서 달력)`와 동일한 아키텍처로 설계되어, 번들러 없이 가벼운 순수 ES 모듈(`dist/`)로 웹앱을 개발하고 Capacitor를 통해 그대로 Android APK로 빌드할 수 있습니다.

## 주요 기능

- **사전 탐색 (`dictionary`)**: 1863년 제6판의 주요 악마·정령·신화·사바트 표제어 68편에 대해 한글/불어 표제어, 지옥 계급, 지휘 군단 규모, 관장 영역 키워드로 즉시 검색·정렬.
- **삽화 도감 (`gallery`)**: 원본 PDF에서 추출한 루이 브르통(Louis Breton)의 1863년 오리지널 목판화 68점(`dist/plates/*.jpg`) 수록.
- **오늘의 악마 (`daily`)**: 매일 날짜에 따라 선정되는 오늘의 표제어 열람 및 무작위 소환.
- **서재 기록 (`bookmarks`)**: 즐겨찾기, 열람 완료 체크, 항목별 개인 연구 노트 작성 및 JSON 백업 내보내기/가져오기.
- **웹 & Android 네이티브 호환 (`native.js`)**: 다크(흑요석)/라이트(고서 양피지) 테마, 글자 크기 조절, 1863 불어 원문 병기 토글, 열람 중 화면 켜짐 유지(Wake Lock), 안드로이드 뒤로 가기 및 시스템 파일 저장 창 연동.

## 실행 및 검증

```sh
# 로컬 개발 서버 실행 (http://localhost:8080)
npm run dev

# 에셋 해시 버전 갱신 및 전체 모듈·백업·네이티브 회귀 테스트
npm run version-assets
npm run check

# 원전 PDF에서 68점 판화 재추출
npm run plates

# Android APK 빌드 (Capacitor + Gradle)
npm run android:debug
```

## 원전 리소스 (`resources/`)

- [`resources/dictionnaire_infernal_1863_full.pdf`](./resources/dictionnaire_infernal_1863_full.pdf): 1863년 제6판 전체 스캔본 PDF (736쪽, 루이 브르통 삽화 포함)
- [`resources/dictionnaire_infernal_illustrations.pdf`](./resources/dictionnaire_infernal_illustrations.pdf): 주요 악마 판화 발췌본 PDF (2.8MB)
- [`resources/dictionnaire_infernal_1863_ocr.txt`](./resources/dictionnaire_infernal_1863_ocr.txt): 1863년 제6판 전체 프랑스어 OCR 텍스트
- [`resources/dictionnaire_infernal_illustrations_en.txt`](./resources/dictionnaire_infernal_illustrations_en.txt): 삽화 항목 영역본 해설 텍스트
