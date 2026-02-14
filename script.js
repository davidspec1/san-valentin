// ====== ERROR ======
const err = document.getElementById('err');
function showError(msg){ err.textContent = msg; err.style.display='block'; setTimeout(()=>err.style.display='none', 5000); }

// ====== AUDIO CONTROL ======
const audio = document.getElementById('audio');
const playBtn = document.getElementById('playBtn');

// Función para alternar Play/Pause
playBtn.onclick = async () => {
    if (audio.paused) {
        try {
            await audio.play();
            playBtn.textContent = '⏸︎';
        } catch(e) {
            showError('El navegador bloqueó el audio. Intenta de nuevo.');
        }
    } else {
        audio.pause();
        playBtn.textContent = '▶︎';
    }
};

// Intento de Auto-play (muchos navegadores lo bloquean hasta un clic)
window.addEventListener('click', () => {
    if (audio.paused && audio.currentTime === 0) {
        audio.play().then(() => playBtn.textContent = '⏸︎').catch(() => {});
    }
}, { once: true });

// ====== WEBGL CHECK ======
try { 
    const test = document.createElement('canvas').getContext('webgl') || 
                 document.createElement('canvas').getContext('experimental-webgl');
    if(!test) throw new Error('WebGL no disponible');
} catch(e) { showError('Habilita la aceleración por hardware en tu navegador.'); }

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
    controls.enableDamping = true; 
    controls.dampingFactor = 0.06;
    controls.minDistance = 10; 
    controls.maxDistance = 220;

    function setCam(){
        const w = window.innerWidth, h = window.innerHeight;
        const isMobile = w < 768;
        camera.fov = isMobile ? 85 : 75;
        camera.position.set(0, isMobile? 30 : 22, isMobile? 120 : 75);
        camera.updateProjectionMatrix(); 
        controls.update();
    }
    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        setCam();
    });
    setCam();

    // Fondo de estrellas
    function makePrettyStarTexture(size=1024, count=2000) {
        const c = document.createElement('canvas'); c.width = c.height = size;
        const g = c.getContext('2d');
        const r = size/2;
        const bg = g.createRadialGradient(r,r, r*0.2, r,r, r);
        bg.addColorStop(0,'#050010'); bg.addColorStop(1,'#000000');
        g.fillStyle = bg; g.fillRect(0,0,size,size);
        for (let i=0;i<count;i++) {
            const x = Math.random()*size, y = Math.random()*size;
            const glow = g.createRadialGradient(x,y,0, x,y, Math.random()*2+1);
            glow.addColorStop(0, 'rgba(255,255,255,0.8)');
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            g.fillStyle = glow; g.beginPath(); g.arc(x,y, 2, 0, Math.PI*2); g.fill();
        }
        return new THREE.CanvasTexture(c);
    }

    const bgGeo = new THREE.SphereGeometry(600, 32, 32);
    const starTex = makePrettyStarTexture();
    starTex.wrapS = starTex.wrapT = THREE.RepeatWrapping;
    const bg = new THREE.Mesh(bgGeo, new THREE.MeshBasicMaterial({ map: starTex, side: THREE.BackSide }));
    scene.add(bg);

    // Galaxia de Frases
    const galaxy = new THREE.Group(); scene.add(galaxy);
    const phrases = ["Pinchecha ✨","Hermosa 💕","Mi Bebe","Mi Cielito 🌌","Hermosaa ✨","Mi bb","Mi Todo","Me Encantas 🥰","mi chaparra","Te Amo💛","Mi Canción Favorita 🎶","Unica 😊","Mi Reina 👑","Mi Amor","Mi Mundo","Mi enana","Mi Niña","Mi Brigthe, MIAA❤️❤️❤️","Mi Paz","Mi chiquita","Mi Sueño","Mi Pensamiento Favorito","Mi renegona","D+B","Te Amooo💕❤️"];
    
    function makeTextTexture(text){
        const c=document.createElement('canvas'); c.width=512; c.height=64;
        const g=c.getContext('2d');
        g.font='800 32px sans-serif';
        g.textAlign='center'; g.textBaseline='middle';
        g.fillStyle='white'; g.fillText(text,256,32);
        return new THREE.CanvasTexture(c);
    }

    phrases.forEach((txt, i) => {
        for(let j=0; j<6; j++) { // Repetir frases para llenar
            const tex = makeTextTexture(txt);
            const mat = new THREE.SpriteMaterial({ map:tex, transparent:true, blending: THREE.AdditiveBlending });
            const spr = new THREE.Sprite(mat);
            const angle = Math.random() * Math.PI * 2;
            const dist = 20 + Math.random() * 60;
            spr.position.set(Math.cos(angle)*dist, (Math.random()-0.5)*15, Math.sin(angle)*dist);
            spr.scale.set(15, 2, 1);
            galaxy.add(spr);
        }
    });

    // Núcleo
    const core = new THREE.Mesh(
        new THREE.SphereGeometry(10, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0x220033 })
    );
    scene.add(core);

    function animate(){
        requestAnimationFrame(animate);
        const t = performance.now()*0.0005;
        galaxy.rotation.y = t * 0.1;
        starTex.offset.x += 0.0001;
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // ====== CORAZONES AL CLIC ======
    const fx = document.getElementById('fx');
    const ctx2 = fx.getContext('2d');
    const hearts = [];
    function resizeFx(){ 
        fx.width = window.innerWidth; fx.height = window.innerHeight; 
    }
    window.addEventListener('resize', resizeFx); resizeFx();

    window.addEventListener('click', (e) => {
        for(let i=0; i<15; i++) {
            hearts.push({
                x: e.clientX, y: e.clientY,
                vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10,
                size: Math.random()*15+5, life: 1
            });
        }
    });

    function loopFx(){
        ctx2.clearRect(0,0,fx.width,fx.height);
        hearts.forEach((h, i) => {
            h.x += h.vx; h.y += h.vy; h.life -= 0.02;
            ctx2.fillStyle = `rgba(255, 100, 200, ${h.life})`;
            ctx2.beginPath();
            ctx2.arc(h.x, h.y, h.size, 0, Math.PI*2);
            ctx2.fill();
            if(h.life <= 0) hearts.splice(i, 1);
        });
        requestAnimationFrame(loopFx);
    }
    loopFx();

} catch(e) { console.error(e); }
