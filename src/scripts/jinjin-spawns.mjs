// A shuffled quota keeps the long-run mix at 35% / 65%, without a fixed order.
// A four-decoy streak limit prevents long runs with no Jinjin to find.
export function createSpawnDirector(random = Math.random) {
  let counts = {}, decoyStreak = 0;
  const recent = [], uses = Array(9).fill(0);
  function weighted(entries) {
    let draw = random() * entries.reduce((sum, [, weight]) => sum + weight, 0);
    for (const [value, weight] of entries) { draw -= weight; if (draw < 0) return value; }
    return entries.at(-1)[0];
  }
  return {
    nextKind() {
      if (!Object.values(counts).some(Boolean)) counts = { jinjin:21, white:13, gold:13, black:13 };
      const decoys = counts.white + counts.gold + counts.black;
      let eligible = Object.entries(counts).filter(([, count]) => count > 0);
      if (decoyStreak >= 4 && counts.jinjin) eligible = [['jinjin', counts.jinjin]];
      // Keep enough Jinjin in reserve to separate the remaining decoys.
      else if (decoys > 4 * counts.jinjin) eligible = eligible.filter(([kind]) => kind !== 'jinjin');
      const kind = weighted(eligible);
      counts[kind]--;
      decoyStreak = kind === 'jinjin' ? 0 : decoyStreak + 1;
      return kind;
    },
    nextJar(available) {
      if (!available.length) return null;
      const fresh = available.filter(index => !recent.includes(index));
      const index = weighted((fresh.length ? fresh : available).map(index => [index, 1 / (1 + uses[index])]));
      uses[index]++; recent.push(index); if (recent.length > 3) recent.shift();
      return index;
    },
  };
}
