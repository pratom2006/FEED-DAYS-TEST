'use strict';
  const statusEl = document.getElementById('status');
  const modeEl = document.getElementById('mode');
  const joystickEl = document.getElementById('joystick');
  const thumbEl = document.getElementById('thumb');
  const debugButton = document.getElementById('debug');
  const hudEl = document.getElementById('hud');
  const hasTouch = navigator.maxTouchPoints > 0 || window.matchMedia('(pointer:coarse)').matches;
  const stick = { x:0, y:0, pointerId:null };
  let liveScene = null;
  function status(message, error=false) { statusEl.textContent = message; statusEl.classList.toggle('error',error); }
  function mode(text) { modeEl.textContent = text; }
  function resetStick() { stick.x=0; stick.y=0; stick.pointerId=null; thumbEl.style.left='50%'; thumbEl.style.top='50%'; }
  function moveStick(e) {
    if (stick.pointerId !== e.pointerId) return;
    e.preventDefault();
    const rect = joystickEl.getBoundingClientRect();
    const radius = rect.width * .31;
    const centerX = rect.left + rect.width/2, centerY=rect.top + rect.height/2;
    const dx=e.clientX-centerX, dy=e.clientY-centerY;
    const d=Math.hypot(dx,dy); const ratio=d>radius ? radius/d : 1;
    const vx=dx*ratio/radius, vy=dy*ratio/radius;
    stick.x=Math.abs(vx)<.12?0:vx;
    stick.y=Math.abs(vy)<.12?0:vy;
    thumbEl.style.left=(50+vx*31)+'%'; thumbEl.style.top=(50+vy*31)+'%';
  }
  joystickEl.addEventListener('pointerdown',e=>{
    if(stick.pointerId!==null)return;
    e.preventDefault();e.stopPropagation();
    stick.pointerId=e.pointerId;
    joystickEl.setPointerCapture(e.pointerId);
    if(liveScene)liveScene.cancelRoute();
    moveStick(e);
  });
  joystickEl.addEventListener('pointermove',moveStick);
  for(const eventName of ['pointerup','pointercancel','lostpointercapture'])
    joystickEl.addEventListener(eventName,e=>{ if(stick.pointerId===e.pointerId)resetStick(); });
  window.addEventListener('blur',()=>{resetStick();liveScene?.cancelRoute();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){resetStick();liveScene?.cancelRoute();}});

