import OBR from 'https://esm.unpkg.com/@owlbear-rodeo/sdk@3.1.0';
import {CHARACTERS,SKILL_ORDER,labelSkill,stepDie,defaultRuntimeState} from './characters.js';
import {rollOp2Test,rollSimple} from './roll.js';
import {CHAT_CHANNEL,ROOM_STATE_KEY,SHEET_SYNC_CHANNEL,RECENT_KEY,MAX_MESSAGE_LENGTH,escapeHtml,makeId,mergeEntries,relativeTime} from './chat-core.js';
import {normalizeRuntimeState} from './core-shared.js';

const $=s=>document.querySelector(s);
const state={role:'PLAYER',playerId:'preview',connectionId:'preview',roomState:defaultRuntimeState(),entries:[],historyParts:new Map(),selectedSides:20,count:1,testsOpen:false,manualExtras:[],attrStep:0,skillStep:0,testCharacterId:null,toastTimer:null};
const attrLabel=k=>k==='fisico'?'Físico':k==='mente'?'Mente':'Emoção';
const attrShort=k=>k==='fisico'?'FÍSICO':k==='mente'?'MENTE':'EMOÇÃO';
const dieImg=s=>`<span class="die-glyph" style="--die:url('./assets/dice/d${Number(s)}.svg')" aria-label="d${Number(s)}"></span>`;

function assignedId(){return Object.keys(CHARACTERS).find(id=>state.roomState.assignments?.[id]?.playerId===state.playerId)||null}
function currentCharacter(){const id=state.testCharacterId||assignedId();return id?CHARACTERS[id]:null}
function runtimeFor(c){return c?state.roomState.characters?.[c.id]:null}
function authorDisplay(){const c=assignedId()?CHARACTERS[assignedId()]:null;return c?.name||(state.role==='GM'?'Mestre':'Jogador')}
function getAccent(){const id=assignedId();return id?CHARACTERS[id].accent:(state.role==='GM'?'#ded6c8':'#c6442b')}
function setTheme(){const c=assignedId()?CHARACTERS[assignedId()]:null;document.documentElement.style.setProperty('--accent',getAccent());$('#identity').textContent=c?`${c.name} · ${c.profile}`:(state.role==='GM'?'MESTRE':'SEM FICHA')}
function toast(text){const el=$('#toast');el.textContent=text;el.classList.remove('hidden');clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>el.classList.add('hidden'),2800)}
function canDelete(e){return state.role==='GM'||e.authorId===state.playerId}
function resultState(r){if(r.criticalFailure)return['FALHA CRÍTICA','critical-failure'];if(r.criticalSuccess)return['SUCESSO CRÍTICO','critical-success'];if(r.success===false)return['FALHA','failure'];if(r.success===true)return['SUCESSO','success'];return['ROLAGEM','neutral']}

function resultCard(e){
  const r=e.result||{};const [status,cls]=resultState(r);const del=canDelete(e)?`<button class="delete" data-delete="${escapeHtml(e.id)}" title="Apagar">×</button>`:'';
  return `<article class="result-card ${cls}" style="--msg-accent:${e.accent||'#c6442b'}"><div class="result-head"><div><div class="result-author">${escapeHtml(e.authorName)}</div><div class="result-title">${escapeHtml(r.label||'Teste')}</div></div><div class="result-time">${relativeTime(e.createdAt)} ${del}</div></div><div class="result-dice">${(r.dice||[]).map(d=>`<div class="result-die"><div class="result-die-top">${dieImg(d.sides)}<span>${escapeHtml(d.source||`d${d.sides}`)}</span></div><strong>${d.value}</strong></div>`).join('')}</div><div class="result-main"><div class="result-total"><span>RESULTADO</span><strong>${r.total??0}</strong></div><div class="result-metric"><span>RA</span><strong>${r.ra??0}</strong></div><div class="result-metric"><span>RB</span><strong>${r.rb??0}</strong></div></div><div class="result-bottom"><span class="result-status">${status}</span><span class="result-dt">DT ${r.dt??'—'}</span></div>${(r.dice||[]).length>3?'<div class="result-note">Soma dos três maiores resultados.</div>':''}</article>`;
}

