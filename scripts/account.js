'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const form=$('account-form'),password=$('password'),confirm=$('confirm-password'),submit=$('submit-account');
  let mode='login',busy=false;
  const status=(message,error=false)=>{$('account-status').textContent=message;$('account-status').classList.toggle('error',error);};
  function select(next){
    mode=next;const register=mode==='register';
    $('login-tab').setAttribute('aria-pressed',String(!register));
    $('register-tab').setAttribute('aria-pressed',String(register));
    $('form-title').textContent=submit.textContent=register?'สมัครสมาชิก':'เข้าสู่ระบบ';
    $('confirm-row').hidden=!register;confirm.disabled=!register;confirm.required=register;confirm.value='';
    $('password-hint').hidden=!register;password.minLength=register?10:1;
    password.autocomplete=register?'new-password':'current-password';password.value='';
    status('');
  }
  $('login-tab').onclick=()=>{if(!busy)select('login');};
  $('register-tab').onclick=()=>{if(!busy)select('register');};
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;
    if(mode==='register'&&password.value!==confirm.value){status('รหัสผ่านยืนยันไม่ตรงกัน',true);return;}
    busy=true;submit.disabled=true;status('กำลังดำเนินการ...');
    try{
      const response=await fetch('/api/auth/'+mode,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:$('account-id').value,password:password.value})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.message||'ไม่สามารถดำเนินการได้');
      if(mode==='register'){select('login');status('สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ');password.focus();}
      else{password.value='';location.replace('/game');}
    }catch(error){status(error instanceof SyntaxError?'ไม่พบ Game Server กรุณาเปิด URL ของเซิร์ฟเวอร์':error.message||'เชื่อมต่อไม่สำเร็จ',true);}
    finally{busy=false;submit.disabled=false;}
  });
  fetch('/api/auth/me',{credentials:'same-origin',cache:'no-store'}).then(async r=>{
    if(r.ok){location.replace('/game');return;}
    if(r.status!==401)throw Error();
    if(!busy)status('');
  }).catch(()=>status('ไม่พบ Game Server กรุณาเปิด URL ของเซิร์ฟเวอร์ ไม่ใช่ GitHub Pages',true));
})();
