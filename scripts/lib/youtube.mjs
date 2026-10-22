export const ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
export const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function videoId(input) {
  const value = String(input || '').trim();
  if (ID_PATTERN.test(value)) return value;
  let url;
  try { url = new URL(value); } catch { throw new Error('YouTube URL 또는 11자리 영상 ID를 입력하세요.'); }
  if (url.protocol !== 'https:') throw new Error('HTTPS YouTube URL만 사용할 수 있습니다.');
  let id;
  if (url.hostname === 'youtu.be') id = url.pathname.slice(1);
  else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) {
    id = url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)\/?$/)?.[1];
  }
  if (!ID_PATTERN.test(id || '')) throw new Error('올바른 YouTube 영상 주소가 아닙니다.');
  return id;
}

export function koreaDate(now = new Date()) {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

export function validateApprovals(records) {
  if (!Array.isArray(records)) throw new Error('승인 목록은 배열이어야 합니다.');
  const ids = new Set();
  const dates = new Set();
  for (const entry of records) {
    if (!ID_PATTERN.test(entry.id) || !validDate(entry.publishOn) || ids.has(entry.id) || dates.has(entry.publishOn)) {
      throw new Error('승인 목록에 잘못된 ID, 날짜 또는 중복된 항목이 있습니다.');
    }
    ids.add(entry.id); dates.add(entry.publishOn);
  }
  return records;
}

export function approve(records, id, publishOn) {
  videoId(id);
  if (!validDate(publishOn)) throw new Error('게시일은 YYYY-MM-DD 형식의 실제 날짜여야 합니다.');
  if (records.some(item => item.publishOn === publishOn && item.id !== id)) throw new Error('해당 날짜에는 이미 승인된 영상이 있습니다. 먼저 remove로 해제하세요.');
  return validateApprovals([...records.filter(item => item.id !== id), { id, publishOn }].sort((a, b) => a.publishOn.localeCompare(b.publishOn)));
}

export function isPlayable(item) {
  return ID_PATTERN.test(item?.id || '') && item.status?.privacyStatus === 'public' && item.status?.embeddable === true
    && item.status?.uploadStatus === 'processed' && item.snippet?.liveBroadcastContent === 'none'
    && !item.contentDetails?.regionRestriction && item.contentDetails?.contentRating?.ytRating !== 'ytAgeRestricted';
}

export function metadata(item) {
  return { id: item.id, title: item.snippet.title, channel: item.snippet.channelTitle };
}

// Errors deliberately exclude request URLs, API keys and response bodies.
export async function youtube(endpoint, params, { key = process.env.YOUTUBE_API_KEY, fetcher = fetch } = {}) {
  if (!key) throw new Error('YOUTUBE_API_KEY Secret을 설정하세요.');
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  url.search = new URLSearchParams(params).toString();
  let response;
  try {
    response = await fetcher(url, { headers: { 'X-Goog-Api-Key': key }, signal: AbortSignal.timeout(20000) });
  } catch { throw new Error('YouTube API 연결에 실패했습니다.'); }
  if (!response.ok) throw new Error(`YouTube API HTTP ${response.status}: API 활성화, 키 제한 또는 할당량을 확인하세요.`);
  let data;
  try { data = await response.json(); } catch { throw new Error('YouTube API 응답을 해석할 수 없습니다.'); }
  if (!Array.isArray(data.items)) throw new Error('YouTube API 응답에 items가 없습니다.');
  return data.items;
}

export async function videoDetails(ids, options) {
  const unique = [...new Set(ids)];
  if (unique.some(id => !ID_PATTERN.test(id))) throw new Error('잘못된 영상 ID입니다.');
  const results = [];
  for (let i = 0; i < unique.length; i += 50) {
    results.push(...await youtube('videos', { part: 'snippet,status,contentDetails', id: unique.slice(i, i + 50).join(',') }, options));
  }
  return results;
}

export function selectFeatured(approvals, cache, now = new Date()) {
  const fetched = Date.parse(cache?.fetchedAt);
  if (!Number.isFinite(fetched) || now.getTime() - fetched > MAX_AGE_MS || fetched > now.getTime() + 60000 || !Array.isArray(cache?.videos)) return null;
  const today = koreaDate(now);
  for (const entry of [...validateApprovals(approvals)].sort((a, b) => b.publishOn.localeCompare(a.publishOn))) {
    const video = cache.videos.find(item => item.id === entry.id);
    if (entry.publishOn <= today && video && typeof video.title === 'string' && typeof video.channel === 'string') {
      return { ...video, publishOn: entry.publishOn, expiresAt: new Date(fetched + MAX_AGE_MS).toISOString() };
    }
  }
  return null;
}
