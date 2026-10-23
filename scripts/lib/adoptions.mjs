export const ADOPTION_LIMIT = 6;
export const ADOPTION_MAX_AGE = 48 * 60 * 60 * 1000;
export const ADOPTION_API = 'https://matchichi.com/api/shelter-data?searchQuery=%EC%A7%84%EB%8F%84&upkind=417000&sort=notice&pageNo=1&numOfRows=6';
export const ADOPTION_SEARCH = 'https://matchichi.com/?q=%EC%A7%84%EB%8F%84&upkind=417000&sort=notice';

const string = value => typeof value === 'string' ? value.trim() : '';
export function dateOnly(value) {
  const digits = string(value).replace(/\D/g, '').slice(0, 8);
  if (!/^\d{8}$/.test(digits)) return '';
  const iso = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  const date = new Date(iso);
  return Number.isFinite(+date) && date.toISOString().slice(0, 10) === iso ? iso : '';
}

function imageUrl(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    // The public animal API supplies HTTP links but serves the same files over HTTPS.
    if (url.hostname === 'openapi.animal.go.kr') url.protocol = 'https:';
    return url.protocol === 'https:' ? url.href : '';
  } catch { return ''; }
}

export function normalizeAnimals(raw) {
  const items = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? [raw] : [];
  const seen = new Set();
  return items.filter(item => {
    if (!item || !/^\d{10,20}$/.test(string(item.desertionNo)) || seen.has(item.desertionNo)) return false;
    if (!['notice', 'protect'].includes(item.processState)) return false;
    if (item.upKindCd !== '417000' && !['개', '강아지', 'dog'].includes(item.upKindNm)) return false;
    if (!['rfidCd', 'happenPlace', 'careAddr', 'careNm', 'kindNm', 'kindFullNm', 'specialMark'].some(key => string(item[key]).includes('진도'))) return false;
    seen.add(item.desertionNo);
    return true;
  }).map(item => ({
    id: item.desertionNo,
    noticeNo: string(item.noticeNo),
    noticeDate: dateOnly(item.noticeSdt),
    updatedDate: dateOnly(item.updTm),
    state: item.processState,
    breed: string(item.kindNm) || string(item.kindFullNm),
    age: string(item.age),
    sex: ['M', 'F'].includes(item.sexCd) ? item.sexCd : 'U',
    weight: string(item.weight),
    region: string(item.orgNm),
    shelter: string(item.careNm),
    description: string(item.specialMark),
    image: imageUrl(item.popfile1 || item.popfile),
    url: `https://matchichi.com/shelter/${item.desertionNo}`,
  })).sort((a, b) => b.noticeDate.localeCompare(a.noticeDate)).slice(0, ADOPTION_LIMIT);
}

export function freshAdoptions(feed, now = Date.now()) {
  const timestamp = Date.parse(feed?.fetchedAt);
  if (!Number.isFinite(timestamp) || timestamp > now + 60000 || now - timestamp >= ADOPTION_MAX_AGE) return [];
  return Array.isArray(feed.animals) ? feed.animals.slice(0, ADOPTION_LIMIT) : [];
}

export async function collectAdoptions(fetcher = fetch) {
  const response = await fetcher(ADOPTION_API, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`입양 목록 조회 실패 (HTTP ${response.status})`);
  const data = await response.json();
  const body = data?.response?.body;
  if (data?.response?.header?.resultCode !== '00' || !body?.items || !Object.hasOwn(body.items, 'item')) throw new Error('입양 목록 응답 형식 오류');
  return { fetchedAt: new Date().toISOString(), status: 'ok', animals: normalizeAnimals(body.items.item) };
}
