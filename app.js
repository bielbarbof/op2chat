import OBR from 'https://esm.unpkg.com/@owlbear-rodeo/sdk@3.1.0';
import {CHARACTERS,defaultRuntimeState} from './characters.js';
import {rollOp2Test,rollSimple} from './roll.js';
import {renderResultCard} from './roll-card.js';
import {CHAT_CHANNEL,ROOM_STATE_KEY,RECENT_KEY,MAX_MESSAGE_LENGTH,escapeHtml,makeId,mergeEntries,relativeTime} from './chat-core.js';
import {normalizeRuntimeState,SYNC_CHANNEL} from './core-shared.js';
import {closeChatPanel,syncChatPanelSize} from './panel.js';

const $=s=>document.querySelector(s);
const SHEETS_BASE_URL='https://op2fichas.onrender.com';
const GM_ACCENT='#7757c8';
const GM_ROSTER_MODAL='com.op2.playtest.chat/open-fichas';
const SHEET_MODAL='com.op2.playtest.fichas/sheet';
const DIE_SIDES=[4,6,8,10,12,20];
const IS_PANEL=new URLSearchParams(location.search).get('surface')==='panel';
document.documentElement.dataset.surface=IS_PANEL?'panel':'standalone';
const state={role:'PLAYER',playerId:'preview',connectionId:'preview',roomState:defaultRuntimeState(),entries:[],historyParts:new Map(),pool:[],toastTimer:null,dtQueue:Promise.resolve(),pendingSharedMutations:new Map(),historyRequested:false};
const dieImg=s=>`<img class="die-asset" src="./assets/dice/d${Number(s)}.png" alt="d${Number(s)}" />`;

function assignedId(){return Object.keys(CHARACTERS).find(id=>state.roomState.assignments?.[id]?.playerId===state.playerId)||null}
function assignedCharacter(){const id=assignedId();return id?CHARACTERS[id]:null}
function authorDisplay(){const c=assignedCharacter();return c?.name||(state.role==='GM'?'Mestre':'Jogador')}
function getAccent(){return assignedCharacter()?.accent||(state.role==='GM'?GM_ACCENT:'#c6442b')}
function renderDtControl(){
  const wrapper=$('#dtControl'),input=$('#dtInput');
  const gm=state.role==='GM';wrapper.classList.toggle('hidden',!gm);
  if(!gm)return;
  if(document.activeElement!==input)input.value=state.roomState.testDt??'';
  wrapper.classList.toggle('active',Number.isFinite(Number(state.roomState.testDt))&&Number(state.roomState.testDt)>0);
}
function setTheme(){
  const c=assignedCharacter(),accent=getAccent();
  document.documentElement.style.setProperty('--accent',accent);
  document.documentElement.dataset.role=state.role==='GM'?'gm':'player';
  const identity=$('#identity');identity.textContent=c?c.profile:(state.role==='GM'?'MESTRE':'SEM FICHA');identity.style.setProperty('--profile-accent',c?.accent||(state.role==='GM'?GM_ACCENT:'#5f5a53'));
  $('#clearHistory')?.classList.toggle('hidden',state.role!=='GM');
  $('#openSheet').textContent=state.role==='GM'?'PERSONAGENS':'ABRIR FICHA';
  $('#closePanel')?.classList.toggle('hidden',!IS_PANEL);
  renderDtControl();
}
function toast(text){const el=$('#toast');el.textContent=text;el.classList.remove('hidden');clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>el.classList.add('hidden'),2800)}
function canDelete(e){return state.role==='GM'||e.authorId===state.playerId}

