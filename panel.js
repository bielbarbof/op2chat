import OBR from 'https://esm.unpkg.com/@owlbear-rodeo/sdk@3.1.0';

export const CHAT_PANEL_ID='com.op2.playtest.chat/side-panel';
const PANEL_URL='/?surface=panel';
const FALLBACK_GEOMETRY=Object.freeze({width:430,height:702,left:8,top:58});

let cachedGeometry={...FALLBACK_GEOMETRY};
let assumedOpen=false;
let toggleQueue=Promise.resolve();

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

async function measureGeometry(){
  const [vw,vh]=await Promise.all([OBR.viewport.getWidth(),OBR.viewport.getHeight()]);
  cachedGeometry=getChatPanelGeometry(vw,vh);
  return cachedGeometry;
}

export function warmChatPanelGeometry(){
  if(!OBR.isAvailable)return Promise.resolve(cachedGeometry);
  return measureGeometry().catch(()=>cachedGeometry);
}

export async function isChatPanelOpen(){
  if(!OBR.isAvailable)return false;
  try{
    const width=await OBR.popover.getWidth(CHAT_PANEL_ID);
    return Number.isFinite(Number(width))&&Number(width)>0;
  }catch{return false}
}

export async function openChatPanel(geometry=cachedGeometry){
  if(!OBR.isAvailable)return;
  const g=geometry||cachedGeometry;
  await OBR.popover.open({
    id:CHAT_PANEL_ID,
    url:PANEL_URL,
    width:g.width,
    height:g.height,
    anchorReference:'POSITION',
    anchorPosition:{left:g.left,top:g.top},
    anchorOrigin:{horizontal:'LEFT',vertical:'TOP'},
    transformOrigin:{horizontal:'LEFT',vertical:'TOP'},
    hidePaper:true,
    disableClickAway:true,
    marginThreshold:0,
  });
  assumedOpen=true;
}

export async function closeChatPanel(){
  if(!OBR.isAvailable)return;
  try{await OBR.popover.close(CHAT_PANEL_ID)}catch{}
  assumedOpen=false;
}

async function toggleOnce(){
  if(!assumedOpen){
    await openChatPanel();
    void syncChatPanelSize();
    return;
  }
  // Only probe the host when our local state says the panel should already be open.
  // This keeps the first click on the fast path while recovering if the in-panel X
  // closed the popover in a different iframe.
  if(await isChatPanelOpen()){
    await closeChatPanel();
    return;
  }
  assumedOpen=false;
  await openChatPanel();
  void syncChatPanelSize();
}

export function toggleChatPanel(){
  const task=toggleQueue.then(toggleOnce,toggleOnce);
  toggleQueue=task.catch(()=>{});
  return task;
}

export async function syncChatPanelSize(){
  if(!OBR.isAvailable)return;
  try{
    const g=await measureGeometry();
    await Promise.all([
      OBR.popover.setWidth(CHAT_PANEL_ID,g.width),
      OBR.popover.setHeight(CHAT_PANEL_ID,g.height),
    ]);
  }catch{}
}
