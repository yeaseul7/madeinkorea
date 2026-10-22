# Jindo of Korea

외국인에게 진돗개를 소개하고 입양 준비로 연결하는 다국어 정적 사이트입니다.

## 실행

```sh
npm install
npm run dev
```

- 영어: http://localhost:4321/en/
- 한국어: http://localhost:4321/ko/
- 일본어: http://localhost:4321/ja/

```sh
npm run build
npm run preview
```

## 구성

- Astro + TypeScript + CSS. 별도 DB와 서버 API 없음.
- `src/data/content.ts`: 언어별 전체 콘텐츠와 메뉴, FAQ, 체크리스트.
- `src/pages/[lang]/index.astro`: 언어별 정적 HTML 생성.
- `src/styles/global.css`: 반응형 스타일.
- `public/images/jinjin.png`: 라이선스를 확인한 실제 진돗개 사진.
- 체크리스트는 현재 페이지에서만 동작하며 개인정보를 수집하지 않음.
- Korean K9 Rescue는 외부 참고 링크이며 제휴 관계가 아님. 개별 입양 공고를 복제하거나 가상의 모집을 표시하지 않음.

## GitHub Pages 배포

1. 이 프로젝트를 GitHub 저장소의 `main` 브랜치에 push합니다.
2. 저장소 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 설정합니다.
3. **Actions → Deploy to GitHub Pages → Run workflow**를 실행하거나 `main`에 새 커밋을 push합니다.
4. 워크플로가 실제 Pages origin과 base path를 받아 빌드합니다. 커스텀 도메인도 Pages 설정을 기준으로 반영됩니다.

일반 프로젝트 주소는 `https://OWNER.github.io/REPOSITORY/en/`입니다. `OWNER.github.io` 저장소 또는 커스텀 도메인은 루트에서 제공됩니다.

로컬에서 프로젝트 하위 경로 검증:

```sh
GITHUB_REPOSITORY=example/madeinkorea npm run build
npm run preview
# http://localhost:4321/madeinkorea/en/
```

직접 빌드할 때 `SITE_URL`, `BASE_PATH` 환경변수로 도메인과 하위 경로를 지정할 수 있습니다. 저장소 정보가 없는 로컬 빌드의 canonical 도메인은 example.com입니다. 배포 시 워크플로가 실제 주소로 교체합니다.

## 콘텐츠 및 출처

- 품종 정보: https://www.akc.org/dog-breeds/korean-jindo-dog/
- 품종 표준: https://www.ukcdogs.com/breed-standards/jindo
- 외부 입양 안내: https://www.koreank9rescue.org/adopt/
- 지도 윤곽: https://github.com/southkorea/southkorea-maps/tree/master/kostat/2013

## 이미지

- `public/images/jindo-coast.png`: 사용자가 제공한 진도 풍경 원본(738×414). 실제 원본을 배경으로 사용하며 지형을 AI로 재생성하지 않았습니다.
- `public/images/jinjin.png`: 사용자가 제공한 JINJIN 캐릭터 시트를 참조하여 imagegen으로 제작한 투명 배경 캐릭터(1024×1536).
- 기존 출처 미상의 사용자 반려견으로 오해할 수 있는 백구 사진은 화면과 프로젝트 이미지에서 제거했습니다.
- 풍경 사진의 저작권자와 이용 허락 범위는 별도로 확인되지 않았으며 사용자 제공 자료로 표기합니다. 배포 전 원본 출처를 확인해야 합니다.

## 디자인

한지 미색(#F4F0E7), 먹색(#292A27), 인주색(#B74332), 저채도 녹색(#858A76)을 기본으로 진도의 바다와 해안 풍경을 배경에 사용합니다. 진진 캐릭터가 풍경 앞에서 사이트를 안내합니다. 다국어 메뉴와 커뮤니티, 입양 안내는 유지합니다.

Google Fonts를 외부에서 로드하며, 로드되지 않으면 시스템 글꼴로 표시됩니다.

## Current background photo

Jindo Bridge, USAG Humphreys, 2010-10-09. Original: https://commons.wikimedia.org/wiki/File:Haenam_Where_nature_meets_history,_culture.jpg (2100×1396), CC BY 2.0: https://creativecommons.org/licenses/by/2.0/. WebP conversion to 1024px and 2100px responsive variants, with CSS cropping and overlays. Attribution and original/license links appear in the footer. This replaces the previous low-resolution user-provided background.
