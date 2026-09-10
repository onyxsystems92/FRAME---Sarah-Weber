if(location.hash){const hashTarget=document.querySelector(location.hash);if(hashTarget&&hashTarget.tagName==='DETAILS')hashTarget.open=true;}

if(!document.querySelector('link[href="frame-navigation.css"]')){
  const refinements=document.createElement('link');
  refinements.rel='stylesheet';
  refinements.href='frame-navigation.css';
  document.head.appendChild(refinements);
}

document.querySelectorAll('.brand .brand-mark').forEach(mark=>{
  const logo=document.createElement('img');
  logo.src='assets/logo-raum-und-zeit.png';
  logo.alt='';
  logo.className='brand-logo';
  mark.replaceWith(logo);
});

const menuToggle=document.querySelector('[data-menu-toggle]');
if(menuToggle){menuToggle.addEventListener('click',()=>{const open=document.body.classList.toggle('menu-open');menuToggle.setAttribute('aria-expanded',String(open));});}
document.querySelectorAll('.nav a').forEach(link=>{link.addEventListener('click',()=>{document.body.classList.remove('menu-open');if(menuToggle)menuToggle.setAttribute('aria-expanded','false');});});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){document.body.classList.remove('menu-open');if(menuToggle)menuToggle.setAttribute('aria-expanded','false');}});

const emitNavigationSignal=(name,detail)=>{
  const payload={event:name,source:'navigation-home',...detail};
  window.dispatchEvent(new CustomEvent(`rz:${name}`,{detail:payload}));
  if(typeof window.rzTrack==='function')window.rzTrack(name,payload);
};

const intentButtons=[...document.querySelectorAll('[data-intent-button]')];
const intentPanels=[...document.querySelectorAll('[data-intent-panel]')];
intentButtons.forEach(button=>{
  button.addEventListener('click',()=>{
    const intent=button.dataset.intentButton;
    intentButtons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    intentPanels.forEach(panel=>panel.hidden=panel.dataset.intentPanel!==intent);
    try{if(!sessionStorage.getItem('rz:first-intent'))sessionStorage.setItem('rz:first-intent',intent);}catch(error){}
    emitNavigationSignal('navigation-intent-selected',{intent});
    const activePanel=intentPanels.find(panel=>panel.dataset.intentPanel===intent);
    if(activePanel)activePanel.querySelector('a')?.focus({preventScroll:true});
  });
});

document.querySelectorAll('[data-intent-route]').forEach(link=>{
  link.addEventListener('click',()=>{
    let firstIntent=null;
    try{firstIntent=sessionStorage.getItem('rz:first-intent');}catch(error){}
    emitNavigationSignal('navigation-route-selected',{
      intent:firstIntent,
      route:link.dataset.intentRoute,
      destination:link.getAttribute('href')
    });
  });
});