function simpleRollCard(e){
  const r=e.roll||{};const del=canDelete(e)?`<button class="delete" data-delete="${escapeHtml(e.id)}" title="Apagar">×</button>`:'';
  return `<article class="result-card neutral" style="--result-accent:${e.accent||'#c6442b'}"><div class="result-head"><div><div class="result-author">${escapeHtml(e.authorName)}</div><div class="result-title">${escapeHtml(r.label||'Rolagem livre')}</div></div><div class="result-time">${relativeTime(e.createdAt)} ${del}</div></div><div class="simple-roll-values">${(r.values||[]).map(v=>`<span class="simple-die">${dieImg(r.sides)}<b>${v}</b></span>`).join('')}</div><div><span class="result-dt">RESULTADO</span><div class="simple-total">${r.total??0}</div></div></article>`;
}

function renderFeed(){
  const feed=$('#feed');
  if(!state.entries.length){feed.innerHTML='<div class="empty-feed">A investigação ainda não começou.</div>';return}
  feed.innerHTML=state.entries.map(e=>{
    if(e.type==='message'){
      const del=canDelete(e)?`<button class="delete" data-delete="${escapeHtml(e.id)}" title="Apagar">×</button>`:'';
      return `<article class="message" style="--msg-accent:${e.accent||'#c6442b'}"><div class="message-head"><span class="author">${escapeHtml(e.authorName)}</span><span class="time">${relativeTime(e.createdAt)} ${del}</span></div><div class="message-text">${escapeHtml(e.text)}</div></article>`;
    }
    if(e.type==='simple-roll')return simpleRollCard(e);
    return resultCard(e);
  }).join('');
  feed.querySelectorAll('[data-delete]').forEach(btn=>btn.addEventListener('click',()=>deleteEntry(btn.dataset.delete)));
  feed.scrollTop=feed.scrollHeight;
}
function mergeAndRender(entries){state.entries=mergeEntries(state.entries,entries);renderFeed()}
function sendEntry(entry){mergeAndRender([entry]);if(OBR.isAvailable)OBR.broadcast.sendMessage(CHAT_CHANNEL,{type:'submit',entry},{destination:'ALL'}).catch(()=>toast('Não foi possível sincronizar a mensagem.'))}
function deleteEntry(id){state.entries=state.entries.filter(e=>e.id!==id);renderFeed();if(OBR.isAvailable)OBR.broadcast.sendMessage(CHAT_CHANNEL,{type:'delete',entryId:id},{destination:'ALL'}).catch(()=>{})}

function submitMessage(){
  const input=$('#message'),text=input.value.trim();if(!text)return;
  const command=text.match(/^\/r\s+(\d+)d(\d+)([+-]\d+)?$/i);
  if(command){const roll=rollSimple({count:Number(command[1]),sides:Number(command[2]),bonus:Number(command[3]||0),label:'Rolagem livre'});sendEntry({id:makeId(),type:'simple-roll',createdAt:Date.now(),authorId:state.playerId,authorName:authorDisplay(),accent:getAccent(),roll});input.value='';return}
  sendEntry({id:makeId(),type:'message',createdAt:Date.now(),authorId:state.playerId,authorName:authorDisplay(),accent:getAccent(),text:text.slice(0,MAX_MESSAGE_LENGTH)});input.value='';
}

