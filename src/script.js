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

const clearSessionValue=key=>{
  try{sessionStorage.removeItem(key);}catch(error){}
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
    const isOpen=button.getAttribute('aria-expanded')==='true';

    intentButtons.forEach(item=>{
      item.setAttribute('aria-pressed','false');
      item.setAttribute('aria-expanded','false');
    });
    intentPanels.forEach(panel=>{panel.hidden=true;});

    if(isOpen){
      clearSessionValue('rz:current-intent');
      return;
    }

    const firstIntent=writeIntentState(intent);
    button.setAttribute('aria-pressed','true');
    button.setAttribute('aria-expanded','true');
    const activePanel=intentPanels.find(panel=>panel.dataset.intentPanel===intent);
    if(activePanel)activePanel.hidden=false;
    emitNavigationSignal('navigation-intent-selected',{intent,firstIntent});
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

const currentDateKey=()=>{
  const now=new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
};

const formatUpdateDate=value=>{
  if(!value)return '';
  const date=new Date(`${value}T12:00:00`);
  if(Number.isNaN(date.getTime()))return '';
  return new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(date);
};

const isActiveUpdate=(item,today)=>{
  if(!item||item.status!=='published')return false;
  if(typeof item.id!=='string'||typeof item.title!=='string'||typeof item.text!=='string')return false;
  if(item.publishedAt&&item.publishedAt>today)return false;
  if(item.expiresAt&&item.expiresAt<today)return false;
  return true;
};

const buildUpdateCard=item=>{
  const article=document.createElement('article');
  article.className='update-card';

  const meta=document.createElement('div');
  meta.className='update-meta';
  const label=document.createElement('span');
  label.textContent='Praxisinformation';
  meta.append(label);

  const formattedDate=formatUpdateDate(item.publishedAt);
  if(formattedDate){
    const time=document.createElement('time');
    time.dateTime=item.publishedAt;
    time.textContent=formattedDate;
    meta.append(time);
  }

  const heading=document.createElement('h3');
  heading.textContent=item.title;
  const body=document.createElement('p');
  body.textContent=item.text;
  article.append(meta,heading,body);
  return article;
};

const renderCurrentUpdates=async()=>{
  const targets=[...document.querySelectorAll('[data-updates-list]')];
  if(!targets.length)return;

  let data;
  try{
    const response=await fetch('content/aktuelles.json',{cache:'no-store'});
    if(!response.ok)return;
    data=await response.json();
  }catch(error){return;}

  const today=currentDateKey();
  const items=Array.isArray(data.items)
    ? data.items.filter(item=>isActiveUpdate(item,today)).sort((a,b)=>(b.publishedAt||'').localeCompare(a.publishedAt||''))
    : [];

  targets.forEach(target=>{
    const scope=target.dataset.updatesScope||'all';
    const limit=Number.parseInt(target.dataset.updatesLimit||'0',10);
    let visible=scope==='home'?items.filter(item=>item.showOnHomepage===true):items;
    if(Number.isFinite(limit)&&limit>0)visible=visible.slice(0,limit);

    target.replaceChildren(...visible.map(buildUpdateCard));

    const container=target.parentElement;
    const empty=container?container.querySelector('[data-updates-empty]'):null;
    if(empty)empty.hidden=visible.length>0;

    if(scope==='home'){
      const section=target.closest('[data-updates-home-section]');
      if(section)section.hidden=visible.length===0;
    }
  });
};

renderCurrentUpdates();