function resultCard(e){
  const action=canDelete(e)?`<button class="delete" data-delete="${escapeHtml(e.id)}" title="Apagar" aria-label="Apagar rolagem">×</button>`:'';
  return renderResultCard({result:e.result||{},authorName:e.authorName,accent:e.accent||'#c6442b',createdAt:e.createdAt,actionHtml:action});
}
function simpleRollCard(e){const r=e.roll||{};const del=canDelete(e)?`<button class="delete" data-delete="${escapeHtml(e.id)}" title="Apagar">×</button>`:'';return `<article class="result-card neutral" style="--msg-accent:${e.accent||'#c6442b'}"><div class="result-head"><div><div class="result-author">${escapeHtml(e.authorName)}</div><div class="result-title">${escapeHtml(r.label||'Rolagem livre')}</div></div><div class="result-time"><span>${relativeTime(e.createdAt)}</span>${del}</div></div><div class="simple-roll-values">${(r.values||[]).map(v=>`<span class="simple-die">${dieImg(r.sides)}<strong>${v}</strong></span>`).join('')}</div><div class="free-result"><span>RESULTADO</span><strong>${r.total??0}</strong></div></article>`}
function renderFeed(){const feed=$('#feed');if(!state.entries.length){feed.innerHTML='<div class="empty-feed">A investigação ainda não começou.</div>';return}feed.innerHTML=state.entries.map(e=>{if(e.type==='message'){const del=canDelete(e)?`<button class="delete" data-delete="${escapeHtml(e.id)}" title="Apagar">×</button>`:'';return `<article class="message" style="--msg-accent:${e.accent||'#c6442b'}"><div class="message-head"><span class="author">${escapeHtml(e.authorName)}</span><span class="time"><span>${relativeTime(e.createdAt)}</span>${del}</span></div><div class="message-text">${escapeHtml(e.text)}</div></article>`}if(e.type==='simple-roll')return simpleRollCard(e);return resultCard(e)}).join('');feed.querySelectorAll('[data-delete]').forEach(btn=>btn.addEventListener('click',()=>deleteEntry(btn.dataset.delete)));feed.scrollTop=feed.scrollHeight}
function mergeAndRender(entries){state.entries=mergeEntries(state.entries,entries);renderFeed()}
function sendEntry(entry){mergeAndRender([entry]);if(OBR.isAvailable)OBR.broadcast.sendMessage(CHAT_CHANNEL,{type:'submit',entry},{destination:'ALL'}).catch(()=>toast('Não foi possível sincronizar a mensagem.'))}
function deleteEntry(id){state.entries=state.entries.filter(e=>e.id!==id);renderFeed();if(OBR.isAvailable)OBR.broadcast.sendMessage(CHAT_CHANNEL,{type:'delete',entryId:id},{destination:'ALL'}).catch(()=>{})}
function updateComposerState(){const input=$('#message'),button=$('#sendMessage');if(!input||!button)return;button.disabled=input.value.trim().length===0}
function submitMessage({allowRollCommand=true}={}){const input=$('#message'),text=input.value.trim();if(!text){updateComposerState();return}const command=allowRollCommand?text.match(/^\/r\s+(\d+)d(\d+)([+-]\d+)?$/i):null;if(command){const count=Math.max(1,Math.min(12,Number(command[1])||1)),sides=Number(command[2]),bonus=Number(command[3]||0);if(DIE_SIDES.includes(sides)){const roll=rollSimple({count,sides,bonus,label:'Rolagem livre'});sendEntry({id:makeId(),type:'simple-roll',createdAt:Date.now(),authorId:state.playerId,authorName:authorDisplay(),accent:getAccent(),roll});input.value='';updateComposerState();return}}sendEntry({id:makeId(),type:'message',createdAt:Date.now(),authorId:state.playerId,authorName:authorDisplay(),accent:getAccent(),text:text.slice(0,MAX_MESSAGE_LENGTH)});input.value='';updateComposerState()}

