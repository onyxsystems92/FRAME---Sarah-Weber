if(location.hash){const hashTarget=document.querySelector(location.hash);if(hashTarget&&hashTarget.tagName==='DETAILS')hashTarget.open=true;}

const menuToggle=document.querySelector('[data-menu-toggle]');
if(menuToggle){menuToggle.addEventListener('click',()=>{const open=document.body.classList.toggle('menu-open');menuToggle.setAttribute('aria-expanded',String(open));});}
document.querySelectorAll('.nav a').forEach(link=>{link.addEventListener('click',()=>{document.body.classList.remove('menu-open');if(menuToggle)menuToggle.setAttribute('aria-expanded','false');});});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){document.body.classList.remove('menu-open');if(menuToggle)menuToggle.setAttribute('aria-expanded','false');}});

const emitNavigationSignal=(name,detail)=>{
  const payload={event:name,source:'navigation-home',...detail};
  window.dispatchEvent(new CustomEvent(`rz:${name}`,{detail:payload}));
  if(typeof window.rzTrack==='function')window.rzTrack(name,payload);
};

const readSessionValue=key=>{
  try{return sessionStorage.getItem(key);}catch(error){return null;}
};

const writeIntentState=intent=>{
  let firstIntent=readSessionValue('rz:first-intent');
  try{
    if(!firstIntent){sessionStorage.setItem('rz:first-intent',intent);firstIntent=intent;}
    sessionStorage.setItem('rz:current-intent',intent);
  }catch(error){}
  return firstIntent||intent;
};

const intentButtons=[...document.querySelectorAll('[data-intent-button]')];
const intentPanels=[...document.querySelectorAll('[data-intent-panel]')];
intentButtons.forEach(button=>{
  button.addEventListener('click',()=>{
    const intent=button.dataset.intentButton;
    const firstIntent=writeIntentState(intent);
    intentButtons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    intentPanels.forEach(panel=>panel.hidden=panel.dataset.intentPanel!==intent);
    emitNavigationSignal('navigation-intent-selected',{intent,firstIntent});
    const activePanel=intentPanels.find(panel=>panel.dataset.intentPanel===intent);
    if(activePanel)activePanel.querySelector('a')?.focus({preventScroll:true});
  });
});

document.querySelectorAll('[data-intent-route]').forEach(link=>{
  link.addEventListener('click',()=>{
    emitNavigationSignal('navigation-route-selected',{
      intent:readSessionValue('rz:current-intent'),
      firstIntent:readSessionValue('rz:first-intent'),
      route:link.dataset.intentRoute,
      destination:link.getAttribute('href')
    });
  });
});
