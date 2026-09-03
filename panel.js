import OBR from 'https://esm.unpkg.com/@owlbear-rodeo/sdk@3.1.0';
import {PANEL_CONTROL_CHANNEL,PANEL_MODE} from './panel-constants.js';

const pending=new Map();
let listening=false;
const listeners=new Set();

function makeRequestId(){
  return globalThis.crypto?.randomUUID?.()||`panel-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function handlePanelEvent(event){
  const data=event.data||{};
  if(data.type!=='panel-state')return;
  for(const listener of listeners){
    try{listener(data)}catch{}
  }
  if(!data.requestId)return;
  const item=pending.get(data.requestId);
  if(!item)return;
  clearTimeout(item.timer);
  pending.delete(data.requestId);
  item.resolve(data);
}

function ensureListener(){
  if(listening||!OBR.isAvailable)return;
  listening=true;
  OBR.broadcast.onMessage(PANEL_CONTROL_CHANNEL,handlePanelEvent);
}

async function sendControl(action,payload={},waitForState=true){
  if(!OBR.isAvailable)return null;
  ensureListener();
  const requestId=makeRequestId();
  let response=null;

  if(waitForState){
    response=new Promise(resolve=>{
      const timer=setTimeout(()=>{
        pending.delete(requestId);
        resolve(null);
      },1200);
      pending.set(requestId,{resolve,timer});
    });
  }

  await OBR.broadcast.sendMessage(PANEL_CONTROL_CHANNEL,{
    type:'panel-control',
    action,
    requestId,
    ...payload,
  },{destination:'LOCAL'}).catch(()=>{});

  return response?response:null;
}

export function onChatPanelState(listener){
  ensureListener();
  listeners.add(listener);
  return ()=>listeners.delete(listener);
}

export async function requestChatPanelState(){
  return sendControl('state',{},true);
}

export async function closeChatPanel(){
  return sendControl('close',{},false);
}

export async function getChatPanelExpanded(){
  const state=await requestChatPanelState();
  return Boolean(state?.expanded);
}

export async function setChatPanelExpanded(expanded){
  const state=await sendControl('set-mode',{mode:expanded?PANEL_MODE.MAXIMIZED:PANEL_MODE.DOCKED},true);
  return state?Boolean(state.expanded):Boolean(expanded);
}

export async function syncChatPanelSize(){
  const state=await sendControl('sync',{},true);
  return Boolean(state?.expanded);
}
