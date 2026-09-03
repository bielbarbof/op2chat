import OBR from 'https://esm.unpkg.com/@owlbear-rodeo/sdk@3.1.0';

async function setup(){
  if(!OBR.isAvailable)return;
  await new Promise(resolve=>OBR.onReady(resolve));
  // The persistent background owns the Action toggle. This is only a safety
  // fallback so the tiny launcher never remains open if the host is delayed.
  setTimeout(()=>{void OBR.action.close().catch(()=>{})},350);
}

setup().catch(()=>{});
