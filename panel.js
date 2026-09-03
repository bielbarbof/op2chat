import OBR from 'https://esm.unpkg.com/@owlbear-rodeo/sdk@3.1.0';

export const CHAT_PANEL_ID='com.op2.playtest.chat/side-panel';
const PANEL_URL='/?surface=panel';
const FALLBACK_GEOMETRY=Object.freeze({width:430,height:702,left:8,top:58});
const HIDDEN_SIZE=1;
const MAX_MARGIN=8;

let cachedGeometry={...FALLBACK_GEOMETRY};
let mounted=false;
let visible=false;
let mountedTop=null;
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

async function measureGeometry(){
  const {vw,vh}=await readViewport();
  cachedGeometry=getChatPanelGeometry(vw,vh);
  return cachedGeometry;
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

async function panelWidth(){
  try{return Number(await OBR.popover.getWidth(CHAT_PANEL_ID))||0}catch{return 0}
}

async function ensureMountedHidden(){
  if(!OBR.isAvailable||mounted)return;
  try{
    await openRaw(HIDDEN_SIZE,HIDDEN_SIZE,cachedGeometry);
    visible=false;
    void measureGeometry().catch(()=>{});
  }catch{
    mounted=false;
  }
}

export function warmChatPanel(){
  const task=panelQueue.then(ensureMountedHidden,ensureMountedHidden);
  panelQueue=task.catch(()=>{});
  return task;
}

async function resizeTo(geometry){
  await Promise.all([
    OBR.popover.setWidth(CHAT_PANEL_ID,geometry.width),
    OBR.popover.setHeight(CHAT_PANEL_ID,geometry.height),
  ]);
}

async function showOnce(){
  if(!OBR.isAvailable)return;
  const initial=cachedGeometry;
  if(!mounted){
    try{
      await openRaw(initial.width,initial.height,initial);
      visible=true;
    }catch{
      mounted=false;
      throw new Error('Não foi possível abrir o painel do Chat.');
    }
  }else{
    try{
      await resizeTo(initial);
      visible=true;
    }catch{
      mounted=false;
      await openRaw(initial.width,initial.height,initial);
      visible=true;
    }
  }

  void measureGeometry().then(async geometry=>{
    if(!visible)return;
    try{
      if(mountedTop!==geometry.top){
        await OBR.popover.close(CHAT_PANEL_ID);
        mounted=false;
        await openRaw(geometry.width,geometry.height,geometry);
        visible=true;
      }else{
        await resizeTo(geometry);
      }
    }catch{}
  }).catch(()=>{});
}

async function hideOnce(){
  if(!OBR.isAvailable)return;
  try{
    await Promise.all([
      OBR.popover.setWidth(CHAT_PANEL_ID,HIDDEN_SIZE),
      OBR.popover.setHeight(CHAT_PANEL_ID,HIDDEN_SIZE),
    ]);
    mounted=true;
  }catch{
    mounted=false;
  }
  visible=false;
}

async function toggleOnce(){
  if(!OBR.isAvailable)return;
  const width=await panelWidth();
  if(width>0)mounted=true;
  if(width>HIDDEN_SIZE+1){
    await hideOnce();
    return;
  }
  visible=false;
  await showOnce();
}

export function toggleChatPanel(){
  const task=panelQueue.then(toggleOnce,toggleOnce);
  panelQueue=task.catch(()=>{});
  return task;
}

export async function closeChatPanel(){
  if(!OBR.isAvailable)return;
  try{
    await Promise.all([
      OBR.popover.setWidth(CHAT_PANEL_ID,HIDDEN_SIZE),
      OBR.popover.setHeight(CHAT_PANEL_ID,HIDDEN_SIZE),
    ]);
    mounted=true;
  }catch{
    mounted=false;
  }
  visible=false;
}

function isExpandedWidth(currentWidth,docked,maximized){
  if(maximized.width<=docked.width+24)return false;
  const threshold=docked.width+Math.min(120,Math.max(40,(maximized.width-docked.width)*0.35));
  return currentWidth>=threshold;
}

export async function toggleChatPanelMaximize(){
  if(!OBR.isAvailable)return false;
  const [{vw,vh},currentWidth]=await Promise.all([readViewport(),panelWidth()]);
  const docked=getChatPanelGeometry(vw,vh);
  const maximized=getMaximizedChatPanelGeometry(vw,vh);
  if(maximized.width<=docked.width+24)return false;
  const expanded=isExpandedWidth(currentWidth,docked,maximized);
  await resizeTo(expanded?docked:maximized);
  mounted=true;
  visible=true;
  mountedTop=docked.top;
  cachedGeometry=docked;
  return !expanded;
}

export async function syncChatPanelSize(){
  if(!OBR.isAvailable)return false;
  try{
    const [{vw,vh},currentWidth]=await Promise.all([readViewport(),panelWidth()]);
    if(currentWidth<=HIDDEN_SIZE+1)return false;
    const docked=getChatPanelGeometry(vw,vh);
    const maximized=getMaximizedChatPanelGeometry(vw,vh);
    const expanded=isExpandedWidth(currentWidth,docked,maximized);
    cachedGeometry=docked;
    if(mountedTop!==null&&mountedTop!==docked.top)return expanded;
    await resizeTo(expanded?maximized:docked);
    mounted=true;
    visible=true;
    mountedTop=docked.top;
    return expanded;
  }catch{
    return false;
  }
}
