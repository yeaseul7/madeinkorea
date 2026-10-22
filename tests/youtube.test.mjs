import test from 'node:test';
import assert from 'node:assert/strict';
import { collectVideos, isPlayable, MAX_AGE_MS, selectVideos, videoDetails, youtube, VIDEO_MARKETS } from '../scripts/lib/youtube.mjs';
const id = 'aBcDeFgH123';
const other = 'zYxWvUtS987';
const now = new Date('2026-10-22T01:00:00Z');
const cache = { locale: 'ko', regionCode: 'KR', fetchedAt: now.toISOString(), videos: [{ id, title: 'Jindo', channel: 'Test' }] };
const playable = (id) => ({ id, status: { privacyStatus: 'public', embeddable: true, uploadStatus: 'processed' }, snippet: { liveBroadcastContent: 'none', title: 'Jindo', channelTitle: 'Test' }, contentDetails: {} });

test('public, processed, embeddable and unrestricted videos only', () => {
  const item = playable(id);
  assert.equal(isPlayable(item), true);
  for (const status of [{ privacyStatus: 'unlisted' }, { privacyStatus: 'private' }, { embeddable: false }, { uploadStatus: 'rejected' }]) assert.equal(isPlayable({ ...item, status: { ...item.status, ...status } }), false);
  assert.equal(isPlayable({ ...item, contentDetails: { regionRestriction: { blocked: ['KR'] } } }), false);
  assert.equal(isPlayable({ ...item, contentDetails: { contentRating: { ytRating: 'ytAgeRestricted' } } }), false);
  assert.equal(isPlayable({ ...item, snippet: { liveBroadcastContent: 'live' } }), false);
  assert.equal(isPlayable({}), false);
});
test('fresh search results appear immediately without approvals or dates', () => {
  const result = selectVideos(cache, 'ko', now);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, id);
  assert.equal(result[0].expiresAt, new Date(now.getTime() + MAX_AGE_MS).toISOString());
});
test('feed deduplicates, rejects malformed IDs and strips unexpected data', () => {
  const result = selectVideos({ ...cache, videos: [...cache.videos, ...cache.videos, null, { id: 'javascript:alert(1)', title: 'x', channel: 'x' }, { id: other, title: 1 }, { id: other, title: 'Other', channel: 'Other', secret: 'no' }] }, 'ko', now);
  assert.deepEqual(result.map(v => v.id), [id, other]);
  assert.equal('secret' in result[1], false);
});
test('missing, malformed, future-dated or expired metadata fails closed', () => {
  for (const value of [null, {}, { ...cache, fetchedAt: 'invalid' }, { ...cache, fetchedAt: new Date(now.getTime() - MAX_AGE_MS).toISOString() }, { ...cache, fetchedAt: '2030-01-01' }, { ...cache, videos: [] }]) assert.deepEqual(selectVideos(value, 'ko', now), []);
});
test('regional feeds never fall back to another locale or the old shared feed', () => {
  assert.deepEqual(selectVideos(cache, 'en', now), []);
  assert.deepEqual(selectVideos({ ...cache, regionCode: 'JP' }, 'ko', now), []);
  assert.deepEqual(selectVideos({ fetchedAt: cache.fetchedAt, videos: cache.videos }, 'ko', now), []);
  assert.deepEqual(selectVideos(cache, 'unknown', now), []);
});
test('each regional feed is capped at three after deduplication', () => {
  for (const [locale, market] of Object.entries(VIDEO_MARKETS)) {
    const videos = Array.from({ length: 5 }, (_, i) => ({ id: `test${String(i).padStart(7, '0')}`, title: 'Jindo', channel: 'Test' }));
    const result = selectVideos({ ...cache, locale, regionCode: market.regionCode, videos: [videos[0], ...videos] }, locale, now);
    assert.deepEqual(result.map(v => v.id), videos.slice(0, 3).map(v => v.id));
  }
});
test('regional searches use the matching country/language and preserve rank after unavailable entries', async () => {
  for (const [locale, market] of Object.entries(VIDEO_MARKETS)) {
    const ids = Array.from({ length: 6 }, (_, i) => `${locale}${String(i).padStart(9, '0')}`);
    const calls = [];
    const videos = await collectVideos(locale, { key: 'test-secret', fetcher: async url => {
      calls.push(url.pathname);
      if (url.pathname.endsWith('/search')) {
        assert.equal(url.searchParams.get('regionCode'), market.regionCode);
        assert.equal(url.searchParams.get('relevanceLanguage'), locale);
        assert.equal(url.searchParams.get('q'), market.query);
        assert.equal(url.searchParams.get('order'), 'relevance');
        return { ok: true, json: async () => ({ items: [...ids, ids[2], 'invalid'].map(videoId => ({ id: { videoId } })) }) };
      }
      assert.equal(url.searchParams.get('id'), ids.join(','));
      // The first item is deleted, the second cannot be embedded, details are unordered.
      return { ok: true, json: async () => ({ items: ids.slice(1).reverse().map(id => ({ ...playable(id), status: { ...playable(id).status, embeddable: id !== ids[1] } })) }) };
    } });
    assert.equal(calls.length, 2);
    assert.deepEqual(videos.map(v => v.id), ids.slice(2, 5));
  }
});
test('API key stays in headers and failures do not disclose secrets', async () => {
  await youtube('videos', { id }, { key: 'test-secret', fetcher: async (url, options) => {
    assert.equal(String(url).includes('test-secret'), false);
    assert.equal(options.headers['X-Goog-Api-Key'], 'test-secret');
    return { ok: true, json: async () => ({ items: [] }) };
  } });
  await assert.rejects(youtube('videos', {}, { key: 'test-secret', fetcher: async () => { throw new Error('test-secret'); } }), error => !error.message.includes('test-secret'));
  await assert.rejects(youtube('videos', {}, { key: 'test-secret', fetcher: async () => ({ ok: false, status: 403 }) }), /HTTP 403/);
  await assert.rejects(youtube('videos', {}, { key: '' }), /Secret/);
});
test('details use batches of 50; empty requests need no key', async () => {
  const ids = Array.from({ length: 51 }, (_, i) => `test${String(i).padStart(7, '0')}`);
  const batches = [];
  await videoDetails([...ids, ids[0]], { key: 'test', fetcher: async url => {
    batches.push(url.searchParams.get('id').split(',').length);
    return { ok: true, json: async () => ({ items: [] }) };
  } });
  assert.deepEqual(batches, [50, 1]);
  assert.deepEqual(await videoDetails([], { key: '' }), []);
});
