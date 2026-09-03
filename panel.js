import OBR from 'https://esm.unpkg.com/@owlbear-rodeo/sdk@3.1.0';
import {CHAT_PANEL_ID} from './panel-constants.js';

export {CHAT_PANEL_ID};

const PANEL_URL='/?surface=panel';
const FALLBACK_GEOMETRY=Object.freeze({width:430,height:702,left:8,top:58});
const MAX_MARGIN=8;

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

async function measureGeometry(){
  const {vw,vh}=await readViewport();
  return {
    docked:getChatPanelGeometry(vw,vh),
    maximized:getMaximizedChatPanelGeometry(vw,vh),
  };
}

async function getPanelDimensions(){
  if(!OBR.isAvailable)return null;
  try{
    const [width,height]=await Promise.all([
      OBR.popover.getWidth(CHAT_PANEL_ID),
      OBR.popover.getHeight(CHAT_PANEL_ID),
    ]);
    const w=Number(width),h=Number(height);
    if(!Number.isFinite(w)||!Number.isFinite(h)||w<=1||h<=1)return null;
    return {width:w,height:h};
  }catch{
    return null;
  }
}

async function resizePanel(geometry){
  await Promise.all([
    OBR.popover.setWidth(CHAT_PANEL_ID,geometry.width),
    OBR.popover.setHeight(CHAT_PANEL_ID,geometry.height),
  ]);
}

export async function isChatPanelOpen(){
  return Boolean(await getPanelDimensions());
}

export async function openChatPanelDocked(){
  if(!OBR.isAvailable)return false;
  const {docked}=await measureGeometry();
  const existing=await getPanelDimensions();
  if(existing){
    await resizePanel(docked);
    return true;
  }
  await OBR.popover.open({
    id:CHAT_PANEL_ID,
    url:PANEL_URL,
    width:docked.width,
    height:docked.height,
    anchorReference:'POSITION',
    anchorPosition:{left:docked.left,top:docked.top},
    anchorOrigin:{horizontal:'LEFT',vertical:'TOP'},
    transformOrigin:{horizontal:'LEFT',vertical:'TOP'},
    hidePaper:true,
    disableClickAway:true,
    marginThreshold:0,
  });
  return true;
}

export async function closeChatPanel(){
  if(!OBR.isAvailable)return false;
  try{
    await OBR.popover.close(CHAT_PANEL_ID);
    return true;
  }catch{
    return false;
  }
}

export async function toggleChatPanel(){
  if(!OBR.isAvailable)return false;
  if(await isChatPanelOpen()){
    await closeChatPanel();
    return false;
  }
  await openChatPanelDocked();
  return true;
}

function geometryDistance(size,target){
  return Math.abs(Number(size?.width||0)-target.width)+Math.abs(Number(size?.height||0)-target.height);
}

export async function getChatPanelExpanded(){
  const size=await getPanelDimensions();
  if(!size)return false;
  const {docked,maximized}=await measureGeometry();
  return geometryDistance(size,maximized)<geometryDistance(size,docked);
}

export async function setChatPanelExpanded(expanded){
  if(!OBR.isAvailable)return false;
  const size=await getPanelDimensions();
  if(!size)return false;
  const {docked,maximized}=await measureGeometry();
  await resizePanel(expanded?maximized:docked);
  return Boolean(expanded);
}

export async function toggleChatPanelMaximize(){
  const expanded=await getChatPanelExpanded();
  return setChatPanelExpanded(!expanded);
}

export async function syncChatPanelSize(expanded){
  if(!OBR.isAvailable)return false;
  const size=await getPanelDimensions();
  if(!size)return false;
  return setChatPanelExpanded(Boolean(expanded));
}
