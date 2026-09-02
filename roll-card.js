function escapeHtml(value='') {
  return String(value)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

function relativeTime(ts) {
  const s=Math.max(0,Math.floor((Date.now()-Number(ts||0))/1000));
  if(s<15)return'agora';
  if(s<60)return`${s}s`;
  const m=Math.floor(s/60);if(m<60)return`${m}min`;
  const h=Math.floor(m/60);if(h<24)return`${h}h`;
  return new Date(ts).toLocaleDateString('pt-BR');
}

function dieImg(sides) {
  return `<img class="die-asset" src="./assets/dice/d${Number(sides)}.png" alt="d${Number(sides)}" />`;
}

export function resultState(result={}) {
  if(result.criticalFailure)return['FALHA CRÍTICA','critical-failure'];
  if(result.criticalSuccess)return['SUCESSO CRÍTICO','critical-success'];
  const hasDt=Number.isFinite(Number(result.dt))&&Number(result.dt)>0;
  if(hasDt&&result.success===false)return['FALHA','failure'];
  if(hasDt&&result.success===true)return['SUCESSO','success'];
  return['','neutral'];
}

export function renderResultCard({result={},authorName='Jogador',accent='#c6442b',createdAt=null,actionHtml='' }={}) {
  const [status,cls]=resultState(result);
  const dice=Array.isArray(result.dice)?result.dice:[];
  const notes=[];
  if(dice.length>3)notes.push('OS TRÊS MAIORES RESULTADOS FORAM SOMADOS.');
  if(Number(result.bonus))notes.push(`BÔNUS ${Number(result.bonus)>0?'+':''}${Number(result.bonus)}`);
  return `<article class="result-card ${cls}" style="--msg-accent:${escapeHtml(accent)}"><div class="result-head"><div><div class="result-author">${escapeHtml(authorName)}</div><div class="result-title">${escapeHtml(result.label||'Teste')}</div></div><div class="result-time"><span>${relativeTime(createdAt??result.createdAt??Date.now())}</span>${actionHtml}</div></div><div class="result-dice">${dice.map(d=>`<div class="result-die"><span class="result-die-source">${escapeHtml(d.source||`d${d.sides}`)}</span><div class="result-die-value">${dieImg(d.sides)}<strong>${Number(d.value)||0}</strong></div></div>`).join('')}</div><div class="result-summary ${status?'':'no-status'}"><div class="result-total"><span>RESULTADO</span><strong>${Number(result.total)||0}</strong></div>${status?`<span class="result-status">${status}</span>`:''}</div>${notes.length?`<div class="result-note">${notes.join(' · ')}</div>`:''}</article>`;
}
