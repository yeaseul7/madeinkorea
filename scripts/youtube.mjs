import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises';
import { collectVideos, selectVideos } from './lib/youtube.mjs';
const generatedPath = new URL('../.generated/', import.meta.url);
const publicPath = new URL('../public/data/', import.meta.url);
const feedUrl = 'https://yeaseul7.github.io/madeinkorea/data/jindo-videos.json';
async function save(feed) {
  // Strip unexpected properties, reject stale metadata, and share only public metadata.
  const videos = selectVideos(feed).map(({ id, title, channel }) => ({ id, title, channel }));
  const data = JSON.stringify({ fetchedAt: feed.fetchedAt, videos }, null, 2) + '\n';
  await mkdir(generatedPath, { recursive: true });
  await mkdir(publicPath, { recursive: true });
  await writeFile(new URL('videos.json', generatedPath), data);
  await writeFile(new URL('jindo-videos.json', publicPath), data);
  console.log(`영상 목록 ${videos.length}개를 저장했습니다.`);
}
async function main() {
  const action = process.argv[2];
  if (action === 'collect') {
    let videos = [];
    try { videos = await collectVideos(); }
    catch (error) { console.warn(`::warning::${error.message} 이번 배포에서는 영상 목록을 비웁니다.`); }
    await save({ fetchedAt: new Date().toISOString(), videos });
    if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `## 진돗개 영상 자동 갱신\n\n공개·임베드 가능한 영상 ${videos.length}개를 메인 페이지에 표시합니다. 별도 승인은 필요하지 않습니다.\n`);
  } else if (action === 'sync') {
    // Local development uses the published feed. No API key is needed or exposed.
    try {
      const response = await fetch(feedUrl, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('목록 동기화 실패');
      const feed = await response.json();
      if (!Number.isFinite(Date.parse(feed.fetchedAt)) || !Array.isArray(feed.videos)) throw new Error('잘못된 목록');
      await save(feed);
    } catch {
      let cache = { fetchedAt: new Date().toISOString(), videos: [] };
      try { cache = JSON.parse(await readFile(new URL('videos.json', generatedPath), 'utf8')); } catch {}
      await save(cache);
      console.warn('온라인 목록을 가져오지 못해 유효한 로컬 목록을 사용합니다.');
    }
  } else throw new Error('사용법: node scripts/youtube.mjs collect|sync');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
