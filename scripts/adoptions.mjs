import { mkdir, writeFile } from 'node:fs/promises';
import { collectAdoptions } from './lib/adoptions.mjs';

let feed;
try {
  feed = await collectAdoptions();
  console.log(`꼬순내 입양 공고 ${feed.animals.length}건 수집 (공고 시작일 최신순)`);
} catch (error) {
  console.warn(`::warning::${error.message}. 오래된 공고 대신 조회 안내를 표시합니다.`);
  feed = { fetchedAt: new Date().toISOString(), status: 'unavailable', animals: [] };
}
await mkdir(new URL('../.generated/', import.meta.url), { recursive: true });
await writeFile(new URL('../.generated/adoptions.json', import.meta.url), JSON.stringify(feed, null, 2) + '\n');
