export const RECORD_KEY = 'jindo-of-korea:jinjin-catch:records:v1';
const empty = () => ({ version:1, played:false, bestScore:0, maxCombo:0 });
function valid(value) {
 return value?.version === 1 && value.played === true && Number.isSafeInteger(value.bestScore) && Number.isSafeInteger(value.maxCombo) && value.maxCombo >= 0;
}
export function readRecords(storage) {
 try { const value=JSON.parse(storage.getItem(RECORD_KEY)); return valid(value) ? value : empty(); }
 catch { return empty(); }
}
export function saveRecords(storage, score, maxCombo, previous = empty()) {
 const persisted=readRecords(storage);
 const candidates=[persisted,previous].filter(valid);
 const oldBest=candidates.length ? Math.max(...candidates.map(r=>r.bestScore)) : null;
 const record={ version:1, played:true, bestScore:oldBest === null ? score : Math.max(oldBest,score), maxCombo:Math.max(maxCombo,...candidates.map(r=>r.maxCombo),0) };
 let saved=false;
 try { storage.setItem(RECORD_KEY,JSON.stringify(record)); saved=true; } catch {}
 return { record, saved, newBest:oldBest === null || score > oldBest };
}
