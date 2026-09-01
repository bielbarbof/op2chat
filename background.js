import OBR,{buildText} from 'https://esm.unpkg.com/@owlbear-rodeo/sdk@3.1.0';
import {CHARACTERS} from './characters.js';
import {CHAT_CHANNEL,ROOM_STATE_KEY,RECENT_KEY,CHUNK_KEY,MAX_MESSAGE_LENGTH,mergeEntries,chunkEntries,makeId,bytes} from './chat-core.js';

let role='PLAYER',playerId='',connectionId='',roomId='',cachedHistory=[],writeQueue=Promise.resolve();

async function resolveSender(event){
  if(event.connectionId===connectionId){return{ id:playerId, role, name:await OBR.player.getName(), color:await OBR.player.getColor() }}
  const party=await OBR.party.getPlayers();const p=party.find(x=>x.connectionId===event.connectionId);return p?{id:p.id,role:p.role,name:p.name,color:p.color}:null;
}

async function assignedCharacter(senderId){
  const meta=await OBR.room.getMetadata();const roomState=meta[ROOM_STATE_KEY];
  if(!roomState?.assignments)return null;
  const id=Object.keys(CHARACTERS).find(cid=>roomState.assignments[cid]?.playerId===senderId);
  return id?CHARACTERS[id]:null;
}

function cleanEntry(raw,sender,character){
  const type=raw?.type==='test'||raw?.type==='simple-roll'?'roll':'message';
  const base={id:String(raw?.id||makeId()),createdAt:Number(raw?.createdAt||Date.now()),authorId:sender.id,
    authorName:character?.name || (sender.role==='GM'?'Mestre':sender.name||'Jogador'),
    characterId:character?.id||null,accent:character?.accent||sender.color||'#c8c1b5'};
  if(type==='message') return {...base,type:'message',text:String(raw?.text||'').slice(0,MAX_MESSAGE_LENGTH)};
  if(raw?.type==='simple-roll') return {...base,type:'simple-roll',roll:raw.roll||{}};
  return {...base,type:'test',result:raw?.result||{}};
}

async function sceneReady(){try{return await OBR.scene.isReady()}catch{return false}}

async function loadSceneHistory(){
  if(!(await sceneReady()))return[];
  const items=await OBR.scene.items.getItems(i=>Boolean(i.metadata?.[CHUNK_KEY]?.roomId===roomId));
  return items.sort((a,b)=>(a.metadata[CHUNK_KEY].index||0)-(b.metadata[CHUNK_KEY].index||0)).flatMap(i=>Array.isArray(i.metadata[CHUNK_KEY].entries)?i.metadata[CHUNK_KEY].entries:[]);
}

async function writeSceneHistory(entries){
  if(!(await sceneReady()))return;
  const chunks=chunkEntries(entries,8500);
  const existing=await OBR.scene.items.getItems(i=>Boolean(i.metadata?.[CHUNK_KEY]?.roomId===roomId));
  existing.sort((a,b)=>(a.metadata[CHUNK_KEY].index||0)-(b.metadata[CHUNK_KEY].index||0));
  const shared=Math.min(existing.length,chunks.length);
  for(let i=0;i<shared;i++){
    const id=existing[i].id;const data={v:1,roomId,index:i,entries:chunks[i],updatedAt:Date.now()};
    await OBR.scene.items.updateItems([id],items=>{for(const item of items){item.metadata=item.metadata||{};item.metadata[CHUNK_KEY]=data;item.visible=false;item.locked=true;item.disableHit=true;item.name=`OP2 Chat // Dados ${i+1}`;}});
  }
  for(let i=shared;i<chunks.length;i++){
    const data={v:1,roomId,index:i,entries:chunks[i],updatedAt:Date.now()};
    const item=buildText().plainText('OP2 CHAT DATA').position({x:0,y:0}).layer('TEXT').visible(false).locked(true).disableHit(true).metadata({[CHUNK_KEY]:data}).name(`OP2 Chat // Dados ${i+1}`).build();
    await OBR.scene.items.addItems([item]);
  }
  if(existing.length>chunks.length)await OBR.scene.items.deleteItems(existing.slice(chunks.length).map(i=>i.id));
}

async function updateRecent(entries){
  let recent=entries.slice(-8);
  while(recent.length&&bytes(recent)>6500)recent=recent.slice(1);
  await OBR.room.setMetadata({[RECENT_KEY]:{v:1,entries:recent,updatedAt:Date.now()}});
}

function persist(entries){
  cachedHistory=entries;
  writeQueue=writeQueue.then(async()=>{await writeSceneHistory(entries);await updateRecent(entries)}).catch(console.error);
  return writeQueue;
}

async function loadInitial(){
  const meta=await OBR.room.getMetadata();const recent=Array.isArray(meta[RECENT_KEY]?.entries)?meta[RECENT_KEY].entries:[];
  const scene=await loadSceneHistory();cachedHistory=mergeEntries(recent,scene);
  if(scene.length===0&&cachedHistory.length)await writeSceneHistory(cachedHistory);
}

async function sendHistory(targetConnectionId,requestId){
  const parts=chunkEntries(cachedHistory,8500);const total=Math.max(1,parts.length);
  if(!parts.length)parts.push([]);
  for(let i=0;i<parts.length;i++)await OBR.broadcast.sendMessage(CHAT_CHANNEL,{type:'history-part',targetConnectionId,requestId,index:i,total,entries:parts[i]},{destination:'ALL'});
}

async function handle(event){
  if(role!=='GM')return;const d=event.data||{};
  if(d.type==='request-history'){await sendHistory(event.connectionId,d.requestId||makeId());return}
  const sender=await resolveSender(event);if(!sender)return;
  if(d.type==='submit'&&d.entry){
    const character=await assignedCharacter(sender.id);const entry=cleanEntry(d.entry,sender,character);
    if(entry.type==='message'&&!entry.text.trim())return;
    cachedHistory=mergeEntries(cachedHistory,[entry]);await persist(cachedHistory);
    await OBR.broadcast.sendMessage(CHAT_CHANNEL,{type:'persisted-entry',entry},{destination:'ALL'});return;
  }
  if(d.type==='delete'&&d.entryId){
    const entry=cachedHistory.find(e=>e.id===d.entryId);if(!entry)return;
    if(sender.role!=='GM'&&entry.authorId!==sender.id)return;
    cachedHistory=cachedHistory.filter(e=>e.id!==d.entryId);await persist(cachedHistory);
    await OBR.broadcast.sendMessage(CHAT_CHANNEL,{type:'deleted',entryId:d.entryId},{destination:'ALL'});return;
  }
}

async function setup(){
  if(!OBR.isAvailable)return;await new Promise(r=>OBR.onReady(r));
  [role,connectionId]=await Promise.all([OBR.player.getRole(),OBR.player.getConnectionId()]);playerId=OBR.player.id;roomId=OBR.room.id;
  if(role==='GM')await loadInitial();
  OBR.broadcast.onMessage(CHAT_CHANNEL,handle);
  OBR.scene.onReadyChange(async ready=>{
    if(role!=='GM'||!ready)return;
    const scene=await loadSceneHistory();const merged=mergeEntries(cachedHistory,scene);cachedHistory=merged;
    if(merged.length)await persist(merged);
  });
}
setup().catch(console.error);
