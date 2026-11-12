# dictionnaire-infernal-app Android 0.1.0

`reading-calendar(독서 달력)`와 동일한 구조로 웹과 Android 앱이 같은 `dist/` 코어를 공유합니다.
원격 사이트를 띄우는 단순 웹뷰가 아니라 1863년 제6판 루이 브르통 목판화 68점(`dist/plates/*.jpg`)과 사전 데이터를 APK 내부에 포함하므로, 설치 후 인터넷 연결 없이도 오프라인으로 사전을 열람·검색하고 연구 노트를 기록할 수 있습니다.

## 주요 기능 및 네이티브 연동

- **완전 오프라인 실행**: `dist/`의 사전 본문과 68점의 판화 이미지를 APK 내부에 포함.
- **시스템 파일 선택기 백업**: `설정 → 서재 정보 관리 → 내보내기 / 가져오기`를 통해 즐겨찾기·열람 기록·연구 노트를 JSON 파일로 백업 및 복원.
- **안드로이드 뒤로 가기(`infernal-back`)**: 상세 모달 닫기 → 사전 탐색 탭으로 이동 → 앱 백그라운드 전환.
- **열람 중 화면 켜짐 유지**: 설정에서 켠 경우 상세 모달이나 오늘의 악마 열람 중 화면 꺼짐 방지.
- **테마 연동**: 다크(흑요석) 및 라이트(고서 양피지) 모드에 맞춘 시스템 상태 표시줄 스타일 동기화.

## 로컬 및 CI 빌드 방법

- Node.js 22 이상, Java **JDK** 21, Android SDK Platform 36, Build Tools 35.0.0

```sh
npm ci
npm run check
npm run android:debug
```

GitHub Actions(`.github/workflows/android-apk.yml`)에서도 `main` 브랜치 푸시 또는 수동 실행(`workflow_dispatch`) 시 자동으로 테스트(`npm run check`) 후 `dictionnaire-infernal-0.1.0-debug.apk`와 SHA-256 체크섬을 아티팩트로 생성합니다.
