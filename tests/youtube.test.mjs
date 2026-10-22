import test from 'node:test';
import assert from 'node:assert/strict';
import { collectVideos, isPlayable, MAX_AGE_MS, selectVideos, videoDetails, youtube } from '../scripts/lib/youtube.mjs';
const id = 'aBcDeFgH123';
const other = 'zYxWvUtS987';
const now = new Date('2026-10-22T01:00:00Z');
const cache = { fetchedAt: now.toISOString(), videos: [{ id, title: 'Jindo', channel: 'Test' }] };
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
  const result = selectVideos(cache, now);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, id);
  assert.equal(result[0].expiresAt, new Date(now.getTime() + MAX_AGE_MS).toISOString());
});
test('feed deduplicates, rejects malformed IDs and strips unexpected data', () => {
  const result = selectVideos({ ...cache, videos: [...cache.videos, ...cache.videos, null, { id: 'javascript:alert(1)', title: 'x', channel: 'x' }, { id: other, title: 1 }, { id: other, title: 'Other', channel: 'Other', secret: 'no' }] }, now);
  assert.deepEqual(result.map(v => v.id), [id, other]);
  assert.equal('secret' in result[1], false);
});
test('missing, malformed, future-dated or expired metadata fails closed', () => {
  for (const value of [null, {}, { ...cache, fetchedAt: 'invalid' }, { ...cache, fetchedAt: new Date(now.getTime() - MAX_AGE_MS).toISOString() }, { ...cache, fetchedAt: '2030-01-01' }, { ...cache, videos: [] }]) assert.deepEqual(selectVideos(value, now), []);
});
test('three searches deduplicate before fetching details and discard unplayable videos', async () => {
  let searches = 0;
  let details = 0;
  const videos = await collectVideos({ key: 'test-secret', fetcher: async url => {
    if (url.pathname.endsWith('/search')) {
      searches++;
      assert.equal(url.searchParams.get('safeSearch'), 'strict');
      return { ok: true, json: async () => ({ items: [{ id: { videoId: id } }, { id: { videoId: other } }, { id: { videoId: 'invalid' } }] }) };
    }
    details++;
    assert.equal(url.searchParams.get('id'), `${id},${other}`);
    return { ok: true, json: async () => ({ items: [playable(id), { ...playable(other), status: { ...playable(other).status, embeddable: false } }] }) };
  } });
  assert.equal(searches, 3); assert.equal(details, 1);
  assert.deepEqual(videos, [{ id, title: 'Jindo', channel: 'Test' }]);
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
