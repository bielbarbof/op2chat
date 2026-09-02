export function randomInt(max) {
  max = Math.max(1, Math.trunc(Number(max) || 1));
  if (globalThis.crypto?.getRandomValues) {
    const range = 0x100000000;
    const limit = range - (range % max);
    const array = new Uint32Array(1);
    let value;
    do { crypto.getRandomValues(array); value = array[0]; } while (value >= limit);
    return (value % max) + 1;
  }
  return Math.floor(Math.random() * max) + 1;
}

export function classifyOp2Result(values = [], total = 0, dt = null) {
  const normalizedValues = Array.isArray(values) ? values.map(Number).filter(Number.isFinite) : [];
  const criticalFailure = normalizedValues.length > 0 && normalizedValues.every(v => v === 1);
  const counts = new Map();
  for (const value of normalizedValues) counts.set(value, (counts.get(value) || 0) + 1);
  const criticalSuccess = !criticalFailure && [...counts.entries()].some(([value,count]) => value >= 6 && count >= 2);
  const numericDt = Number(dt);
  const hasDt = Number.isFinite(numericDt) && numericDt > 0;
  const success = criticalSuccess ? true : criticalFailure ? false : hasDt ? Number(total) >= numericDt : null;
  return {
    dt: hasDt ? Math.trunc(numericDt) : null,
    success,
    criticalSuccess,
    criticalFailure
  };
}

export function rollOp2Test({ dice = [], dt = null, bonus = 0, label = 'Teste', selected = null } = {}) {
  const normalized = dice.slice(0,4).map((d, index) => ({
    index,
    sides: Math.max(4, Number(d.sides) || 4),
    source: String(d.source || `d${d.sides || 4}`),
    kind: String(d.kind || 'extra')
  }));
  const results = normalized.map(d => ({ ...d, value: randomInt(d.sides) }));
  const maxSum = Math.min(3, results.length);
  let selectedIndexes = Array.isArray(selected)
    ? selected.filter(i => Number.isInteger(i) && i >= 0 && i < results.length).slice(0,maxSum)
    : [];
  if (selectedIndexes.length !== maxSum) {
    selectedIndexes = [...results]
      .sort((a,b) => b.value - a.value || a.index - b.index)
      .slice(0,maxSum)
      .map(x => x.index)
      .sort((a,b)=>a-b);
  }
  const numericBonus = Number.isFinite(Number(bonus)) ? Number(bonus) : 0;
  const diceTotal = results.filter(r => selectedIndexes.includes(r.index)).reduce((sum,r)=>sum+r.value,0);
  const total = diceTotal + numericBonus;
  const values = results.map(r=>r.value);
  const ra = values.length ? Math.max(...values) : 0;
  const rb = values.length ? Math.min(...values) : 0;
  const classification = classifyOp2Result(values,total,dt);
  return {
    label,
    dice: results,
    selectedIndexes,
    diceTotal,
    bonus: numericBonus,
    total,
    ra,
    rb,
    dt: classification.dt,
    success: classification.success,
    criticalSuccess: classification.criticalSuccess,
    criticalFailure: classification.criticalFailure,
    createdAt: Date.now()
  };
}

export function rollSimple({ sides = 20, count = 1, bonus = 0, keep = 0, label = 'Rolagem livre' } = {}) {
  sides = Math.max(2, Math.trunc(Number(sides) || 20));
  count = Math.max(1, Math.min(20, Math.trunc(Number(count) || 1)));
  bonus = Number(bonus) || 0;
  const values = Array.from({length:count}, () => randomInt(sides));
  let used = [...values];
  if (keep > 0 && keep < used.length) used = [...used].sort((a,b)=>b-a).slice(0,keep);
  const total = used.reduce((a,b)=>a+b,0) + bonus;
  return { label, sides, count, bonus, keep, values, used, total, createdAt:Date.now() };
}
