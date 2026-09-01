export const ID='com.op2.playtest.chat';
export const CHAT_CHANNEL='com.op2.playtest.chat/channel-v1';
export const ROOM_STATE_KEY='com.op2.playtest/state-v1';
export const SHEET_SYNC_CHANNEL='com.op2.playtest.fichas/sync-v1';
export const RECENT_KEY='com.op2.playtest.chat/recent-v1';
export const CHUNK_KEY='com.op2.playtest.chat/chunk-v1';
export const MAX_MESSAGE_LENGTH=1800;

export function escapeHtml(value=''){return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}
export function bytes(value){return new TextEncoder().encode(JSON.stringify(value)).length}
export function makeId(){return crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`}
export function mergeEntries(current,incoming){
  const map=new Map();
  for(const e of [...current,...incoming])if(e?.id)map.set(e.id,e);
  return [...map.values()].sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
}
export function chunkEntries(entries,maxBytes=9000){
  const chunks=[];let current=[];
  for(const entry of entries){
    const test=[...current,entry];
    if(current.length&&bytes(test)>maxBytes){chunks.push(current);current=[entry]}else current=test;
  }
  if(current.length)chunks.push(current);
  return chunks;
}
export function relativeTime(ts){
  const s=Math.max(0,Math.floor((Date.now()-Number(ts||0))/1000));if(s<15)return'agora';if(s<60)return`${s}s`;const m=Math.floor(s/60);if(m<60)return`${m}min`;const h=Math.floor(m/60);if(h<24)return`${h}h`;return new Date(ts).toLocaleDateString('pt-BR');
}
