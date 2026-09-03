import OBR from 'https://esm.unpkg.com/@owlbear-rodeo/sdk@3.1.0';

export const CHAT_PANEL_ID='com.op2.playtest.chat/side-panel';
export const PANEL_CONTROL_CHANNEL='com.op2.playtest.chat/panel-control-v1';

const PANEL_URL='/?surface=panel';
const FALLBACK_GEOMETRY=Object.freeze({width:430,height:702,left:8,top:58});
const HIDDEN_SIZE=1;
const MAX_MARGIN=8;

let cachedGeometry={...FALLBACK_GEOMETRY};
let mounted=false;
let mountedTop=null;
let mode='hidden';
let panelQueue=Promise.resolve();

export function getChatPanelGeometry(viewportWidth,viewportHeight){
  const vw=Math.max(320,Number(viewportWidth)||1280);
  const vh=Math.max(420,Number(viewportHeight)||720);
  const compact=vw<600;
  const left=8;
  const top=compact?8:58;
  const availableWidth=Math.max(304,vw-left-8);
  let width;
  if(compact) width=availableWidth;
  else if(vw<980) width=Math.min(410,availableWidth);
  else if(vw<1440) width=Math.min(430,availableWidth);
  else width=Math.min(452,availableWidth);
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

async function measureDockedGeometry(){
  const {vw,vh}=await readViewport();
  cachedGeometry=getChatPanelGeometry(vw,vh);
  return {docked:cachedGeometry,maximized:getMaximizedChatPanelGeometry(vw,vh)};
}

async function openRaw(width,height,geometry){
  const g=geometry||cachedGeometry;
  await OBR.popover.open({
    id:CHAT_PANEL_ID,
    url:PANEL_URL,
    width,
    height,
    anchorReference:'POSITION',
    anchorPosition:{left:g.left,top:g.top},
    anchorOrigin:{horizontal:'LEFT',vertical:'TOP'},
    transformOrigin:{horizontal:'LEFT',vertical:'TOP'},
    hidePaper:true,
    disableClickAway:true,
    marginThreshold:0,
  });
  mounted=true;
  mountedTop=g.top;
}

async function resizeTo(geometry){
  await Promise.all([
    OBR.popover.setWidth(CHAT_PANEL_ID,geometry.width),
    OBR.popover.setHeight(CHAT_PANEL_ID,geometry.height),
  ]);
}

async function applyVisibleGeometry(geometry){
  if(!mounted||mountedTop!==geometry.top){
    if(mounted){
      try{await OBR.popover.close(CHAT_PANEL_ID)}catch{}
    }
    mounted=false;
    await openRaw(geometry.width,geometry.height,geometry);
    return;
  }
  try{
    await resizeTo(geometry);
  }catch{
    mounted=false;
    await openRaw(geometry.width,geometry.height,geometry);
  }
}

async function ensureMountedHidden(){
  if(!OBR.isAvailable||mounted)return;
  try{
    await openRaw(HIDDEN_SIZE,HIDDEN_SIZE,cachedGeometry);
    mode='hidden';
    void measureDockedGeometry().catch(()=>{});
  }catch{
    mounted=false;
    mountedTop=null;
  }
}

export function warmChatPanel(){
  const task=panelQueue.then(ensureMountedHidden,ensureMountedHidden);
  panelQueue=task.catch(()=>{});
  return task;
}

async function showDockedOnce(){
  if(!OBR.isAvailable)return;
  mode='docked';
  await applyVisibleGeometry(cachedGeometry);
  void measureDockedGeometry().then(({docked})=>{
    if(mode!=='docked')return;
    return applyVisibleGeometry(docked);
  }).catch(()=>{});
}

async function closeOnce(){
  if(!OBR.isAvailable)return;
  mode='hidden';
  try{await OBR.popover.close(CHAT_PANEL_ID)}catch{}
  mounted=false;
  mountedTop=null;
}

async function toggleOnce(){
  if(!OBR.isAvailable)return;
  if(mode==='hidden'){
    await showDockedOnce();
    return;
  }
  await closeOnce();
}

export function toggleChatPanel(){
  const task=panelQueue.then(toggleOnce,toggleOnce);
  panelQueue=task.catch(()=>{});
  task.then(()=>{if(mode==='hidden')void warmChatPanel()},()=>{if(mode==='hidden')void warmChatPanel()});
  return task;
}

export function closeChatPanel(){
  const task=panelQueue.then(closeOnce,closeOnce);
  panelQueue=task.catch(()=>{});
  task.then(()=>void warmChatPanel(),()=>void warmChatPanel());
  return task;
}

async function toggleMaximizeOnce(){
  if(!OBR.isAvailable||mode==='hidden')return false;
  const {docked,maximized}=await measureDockedGeometry();
  if(maximized.width<=docked.width+24){
    mode='docked';
    await applyVisibleGeometry(docked);
    return false;
  }
  if(mode==='maximized'){
    mode='docked';
    await applyVisibleGeometry(docked);
    return false;
  }
  mode='maximized';
  await applyVisibleGeometry(maximized);
  return true;
}

export function toggleChatPanelMaximize(){
  const task=panelQueue.then(toggleMaximizeOnce,toggleMaximizeOnce);
  panelQueue=task.catch(()=>{});
  return task;
}

async function syncSizeOnce(){
  if(!OBR.isAvailable||mode==='hidden')return false;
  const {docked,maximized}=await measureDockedGeometry();
  const expanded=mode==='maximized'&&maximized.width>docked.width+24;
  if(!expanded&&mode==='maximized')mode='docked';
  await applyVisibleGeometry(expanded?maximized:docked);
  return expanded;
}

export function syncChatPanelSize(){
  const task=panelQueue.then(syncSizeOnce,syncSizeOnce);
  panelQueue=task.catch(()=>{});
  return task;
}

export function getChatPanelState(){
  return {mode,visible:mode!=='hidden',expanded:mode==='maximized'};
}
