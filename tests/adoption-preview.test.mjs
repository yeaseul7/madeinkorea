import test from 'node:test';
import assert from 'node:assert/strict';
import { previewAge, previewLocation, previewWeight } from '../src/data/adoption-preview.mjs';

test('birth years become approximate localized ages without inventing birthdays', () => {
  assert.equal(previewAge('2016(년생)', 'en', 2026), 'About 10 years');
  assert.equal(previewAge('2025(년생)', 'en', 2026), 'About 1 year');
  assert.equal(previewAge('2026(년생)', 'ja', 2026), '1歳未満');
  assert.equal(previewAge('2026(60일미만)(년생)', 'en', 2026), 'Under 60 days');
  assert.equal(previewAge('2025(년생)', 'ko', 2026), '약 1살');
  for (const value of [null, '', '미상', '2027(년생)', '1800(년생)']) assert.equal(previewAge(value, 'en', 2026), '');
});
test('locations use known province translations, with a country-only fallback', () => {
  assert.equal(previewLocation('부산광역시 동구', 'en'), 'South Korea · Busan');
  assert.equal(previewLocation('강원특별자치도 횡성군', 'ja'), '韓国 · 江原道');
  assert.equal(previewLocation('충청북도 청주시', 'en'), 'South Korea · North Chungcheong');
  assert.equal(previewLocation('경기도 성남시', 'ko'), '대한민국 · 경기도 성남시');
  assert.equal(previewLocation('알 수 없는 지역', 'en'), 'South Korea');
});
test('weights retain kg units and unknown values are omitted', () => {
  assert.equal(previewWeight('10.2(Kg)'), '10.2 kg');
  assert.equal(previewWeight('3 kg'), '3 kg');
  for (const value of [null, '', '미상', '20 lb', '0(Kg)']) assert.equal(previewWeight(value), '');
});
