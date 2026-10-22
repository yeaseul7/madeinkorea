import { readFile, writeFile, mkdir, appendFile, rm } from 'node:fs/promises';
import { collectVideos, selectVideos, VIDEO_MARKETS } from './lib/youtube.mjs';
const generatedPath = new URL('../.generated/', import.meta.url);
const publicPath = new URL('../public/data/', import.meta.url);
const feedBase = 'https://yeaseul7.github.io/madeinkorea/data/';
async function save(locale, feed) {
  const videos = selectVideos(feed, locale).map(({ id, title, channel }) => ({ id, title, channel }));
  const data = JSON.stringify({ fetchedAt: feed.fetchedAt, locale, regionCode: VIDEO_MARKETS[locale].regionCode, videos }, null, 2) + '\n';
  await mkdir(generatedPath, { recursive: true });
  await mkdir(publicPath, { recursive: true });
  await writeFile(new URL(`videos-${locale}.json`, generatedPath), data);
  await writeFile(new URL(`jindo-videos-${locale}.json`, publicPath), data);
  console.log(`${locale}/${VIDEO_MARKETS[locale].regionCode}: 영상 ${videos.length}개 저장`);
  return videos.length;
}
async function main() {
  const action = process.argv[2];
  if (!['collect', 'sync'].includes(action)) throw new Error('사용법: node scripts/youtube.mjs collect|sync');
  const counts = [];
  for (const [locale, market] of Object.entries(VIDEO_MARKETS)) {
    const emptyFeed = { fetchedAt: new Date().toISOString(), locale, regionCode: market.regionCode, videos: [] };
    if (action === 'collect') {
      let videos = [];
      try { videos = await collectVideos(locale); }
      catch (error) { console.warn(`::warning::${locale}: ${error.message} 이 지역 목록만 비웁니다.`); }
      const count = await save(locale, { ...emptyFeed, videos });
      counts.push(`${locale}/${market.regionCode}: ${count}개`);
    } else {
      try {
        const response = await fetch(`${feedBase}jindo-videos-${locale}.json`, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error('목록 동기화 실패');
        const feed = await response.json();
        if (!Number.isFinite(Date.parse(feed.fetchedAt)) || feed.locale !== locale || feed.regionCode !== market.regionCode || !Array.isArray(feed.videos)) throw new Error('잘못된 지역 목록');
        await save(locale, feed);
      } catch {
        let cache = emptyFeed;
        try { cache = JSON.parse(await readFile(new URL(`videos-${locale}.json`, generatedPath), 'utf8')); } catch {}
        await save(locale, cache);
        console.warn(`${locale}: 온라인 목록을 가져오지 못해 해당 지역의 유효한 로컬 목록만 사용합니다.`);
      }
    }
  }
  // Remove the old shared feed so it cannot be accidentally reused or published.
  await rm(new URL('videos.json', generatedPath), { force: true });
  await rm(new URL('jindo-videos.json', publicPath), { force: true });
  if (action === 'collect' && process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `## 지역별 진돗개 영상 자동 갱신\n\n${counts.join(' · ')}\n\n각 언어 페이지에 해당 지역 영상만 최대 3개 표시합니다. 별도 승인은 필요하지 않습니다.\n`);
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
