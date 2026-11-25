'use strict';
  if(typeof Phaser==='undefined') {
    status('โหลด Phaser ไม่สำเร็จ กรุณาเชื่อมต่ออินเทอร์เน็ตแล้วรีเฟรชหน้าเว็บ',true);
    for(const b of document.querySelectorAll('.pick'))b.disabled=true;
  } else {
    status('พร้อมทดสอบเมืองวงแหวน · ตั้งชื่อและเลือกตัวละคร');
    class StarterTown extends Phaser.Scene {
      constructor(name,gender){super('starter');this.playerName=name;this.gender=gender;}
      preload(){
        status('กำลังโหลดตัวละครและสร้างเมืองไม้จากโค้ด...');
        this.load.on('loaderror',file=>status('โหลดไฟล์ภาพไม่สำเร็จ: '+file.key,true));
        // The town and six wooden buildings are drawn from code in create().
        for(const c of covers) this.load.image('cover_'+c.id,ART.covers[c.id]);
      }
      create(){
        liveScene=this;
        const townCanvas=document.createElement('canvas');
        townCanvas.width=WORLD.width;townCanvas.height=WORLD.height;
        drawTown(townCanvas.getContext('2d'));
        this.textures.addCanvas('ring_background',townCanvas);
        this.add.image(0,0,'ring_background').setOrigin(0,0).setDepth(0);
        // Each building is an independent procedural texture with its own collider.
        this.houses=HOUSES.map(h=>{
          this.textures.addCanvas('building_'+h.id,makeHouseCanvas(h));
          return this.add.image(h.x,h.y,'building_'+h.id).setOrigin(.5,1).setDepth(h.y);
        });
        this.coverSprites=[];
        this.cameras.main.setBounds(0,0,WORLD.width,WORLD.height);
        this.debugG=this.add.graphics().setDepth(25000).setVisible(false);
        this.debugEnabled=false;
        this.drawDebug();
        // Temporary procedural marker until a new character art direction is approved.
        const texture='placeholder_'+this.gender;
        const markerCanvas=document.createElement('canvas');markerCanvas.width=128;markerCanvas.height=128;
        const markerCtx=markerCanvas.getContext('2d');
        markerCtx.fillStyle='#4777a1';markerCtx.fillRect(46,46,36,45);
        markerCtx.fillStyle='#d9b18f';markerCtx.fillRect(48,23,32,27);
        markerCtx.fillStyle='#38363e';markerCtx.fillRect(48,18,32,9);markerCtx.fillRect(47,91,13,29);markerCtx.fillRect(68,91,13,29);
        this.textures.addCanvas(texture,markerCanvas);
        const spawn={x:1024,y:1800};
        if(!walkable(spawn.x,spawn.y))throw new Error('ตำแหน่งเริ่มต้นซ้อนพื้นที่ห้ามเดิน');
        this.feet=new Phaser.Math.Vector2(spawn.x,spawn.y);
        this.shadow=this.add.ellipse(spawn.x,spawn.y-1,37,13,0x152820,.55).setDepth(spawn.y-.2);
        this.hero=this.add.image(spawn.x,spawn.y,texture).setScale(.72).setOrigin(.5,122/128).setDepth(spawn.y+.1);
        this.face='down';this.route=[];this.destination=null;this.oldMode='';this.blockedFor=0;
        this.label=this.add.text(spawn.x,spawn.y-94,this.playerName,{fontFamily:'system-ui,sans-serif',fontSize:'17px',color:'#fff8e9',stroke:'#193125',strokeThickness:5}).setOrigin(.5).setDepth(30000);
        this.marker=this.add.graphics().setDepth(5);
        this.keys=this.input.keyboard.addKeys({up:Phaser.Input.Keyboard.KeyCodes.W,down:Phaser.Input.Keyboard.KeyCodes.S,left:Phaser.Input.Keyboard.KeyCodes.A,right:Phaser.Input.Keyboard.KeyCodes.D});
        this.input.keyboard.addCapture(['W','A','S','D']);
        this.cameras.main.startFollow(this.hero,true,.10,.10);
        this.cameras.main.setZoom(.82);
        this.cameras.main.centerOn(spawn.x,spawn.y);
        this.input.on('pointerdown',pointer=>{
          const q=pointer.positionToCamera(this.cameras.main);
          this.setDestination(q.x,q.y);
        });
        debugButton.onclick=()=>{
          this.debugEnabled=!this.debugEnabled;
          this.debugG.setVisible(this.debugEnabled);
          debugButton.textContent=this.debugEnabled?'ซ่อนขอบแผนที่':'แสดงพื้นที่ชน';
          debugButton.setAttribute('aria-pressed',String(this.debugEnabled));
        };
        hudEl.style.display='block';
        if(hasTouch){joystickEl.style.display='block';document.getElementById('touchHint').style.display='block';}
        status('Phaser 08 · เมืองวงแหวนพร้อมทดสอบ · ถนนไม้และสะพานเดินได้ / สวนกลางเมืองและบ้านเดินผ่านไม่ได้');
        mode('สำรวจเมืองวงแหวน · 4 ทางออก');
      }
      drawDebug(){
        const g=this.debugG;
        g.clear();
        // The actual wooden road boundaries (green) and blocked central garden (red).
        const m=WORLD.margin+WORLD.radius;
        g.lineStyle(2,0x46e3aa,.9).strokeRect(m,m,WORLD.width-2*m,WORLD.height-2*m);
        g.lineStyle(3,0x35edac,.9);
        g.strokeCircle(TOWN.cx,TOWN.cy,TOWN.outer-WORLD.radius-3);
        g.lineStyle(3,0xff4949,.95).fillStyle(0xe03a32,.19);
        g.fillCircle(TOWN.cx,TOWN.cy,TOWN.inner+WORLD.radius+7);
        g.strokeCircle(TOWN.cx,TOWN.cy,TOWN.inner+WORLD.radius+7);
        g.lineStyle(3,0xff4949,.95).fillStyle(0xe03a32,.22);
        for(const shape of shapes){
          if(shape.kind==='poly'){
            const pts=shape.points.map(([x,y])=>({x,y}));
            g.fillPoints(pts,true);g.strokePoints(pts,true);
          } else if(shape.kind==='circle'){
            g.fillCircle(shape.x,shape.y,shape.r);g.strokeCircle(shape.x,shape.y,shape.r);
          } else {
            g.fillEllipse(shape.x,shape.y,shape.rx*2,shape.ry*2);
            g.strokeEllipse(shape.x,shape.y,shape.rx*2,shape.ry*2);
          }
        }
      }
      cancelRoute(){this.route=[];this.destination=null;this.marker.clear();}
      setDestination(x,y){
        this.cancelRoute();
        const goal={x,y},start={x:this.feet.x,y:this.feet.y};
        if(Math.hypot(goal.x-start.x,goal.y-start.y)<12)return;
        if(!walkable(x,y)){
          status('จุดหมายอยู่นอกทางเดินหรือทับสิ่งกีดขวาง กรุณาแตะบนทางไม้',true);
          mode('พื้นที่นี้เดินไม่ได้');
          return;
        }
        const planned=nav.route(start,goal);
        if(!planned?.length){status('ไม่พบเส้นทางที่เดินได้ กรุณาแตะพื้นจุดอื่น',true);mode('หาเส้นทางไม่พบ');return;}
        this.route=planned;this.destination=goal;this.blockedFor=0;
        this.marker.clear().lineStyle(3,0xffed8a,.97).strokeCircle(x,y,14).lineStyle(1,0xffffff,.85).strokeCircle(x,y,6);
        mode('แตะ/คลิกเดินอัตโนมัติ');
        status('เดินอัตโนมัติบนทางไม้ · ใช้จอยสติ๊กหรือ WASD เพื่อยกเลิก');
      }
      tryMove(dx,dy){
        const dist=Math.hypot(dx,dy);if(dist===0)return false;
        const steps=Math.max(1,Math.ceil(dist/3.5));const sx=dx/steps,sy=dy/steps;
        let moved=false;
        for(let n=0;n<steps;n++){
          let xx=this.feet.x+sx, yy=this.feet.y+sy;
          if(walkable(xx,yy)){this.feet.set(xx,yy);moved=true;continue;}
          // Sliding around walls; do not tunnel through blocked polygons.
          if(sx&&walkable(this.feet.x+sx,this.feet.y)){this.feet.x+=sx;moved=true;}
          if(sy&&walkable(this.feet.x,this.feet.y+sy)){this.feet.y+=sy;moved=true;}
        }
        return moved;
      }
      update(time,delta){
        const dt=Math.min(.05,delta/1000);
        let vx=Number(this.keys.right.isDown)-Number(this.keys.left.isDown)+stick.x;
        let vy=Number(this.keys.down.isDown)-Number(this.keys.up.isDown)+stick.y;
        let manual=Math.hypot(vx,vy)>.12;
        let current='idle';
        if(manual){
          if(this.destination)this.cancelRoute();
          const d=Math.hypot(vx,vy);vx/=Math.max(1,d);vy/=Math.max(1,d);
          current='manual';
        } else if(this.route.length){
          while(this.route.length&&Math.hypot(this.route[0].x-this.feet.x,this.route[0].y-this.feet.y)<6)this.route.shift();
          if(!this.route.length){this.cancelRoute();status('ถึงจุดหมายแล้ว · เลือกจุดหมายใหม่ได้');}
          else {
            const p=this.route[0],dx=p.x-this.feet.x,dy=p.y-this.feet.y,d=Math.hypot(dx,dy);
            vx=dx/d;vy=dy/d;current='route';
          }
        }
        const speed=169;
        const len=Math.hypot(vx,vy);
        const step=Math.min(speed*dt,current==='route'&&this.route.length?Math.hypot(this.route[0].x-this.feet.x,this.route[0].y-this.feet.y):Infinity);
        const moved=len>0&&this.tryMove(vx*step,vy*step);
        if(current==='route'&&this.route.length){
          if(moved)this.blockedFor=0;
          else this.blockedFor+=delta;
          if(this.blockedFor>900){this.cancelRoute();status('เส้นทางติดสิ่งกีดขวาง กรุณาเลือกจุดใหม่',true);mode('เส้นทางถูกขวาง');}
        }
        if(current!==this.oldMode){
          if(current==='manual')mode('บังคับเดินเอง');
          if(current==='idle'&&this.oldMode==='manual')mode('สำรวจเมืองวงแหวน · 4 ทางออก');
          this.oldMode=current;
        }
        if(len>.12&&moved){
          this.face=Math.abs(vx)>Math.abs(vy)?(vx<0?'left':'right'):(vy<0?'up':'down');
        }
        // Future roofs/canopies can hide the character while keeping the nameplate visible.
        const behind=covers.some(c=>c.hide&&this.feet.y<c.anchor &&
          this.feet.x>=c.hide[0] && this.feet.x<=c.hide[2] &&
          this.feet.y>=c.hide[1] && this.feet.y<=c.hide[3]);
        this.hero.setVisible(!behind).setDepth(this.feet.y+.1);
        this.shadow.setVisible(!behind).setDepth(this.feet.y-.2);
        this.hero.setPosition(this.feet.x,this.feet.y);
        this.shadow.setPosition(this.feet.x,this.feet.y-2);
        this.label.setPosition(this.feet.x,this.feet.y-94);
      }
    }
    let started=false;
    function start(gender){
      if(started)return;
      const name=document.getElementById('name').value.trim()||'นักผจญภัย';
      try {
        started=true;
        document.getElementById('setup').style.display='none';
        new Phaser.Game({type:Phaser.AUTO,parent:'game',backgroundColor:'#254b39',width:1120,height:700,
          render:{antialias:true,pixelArt:false},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
          input:{activePointers:3},scene:[new StarterTown(name,gender)]});
      } catch(e) {started=false;document.getElementById('setup').style.display='flex';status('เริ่มเกมไม่สำเร็จ: '+e.message,true);}
    }
    document.getElementById('male').addEventListener('click',()=>start('male'));
    document.getElementById('female').addEventListener('click',()=>start('female'));
  }
