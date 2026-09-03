import OBR from 'https://esm.unpkg.com/@owlbear-rodeo/sdk@3.1.0';
import {CHAT_PANEL_ID,PANEL_MODE} from './panel-constants.js';

const PANEL_URL='/?surface=panel';
const MAX_MARGIN=8;
const SDK_OPEN_DEADLINE_MS=750;
const SDK_CLOSE_DEADLINE_MS=500;
const SDK_RESIZE_DEADLINE_MS=500;
const FALLBACK_DOCKED=Object.freeze({width:430,height:702,left:8,top:58});

let mode=PANEL_MODE.HIDDEN;
let mounted=false;
let mountedTop=null;
let cachedDocked={...FALLBACK_DOCKED};
let cachedMaximized={width:1264,height:654,left:8,top:58};
let controllerQueue=Promise.resolve();
let geometryRefresh=null;
let lifecycleEpoch=0;

export function getChatPanelGeometry(viewportWidth,viewportHeight){
  const vw=Math.max(320,Number(viewportWidth)||1280);
  const vh=Math.max(420,Number(viewportHeight)||720);
  const compact=vw<600;
  const left=8;
  const top=compact?8:58;
  const availableWidth=Math.max(304,vw-left-8);
  let width;

  if(compact){
    const reservedRoom=Math.max(32,Math.min(48,Math.round(vw*0.10)));
    width=Math.min(430,Math.max(272,availableWidth-reservedRoom));
    if(width>availableWidth-28)width=Math.max(272,availableWidth-32);
  }else if(vw<980){
    width=Math.min(410,availableWidth);
  }else if(vw<1440){
    width=Math.min(430,availableWidth);
  }else{
    width=Math.min(452,availableWidth);
  }

  const availableHeight=Math.max(280,vh-top-8);
  const height=Math.min(980,availableHeight);
  return {width:Math.round(width),height:Math.round(height),left,top};
}

export function getMaximizedChatPanelGeometry(viewportWidth,viewportHeight){
  const vw=Math.max(320,Number(viewportWidth)||1280);
  const vh=Math.max(420,Number(viewportHeight)||720);
  const compact=vw<600;
  const left=MAX_MARGIN;
  const top=compact?MAX_MARGIN:58;
  return {
    width:Math.round(Math.max(304,vw-left-MAX_MARGIN)),
    height:Math.round(Math.max(280,vh-top-MAX_MARGIN)),
    left,
    top,
  };
}

function settleWithin(promise,timeoutMs){
  return new Promise(resolve=>{
    let settled=false;
    const finish=result=>{if(settled)return;settled=true;clearTimeout(timer);resolve(result)};
    const timer=setTimeout(()=>finish({status:'timeout'}),timeoutMs);
    Promise.resolve(promise).then(
      value=>finish({status:'fulfilled',value}),
      error=>finish({status:'rejected',error}),
    );
  });
}

async function readViewport(){
  const result=await settleWithin(Promise.all([OBR.viewport.getWidth(),OBR.viewport.getHeight()]),450);
  if(result.status!=='fulfilled')throw result.error||new Error('Viewport indisponível');
  const [vw,vh]=result.value;
  return {vw:Number(vw)||1280,vh:Number(vh)||720};
}

async function refreshGeometry(){
  if(!OBR.isAvailable)return {docked:cachedDocked,maximized:cachedMaximized};
  const {vw,vh}=await readViewport();
  cachedDocked=getChatPanelGeometry(vw,vh);
  cachedMaximized=getMaximizedChatPanelGeometry(vw,vh);
  return {docked:cachedDocked,maximized:cachedMaximized};
}

export function primeChatPanelGeometry(){
  if(!geometryRefresh){
    geometryRefresh=refreshGeometry().catch(()=>({docked:cachedDocked,maximized:cachedMaximized})).finally(()=>{
      geometryRefresh=null;
    });
  }
  return geometryRefresh;
}

function popoverConfig(geometry){
  return {
    id:CHAT_PANEL_ID,
    url:PANEL_URL,
    width:geometry.width,
    height:geometry.height,
    anchorReference:'POSITION',
    anchorPosition:{left:geometry.left,top:geometry.top},
    anchorOrigin:{horizontal:'LEFT',vertical:'TOP'},
    transformOrigin:{horizontal:'LEFT',vertical:'TOP'},
    hidePaper:true,
    disableClickAway:true,
    marginThreshold:0,
  };
}

async function openRaw(geometry,epoch){
  let request;
  try{
    request=OBR.popover.open(popoverConfig(geometry));
  }catch(error){
    if(epoch===lifecycleEpoch){mode=PANEL_MODE.HIDDEN;mounted=false;mountedTop=null}
    throw error;
  }

  // The host receives the open command immediately. Do not let a slow iframe
  // navigation hold the lifecycle queue forever.
  mounted=true;
  mountedTop=geometry.top;
  const result=await settleWithin(request,SDK_OPEN_DEADLINE_MS);
  if(result.status==='rejected'&&epoch===lifecycleEpoch){
    mode=PANEL_MODE.HIDDEN;
    mounted=false;
    mountedTop=null;
    throw result.error;
  }
}

