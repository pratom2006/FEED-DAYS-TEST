'use strict';
(() => {
  const logout=document.getElementById('logout');
  const status=document.getElementById('logout-status');
  async function check(){
    try{
      const r=await fetch('/api/auth/me',{credentials:'same-origin',cache:'no-store'});
      if(r.status===401){location.replace('/');return;}
      if(!r.ok)throw Error();
      const data=await r.json();
      document.getElementById('account-name').textContent='ID: '+data.id;
      document.body.classList.remove('session-pending');
      // Phaser is loaded in the original order, even while the session is being verified.
    }catch{document.body.classList.remove('session-pending');status.textContent='ตรวจสอบบัญชีไม่สำเร็จ กรุณาโหลดหน้าใหม่';document.getElementById('male').disabled=true;document.getElementById('female').disabled=true;}
  }
  logout.addEventListener('click',async()=>{
    logout.disabled=true;
    try{
      const r=await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:'{}'});
      if(!r.ok)throw Error();
      location.replace('/');
    }catch{status.textContent='ออกจากระบบไม่สำเร็จ กรุณาลองใหม่';logout.disabled=false;}
  });
  window.addEventListener('pageshow',e=>{if(e.persisted){document.body.classList.add('session-pending');check();}});
  check();
})();
