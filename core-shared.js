import { CHARACTERS, defaultRuntimeState } from './characters.js';

export const ID = 'com.op2.playtest.fichas';
export const ROOM_STATE_KEY = 'com.op2.playtest/state-v1';
export const SYNC_CHANNEL = 'com.op2.playtest.fichas/sync-v1';
export const CHAT_CHANNEL = 'com.op2.playtest.chat/channel-v1';
export const SHEET_MODAL_ID = `${ID}/sheet`;

export function clamp(n, min, max) {
  n = Number(n);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function normalizePendingDie(x) {
  return {
    id: String(x?.id || crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`),
    sides: Math.max(4, Number(x?.sides) || 4),
    scope: String(x?.scope || 'any'),
    source: String(x?.source || 'Bônus'),
    effectKey: String(x?.effectKey || ''),
    oneShot: x?.oneShot !== false
  };
}

export function normalizeRuntimeState(raw) {
  const base = defaultRuntimeState();
  if (!raw || typeof raw !== 'object') return base;
  base.v = 2;
  if (raw.assignments && typeof raw.assignments === 'object') {
    for (const id of Object.keys(CHARACTERS)) {
      const a = raw.assignments[id];
      if (a?.playerId) base.assignments[id] = { playerId: String(a.playerId), playerName: String(a.playerName || 'Jogador') };
    }
  }
  for (const [id, character] of Object.entries(CHARACTERS)) {
    const incoming = raw.characters?.[id] || {};
    const target = base.characters[id];
    target.pv = clamp(incoming.pv ?? target.pv, 0, character.maxPV);
    target.pd = clamp(incoming.pd ?? target.pd, 0, character.maxPD);
    target.impulse = clamp(Math.trunc(incoming.impulse ?? 0), 0, 3);
    target.evaluationDice = clamp(Math.trunc(incoming.evaluationDice ?? 0), 0, 2);
    target.readiness = Boolean(incoming.readiness);
    target.pendingDice = Array.isArray(incoming.pendingDice)
      ? incoming.pendingDice.slice(-4).map(normalizePendingDie)
      : [];
    // Recovery: remove accidental duplicate one-shot effects from older builds.
    const unique = [];
    const seenOneShot = new Set();
    for (const die of target.pendingDice) {
      const key = die.effectKey || ((die.source === 'Foco Mental' || die.source === 'Foco Emocional') ? `${die.source}:${die.scope}` : '');
      if (key && die.oneShot) {
        if (seenOneShot.has(key)) continue;
        seenOneShot.add(key);
        die.effectKey = key;
      }
      unique.push(die);
    }
    target.pendingDice = unique.slice(-4);
    target.stepMods = { fisico:0, mente:0, emocao:0 };
    for (const key of Object.keys(target.stepMods)) target.stepMods[key] = clamp(Math.trunc(incoming.stepMods?.[key] ?? 0), -4, 4);
    target.updatedAt = Number(incoming.updatedAt || Date.now());
  }
  return base;
}

export function encodeSize(value) { return new TextEncoder().encode(JSON.stringify(value)).length; }
export function validateStateSize(state) { const bytes = encodeSize(state); return { bytes, ok: bytes < 14500 }; }
export function assignedCharacterId(state, playerId) { return Object.keys(CHARACTERS).find(id => state.assignments?.[id]?.playerId === playerId) || null; }
export function isAuthorized(state, characterId, playerId, role) { return role === 'GM' || state.assignments?.[characterId]?.playerId === playerId; }

export function makeBonusDie(source, scope='any', options={}) {
  return {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    sides: Math.max(4, Number(options.sides) || 4),
    scope,
    source,
    effectKey: String(options.effectKey || ''),
    oneShot: options.oneShot !== false
  };
}

function hasPending(runtime, effectKey) {
  return Boolean(effectKey && runtime.pendingDice.some(d => d.effectKey === effectKey));
}

export function applyOperation(stateInput, operation, sender) {
  const state = normalizeRuntimeState(stateInput);
  const id = String(operation?.characterId || '');
  const runtime = state.characters[id];
  const character = CHARACTERS[id];
  if (!runtime || !character) throw new Error('Personagem inválido.');
  if (!isAuthorized(state, id, sender.playerId, sender.role)) throw new Error('Sem permissão para alterar esta ficha.');

  switch (operation.type) {
    case 'resource':
      if (operation.pv !== undefined) runtime.pv = clamp(operation.pv, 0, character.maxPV);
      if (operation.pd !== undefined) runtime.pd = clamp(operation.pd, 0, character.maxPD);
      break;
    case 'adjust-resource':
      if (operation.resource === 'pv') runtime.pv = clamp(runtime.pv + Number(operation.delta || 0), 0, character.maxPV);
      if (operation.resource === 'pd') runtime.pd = clamp(runtime.pd + Number(operation.delta || 0), 0, character.maxPD);
      break;
    case 'impulse-set': runtime.impulse = clamp(Math.trunc(operation.value), 0, 3); break;
    case 'impulse-adjust': runtime.impulse = clamp(runtime.impulse + Math.trunc(operation.delta || 0), 0, 3); break;
    case 'queue-die':
      runtime.pendingDice = [...runtime.pendingDice, makeBonusDie(String(operation.source || 'Bônus'), String(operation.scope || 'any'), {effectKey:String(operation.effectKey||''), sides:Number(operation.sides)||4})].slice(-4);
      break;
    case 'consume-pending': {
      const ids = new Set(Array.isArray(operation.ids) ? operation.ids.map(String) : []);
      runtime.pendingDice = runtime.pendingDice.filter(d => !ids.has(d.id));
      break;
    }
    case 'evaluation-set': runtime.evaluationDice = clamp(Math.trunc(operation.value), 0, 2); break;
    case 'evaluation-use': {
      const count = clamp(Math.trunc(operation.count || 1), 1, 2);
      if (runtime.evaluationDice < count) throw new Error('Dados de Avaliação insuficientes.');
      runtime.evaluationDice -= count;
      for (let i=0;i<count;i++) runtime.pendingDice.push(makeBonusDie('Avaliação', 'any', {effectKey:`evaluation-${Date.now()}-${i}`}));
      runtime.pendingDice = runtime.pendingDice.slice(-4);
      break;
    }
    case 'step-mod': {
      const attr = String(operation.attribute || '');
      if (!(attr in runtime.stepMods)) throw new Error('Atributo inválido.');
      runtime.stepMods[attr] = clamp(runtime.stepMods[attr] + Math.trunc(operation.delta || 0), -4, 4);
      break;
    }
    case 'step-reset': runtime.stepMods = { fisico:0, mente:0, emocao:0 }; break;
    case 'ability-focus': {
      const scope = String(operation.scope || 'any');
      const source = String(operation.source || 'Foco');
      const effectKey = `focus:${scope}`;
      if (hasPending(runtime, effectKey)) throw new Error(`${source} já está preparado.`);
      if (runtime.pd < 2) throw new Error('PD insuficiente.');
      runtime.pd -= 2;
      runtime.pendingDice = [...runtime.pendingDice, makeBonusDie(source, scope, {effectKey})].slice(-4);
      break;
    }
    case 'ability-evaluation':
      if (runtime.pd < 2) throw new Error('PD insuficiente.');
      if (runtime.evaluationDice > 0 || runtime.pendingDice.some(d => d.source === 'Avaliação')) throw new Error('Avaliação já está ativa.');
      runtime.pd -= 2;
      runtime.evaluationDice = 2;
      break;
    case 'ability-readiness':
      if (runtime.readiness) throw new Error('Prontidão já está ativa.');
      if (runtime.pd < 3) throw new Error('PD insuficiente.');
      runtime.pd -= 3;
      runtime.readiness = true;
      break;
    case 'impulse-spend-one':
      if (runtime.impulse < 1) throw new Error('Ímpeto insuficiente.');
      runtime.impulse -= 1;
      runtime.pendingDice = [...runtime.pendingDice, makeBonusDie('Ímpeto', 'any', {effectKey:`impulse-${Date.now()}`})].slice(-4);
      break;
    case 'impulse-spend-three': {
      const attr = String(operation.attribute || '');
      if (!(attr in runtime.stepMods)) throw new Error('Atributo inválido.');
      if (runtime.impulse < 3) throw new Error('Ímpeto insuficiente.');
      runtime.impulse -= 3;
      runtime.stepMods[attr] = clamp(runtime.stepMods[attr] + 1, -4, 4);
      break;
    }
    case 'readiness-set': runtime.readiness = Boolean(operation.value); break;
    default: throw new Error('Operação desconhecida.');
  }

  runtime.updatedAt = Date.now();
  const size = validateStateSize(state);
  if (!size.ok) throw new Error(`Estado das fichas excederia ${(size.bytes/1024).toFixed(1)} KB.`);
  return state;
}
