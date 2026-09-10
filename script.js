const menuToggle=document.querySelector('[data-menu-toggle]');
if(menuToggle){menuToggle.addEventListener('click',()=>{const open=document.body.classList.toggle('menu-open');menuToggle.setAttribute('aria-expanded',String(open));});}
document.querySelectorAll('.nav a').forEach(link=>{link.addEventListener('click',()=>{document.body.classList.remove('menu-open');if(menuToggle)menuToggle.setAttribute('aria-expanded','false');});});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){document.body.classList.remove('menu-open');if(menuToggle)menuToggle.setAttribute('aria-expanded','false');}});