function poolCounts(){const counts=new Map(DIE_SIDES.map(s=>[s,0]));for(const s of state.pool)counts.set(s,(counts.get(s)||0)+1);return counts}
function poolLabel(){const counts=poolCounts();const parts=DIE_SIDES.filter(s=>counts.get(s)>0).map(s=>`${counts.get(s)>1?counts.get(s):''}d${s}`);return parts.length?parts.join(' + '):'SELECIONE ATÉ 4 DADOS'}
function addDie(sides){if(state.pool.length>=4){toast('UM TESTE PODE TER NO MÁXIMO 4 DADOS.');return}state.pool.push(Number(sides));renderDiceTray()}
function removeDie(sides){const index=state.pool.lastIndexOf(Number(sides));if(index>=0){state.pool.splice(index,1);renderDiceTray()}}
function renderDiceTray(){
  const counts=poolCounts();
  $('#diceButtons').innerHTML=DIE_SIDES.map(s=>`<div class="die-option ${counts.get(s)?'selected':''}"><button class="die-btn ${counts.get(s)?'active':''}" data-add-side="${s}" aria-label="Adicionar d${s}; selecionados ${counts.get(s)}" title="Adicionar D${s}">${dieImg(s)}${counts.get(s)?`<span class="die-count">×${counts.get(s)}</span>`:''}</button>${counts.get(s)?`<button class="die-remove" data-remove-side="${s}" aria-label="Remover um d${s}" title="Remover um d${s}">−</button>`:''}</div>`).join('');
  $('#diceButtons').querySelectorAll('[data-add-side]').forEach(btn=>btn.addEventListener('click',()=>addDie(btn.dataset.addSide)));
  $('#diceButtons').querySelectorAll('[data-remove-side]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();removeDie(btn.dataset.removeSide)}));
  $('#poolSummary').textContent=poolLabel();
  $('#clearPool').disabled=state.pool.length===0;
  $('#freeRoll').disabled=state.pool.length===0;
}
async function applyExecutorFailure(result){
  const c=assignedCharacter();
  if(!c||c.profile!=='Executor'||result.success!==false||!OBR.isAvailable)return;
  const requestId=makeId();
  await OBR.broadcast.sendMessage(SYNC_CHANNEL,{type:'mutation',requestId,senderPlayerId:state.playerId,operation:{type:'resolve-roll',characterId:c.id,consumedIds:[],failed:true}},{destination:'ALL'}).catch(()=>{});
}
function freeRoll(){
  if(!state.pool.length){toast('SELECIONE PELO MENOS UM DADO.');return}
  const bonus=Number($('#freeBonus').value||0);
  const dice=state.pool.slice(0,4).map(s=>({sides:s,source:`d${s}`,kind:'free'}));
  const result=rollOp2Test({dice,dt:state.roomState.testDt,bonus,label:poolLabel()});
  const entry={id:makeId(),type:'test',createdAt:Date.now(),authorId:state.playerId,authorName:authorDisplay(),characterId:assignedId(),accent:getAccent(),result};
  sendEntry(entry);applyExecutorFailure(result);
}


function onSharedSync(event){
  const d=event.data||{};if(d.type!=='mutation-result'||!d.requestId)return;
  const pending=state.pendingSharedMutations.get(d.requestId);if(!pending)return;
  clearTimeout(pending.timer);state.pendingSharedMutations.delete(d.requestId);
  if(d.ok&&d.state){state.roomState=normalizeRuntimeState(d.state);setTheme();pending.resolve(state.roomState);return}
  pending.reject(new Error(d.error||'Não foi possível atualizar o estado compartilhado.'));
}
function requestSharedMutation(operation,timeoutMs=1200){
  const requestId=makeId();
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{state.pendingSharedMutations.delete(requestId);reject(new Error('Sem confirmação da extensão de Fichas.'))},timeoutMs);
    state.pendingSharedMutations.set(requestId,{resolve,reject,timer});
    OBR.broadcast.sendMessage(SYNC_CHANNEL,{type:'mutation',requestId,senderPlayerId:state.playerId,operation},{destination:'ALL'}).catch(error=>{clearTimeout(timer);state.pendingSharedMutations.delete(requestId);reject(error)});
  });
}

async function setRoomDt(raw){
  if(state.role!=='GM')return;
  const numeric=Number(raw);const value=Number.isFinite(numeric)&&numeric>0?Math.trunc(numeric):null;
  const execute=async()=>{
    if(!OBR.isAvailable){state.roomState.testDt=value;renderDtControl();return}
    try{return await requestSharedMutation({type:'dt-set',value})}
    catch{
      const meta=await OBR.room.getMetadata();const next=normalizeRuntimeState(meta[ROOM_STATE_KEY]);next.testDt=value;next.v=Math.max(3,Number(next.v)||3);await OBR.room.setMetadata({[ROOM_STATE_KEY]:next});state.roomState=normalizeRuntimeState(next);renderDtControl();return state.roomState;
    }
  };
  const queued=state.dtQueue.then(execute,execute);state.dtQueue=queued.catch(()=>{});return queued;
}
async function commitDt(){const input=$('#dtInput');await setRoomDt(input.value);input.value=state.roomState.testDt??''}