function renderDiceTray(){
  const sides=[4,6,8,10,12,20];$('#diceButtons').innerHTML=sides.map(s=>`<button class="die-btn ${state.selectedSides===s?'active':''}" data-side="${s}">${dieImg(s)}<span>D${s}</span></button>`).join('');
  $('#diceButtons').querySelectorAll('[data-side]').forEach(btn=>btn.addEventListener('click',()=>{state.selectedSides=Number(btn.dataset.side);renderDiceTray()}));$('#countValue').textContent=state.count;
}
function freeRoll(){const bonus=Number($('#freeBonus').value||0);const roll=rollSimple({sides:state.selectedSides,count:state.count,bonus,label:`${state.count}d${state.selectedSides}${bonus?bonus>0?` + ${bonus}`:` - ${Math.abs(bonus)}`:''}`});sendEntry({id:makeId(),type:'simple-roll',createdAt:Date.now(),authorId:state.playerId,authorName:authorDisplay(),accent:getAccent(),roll})}
function setTestsOpen(open){state.testsOpen=open;$('#app').classList.toggle('tests-open',open);$('#testPanel').setAttribute('aria-hidden',String(!open));if(OBR.isAvailable)OBR.action.setWidth(open?980:450).catch(()=>{})}

function renderExtras(){
  $('#extraDice').innerHTML=[4,6,8,10,12,20].map(s=>`<button data-extra="${s}">${dieImg(s)}<span>+D${s}</span></button>`).join('');
  $('#extraDice').querySelectorAll('[data-extra]').forEach(btn=>btn.addEventListener('click',()=>{if(state.manualExtras.length>=2){toast('O teste pode ter no máximo 4 dados.');return}state.manualExtras.push(Number(btn.dataset.extra));renderExtras()}));
  $('#queuedExtras').innerHTML=state.manualExtras.length?state.manualExtras.map((s,i)=>`<span class="extra-chip">+D${s}<button data-remove-extra="${i}">×</button></span>`).join(''):'<span style="font-size:10px;color:#7d766d">Nenhum dado extra.</span>';
  $('#queuedExtras').querySelectorAll('[data-remove-extra]').forEach(btn=>btn.addEventListener('click',()=>{state.manualExtras.splice(Number(btn.dataset.removeExtra),1);renderExtras()}));
}

function renderTestPanel(){
  const assigned=assignedId();const toolbar=$('.test-toolbar'),extras=$('.extra-section');
  if(state.role==='GM'){
    toolbar.classList.remove('hidden');extras.classList.remove('hidden');$('#characterChooser').classList.remove('hidden');
    $('#characterChooser').innerHTML=`<select id="gmCharacter"><option value="">TESTE MANUAL</option>${Object.values(CHARACTERS).map(c=>`<option value="${c.id}">${c.name} · ${c.profile}</option>`).join('')}</select>`;
    $('#gmCharacter').value=state.testCharacterId||'';$('#gmCharacter').addEventListener('change',e=>{state.testCharacterId=e.target.value||null;renderTestPanel()});
  }else{
    $('#characterChooser').classList.add('hidden');state.testCharacterId=assigned;
    if(!assigned){toolbar.classList.add('hidden');extras.classList.add('hidden');$('#panelTitle').textContent='TESTES';$('#quickSheet').classList.remove('hidden');$('#quickSheet').innerHTML='<div class="no-assignment">O mestre ainda não atribuiu uma ficha a você.</div>';$('#manualTest').classList.add('hidden');return}
    toolbar.classList.remove('hidden');extras.classList.remove('hidden');
  }
  const c=currentCharacter();$('#panelTitle').textContent=c?`${c.name} · ${c.profile}`:'TESTE MANUAL';
  if(!c){$('#quickSheet').classList.add('hidden');$('#manualTest').classList.remove('hidden');renderManual();return}
  $('#manualTest').classList.add('hidden');$('#quickSheet').classList.remove('hidden');const rt=runtimeFor(c)||defaultRuntimeState().characters[c.id];
  const attrs=Object.entries(c.attributes).map(([k,v])=>{const sides=stepDie(v,rt.stepMods?.[k]||0);return `<div class="attr-card"><span>${attrLabel(k)}</span><strong>${dieImg(sides)}<b>${sides}</b></strong></div>`}).join('');
  const pending=(rt.pendingDice||[]).length?`<div class="pending-note">${(rt.pendingDice||[]).map(d=>`+D${d.sides} ${escapeHtml(d.source)}`).join(' · ')}</div>`:'';
  const rows=SKILL_ORDER.map(key=>{const sk=c.skills[key];const attr=sk.attribute;const attrSides=stepDie(c.attributes[attr],rt.stepMods?.[attr]||0);return `<div class="skill-row"><span class="skill-name">${escapeHtml(labelSkill(c,key))}</span><span class="q-die">${dieImg(sk.die)}<b>${sk.die}</b></span><span class="plus">+</span><span class="q-die">${dieImg(attrSides)}<b>${attrSides}</b></span><span class="q-attr">${attrShort(attr)}</span><button class="skill-roll" data-skill="${key}">ROLAR</button></div>`}).join('');
  $('#quickSheet').innerHTML=`<div class="quick-identity"><h2>${escapeHtml(c.name)}</h2><span>${escapeHtml(c.occupation)} · Nível ${c.level}</span></div><div class="attribute-grid">${attrs}</div>${pending}<div class="skill-table">${rows}</div>`;
  $('#quickSheet').querySelectorAll('[data-skill]').forEach(btn=>btn.addEventListener('click',()=>rollSkill(c,btn.dataset.skill)));
}

