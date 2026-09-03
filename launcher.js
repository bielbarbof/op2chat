import OBR from 'https://esm.unpkg.com/@owlbear-rodeo/sdk@3.1.0';
import {toggleChatPanel} from './panel.js';

async function setup(){
  if(!OBR.isAvailable)return;
  await new Promise(resolve=>OBR.onReady(resolve));
  try{
    await toggleChatPanel();
  }finally{
    await OBR.action.close().catch(()=>{});
  }
}

setup().catch(()=>{
  void OBR.action.close().catch(()=>{});
});
