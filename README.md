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

### 오늘의 진돗개 — YouTube 영상 운영

사이트에는 **직접 승인한 영상만** 표시됩니다. 검색 결과는 자동 승인하지 않습니다.

1. 저장소 Actions Secret에 `YOUTUBE_API_KEY`를 등록합니다. Google Cloud의 YouTube Data API v3를 활성화하고 해당 API만 허용한 키를 사용합니다. 키를 소스나 `PUBLIC_` 환경변수에 넣지 마세요.
2. [Collect Jindo video candidates](https://github.com/yeaseul7/madeinkorea/actions/workflows/collect-videos.yml) → **Run workflow**. 매일 09:17 KST에도 실행됩니다.
3. 성공한 실행 하단 **Artifacts → jindo-video-candidates**를 내려받고 `review.html`을 엽니다. 각 YouTube 원본을 직접 보고 진돗개 관련성, 내용, 채널, 자막을 확인합니다. 한국어·영어·일본어 검색은 후보 탐색용이며 콘텐츠 품질이나 품종을 자동 판정하지 않습니다.
4. [Review a Jindo video](https://github.com/yeaseul7/madeinkorea/actions/workflows/review-video.yml) → **Run workflow**. `action=approve`, 검토한 영상 URL/ID, 게시일(`YYYY-MM-DD`, 한국 시간)을 입력합니다. 게시일을 비우면 오늘입니다. 저장소 쓰기 권한이 있는 운영자만 실행할 수 있습니다.
5. 승인 목록이 커밋되고 배포가 자동 시작됩니다. 미래 날짜의 영상은 해당 날짜 이후 첫 배포부터 표시됩니다. 날짜별 한 편만 등록되며 날짜 충돌 시 실패합니다. 수정하려면 기존 영상을 `remove`로 해제한 뒤 승인하세요.
6. 승인 해제는 같은 워크플로에서 `action=remove`와 영상 URL/ID를 입력합니다. 배포가 완료되면 사이트에서 제거됩니다.

매일 09:37 KST에 승인 영상을 재검증하고 사이트를 배포합니다. 예약 실행은 GitHub 사정에 따라 늦어질 수 있고, 공개 저장소가 장기간 비활성 상태이면 중지될 수 있습니다. Actions에서 실행 상태를 확인하세요. 당일 영상이 없으면 가장 최근의 재생 가능한 승인 영상을 유지합니다. 아직 승인 영상이 없으면 준비 문구만 표시합니다.

- `src/data/featured-videos.json`: 승인한 ID와 게시일만 저장. API에서 받은 제목·채널은 Git에 저장하지 않습니다.
- `.reports/`: 후보 JSON과 HTML. Git 무시, Actions Artifact 보관 7일. 내려받은 후보 파일도 검토 후 삭제하세요.
- `.generated/videos.json`: 매 배포마다 갱신되는 제목·채널. Git 무시. 일반 로컬 빌드는 파일이 없어도 동작합니다.
- 삭제/비공개/임베드 불가/지역·연령 제한/라이브 영상은 제외합니다. API 오류가 나면 해당 배포에서 영상을 숨기고 Actions 경고를 남깁니다.
- 메타데이터 유효기간은 7일입니다. 빌드 및 브라우저에서 만료를 확인합니다. 배포가 멈추더라도 재생하지 않으며, 정적 배포 파일의 갱신·삭제를 위해 운영자는 예약 배포 상태를 유지해야 합니다.
- 제목·음성·자막은 원본에서 제공하는 언어입니다. 주변 UI는 한국어·영어·일본어를 지원합니다.
- 방문자는 YouTube Data API를 호출하지 않습니다. 썸네일은 YouTube에서 로드하고 재생 클릭 시에만 `youtube-nocookie.com` 플레이어를 만듭니다. 지역/계정별 재생 제한은 YouTube에서 최종 결정하며 원본 링크도 제공합니다.
- 검증: `npm test`, `npm run build`. 로컬 API 테스트는 별도로 환경에 주입한 키로 `npm run videos:collect`, `npm run videos:refresh`를 실행합니다. `.env`는 자동으로 읽지 않습니다.

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
