import test from 'node:test';
import assert from 'node:assert/strict';
import { approve, isPlayable, koreaDate, MAX_AGE_MS, selectFeatured, validDate, validateApprovals, videoDetails, videoId, youtube } from '../scripts/lib/youtube.mjs';

const id = 'aBcDeFgH123';
const other = 'zYxWvUtS987';
const now = new Date('2026-10-22T01:00:00Z');
const records = [{ id, publishOn: '2026-10-22' }];
const cache = { fetchedAt: now.toISOString(), videos: [{ id, title: 'Jindo', channel: 'Test' }] };

test('accepts IDs, watch, short, embed and mobile URLs', () => {
  for (const url of [id, `https://youtu.be/${id}?t=10`, `https://www.youtube.com/watch?v=${id}&t=10`, `https://youtube.com/shorts/${id}`, `https://m.youtube.com/watch?v=${id}`, `https://youtube.com/embed/${id}`]) assert.equal(videoId(url), id);
});
test('rejects non-YouTube hosts and executable/invalid inputs', () => {
  for (const url of [`https://youtube.com.evil.test/watch?v=${id}`, `https://evil.test/${id}`, 'javascript:alert(1)', '$(echo secret)', 'short', `http://youtu.be/${id}`]) assert.throws(() => videoId(url));
});
test('calendar date and Korean midnight are correct', () => {
  assert.equal(koreaDate(new Date('2026-10-21T15:00:00Z')), '2026-10-22');
  assert.equal(koreaDate(new Date('2026-10-21T14:59:59Z')), '2026-10-21');
  assert.equal(validDate('2026-02-30'), false);
  assert.equal(validDate('2026-2-1'), false);
  assert.equal(validDate('2028-02-29'), true);
});
test('approval is idempotent and never silently replaces a scheduled video', () => {
  assert.deepEqual(approve(records, id, '2026-10-22'), records);
  assert.throws(() => approve(records, other, '2026-10-22'));
  assert.deepEqual(approve(records, id, '2026-10-23'), [{ id, publishOn: '2026-10-23' }]);
  assert.throws(() => validateApprovals([...records, ...records]));
});
test('only public, processed, embeddable and unrestricted videos pass', () => {
  const item = { id, status: { privacyStatus: 'public', embeddable: true, uploadStatus: 'processed' }, snippet: { liveBroadcastContent: 'none' }, contentDetails: {} };
  assert.equal(isPlayable(item), true);
  for (const status of [{ privacyStatus: 'unlisted' }, { privacyStatus: 'private' }, { embeddable: false }, { uploadStatus: 'rejected' }]) assert.equal(isPlayable({ ...item, status: { ...item.status, ...status } }), false);
  assert.equal(isPlayable({ ...item, contentDetails: { regionRestriction: { blocked: ['KR'] } } }), false);
  assert.equal(isPlayable({ ...item, contentDetails: { contentRating: { ytRating: 'ytAgeRestricted' } } }), false);
  assert.equal(isPlayable({ ...item, snippet: { liveBroadcastContent: 'live' } }), false);
  assert.equal(isPlayable({}), false);
});
test('unapproved candidates, revoked and future approvals never render', () => {
  assert.equal(selectFeatured([], cache, now), null);
  assert.equal(selectFeatured([{ id, publishOn: '2026-10-23' }], cache, now), null);
  assert.equal(selectFeatured([{ id: other, publishOn: '2026-10-21' }], cache, now), null);
});
test('selects newest available due video and falls back when a newer one is deleted', () => {
  assert.equal(selectFeatured(records, cache, now).id, id);
  assert.equal(selectFeatured([{ id, publishOn: '2026-10-20' }, { id: other, publishOn: '2026-10-21' }], cache, now).id, id);
  const two = { ...cache, videos: [...cache.videos, { id: other, title: 'Next', channel: 'Next' }] };
  assert.equal(selectFeatured([{ id, publishOn: '2026-10-20' }, { id: other, publishOn: '2026-10-21' }], two, now).id, other);
});
test('missing, malformed or expired metadata fails closed', () => {
  for (const value of [null, {}, { ...cache, fetchedAt: 'invalid' }, { ...cache, fetchedAt: new Date(now.getTime() - MAX_AGE_MS - 1).toISOString() }, { ...cache, fetchedAt: '2030-01-01' }, { ...cache, videos: [] }]) assert.equal(selectFeatured(records, value, now), null);
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
test('details deduplicate and batch IDs; an empty list needs no key or requests', async () => {
  let calls = 0;
  const fetcher = async url => { calls++; assert.equal(url.searchParams.get('id'), id); return { ok: true, json: async () => ({ items: [{ id }] }) }; };
  assert.deepEqual(await videoDetails([id, id], { key: 'test', fetcher }), [{ id }]);
  assert.equal(calls, 1);
  assert.deepEqual(await videoDetails([], { key: '', fetcher }), []);
  assert.equal(calls, 1);
});