function renderManual(){const opts=[4,6,8,10,12,20].map(s=>`<option value="${s}">D${s}</option>`).join('');$('#manualTest').innerHTML=`<div class="manual-box"><h3>Teste manual</h3><div class="manual-pair"><label>DADO A<select id="manualA">${opts}</select></label><label>DADO B<select id="manualB">${opts}</select></label></div><button id="manualRoll" class="primary" style="height:36px;width:100%">ROLAR</button></div>`;$('#manualA').value='6';$('#manualB').value='6';$('#manualRoll').addEventListener('click',rollManual)}
function eligiblePending(c,attr){const rt=runtimeFor(c);return (rt?.pendingDice||[]).filter(d=>d.scope==='any'||d.scope===attr)}
function mutateSheet(operation){if(!OBR.isAvailable)return Promise.resolve();return OBR.broadcast.sendMessage(SHEET_SYNC_CHANNEL,{type:'mutation',requestId:makeId(),operation},{destination:'ALL'})}

async function rollSkill(c,key){
  const sk=c.skills[key],override=$('#attributeOverride').value,attr=override==='base'?sk.attribute:override,rt=runtimeFor(c)||defaultRuntimeState().characters[c.id];
  const attrSides=stepDie(c.attributes[attr],(rt.stepMods?.[attr]||0)+state.attrStep);const skillSides=stepDie(sk.die,state.skillStep);const pending=eligiblePending(c,attr);const extras=[];const usedPending=[];
  for(const d of pending){if(extras.length>=2)break;extras.push({sides:d.sides,source:d.source,kind:'bonus'});usedPending.push(d)}
  for(const s of state.manualExtras){if(extras.length>=2)break;extras.push({sides:s,source:`Extra d${s}`,kind:'bonus'})}
  const result=rollOp2Test({dice:[{sides:attrSides,source:attrLabel(attr),kind:'attribute'},{sides:skillSides,source:labelSkill(c,key),kind:'skill'},...extras],dt:Number($('#dtInput').value||7),label:`${labelSkill(c,key)} + ${attrLabel(attr)}`});
  sendEntry({id:makeId(),type:'test',createdAt:Date.now(),authorId:state.playerId,authorName:authorDisplay(),characterId:c.id,accent:c.accent,result});
  if(usedPending.length)mutateSheet({type:'consume-pending',characterId:c.id,ids:usedPending.map(d=>d.id)}).catch(()=>{});
  if(c.profile==='Executor'&&result.success===false&&(rt.impulse||0)<3)mutateSheet({type:'impulse-adjust',characterId:c.id,delta:1}).catch(()=>{});
  state.manualExtras=[];state.attrStep=0;state.skillStep=0;renderExtras();updateStepLabels();
}
function rollManual(){const a=stepDie(Number($('#manualA').value),state.attrStep),b=stepDie(Number($('#manualB').value),state.skillStep);const extras=state.manualExtras.slice(0,2).map(s=>({sides:s,source:`Extra d${s}`,kind:'bonus'}));const result=rollOp2Test({dice:[{sides:a,source:'Dado A',kind:'attribute'},{sides:b,source:'Dado B',kind:'skill'},...extras],dt:Number($('#dtInput').value||7),label:'Teste manual'});sendEntry({id:makeId(),type:'test',createdAt:Date.now(),authorId:state.playerId,authorName:authorDisplay(),accent:getAccent(),result});state.manualExtras=[];state.attrStep=0;state.skillStep=0;renderExtras();updateStepLabels()}
function updateStepLabels(){$('#attrStep').textContent=state.attrStep>0?`+${state.attrStep}`:state.attrStep;$('#skillStep').textContent=state.skillStep>0?`+${state.skillStep}`:state.skillStep}
async function requestHistory(){const requestId=makeId();state.historyParts.set(requestId,{parts:[],total:null});await OBR.broadcast.sendMessage(CHAT_CHANNEL,{type:'request-history',requestId},{destination:'ALL'}).catch(()=>{})}
function onChatEvent(event){const d=event.data||{};if(d.type==='persisted-entry'&&d.entry){mergeAndRender([d.entry]);return}if(d.type==='deleted'&&d.entryId){state.entries=state.entries.filter(e=>e.id!==d.entryId);renderFeed();return}if(d.type==='history-part'&&d.targetConnectionId===state.connectionId){let bag=state.historyParts.get(d.requestId);if(!bag){bag={parts:[],total:d.total};state.historyParts.set(d.requestId,bag)}bag.total=d.total;bag.parts[d.index]=d.entries||[];if(bag.parts.filter(Boolean).length===bag.total){mergeAndRender(bag.parts.flat());state.historyParts.delete(d.requestId)}}}

