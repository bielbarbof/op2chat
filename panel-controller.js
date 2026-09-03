import OBR from 'https://esm.unpkg.com/@owlbear-rodeo/sdk@3.1.0';
import {CHAT_PANEL_ID,PANEL_MODE} from './panel-constants.js';

const PANEL_URL='/?surface=panel';
const HIDDEN_SIZE=1;
const MAX_MARGIN=8;
const FALLBACK_DOCKED=Object.freeze({width:430,height:702,left:8,top:58});

let mode=PANEL_MODE.HIDDEN;
let mounted=false;
let mountedTop=null;
let cachedDocked={...FALLBACK_DOCKED};
let cachedMaximized={width:1264,height:654,left:8,top:58};
let controllerQueue=Promise.resolve();
let geometryRefresh=null;

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

async function readViewport(){
  const [vw,vh]=await Promise.all([OBR.viewport.getWidth(),OBR.viewport.getHeight()]);
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

async function openRaw(geometry){
  await OBR.popover.open({
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
  });
  mounted=true;
  mountedTop=geometry.top;
}

async function resizeRaw(geometry){
  await Promise.all([
    OBR.popover.setWidth(CHAT_PANEL_ID,geometry.width),
    OBR.popover.setHeight(CHAT_PANEL_ID,geometry.height),
  ]);
}

async function ensureGeometry(){
  try{return await refreshGeometry()}catch{return {docked:cachedDocked,maximized:cachedMaximized}}
}

async function showGeometry(geometry){
  if(!mounted){
    await openRaw(geometry);
    return;
  }

  // Popovers cannot be repositioned after opening. Recreate only when crossing
  // the desktop/mobile top anchor; ordinary reopen cycles stay mounted and fast.
  if(mountedTop!==geometry.top){
    try{await OBR.popover.close(CHAT_PANEL_ID)}catch{}
    mounted=false;
    mountedTop=null;
    await openRaw(geometry);
    return;
  }

  try{
    await resizeRaw(geometry);
  }catch{
    mounted=false;
    mountedTop=null;
    await openRaw(geometry);
  }
}

async function showDockedOnce(){
  if(!OBR.isAvailable)return getState();
  const {docked}=await ensureGeometry();
  mode=PANEL_MODE.DOCKED;
  await showGeometry(docked);
  return getState();
}

async function hideOnce(){
  if(!OBR.isAvailable)return getState();
  mode=PANEL_MODE.HIDDEN;
  if(!mounted)return getState();

  // Keep the already hydrated iframe mounted at 1×1. This makes every reopen a
  // resize instead of a full iframe/SDK/history boot while still removing the
  // panel from the usable interface.
  try{
    await Promise.all([
      OBR.popover.setWidth(CHAT_PANEL_ID,HIDDEN_SIZE),
      OBR.popover.setHeight(CHAT_PANEL_ID,HIDDEN_SIZE),
    ]);
  }catch{
    mounted=false;
    mountedTop=null;
  }
  return getState();
}

async function setModeOnce(nextMode){
  if(!OBR.isAvailable)return getState();
  if(nextMode===PANEL_MODE.HIDDEN)return hideOnce();
  const {docked,maximized}=await ensureGeometry();
  const target=nextMode===PANEL_MODE.MAXIMIZED?maximized:docked;
  mode=nextMode===PANEL_MODE.MAXIMIZED?PANEL_MODE.MAXIMIZED:PANEL_MODE.DOCKED;
  await showGeometry(target);
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
  return setModeOnce(mode);
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
