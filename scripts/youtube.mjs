import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises';
import { approve, isPlayable, koreaDate, metadata, validateApprovals, videoDetails, videoId, youtube } from './lib/youtube.mjs';

const approvalsPath = new URL('../src/data/featured-videos.json', import.meta.url);
const generatedPath = new URL('../.generated/', import.meta.url);
const reportsPath = new URL('../.reports/', import.meta.url);
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
async function summary(text) {
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, text + '\n');
}

async function main() {
  const action = process.argv[2];
  const approvals = validateApprovals(JSON.parse(await readFile(approvalsPath, 'utf8')));
  if (action === 'collect') {
    const seen = new Set(approvals.map(item => item.id));
    const ids = [];
    for (const [q, relevanceLanguage] of [['진돗개 일상', 'ko'], ['Korean Jindo dog', 'en'], ['珍島犬', 'ja']]) {
      const items = await youtube('search', { part: 'snippet', type: 'video', q, relevanceLanguage, maxResults: '10', order: 'date', safeSearch: 'strict', videoEmbeddable: 'true', videoSyndicated: 'true' });
      for (const item of items) if (item.id?.videoId && !seen.has(item.id.videoId)) { seen.add(item.id.videoId); ids.push(item.id.videoId); }
    }
    const candidates = (await videoDetails(ids)).filter(isPlayable).map(metadata);
    await mkdir(reportsPath, { recursive: true });
    await writeFile(new URL('candidates.json', reportsPath), JSON.stringify({ fetchedAt: new Date().toISOString(), candidates }, null, 2) + '\n');
    await writeFile(new URL('review.html', reportsPath), `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>진돗개 영상 후보 검토</title><style>body{font:17px/1.7 system-ui;background:#f4f0e7;color:#292a27;max-width:900px;margin:48px auto;padding:24px}article{border-bottom:1px solid #d0cabc;padding:24px 0}h2{font-size:22px}a{color:#b74332}code{user-select:all}</style><h1>영상 후보 ${candidates.length}개</h1><p>영상을 직접 확인한 뒤 <a href="https://github.com/yeaseul7/madeinkorea/actions/workflows/review-video.yml">Review a Jindo video → Run workflow</a>에서 ID와 게시일을 입력하세요. 후보 수집만으로는 사이트에 게시되지 않습니다.</p><p>진돗개 관련성, 영상 내용과 채널, 자막 제공 여부를 확인하세요. 제목과 음성은 원본 언어입니다.</p>${candidates.map(item => `<article><h2>${escape(item.title)}</h2><p>${escape(item.channel)}</p><p><a href="https://www.youtube.com/watch?v=${item.id}" target="_blank" rel="noreferrer">YouTube에서 검토 ↗</a></p><p>영상 ID: <code>${item.id}</code></p></article>`).join('')}${candidates.length ? '' : '<p>이번 실행에서 새로운 후보를 찾지 못했습니다.</p>'}</html>`);
    await summary(`## 영상 후보 수집 완료\n\n${candidates.length}개 후보를 찾았습니다. 이 실행 하단 **Artifacts → jindo-video-candidates**를 내려받아 **review.html**을 여세요.\n\n[영상 승인 / 해제](https://github.com/yeaseul7/madeinkorea/actions/workflows/review-video.yml)\n\n후보 파일은 7일 후 만료됩니다. 자동 게시는 하지 않습니다.`);
    console.log(`후보 ${candidates.length}개를 검토 파일로 저장했습니다.`);
  } else if (action === 'refresh') {
    let videos = [];
    try { videos = (await videoDetails(approvals.map(item => item.id))).filter(isPlayable).map(metadata); }
    catch (error) { console.warn(`::warning::${error.message} 이번 배포에서는 영상을 숨깁니다.`); }
    await mkdir(generatedPath, { recursive: true });
    await writeFile(new URL('videos.json', generatedPath), JSON.stringify({ fetchedAt: new Date().toISOString(), videos }, null, 2) + '\n');
    console.log(`승인 ${approvals.length}개 중 재생 가능한 영상 ${videos.length}개를 갱신했습니다.`);
  } else if (action === 'approve' || action === 'remove') {
    const id = videoId(process.env.VIDEO_INPUT);
    let next;
    if (action === 'approve') {
      const publishOn = process.env.PUBLISH_ON?.trim() || koreaDate();
      // Validate the proposed edit before consuming API quota.
      next = approve(approvals, id, publishOn);
      if (!(await videoDetails([id])).some(isPlayable)) throw new Error('공개 상태의 임베드 가능한 일반 영상만 승인할 수 있습니다. 삭제·지역 제한·연령 제한·라이브 영상은 제외합니다.');
    } else next = approvals.filter(item => item.id !== id);
    await writeFile(approvalsPath, JSON.stringify(next, null, 2) + '\n');
    await summary(action === 'approve' ? '영상이 승인 목록에 반영되었습니다. 지정한 게시일(한국 시간)부터 노출됩니다.' : '영상이 승인 목록에서 제거되었습니다.');
  } else throw new Error('사용법: node scripts/youtube.mjs collect|refresh|approve|remove');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