async function setup(){
  renderDiceTray();renderExtras();updateStepLabels();renderTestPanel();renderFeed();
  $('#message').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submitMessage()}});$('#freeRoll').addEventListener('click',freeRoll);$('#countMinus').addEventListener('click',()=>{state.count=Math.max(1,state.count-1);renderDiceTray()});$('#countPlus').addEventListener('click',()=>{state.count=Math.min(12,state.count+1);renderDiceTray()});$('#testToggle').addEventListener('click',()=>setTestsOpen(!state.testsOpen));$('#testClose').addEventListener('click',()=>setTestsOpen(false));
  document.querySelectorAll('[data-step]').forEach(btn=>btn.addEventListener('click',()=>{const delta=Number(btn.dataset.delta);if(btn.dataset.step==='attr')state.attrStep=Math.max(-4,Math.min(4,state.attrStep+delta));else state.skillStep=Math.max(-4,Math.min(4,state.skillStep+delta));updateStepLabels()}));
  if(!OBR.isAvailable){$('#loading').classList.add('hidden');setTheme();return}
  await new Promise(r=>OBR.onReady(r));[state.role,state.connectionId]=await Promise.all([OBR.player.getRole(),OBR.player.getConnectionId()]);state.playerId=OBR.player.id;
  const meta=await OBR.room.getMetadata();state.roomState=normalizeRuntimeState(meta[ROOM_STATE_KEY]);if(Array.isArray(meta[RECENT_KEY]?.entries))mergeAndRender(meta[RECENT_KEY].entries);
  setTheme();renderTestPanel();OBR.broadcast.onMessage(CHAT_CHANNEL,onChatEvent);OBR.room.onMetadataChange(meta=>{if(meta[ROOM_STATE_KEY]){state.roomState=normalizeRuntimeState(meta[ROOM_STATE_KEY]);setTheme();renderTestPanel()}if(Array.isArray(meta[RECENT_KEY]?.entries))mergeAndRender(meta[RECENT_KEY].entries)});await OBR.action.setWidth(450).catch(()=>{});await requestHistory();$('#loading').classList.add('hidden');
}
setup().catch(e=>{console.error(e);$('#loading').textContent=`ERRO · ${e.message||e}`});
