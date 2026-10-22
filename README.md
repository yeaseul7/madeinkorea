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

### 오늘의 진돗개 — 자동 영상 목록

별도 승인 없이 YouTube 검색으로 수집한 진돗개 관련 영상을 메인에 표시합니다. 한국어·영어·일본어로 검색하고 중복을 제거한 뒤 공개·임베드 가능한 일반 영상만 포함합니다. 삭제/비공개/지역·연령 제한/라이브 영상은 제외합니다. 검색 결과의 내용이나 품종을 직접 검증한 목록은 아닙니다.

- 배포할 때마다 자동 수집하며 매일 09:37 KST에도 갱신·배포합니다. GitHub 예약 실행은 지연되거나 장기 비활성 시 중지될 수 있습니다.
- 수동 갱신: [Deploy to GitHub Pages](https://github.com/yeaseul7/madeinkorea/actions/workflows/deploy.yml) → Run workflow.
- `YOUTUBE_API_KEY`는 GitHub Actions Secret에만 설정합니다. 방문자의 브라우저에서는 Data API를 호출하지 않습니다.
- 로컬은 `npm run dev` 실행 시 배포된 공개 JSON을 동기화합니다. 이미 서버가 실행 중이면 `npm run videos:sync` 후 새로고침하세요. 로컬에 API 키를 넣을 필요가 없습니다.
- `.generated/videos.json`과 `public/data/jindo-videos.json`은 자동 생성되며 Git에 저장하지 않습니다. 제목·채널 등 API 메타데이터가 Git 이력에 남지 않도록 합니다.
- API 수집 실패 시 이번 배포의 목록을 비우고 Actions 경고를 남깁니다. 로컬 동기화 실패 시 7일 이내의 로컬 자료만 사용합니다. 오래된 목록은 빌드·브라우저에서 숨기므로 배포 스케줄을 유지하세요.
- 첫 6개를 표시하고 ‘영상 더 보기’로 6개씩 펼칩니다. 제목과 음성·자막은 원본 언어이며 UI는 3개 언어를 지원합니다.
- 썸네일은 YouTube에서 로드하며 클릭 시에만 플레이어를 연결합니다. 다른 영상을 재생하면 이전 재생은 중단합니다. 지역/계정별 재생 여부는 YouTube에서 최종 결정합니다.
- 검증: `npm test`, `npm run build`. API 키가 주입된 환경에서는 `npm run videos:collect`로 수집할 수 있습니다.

공식 문서: [검색 API](https://developers.google.com/youtube/data/reference/rest/v3/search/list), [영상 상태 API](https://developers.google.com/youtube/data/reference/rest/v3/videos/list), [YouTube 개발자 정책](https://developers.google.com/youtube/terms/developer-policies).

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
