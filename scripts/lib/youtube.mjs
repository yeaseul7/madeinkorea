export const ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
export const MAX_VIDEOS = 3;
export const VIDEO_MARKETS = {
  ko: { regionCode: 'KR', query: '진돗개 일상' },
  en: { regionCode: 'US', query: 'Korean Jindo dog' },
  ja: { regionCode: 'JP', query: '珍島犬' },
};
export const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

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

export function selectVideos(cache, locale, now = new Date()) {
  if (!Object.hasOwn(VIDEO_MARKETS, locale) || cache?.locale !== locale || cache?.regionCode !== VIDEO_MARKETS[locale].regionCode) return [];
  const fetched = Date.parse(cache?.fetchedAt);
  if (!Number.isFinite(fetched) || now.getTime() - fetched >= MAX_AGE_MS || fetched > now.getTime() + 60000 || !Array.isArray(cache?.videos)) return [];
  const seen = new Set();
  return cache.videos.filter(video => {
    if (!ID_PATTERN.test(video?.id || '') || typeof video.title !== 'string' || typeof video.channel !== 'string' || seen.has(video.id)) return false;
    seen.add(video.id);
    return true;
  }).slice(0, MAX_VIDEOS).map(video => ({ id: video.id, title: video.title, channel: video.channel, expiresAt: new Date(fetched + MAX_AGE_MS).toISOString() }));
}

export async function collectVideos(locale, options) {
  if (!Object.hasOwn(VIDEO_MARKETS, locale)) throw new Error('지원하지 않는 영상 언어입니다.');
  const market = VIDEO_MARKETS[locale];
  // Retrieve a small pool so unavailable entries can be skipped, but store only three.
  const items = await youtube('search', {
    part: 'snippet', type: 'video', q: market.query, regionCode: market.regionCode,
    relevanceLanguage: locale, maxResults: '10', order: 'relevance',
    safeSearch: 'strict', videoEmbeddable: 'true', videoSyndicated: 'true',
  }, options);
  const ids = [...new Set(items.map(item => item.id?.videoId).filter(id => ID_PATTERN.test(id || '')))];
  const details = new Map((await videoDetails(ids, options)).map(item => [item.id, item]));
  // Preserve each market's search ranking, independent of the details response order.
  return ids.map(id => details.get(id)).filter(isPlayable).slice(0, MAX_VIDEOS).map(metadata);
}