async function openSheet(){
  const id=assignedId();
  if(!OBR.isAvailable){location.href=id?`${SHEETS_BASE_URL}/sheet.html?id=${id}&from=chat`:`${SHEETS_BASE_URL}/?from=chat`;return}
  try{
    if(state.role==='GM'){await OBR.modal.open({id:GM_ROSTER_MODAL,url:`${SHEETS_BASE_URL}/?from=chat&modalId=${encodeURIComponent(GM_ROSTER_MODAL)}`,fullScreen:true});return}
    if(!id){toast('O mestre ainda não atribuiu uma ficha a você.');return}
    await OBR.modal.open({id:SHEET_MODAL,url:`${SHEETS_BASE_URL}/sheet.html?id=${encodeURIComponent(id)}&from=chat`,fullScreen:true});
  }catch(e){console.error(e);toast('Não foi possível abrir a ficha.')}
}
async function clearHistory(){if(state.role!=='GM')return;const ok=confirm('Limpar todo o histórico do Chat? Mensagens e rolagens serão apagadas para todos os jogadores.');if(!ok)return;if(!OBR.isAvailable){state.entries=[];renderFeed();toast('Histórico limpo.');return}try{await OBR.broadcast.sendMessage(CHAT_CHANNEL,{type:'clear-history'},{destination:'ALL'});}catch(e){console.error(e);toast('Não foi possível limpar o histórico.')}}
async function requestHistory(){if(state.historyRequested)return;state.historyRequested=true;const requestId=makeId();state.historyParts.set(requestId,{parts:[],total:null});await OBR.broadcast.sendMessage(CHAT_CHANNEL,{type:'request-history',requestId},{destination:'ALL'}).catch(()=>{state.historyRequested=false;state.historyParts.delete(requestId)})}
function onChatEvent(event){const d=event.data||{};if(d.type==='persisted-entry'&&d.entry){mergeAndRender([d.entry]);return}if(d.type==='deleted'&&d.entryId){state.entries=state.entries.filter(e=>e.id!==d.entryId);renderFeed();return}if(d.type==='history-cleared'){state.entries=[];state.historyParts.clear();renderFeed();toast('Histórico limpo.');return}if(d.type==='history-part'&&d.targetConnectionId===state.connectionId){let bag=state.historyParts.get(d.requestId);if(!bag){bag={parts:[],total:d.total};state.historyParts.set(d.requestId,bag)}bag.total=d.total;bag.parts[d.index]=d.entries||[];if(bag.parts.filter(Boolean).length===bag.total){mergeAndRender(bag.parts.flat());state.historyParts.delete(d.requestId)}}}
async function setup(){
  renderDiceTray();renderFeed();updateComposerState();
  $('#message').addEventListener('input',updateComposerState);
  $('#message').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submitMessage({allowRollCommand:true})}});
  $('#sendMessage').addEventListener('click',()=>submitMessage({allowRollCommand:false}));
  $('#freeRoll').addEventListener('click',freeRoll);$('#clearPool').addEventListener('click',()=>{state.pool=[];renderDiceTray()});
  $('#openSheet').addEventListener('click',openSheet);$('#clearHistory').addEventListener('click',clearHistory);$('#closePanel').addEventListener('click',()=>closeChatPanel());
  $('#dtInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();commitDt();e.currentTarget.blur()}if(e.key==='Escape'){e.currentTarget.value=state.roomState.testDt??'';e.currentTarget.blur()}});
  $('#dtInput').addEventListener('blur',commitDt);$('#clearDt').addEventListener('click',()=>{setRoomDt(null);$('#dtInput').value=''});
  if(!OBR.isAvailable){$('#loading').classList.add('hidden');state.role='GM';setTheme();return}

  await new Promise(r=>OBR.onReady(r));
  const [nextRole,nextConnectionId,meta]=await Promise.all([
    OBR.player.getRole(),
    OBR.player.getConnectionId(),
    OBR.room.getMetadata(),
  ]);
  state.role=nextRole;
  state.connectionId=nextConnectionId;
  state.playerId=OBR.player.id;
  state.roomState=normalizeRuntimeState(meta[ROOM_STATE_KEY]);
  if(Array.isArray(meta[RECENT_KEY]?.entries))mergeAndRender(meta[RECENT_KEY].entries);
  setTheme();

  OBR.broadcast.onMessage(CHAT_CHANNEL,onChatEvent);
  OBR.broadcast.onMessage(SYNC_CHANNEL,onSharedSync);
  OBR.room.onMetadataChange(nextMeta=>{
    if(nextMeta[ROOM_STATE_KEY]){state.roomState=normalizeRuntimeState(nextMeta[ROOM_STATE_KEY]);setTheme()}
    if(Array.isArray(nextMeta[RECENT_KEY]?.entries)){
      if(nextMeta[RECENT_KEY].entries.length===0&&state.entries.length){state.entries=[];renderFeed()}
      else mergeAndRender(nextMeta[RECENT_KEY].entries)
    }
  });

  $('#loading').classList.add('hidden');

  if(IS_PANEL){
    let resizeTimer=null;
    const panelIsVisible=()=>window.innerWidth>4&&window.innerHeight>4;
    const resync=()=>{
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(()=>{
        if(!panelIsVisible())return;
        void requestHistory();
        void syncChatPanelSize();
      },80);
    };
    window.addEventListener('resize',resync,{passive:true});
    if(panelIsVisible())void requestHistory();
  }else{
    void requestHistory();
  }
}
setup().catch(e=>{console.error(e);$('#loading').textContent=`ERRO · ${e.message||e}`});
