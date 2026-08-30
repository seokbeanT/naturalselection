# 자연선택 모의실험 — GitHub 배포용

현재 공개 중인 자연선택 모의실험을 GitHub Pages나 다른 정적 웹서버에서 운영할 수 있도록 정리한 독립 소스입니다. 학생 기록이나 개인정보를 서버에 저장하지 않으며, 모든 계산은 접속한 브라우저에서 실행됩니다.

## 현재 포함된 기능

- 매 세대 눈에 띄는 공 10개를 제거하는 `10개 고정` 모드
- 5초 동안 고정된 공을 제거하는 `5초 모드`
- 5초 동안 움직이는 공을 제거하는 `추적 모드`
- 생존 개체가 다음 세대에 같은 색으로 2배 번식
- 2세대 번식 후 모든 색상 개체의 약 10%가 다른 색으로 무작위 변이
- 클릭할 때마다 색상별 개체 수와 비율을 실시간 표시
- 5세대 결과표, 비율 그래프, CSV 저장

## GitHub Pages로 가장 쉽게 배포하기

1. GitHub에서 새 저장소를 만듭니다.
2. 이 ZIP의 압축을 풀고 폴더 안의 파일을 저장소에 모두 업로드합니다.
3. 기본 브랜치 이름이 `main`인지 확인합니다.
4. 저장소의 `Settings → Pages`에서 배포 방식을 `GitHub Actions`로 선택합니다.
5. `Actions` 탭의 `Deploy to GitHub Pages` 작업이 완료되면 공개 주소가 생성됩니다.

이 프로젝트에는 `.github/workflows/deploy-pages.yml`이 포함되어 있어 이후 파일을 수정해 `main` 브랜치에 올릴 때도 자동으로 다시 배포됩니다.

## 포함 내용

- `src/App.tsx`: 시뮬레이션 화면과 실험 계산
- `src/styles.css`: 전체 디자인과 반응형 화면
- `src/main.tsx`: 웹앱 시작 파일
- `public/favicon.svg`: 사이트 아이콘
- `SIMULATION_RULES.md`: 현재 실험 규칙과 계산 원리
- `CUSTOMIZATION.md`: 공 개수, 시간, 색상 등을 바꾸는 방법
- `DEPLOYMENT.md`: 다른 서버에 배포하는 방법
- `.github/workflows/deploy-pages.yml`: GitHub Pages 자동 배포 설정
- `dist/`: `npm run build` 실행 후 생성되는 배포용 파일

## 빠른 실행

Node.js 22.13 이상이 설치된 컴퓨터에서 이 폴더를 열고 다음 명령을 실행합니다.

```bash
npm install
npm run dev
```

브라우저에 표시되는 주소로 접속하면 됩니다.

## 배포 파일 만들기

```bash
npm install
npm run build
```

완료되면 `dist` 폴더가 만들어집니다. 일반 웹서버에는 `dist` 안의 파일들을 업로드하면 됩니다.

## 기술 구성

- React 19
- TypeScript
- Vite
- 별도 데이터베이스와 로그인 기능 없음
- 외부 API 및 비밀키 없음

## 공개본과의 관계

이 소스는 제작 시점의 공개본과 같은 규칙과 주요 화면을 담습니다. 공개 사이트를 나중에 수정하더라도 GitHub 저장소는 자동으로 바뀌지 않으므로, 큰 수정 후에는 소스도 함께 갱신해야 합니다.