async function closeRaw(){
  let request;
  try{request=OBR.popover.close(CHAT_PANEL_ID)}catch{return}
  await settleWithin(request,SDK_CLOSE_DEADLINE_MS);
}

async function resizeRaw(geometry){
  const request=Promise.all([
    OBR.popover.setWidth(CHAT_PANEL_ID,geometry.width),
    OBR.popover.setHeight(CHAT_PANEL_ID,geometry.height),
  ]);
  const result=await settleWithin(request,SDK_RESIZE_DEADLINE_MS);
  if(result.status==='rejected')throw result.error;
}

function refreshVisibleGeometry(epoch){
  void primeChatPanelGeometry().then(async({docked,maximized})=>{
    if(epoch!==lifecycleEpoch||mode===PANEL_MODE.HIDDEN||!mounted)return;
    const target=mode===PANEL_MODE.MAXIMIZED?maximized:docked;

    // Popovers cannot be repositioned after opening. Recreate only if a real
    // viewport class change moves the top anchor (desktop <-> compact).
    if(mountedTop!==target.top){
      await closeRaw();
      if(epoch!==lifecycleEpoch||mode===PANEL_MODE.HIDDEN)return;
      mounted=false;
      mountedTop=null;
      await openRaw(target,epoch).catch(()=>{});
      return;
    }

    await resizeRaw(target).catch(()=>{});
  }).catch(()=>{});
}

async function showDockedOnce(){
  if(!OBR.isAvailable)return getState();
  const epoch=++lifecycleEpoch;
  mode=PANEL_MODE.DOCKED;

  // Open from the already primed/fallback geometry first. Viewport refresh is
  // deliberately deferred so a pair of SDK size reads never blocks the click.
  await openRaw(cachedDocked,epoch);
  refreshVisibleGeometry(epoch);
  return getState();
}

async function hideOnce(){
  if(!OBR.isAvailable)return getState();
  ++lifecycleEpoch;

  // Closing is a visibility operation only. Never resize here: width/height
  // changes are reserved exclusively for the maximize/restore control.
  mode=PANEL_MODE.HIDDEN;
  mounted=false;
  mountedTop=null;
  await closeRaw();
  return getState();
}

async function setModeOnce(nextMode){
  if(!OBR.isAvailable)return getState();
  if(nextMode===PANEL_MODE.HIDDEN)return hideOnce();
  if(mode===PANEL_MODE.HIDDEN)return getState();

  const epoch=++lifecycleEpoch;
  const normalized=nextMode===PANEL_MODE.MAXIMIZED?PANEL_MODE.MAXIMIZED:PANEL_MODE.DOCKED;
  mode=normalized;
  const target=normalized===PANEL_MODE.MAXIMIZED?cachedMaximized:cachedDocked;

  if(!mounted){
    await openRaw(target,epoch);
  }else if(mountedTop!==target.top){
    await closeRaw();
    if(epoch!==lifecycleEpoch||mode===PANEL_MODE.HIDDEN)return getState();
    mounted=false;
    mountedTop=null;
    await openRaw(target,epoch);
  }else{
    await resizeRaw(target);
  }

  refreshVisibleGeometry(epoch);
  return getState();
}

async function toggleOnce(){
  if(mode===PANEL_MODE.HIDDEN)return showDockedOnce();
  return hideOnce();
}

async function toggleMaximizeOnce(){
  if(mode===PANEL_MODE.HIDDEN)return getState();
  return setModeOnce(mode===PANEL_MODE.MAXIMIZED?PANEL_MODE.DOCKED:PANEL_MODE.MAXIMIZED);
}

async function syncOnce(){
  if(mode===PANEL_MODE.HIDDEN)return getState();
  const epoch=lifecycleEpoch;
  refreshVisibleGeometry(epoch);
  return getState();
}

function enqueue(operation){
  const task=controllerQueue.then(operation,operation);
  controllerQueue=task.catch(()=>{});
  return task;
}

export function toggleChatPanel(){return enqueue(toggleOnce)}
export function hideChatPanel(){return enqueue(hideOnce)}
export function toggleChatPanelMaximize(){return enqueue(toggleMaximizeOnce)}
export function syncChatPanelSize(){return enqueue(syncOnce)}
export function setChatPanelMode(nextMode){return enqueue(()=>setModeOnce(nextMode))}

export function getState(){
  return {
    mode,
    visible:mode!==PANEL_MODE.HIDDEN,
    expanded:mode===PANEL_MODE.MAXIMIZED,
    mounted,
  };
}
