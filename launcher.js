import OBR from 'https://esm.unpkg.com/@owlbear-rodeo/sdk@3.1.0';
import {PANEL_CONTROL_CHANNEL} from './panel-constants.js';

const requestId=globalThis.crypto?.randomUUID?.()||`panel-toggle-${Date.now()}-${Math.random().toString(36).slice(2)}`;
let acknowledged=false;
let acknowledge;
const acknowledgedPromise=new Promise(resolve=>{acknowledge=resolve});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function onPanelState(event){
  const data=event.data||{};
  if(data.type!=='panel-state'||data.requestId!==requestId)return;
  acknowledged=true;
  acknowledge?.();
}

async function setup(){
  if(!OBR.isAvailable)return;
  await new Promise(resolve=>OBR.onReady(resolve));
  OBR.broadcast.onMessage(PANEL_CONTROL_CHANNEL,onPanelState);

  // Reenvios usam o mesmo requestId; o background deduplica o comando.
  for(let attempt=0;attempt<4&&!acknowledged;attempt+=1){
    await OBR.broadcast.sendMessage(PANEL_CONTROL_CHANNEL,{
      type:'panel-control',
      action:'toggle',
      requestId,
    },{destination:'LOCAL'}).catch(()=>{});
    if(!acknowledged)await Promise.race([acknowledgedPromise,delay(140)]);
  }

  await OBR.action.close().catch(()=>{});
}

setup().catch(()=>{
  void OBR.action.close().catch(()=>{});
});
