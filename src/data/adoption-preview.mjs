const regions = [
  [/^서울/, 'Seoul', 'ソウル'], [/^부산/, 'Busan', '釜山'],
  [/^대구/, 'Daegu', '大邱'], [/^인천/, 'Incheon', '仁川'],
  [/^광주/, 'Gwangju', '光州'], [/^대전/, 'Daejeon', '大田'],
  [/^울산/, 'Ulsan', '蔚山'], [/^세종/, 'Sejong', '世宗'],
  [/^경기/, 'Gyeonggi', '京畿道'], [/^강원/, 'Gangwon', '江原道'],
  [/^충청북도|^충북/, 'North Chungcheong', '忠清北道'],
  [/^충청남도|^충남/, 'South Chungcheong', '忠清南道'],
  [/^전라북도|^전북/, 'Jeonbuk', '全北'],
  [/^전라남도|^전남/, 'South Jeolla', '全羅南道'],
  [/^경상북도|^경북/, 'North Gyeongsang', '慶尚北道'],
  [/^경상남도|^경남/, 'South Gyeongsang', '慶尚南道'],
  [/^제주/, 'Jeju', '済州'],
];

export function previewLocation(value, lang) {
  const region = typeof value === 'string' ? value.trim() : '';
  if (lang === 'ko') return region ? `대한민국 · ${region}` : '대한민국';
  const match = regions.find(([pattern]) => pattern.test(region));
  if (lang === 'ja') return match ? `韓国 · ${match[2]}` : '韓国';
  return match ? `South Korea · ${match[1]}` : 'South Korea';
}

export function previewAge(value, lang, year) {
  const age = typeof value === 'string' ? value.trim() : '';
  const birth = age.match(/^(\d{4})(?:\D|$)/);
  if (!birth || !Number.isInteger(year)) return '';
  const years = year - Number(birth[1]);
  if (years < 0 || years > 30) return '';
  // This is a source-reported age range, not an exact birthday.
  if (/60\s*일\s*미만/.test(age)) return { ko: '생후 60일 미만', en: 'Under 60 days', ja: '生後60日未満' }[lang];
  if (years === 0) return { ko: '1살 미만', en: 'Under 1 year', ja: '1歳未満' }[lang];
  if (lang === 'ko') return `약 ${years}살`;
  if (lang === 'ja') return `約${years}歳`;
  return `About ${years} ${years === 1 ? 'year' : 'years'}`;
}

export function previewWeight(value) {
  const match = typeof value === 'string' && value.trim().match(/^(\d+(?:\.\d+)?)\s*\(?\s*kg\s*\)?$/i);
  if (!match || Number(match[1]) <= 0) return '';
  return `${Number(match[1])} kg`;
}
