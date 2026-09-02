import OBR from 'https://esm.unpkg.com/@owlbear-rodeo/sdk@3.1.0';
import {isChatPanelOpen,openChatPanel} from './panel.js';

const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function fallbackLaunch(){
  if(!OBR.isAvailable)return;
  await new Promise(resolve=>OBR.onReady(resolve));

  // Normally background.js handles the Action immediately. This small fallback
  // only acts when the Action is still open, protecting the first click during
  // a cold extension/background start without putting history work on this path.
  await wait(450);
  let actionOpen=false;
  try{actionOpen=await OBR.action.isOpen()}catch{}
  if(!actionOpen)return;

  try{
    if(!(await isChatPanelOpen()))await openChatPanel();
  }catch{}
  try{await OBR.action.close()}catch{}
}

fallbackLaunch().catch(()=>{});
