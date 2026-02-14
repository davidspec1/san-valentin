// ====== ERROR ======
const err = document.getElementById('err');
function showError(msg){ err.textContent = msg; err.style.display='block'; }

// ====== AUDIO ======
const audio = document.getElementById('audio');
const playBtn = document.getElementById('playBtn');

playBtn.onclick = async () => {
  try {
    if (audio.paused) {
      await audio.play();
      playBtn.textContent = '⏸︎';
    } else {
      audio.pause();
      playBtn.textContent = '▶︎';
    }
  } catch(e){
    showError('Error al reproducir la canción. Revisa tu navegador.');
  }
};

// Auto-play al cargar
audio.play().then(()=> playBtn.textContent='⏸︎').catch(()=>{});

// ====== WEBGL CHECK ======
try { 
  const test = document.createElement('canvas').getContext('webgl') || 
               document.createElement('canvas').getContext('experimental-webgl');
  if(!test) throw new Error('Tu navegador no tiene WebGL activo');
} catch(e) { showError('WebGL parece desactivado. Prueba con Chrome/Edge/Firefox, o habilita aceleración por hardware.'); }

// ====== THREE.JS GALAXY ======
try {
  const canvas = document.getElementById('galaxy-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio||1));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 2000);
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.06;
  controls.minDistance = 10; controls.maxDistance = 220;
  controls.target.set(0,0,0);

  function setCam(){
    const w = window.innerWidth, h = window.innerHeight;
    const isMobile = w < 768 || w < h;
    camera.fov = isMobile ? 90 : 75;
    camera.position.set(0, isMobile? 26 : 22, isMobile? 110 : 75);
    camera.updateProjectionMatrix(); controls.update();
  }
  setCam();

  // Star texture
  function makePrettyStarTexture(size=1024, count=2000) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d');
    const r = size/2;
    const bg = g.createRadialGradient(r,r, r*0.2, r,r, r);
    bg.addColorStop(0,'#050010');
    bg.addColorStop(1,'#000000');
    g.fillStyle = bg; g.fillRect(0,0,size,size);

    for (let i=0;i<count;i++) {
      const x = Math.random()*size, y = Math.random()*size;
      const base = Math.random()*0.7 + 0.3;
      const glow = g.createRadialGradient(x,y,0, x,y, Math.random()*2.2+1.6);
      const huePick = Math.random();
      let colInner = 'rgba(255,255,255,'+(0.65*base)+')';
      let colOuter = 'rgba(180,190,255,'+(0.12*base)+')';
      if (huePick < 0.25) { colOuter = 'rgba(255,180,240,'+(0.12*base)+')'; }
      glow.addColorStop(0, colInner);
      glow.addColorStop(1, colOuter);
      g.fillStyle = glow; g.beginPath(); g.arc(x,y, Math.random()*1.2+0.6, 0, Math.PI*2); g.fill();
    }
    return new THREE.CanvasTexture(c);
  }

  const bgGeo = new THREE.SphereGeometry(600, 64, 64);
  const starTex = makePrettyStarTexture(1024, 2600);
  starTex.wrapS = starTex.wrapT = THREE.RepeatWrapping;
  const bg = new THREE.Mesh(bgGeo, new THREE.MeshBasicMaterial({ map: starTex, side: THREE.BackSide, transparent:false, opacity:0.85 }));
  scene.add(bg);

  // Galaxy sprites
  const galaxy = new THREE.Group(); scene.add(galaxy);
  const phrases = ["Pinchecha ✨","Hermosa 💕","Mi Bebe","Mi Cielito 🌌","Hermosaa ✨","Mi bb","Mi Todo","Me Encantas 🥰","mi chaparra","Te Amo💛","Mi Canción Favorita 🎶","Unica 😊","Mi Reina 👑","Mi Amor","Mi Mundo","Mi enana","Mi Niña","Mi Brigthe, MIAA❤️❤️❤️","Mi Paz","Mi chiquita","Mi Sueño","Mi Pensamiento Favorito","Mi renegona","D+B","Te Amooo💕❤️"];
  const phraseCount = Math.max(phrases.length * 6, 180);
  const arms = 5, radius = 82, maxH = 22;

  function makeTextTexture(text, size=48){
    const c=document.createElement('canvas'); c.width=1024; c.height=128;
    const g=c.getContext('2d'); g.clearRect(0,0,c.width,c.height);
    g.font='800 '+size+'px -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial';
    g.textAlign='center'; g.textBaseline='middle';
    g.shadowColor='rgba(210,140,255,0.95)'; g.shadowBlur=24;
    g.fillStyle='rgba(255,240,255,0.98)'; g.fillText(text,c.width/2,c.height/2);
    return new THREE.CanvasTexture(c);
  }

  for(let i=0;i<phraseCount;i++){
    const text = phrases[i%phrases.length];
    const tex=makeTextTexture(text,48);
    const spr=new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, transparent:true, depthWrite:false }));
    spr.isPhrase=true;
    const perArm=phraseCount/arms; 
    const ang=(i%perArm)*(Math.PI*2/perArm);
    const armAng=Math.floor(i/perArm)*(Math.PI*2/arms);
    const dist=Math.pow(i/phraseCount,0.72)*radius;
    const thickness=Math.pow(1-(dist/radius),2);
    const x=Math.cos(ang+armAng)*dist, z=Math.sin(ang+armAng)*dist, y=(Math.random()-0.5)*maxH*thickness*.9;
    spr.position.set(x,y,z); spr.scale.set(20,2.6,1); galaxy.add(spr);
  }

  // Galaxy stars
  const starCount=8000, geom=new THREE.BufferGeometry(), pos=new Float32Array(starCount*3);
  for(let i=0;i<starCount;i++){
    const ang=Math.random()*Math.PI*2, dist=Math.random()*radius*1.15;
    const y=(Math.random()-0.5)*36*Math.pow(1-Math.min(dist,radius)/radius,1.5);
    pos[i*3]=Math.cos(ang)*dist; pos[i*3+1]=y; pos[i*3+2]=Math.sin(ang)*dist;
  }
  geom.setAttribute('position', new THREE.BufferAttribute(pos,3));
  galaxy.add(new THREE.Points(geom, new THREE.PointsMaterial({ color:0xffffff, size:0.28, transparent:true, opacity:0.65, blending:THREE.AdditiveBlending })));

  // Black hole core
  const coreR=12;
  const coreTexCanvas=document.createElement('canvas'); coreTexCanvas.width=coreTexCanvas.height=256;
  const cg=coreTexCanvas.getContext('2d'); const grd=cg.createRadialGradient(128,128,10,128,128,128);
  grd.addColorStop(0,'#140018'); grd.addColorStop(0.6,'#090012'); grd.addColorStop(1,'#000'); 
  cg.fillStyle=grd; cg.arc(128,128,128,0,Math.PI*2); cg.fill();
  const core=new THREE.Mesh(new THREE.SphereGeometry(coreR,64,64), new THREE.MeshBasicMaterial({ map:new THREE.CanvasTexture(coreTexCanvas) }));
  core.renderOrder=1; scene.add(core);

  // Photon ring
  const photonRing=new THREE.Mesh(new THREE.RingGeometry(coreR*1.05, coreR*1.18, 128), new THREE.MeshBasicMaterial({ color:0xEAAEFF, transparent:true, opacity:0.95, side:THREE.DoubleSide }));
  photonRing.rotation.x=-Math.PI/2; photonRing.renderOrder=0.5; scene.add(photonRing);

  // Halo
  function makeHaloTexture(size=1024, inner=0.45){
    const c=document.createElement('canvas'); c.width=c.height=size; const g=c.getContext('2d'); const r=size/2;
    const grd=g.createRadialGradient(r,r,r*inner, r,r,r);
    grd.addColorStop(0.0,'rgba(255,200,240,0.45)');
    grd.addColorStop(0.35,'rgba(220,180,255,0.35)');
    grd.addColorStop(0.7,'rgba(160,200,255,0.28)');
    grd.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=grd; g.fillRect(0,0,size,size); const tex=new THREE.CanvasTexture(c); tex.needsUpdate=true; return tex;
  }
  const haloPlane=new THREE.Mesh(new THREE.PlaneGeometry(320,320), new THREE.MeshBasicMaterial({ map:makeHaloTexture(1024,0.45), transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, opacity:0.9 }));
  haloPlane.rotation.x=-Math.PI/2; haloPlane.renderOrder=0.2; scene.add(haloPlane);

  // Animate
  let tw = 0;
  function animate(){
    requestAnimationFrame(animate);
    const t = performance.now()*0.001;
    tw = (tw + 0.0003) % 1;
    starTex.offset.set(tw, 0);
    galaxy.rotation.y = t * 0.05;
    core.rotation.y = t * 0.12;
    photonRing.rotation.z = t * 0.18;
    haloPlane.rotation.z = t * 0.02;
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // ====== HEARTS OVERLAY ======
  const fx = document.getElementById('fx');
  const ctx2 = fx.getContext('2d');
  function resizeFx(){
    fx.width = Math.floor(innerWidth * Math.min(2, window.devicePixelRatio||1));
    fx.height = Math.floor(innerHeight * Math.min(2, window.devicePixelRatio||1));
    fx.style.width = innerWidth + 'px';
    fx.style.height = innerHeight + 'px';
  }
  addEventListener('resize', resizeFx); resizeFx();
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  const hearts = [];
  function spawnHearts(x,y,n=20){
    x *= DPR; y *= DPR;
    for(let i=0;i<n;i++){
      const a=Math.random()*Math.PI*2;
      hearts.push({x,y,vx:Math.cos(a)*(0.6+Math.random()*0.8),vy:-(0.8+Math.random()*1.2),life:1,size:10+Math.random()*16});
    }
  }
  function drawHeart(x,y,size){
    const s=size; ctx2.save(); ctx2.translate(x,y);
    ctx2.beginPath(); ctx2.moveTo(0,-0.25*s);
    ctx2.bezierCurveTo(.5*s,-.9*s,1.4*s,-.1*s,0,.9*s);
    ctx2.bezierCurveTo(-1.4*s,-.1*s,-.5*s,-.9*s,0,-0.25*s);
    const g=ctx2.createRadialGradient(0,0,0,0,0,s);
    g.addColorStop(0,'rgba(255,190,220,.95)'); g.addColorStop(1,'rgba(255,90,160,0)');
    ctx2.fillStyle=g; ctx2.fill(); ctx2.restore();
  }
  let lastTap=0;
  addEventListener('click', (e)=>{ const now=performance.now(); if(now-lastTap<320) spawnHearts(e.clientX,e.clientY,20); lastTap=now; }, {passive:true});
  addEventListener('touchend', (e)=>{ const now=performance.now(); const t=e.changedTouches&&e.changedTouches[0]; if(now-lastTap<320&&t) spawnHearts(t.clientX,t.clientY,20); lastTap=now; }, {passive:true});
  function loopFx(){
    ctx2.clearRect(0,0,fx.width,fx.height);
    for(let i=hearts.length-1;i>=0;i--){ const h=hearts[i]; h.x+=h.vx; h.y+=h.vy; h.vy-=0.02; h.life-=0.015;
      ctx2.globalAlpha=Math.max(0,h.life); drawHeart(h.x,h.y,h.size); ctx2.globalAlpha=1; if(h.life<=0) hearts.splice(i,1);
    }
    requestAnimationFrame(loopFx);
  }
  loopFx();

} catch(e) { showError('Error cargando la galaxia: '+e.message); console.error(e); }