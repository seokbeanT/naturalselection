# 배포 안내서

## 1. 공통 준비

Node.js 22.13 이상을 설치한 뒤 프로젝트 폴더에서 실행합니다.

```bash
npm install
npm run build
```

`dist` 폴더가 생성되면 배포 준비가 끝납니다.

## 2. 일반 웹서버

Apache, Nginx, NAS 웹서버, 학교 서버 등에 `dist` 폴더 안의 파일을 모두 업로드합니다. 이 프로그램은 경로가 달라져도 동작하도록 상대 경로로 빌드됩니다.

## 3. Cloudflare Pages

Git 저장소에 이 프로젝트를 올린 뒤 Pages 프로젝트를 만듭니다.

- 빌드 명령: `npm run build`
- 출력 폴더: `dist`
- Node.js 버전: 22.13 이상

## 4. Vercel

Git 저장소를 연결한 뒤 다음 값을 확인합니다.

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

## 5. GitHub Pages

프로젝트에 자동 배포 파일 `.github/workflows/deploy-pages.yml`이 포함되어 있습니다.

1. GitHub에서 새 저장소를 만듭니다.
2. 압축을 푼 폴더 안의 파일을 저장소 루트에 모두 업로드합니다.
3. 저장소의 `Settings → Pages`에서 배포 방식을 `GitHub Actions`로 선택합니다.
4. `main` 브랜치에 파일이 올라가면 자동으로 설치·빌드·배포가 진행됩니다.
5. `Actions` 탭에서 작업이 완료되면 Pages 주소를 확인합니다.

`vite.config.ts`의 `base: "./"` 설정 덕분에 저장소 하위 주소에서도 정적 자산을 불러올 수 있습니다.

## 6. 업데이트 방법

1. `src/App.tsx` 또는 `src/styles.css`를 수정합니다.
2. `npm run build`를 실행합니다.
3. 새로 만들어진 `dist` 내용을 기존 서버 파일과 교체합니다.
4. 브라우저에 이전 화면이 남아 있으면 강력 새로고침을 합니다.

## 운영상 참고

- 서버 데이터베이스가 필요하지 않습니다.
- 학생이 입력한 내용이나 실험 결과가 서버에 저장되지 않습니다.
- CSV 결과표는 학생의 브라우저에서 바로 생성됩니다.
- 여러 학생이 동시에 접속해도 각자의 브라우저에서 별도로 실행됩니다.
