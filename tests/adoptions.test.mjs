import test from 'node:test';
import assert from 'node:assert/strict';
import { collectAdoptions, normalizeAnimals, freshAdoptions, dateOnly, ADOPTION_MAX_AGE } from '../scripts/lib/adoptions.mjs';

const dog = (id, overrides = {}) => ({ desertionNo: String(id), processState: 'protect', upKindCd: '417000', kindNm: '진도견', noticeSdt: '20261020', ...overrides });
test('general-search matches include mixes and locations, but exclude cats and closed notices', () => {
  const items = normalizeAnimals([
    dog(12345678901), dog(12345678901),
    dog(12345678902, { kindNm: '믹스견', specialMark: '진도 믹스 추정' }),
    dog(12345678903, { kindNm: '믹스견', careAddr: '전남 진도군' }),
    dog(12345678904, { processState: 'adopted' }),
    dog(12345678905, { upKindCd: '422400', upKindNm: '고양이' }),
    dog(12345678906, { kindNm: '푸들' }),
  ]);
  assert.deepEqual(items.map(x => x.id), ['12345678901', '12345678902', '12345678903']);
});
test('notice date sorts newest first, never sync or rescue date; cap at six', () => {
  const result = normalizeAnimals(Array.from({ length: 9 }, (_, i) => dog(12345678900 + i, { noticeSdt: `202610${10 + i}`, happenDt: '20261023', updTm: '2026-10-23' })));
  assert.equal(result.length, 6);
  assert.equal(result[0].noticeDate, '2026-10-18');
  assert.equal(result[5].noticeDate, '2026-10-13');
});
test('allowlisted public fields, safe links, HTTPS photos and valid dates', () => {
  const [item] = normalizeAnimals(dog(12345678901, { careOwnerNm: 'unneeded', popfile: 'http://openapi.animal.go.kr/photo.jpg' }));
  assert.equal(item.image, 'https://openapi.animal.go.kr/photo.jpg');
  assert.equal(item.url, 'https://matchichi.com/shelter/12345678901');
  assert.equal(item.careOwnerNm, undefined);
  assert.equal(normalizeAnimals(dog(12345678902, { popfile: 'javascript:alert(1)' }))[0].image, '');
  assert.equal(dateOnly('20260230'), '');
  assert.equal(dateOnly('2026-10-21 13:00:42.0'), '2026-10-21');
});
test('stale or future snapshots are not shown', () => {
  const now = Date.parse('2026-10-23T00:00:00Z');
  const feed = { fetchedAt: new Date(now).toISOString(), animals: [dog(12345678901)] };
  assert.equal(freshAdoptions(feed, now).length, 1);
  assert.deepEqual(freshAdoptions(feed, now + ADOPTION_MAX_AGE), []);
  assert.deepEqual(freshAdoptions(feed, now - 120000), []);
  assert.deepEqual(freshAdoptions({}, now), []);
});
test('collector uses public normal-search API with dog filter and notice sort; handles null and invalid responses', async () => {
  const feed = await collectAdoptions(async url => {
    const params = new URL(url).searchParams;
    assert.equal(params.get('searchQuery'), '진도');
    assert.equal(params.get('upkind'), '417000');
    assert.equal(params.get('sort'), 'notice');
    return { ok: true, json: async () => ({ response: { header: { resultCode: '00' }, body: { items: { item: null } } } }) };
  });
  assert.deepEqual(feed.animals, []);
  await assert.rejects(collectAdoptions(async () => ({ ok: true, json: async () => ({}) })), /응답 형식/);
  await assert.rejects(collectAdoptions(async () => ({ ok: false, status: 503 })), /503/);
});
