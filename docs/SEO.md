# 검색 등록

배포 주소: https://yeaseul7.github.io/madeinkorea/
사이트맵: https://yeaseul7.github.io/madeinkorea/sitemap.xml

## 대상

- 미국: `/en/`, `en-US` + 일반 영어 `en`
- 일본: `/ja/`, `ja-JP` + 일반 일본어 `ja`
- 한국: `/ko/`, `ko-KR` + 일반 한국어 `ko`
- 각 언어에 홈·역사·게임 목록·진진잡기, 총 12개 URL

## 배포 후 계정 소유자가 할 일

1. Google Search Console에 위 배포 주소를 URL 접두어 속성으로 추가하고 소유권 인증.
2. 사이트맵 주소 제출.
3. 네이버 서치어드바이저에도 배포 주소 등록, 소유권 인증 후 사이트맵 제출.
4. 필요하면 Bing Webmaster Tools에도 등록.

인증 파일을 발급받으면 `public/`에 넣을 수 있습니다. 인증 메타태그는 공통 페이지의 `<head>`에 추가합니다. 아직 어떤 서비스에도 소유권 인증·사이트맵 제출을 하지 않았습니다.

## GitHub Pages 경로

GitHub 프로젝트 사이트이므로 `robots.txt`는 `/madeinkorea/robots.txt`에 생성됩니다. 검색엔진이 자동으로 조회하는 호스트 루트 `/robots.txt`는 이 저장소가 관리하지 않습니다. 사이트맵은 Search Console에 직접 제출하고, 호스트 루트 파일을 관리할 수 있다면 사이트맵 링크를 그곳에도 추가합니다.

GitHub Actions의 `SITE_URL`과 `BASE_PATH`를 이용해 canonical, 언어 연결, 사이트맵 URL을 같은 배포 경로로 생성합니다. 빌드 날짜를 문서 수정일처럼 표시하지 않습니다.
