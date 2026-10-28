/* Área restrita durante a construção: só quem fez login de administrador vê as páginas internas. */
(function(){
  var K='zapeAdmin',H='5eccc2d72d53bce94164a355ab83a1877e4ce09d7452b201cc7cd08ee24ec6a8';
  var s=document.currentScript,home=(s&&s.getAttribute('data-home'))||'./';
  var ok=false;try{ok=localStorage.getItem(K)===H}catch(e){}
  if(!ok){document.documentElement.style.visibility='hidden';location.replace(home+'?login&next='+encodeURIComponent(location.pathname+location.search+location.hash));return;}
  var m=document.createElement('meta');m.name='robots';m.content='noindex,nofollow';document.head.appendChild(m);
  window.addEventListener('DOMContentLoaded',function(){
    var b=document.createElement('div');
    b.style.cssText='position:fixed;left:12px;bottom:12px;z-index:99999;display:flex;gap:10px;align-items:center;background:rgba(12,11,10,.88);border:1px solid #3a362e;border-radius:30px;padding:7px 14px;font:600 11px "Barlow Condensed",Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#a39d91;backdrop-filter:blur(6px)';
    b.innerHTML='<span style="width:7px;height:7px;border-radius:50%;background:#daa520"></span>Modo administrador<a href="#" style="color:#daa520;text-decoration:none;margin-left:6px">Sair</a>';
    b.querySelector('a').onclick=function(e){e.preventDefault();try{localStorage.removeItem(K)}catch(_){}location.href=home;};
    document.body.appendChild(b);
  });
})();
