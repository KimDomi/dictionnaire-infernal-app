# dictionnaire-infernal-app Cloudflare 배포 안내

`reading-calendar(독서 달력)`와 동일하게 Cloudflare Workers Static Assets 방식으로 `dist/` 정적 웹앱을 배포하도록 [`wrangler.jsonc`](./wrangler.jsonc)와 [`.npmrc`](./.npmrc) 설정이 완료되어 있습니다.

## 1. Cloudflare 대시보드에서 GitHub 저장소 연결하기

1. [Cloudflare 대시보드](https://dash.cloudflare.com/)에 로그인합니다.
2. 왼쪽 메뉴에서 **Compute (Workers)** → **Workers & Pages**로 이동한 뒤 **Create(만들기)** 버튼을 누릅니다.
3. **Import a repository (Git 저장소 연결)** 탭을 선택하고 GitHub 계정에서 **`KimDomi/dictionnaire-infernal-app`** 저장소를 선택합니다.
4. 빌드 및 배포 설정(Build settings)을 다음과 같이 입력합니다:
   - **Project name (Worker 이름)**: `dictionnaire-infernal-app` ([`wrangler.jsonc`](./wrangler.jsonc)의 `name` 값과 동일하게 맞춤)
   - **Production branch**: `main`
   - **Build command (빌드 명령)**:
     ```sh
     node scripts-versions.mjs
     ```
   - **Deploy command (배포 명령)**:
     ```sh
     npm run deploy
     ```
     *(또는 기본값인 `npx wrangler deploy`를 그대로 두어도 프로젝트에 고정된 Wrangler 버전을 사용해 배포됩니다.)*
5. **Save and Deploy**를 누르면 첫 빌드가 시작됩니다.

## 2. 배포 주소 확인

- 배포가 완료되면 `workers.dev` 하위 도메인으로 바로 접속할 수 있습니다:
  - 예상 주소: `https://dictionnaire-infernal-app.waffle4843.workers.dev`
- 이후 `main` 브랜치에 새 커밋이 푸시될 때마다 Cloudflare가 자동으로 `node scripts-versions.mjs`와 배포를 실행합니다.

## 3. 참고 사항

- **캐시 충돌 방지**: Cloudflare 빌드 환경에서 간헐적으로 발생하는 npm 캐시 오류를 방지하기 위해 `reading-calendar`와 동일하게 [`.npmrc`](./.npmrc)(`cache=.npm-cache`)와 `wrangler` 고정 버전을 적용해 두었습니다.
- **배포 전 로컬 검증**:
  ```sh
  node scripts-versions.mjs
  npm run check
  ```
