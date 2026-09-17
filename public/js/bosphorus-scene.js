/**
 * ZenithIstanbul - 3D Bosphorus Scene & WebGL City Renderer
 * High-performance Three.js architecture with realistic water shaders,
 * 15 July Martyrs suspension bridge, European & Asian terraced topography,
 * 1500+ instanced ambient metropole, iconic landmarks, and living maritime ferry traffic.
 */

import * as THREE from '../vendor/three/three.module.js';
import { OrbitControls } from '../vendor/three/OrbitControls.js';

// ─── Prosedürel PBR Doku ve Ağaç Üretim Yardımcıları (Zero-CDN) ───
function createProceduralCanvasTexture(w, h, fn) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) fn(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

function createWaterCausticTexture() {
  const tex = createProceduralCanvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#041d2d';
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 48; i++) {
      const cx = Math.random() * w;
      const cy = Math.random() * h;
      const rad = 25 + Math.random() * 70;
      const grad = ctx.createRadialGradient(cx, cy, rad * 0.15, cx, cy, rad);
      grad.addColorStop(0, 'rgba(14, 165, 233, 0.28)');
      grad.addColorStop(0.45, 'rgba(2, 132, 199, 0.14)');
      grad.addColorStop(1, 'rgba(4, 29, 45, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      let x = Math.random() * w;
      let y = Math.random() * h;
      ctx.moveTo(x, y);
      for (let s = 0; s < 4; s++) {
        x += (Math.random() - 0.5) * 75;
        y += (Math.random() - 0.5) * 75;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });
  if (tex) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
  }
  return tex;
}

function createAsphaltTexture() {
  const tex = createProceduralCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#161c26';
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 1600; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const tone = Math.random();
      ctx.fillStyle = tone > 0.5 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  });
  if (tex) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 16);
  }
  return tex;
}

function createRealisticIstanbulTree(type = 'pine', scale = 1.0, colorHex = 0x1e5128) {
  const group = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x2b1d0c, roughness: 0.9 });
  const foliageMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.8, flatShading: true });

  if (type === 'pine') {
    // İstanbul Fıstık Çamı (Pinus Pinea / Umbrella Pine)
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35 * scale, 0.55 * scale, 6 * scale, 7), trunkMat);
    trunk.position.y = 3 * scale;
    trunk.castShadow = true;
    group.add(trunk);

    const crown = new THREE.Mesh(new THREE.CylinderGeometry(4.4 * scale, 3.2 * scale, 1.8 * scale, 8), foliageMat);
    crown.position.y = 6.4 * scale;
    crown.castShadow = true;
    group.add(crown);

    const crownTop = new THREE.Mesh(new THREE.ConeGeometry(3.6 * scale, 1.4 * scale, 8), foliageMat);
    crownTop.position.y = 7.6 * scale;
    crownTop.castShadow = true;
    group.add(crownTop);
  } else if (type === 'cypress') {
    // Akdeniz Servisi (Cupressus Sempervirens)
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25 * scale, 0.35 * scale, 2 * scale, 6), trunkMat);
    trunk.position.y = 1 * scale;
    group.add(trunk);

    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.6 * scale, 1.5 * scale, 7.5 * scale, 8), foliageMat);
    col.position.y = 5.2 * scale;
    col.castShadow = true;
    group.add(col);

    const tip = new THREE.Mesh(new THREE.ConeGeometry(1.2 * scale, 3.5 * scale, 8), foliageMat);
    tip.position.y = 9.8 * scale;
    tip.castShadow = true;
  } else if (type === 'judas') {
    // Boğaziçi Erguvan Ağacı (Cercis Siliquastrum - Canlı Pembe / Eflatun Bahar Çiçekleri)
    const erguvanMat = new THREE.MeshStandardMaterial({
      color: colorHex || 0xdb2777,
      roughness: 0.75,
      flatShading: true,
      emissive: 0x831843,
      emissiveIntensity: 0.25
    });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.32 * scale, 0.52 * scale, 3.2 * scale, 6), trunkMat);
    trunk.position.y = 1.6 * scale;
    trunk.castShadow = true;
    group.add(trunk);

    const bloom1 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.6 * scale, 1), erguvanMat);
    bloom1.position.set(0, 3.8 * scale, 0);
    bloom1.scale.set(1.1, 0.9, 1.0);
    bloom1.castShadow = true;
    group.add(bloom1);

    const bloom2 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.0 * scale, 1), erguvanMat);
    bloom2.position.set(1.1 * scale, 4.4 * scale, 0.6 * scale);
    bloom2.castShadow = true;
    group.add(bloom2);
  } else {
    // Boğaziçi Çınarı (Platanus Orientalis)
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.55 * scale, 0.85 * scale, 4.2 * scale, 7), trunkMat);
    trunk.position.y = 2.1 * scale;
    trunk.castShadow = true;
    group.add(trunk);

    const crown1 = new THREE.Mesh(new THREE.DodecahedronGeometry(3.2 * scale, 1), foliageMat);
    crown1.position.set(0, 5.2 * scale, 0);
    crown1.scale.set(1.2, 0.85, 1.1);
    crown1.castShadow = true;
    group.add(crown1);

    const crown2 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4 * scale, 1), foliageMat);
    crown2.position.set(1.4 * scale, 6.4 * scale, -0.8 * scale);
    crown2.castShadow = true;
    group.add(crown2);
  }

  return group;
}

function createSkyscraperFacadeTexture() {
  const tex = createProceduralCanvasTexture(512, 512, (ctx, w, h) => {
    // Modern plazaların parlak mavi-antrasit perde duvar tabanı
    ctx.fillStyle = '#0f1d33';
    ctx.fillRect(0, 0, w, h);

    const cols = 16;
    const rows = 32;
    const cellW = w / cols;
    const cellH = h / rows;
    const winMarginX = 3.0;
    const winMarginY = 2.2;

    for (let r = 0; r < rows; r++) {
      // Kat döşeme kirişi (Spandrel slab)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, r * cellH, w, 3.4);
      // Metalik alüminyum kat profili parlaması
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.fillRect(0, r * cellH + 0.4, w, 1.2);

      for (let c = 0; c < cols; c++) {
        const x = c * cellW + winMarginX;
        const y = r * cellH + winMarginY;
        const ww = cellW - winMarginX * 2;
        const wh = cellH - winMarginY * 2;

        const rand = Math.random();
        if (rand > 0.38) {
          // Canlı yanan ofis pencereleri
          if (rand > 0.82) {
            ctx.fillStyle = '#fef08a'; // Sıcak sarı akkor ofis ışığı
          } else if (rand > 0.64) {
            ctx.fillStyle = '#ffffff'; // Soğuk xenon beyazı LED
          } else if (rand > 0.48) {
            ctx.fillStyle = '#7dd3fc'; // Kristal cam gök mavisi
          } else {
            ctx.fillStyle = '#fed7aa'; // Sıcak kehribar yönetici katı
          }
          ctx.fillRect(x, y, ww, wh);

          // Gerçekçi ofis jaluzi ve tavan ayırıcı gölgesi
          if (Math.random() > 0.45) {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.38)';
            ctx.fillRect(x, y, ww, wh * (0.2 + Math.random() * 0.35));
          }
        } else {
          // Yansımalı safir/gökyüzü camı (Asla zifiri karanlık değil)
          const grad = ctx.createLinearGradient(x, y, x + ww, y + wh);
          grad.addColorStop(0, '#0f172a');
          grad.addColorStop(0.5, '#0369a1');
          grad.addColorStop(1, '#0284c7');
          ctx.fillStyle = grad;
          ctx.fillRect(x, y, ww, wh);
        }

        // Düşey alüminyum profil dikmeleri
        ctx.fillStyle = '#334155';
        ctx.fillRect(c * cellW, r * cellH, 1.8, cellH);
      }
    }
  });
  if (tex) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 6);
  }
  return tex;
}

function createYaliFacadeTexture(colorHex = '#8b1e1e') {
  const tex = createProceduralCanvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, w, h);

    // Ahşap yalıbaskı yatay fugaları
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.lineWidth = 1.4;
    for (let y = 0; y < h; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Kat silmesi
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, h * 0.5 - 3, w, 6);

    // Geleneksel Beyaz Giyotin Pencereler ve Ahşap Panjurlar
    const cols = 8;
    const rows = 4;
    const cellW = w / cols;
    const cellH = h / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = c * cellW + cellW * 0.25;
        const cy = r * cellH + cellH * 0.2;
        const pw = cellW * 0.5;
        const ph = cellH * 0.6;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - 3, cy - 3, pw + 6, ph + 6);

        ctx.fillStyle = Math.random() > 0.3 ? '#fef3c7' : '#1e293b';
        ctx.fillRect(cx, cy, pw, ph);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx + pw / 2, cy);
        ctx.lineTo(cx + pw / 2, cy + ph);
        ctx.moveTo(cx, cy + ph / 2);
        ctx.lineTo(cx + pw, cy + ph / 2);
        ctx.stroke();

        ctx.fillStyle = colorHex === '#f8fafc' ? '#1e3a5f' : '#2a0c0c';
        ctx.fillRect(cx - 8, cy, 5, ph);
        ctx.fillRect(cx + pw + 3, cy, 5, ph);
      }
    }
  });
  if (tex) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1);
  }
  return tex;
}

function createHistoricApartmentTexture() {
  const tex = createProceduralCanvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#854d0e';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.lineWidth = 1.2;
    for (let y = 0; y < h; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, h * 0.33, w, 5);
    ctx.fillRect(0, h * 0.66, w, 5);

    const cols = 6;
    const rows = 3;
    const cellW = w / cols;
    const cellH = h / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = c * cellW + cellW * 0.22;
        const cy = r * cellH + cellH * 0.2;
        const pw = cellW * 0.56;
        const ph = cellH * 0.55;

        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(cx - 2, cy - 2, pw + 4, ph + 4);

        ctx.fillStyle = Math.random() > 0.35 ? '#fde68a' : '#1e1e24';
        ctx.fillRect(cx, cy, pw, ph);

        ctx.fillStyle = '#09090b';
        ctx.fillRect(cx - 3, cy + ph - 8, pw + 6, 8);
      }
    }
  });
  if (tex) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 2);
  }
  return tex;
}

function createShoreFoamTexture() {
  const tex = createProceduralCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < 400; i++) {
      const cx = Math.random() * w;
      const cy = Math.random() * h;
      const rad = 1.8 + Math.random() * 8.5;
      const alpha = 0.25 + Math.random() * 0.65;
      ctx.fillStyle = `rgba(240, 253, 250, ${alpha})`;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  if (tex) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 28);
  }
  return tex;
}

function createHelipadTexture() {
  const tex = createProceduralCanvasTexture(128, 128, (ctx, w, h) => {
    // Dark asphalt pad
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, w, h);

    // Outer yellow safety boundary
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.44, 0, Math.PI * 2);
    ctx.stroke();

    // Inner red warning perimeter
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.36, 0, Math.PI * 2);
    ctx.stroke();

    // Crisp white 'H' marking
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('H', w / 2, h / 2);
  });
  return tex;
}

export class BosphorusScene {
  constructor(canvasContainer, onBuildingClick, onBuildingHover = null) {
    this.container = canvasContainer;
    this.onBuildingClick = onBuildingClick;
    this.onBuildingHover = onBuildingHover;
    this.isCinematicTour = false;
    this.cinematicAngle = 0;
    this.cinematicRadius = 340;
    this.cinematicHeight = 170;
    this.onCinematicChange = null;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.buildingsMeshMap = new Map(); // mesh -> module
    this.buildingObjects = []; // Clickable primary AST module meshes
    this.bridgeMeshes = []; // 3D Bridge lines
    this.activeLaserLines = []; // 3D Neon Dependency Lasers

    this.waterMesh = null;
    this.waterMat = null;
    this.landMat = null;
    this.ambientMat = null;
    this.ambientMesh = null;
    this.gridHelper = null;
    this.parkObjects = [];

    // Bridge & Dynamic Telemetry
    this.bridgeGroup = null;
    this.bridgeCableMat = null;
    this.isDeadlockAlert = false;

    // Landmarks & Aviation
    this.aviationBeacons = [];
    this.skyscraperLandmarkGroup = null;
    this.yaliGroup = null;
    this.shoreFoamMat = null;
    this.maidenTowerGroup = null;
    this.maidenLightBeam = null;
    this.galataTowerGroup = null;
    this.hagiaSophiaGroup = null;
    this.coastGuardGroup = null;
    this.coastGuardStrobe = null;
    this.coastGuardBulbMat = null;

    // Living Maritime Traffic (Şehir Hatları Vapuru)
    this.ferryGroup = null;
    this.ferryCurve = null;
    this.ferryProgress = 0;
    this.ferryWakeParticles = [];

    this.clock = new THREE.Clock();
    this.activeTheme = 'night';
    this.isRaining = false;
    this.hasSecurityLeaks = false;
    this.rainParticles = null;
    this.rainCount = 1200;

    this.searchBeaconGroup = null;
    this.searchBeaconStartTime = 0;
    this.cameraLerpTarget = null;
    this.controlsLerpTarget = null;

    this.init();
  }

  init() {
    // 1. Scene & Camera Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060913);
    this.scene.fog = new THREE.FogExp2(0x060913, 0.0005);

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 4000);
    this.camera.far = 4000;
    this.camera.updateProjectionMatrix();
    this.camera.position.set(0, 240, 360);

    // 2. High-Performance WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);
    // ─── WebGL Context Loss & Restoration Resilience ───
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        console.warn('[ZENITH 3D] WebGL context lost! Pausing render loop.');
      }, false);
      this.renderer.domElement.addEventListener('webglcontextrestored', () => {
        console.info('[ZENITH 3D] WebGL context restored. Re-initializing scene.');
        if (this.init) this.init();
      }, false);
    }


    // 3. Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
    this.controls.minDistance = 35;
    this.controls.maxDistance = 950;
    this.controls.target.set(0, 15, 0);

    // 4. Build Static World Geography ONCE in memory (Zero VRAM Leaks)
    this.setupLights();
    this.createBosphorusTerrain();
    this.createAmbientMetropole();
    this.createBridge();
    this.createLandmarks();
    this.createYaliMansions();
    this.createFerry();
    this.setupRainSystem();

    // 5. User Interaction Listeners
    window.addEventListener('resize', () => this.onWindowResize());
    this.renderer.domElement.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.renderer.domElement.addEventListener('pointermove', (e) => this.onPointerMove(e));

    this.animate();
  }

  setupLights() {
    this.ambientLight = new THREE.AmbientLight(0x1e293b, 0.7);
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x101b38, 0.8);
    this.scene.add(this.hemiLight);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    this.dirLight.position.set(150, 350, 100);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 800;
    this.dirLight.shadow.camera.left = -320;
    this.dirLight.shadow.camera.right = 320;
    this.dirLight.shadow.camera.top = 320;
    this.dirLight.shadow.camera.bottom = -320;
    this.scene.add(this.dirLight);

    this.bridgeSpot = new THREE.SpotLight(0x00f0ff, 2.5, 500, Math.PI / 4, 0.4);
    this.bridgeSpot.position.set(0, 140, -10);
    this.bridgeSpot.target.position.set(0, 20, -30);
    this.scene.add(this.bridgeSpot);
    this.scene.add(this.bridgeSpot.target);
  }

  /**
   * Coğrafi Boğaz Hattı Matematiksel Sınırları (S-Kıvrımı, Haliç & Marmara Denizi)
   * Marmara Denizi güney açık su kütlesi, Sarayburnu-Üsküdar daralması, Ortaköy-Beylerbeyi köprü hattı
   */
  getBosphorusCenter(z) {
    return Math.sin(z * 0.007) * 25 + Math.sin(z * 0.015) * 10;
  }

  getStraitHalfWidth(z) {
    if (z > 160) return 60 + (z - 160) * 0.45; // Marmara Denizi geniş girişi
    if (z < -180) return 60 + (-180 - z) * 0.25; // Karadeniz genişlemesi
    if (z >= -55 && z <= 10) return 48; // 15 Temmuz Köprüsü boğaz boğazı
    return 52 + Math.cos(z * 0.012) * 6;
  }

  /**
   * Haliç (Golden Horn) Gerçek Su Yarığı
   * Sarayburnu/Galata arasından (-65, 95) kuzeybatıya (-340, 20) doğru kıvrılarak Avrupa karasının içine girer
   */
  isInsideHalic(x, z, margin = 0) {
    // Boğaz'dan (-25, 95) başlayıp kuzeybatıya (-340, 20) doğru kesintisiz açık su kanalı
    if (x > -25 + margin || x < -340 - margin) return false;
    const t = (-25 - x) / 290;
    const halicCenterZ = 100 - t * 68;
    const halicHalfWidth = (20 - t * 7) + margin; // Ağızda 40 birim, iç kısımda 26 birim geniş su kanalı
    return Math.abs(z - halicCenterZ) < halicHalfWidth;
  }

  isInHalic(x, z, margin = 0) {
    return this.isInsideHalic(x, z, margin);
  }

  /**
   * Marmara Denizi Güney Açık Su Kütlesi
   * Tarihi Yarımada'nın güneyini (Kennedy Caddesi boyu) ve Kadıköy/Moda'nın güneyini çevreleyen açık deniz
   */
  isMarmaraSea(x, z) {
    // Tarihi Yarımada güneyi (X < -70): Z > 190 Marmara Denizi
    if (x < -70 && z > 190) {
      const coastZ = 190 + (x + 70) * 0.15;
      return z > coastZ;
    }
    // Anadolu Yakası Kadıköy güneyi (X > 60): Z > 220 Marmara Denizi
    if (x > 60 && z > 220) return true;
    // Boğaz çıkışı Marmara ortası
    if (x >= -70 && x <= 60 && z > 170) return true;
    // Açık güney ufku
    if (z > 240) return true;
    return false;
  }

  /**
   * Kıyı Şeridi Mesafesi Matematiği (Signed Shoreline Distance)
   * Kara içindeyse pozitif mesafe, su içindeyse negatif mesafe döner.
   */
  getShoreDistance(x, z) {
    const bCenter = this.getBosphorusCenter(z);
    const bHalf = this.getStraitHalfWidth(z);
    const distBosphorus = x < bCenter ? (bCenter - bHalf) - x : x - (bCenter + bHalf);

    let distHalic = 999;
    if (x <= -25 && x >= -350) {
      const t = (-25 - x) / 290;
      if (t >= -0.05 && t <= 1.1) {
        const halicCenterZ = 100 - t * 68;
        const halicHalf = 20 - t * 7;
        distHalic = Math.abs(z - halicCenterZ) - halicHalf;
      }
    }

    let distMarmara = 999;
    if (x < -70) {
      const coastZ = 190 + (x + 70) * 0.15;
      distMarmara = coastZ - z;
    } else if (x > 60) {
      distMarmara = 220 - z;
    } else {
      distMarmara = 170 - z;
    }
    if (z > 240) distMarmara = Math.min(distMarmara, 240 - z);

    return Math.min(distBosphorus, distHalic, distMarmara);
  }

  /**
   * Kıyı Şeridi ve Su Güvenlik Tamponu
   */
  isPointOnLand(x, z, bufferMargin = 0) {
    return this.getShoreDistance(x, z) > bufferMargin;
  }

  /**
   * İstanbul Yeşil Kuşak ve Tarihi Koruluk Tampon Denetimi
   * Hiçbir konut, ambient bina veya AST yapısı park alanlarına taşamaz.
   */
  isInPark(x, z, margin = 4) {
    // 1. Nakkaştepe Millet Bahçesi (15 Temmuz Köprüsü Anadolu Ayağı & Uçan Yol Seyir Terası)
    if (x >= (62 - margin) && x <= (118 + margin) && z >= (-55 - margin) && z <= (-8 + margin)) return true;
    // 2. Fethi Paşa Korusu (Kuzguncuk & Üsküdar Sırtları)
    if (x >= (65 - margin) && x <= (125 + margin) && z >= (2 - margin) && z <= (52 + margin)) return true;
    // 3. Otağtepe Parkı / Fatih Korusu (FSM Köprüsü Anadolu Ayağı & Boğaz Panoraması)
    if (x >= (62 - margin) && x <= (120 + margin) && z >= (-195 - margin) && z <= (-145 + margin)) return true;
    // 4. Büyük Çamlıca Tepesi Koruluğu (Anadolu Hakim Masifi)
    if (x >= (155 - margin) && x <= (225 + margin) && z >= (-40 - margin) && z <= (25 + margin)) return true;
    // 5. Yıldız Parkı & Korusu (15 Temmuz Köprüsü Avrupa Ayağı / Beşiktaş & Çırağan Sırtı)
    if (x >= (-120 - margin) && x <= (-60 + margin) && z >= (-55 - margin) && z <= (-8 + margin)) return true;
    // 6. Emirgan Korusu (FSM Köprüsü Avrupa Sırtı & Lale Bahçeleri)
    if (x >= (-125 - margin) && x <= (-65 + margin) && z >= (-195 - margin) && z <= (-145 + margin)) return true;
    // 7. Gülhane Parkı & Sarayburnu Bahçeleri (Tarihi Yarımada)
    if (x >= (-125 - margin) && x <= (-42 + margin) && z >= (115 - margin) && z <= (180 + margin)) return true;
    // 8. Moda Sahil Parkı (Kadıköy Burnu)
    if (x >= (65 - margin) && x <= (125 + margin) && z >= (120 - margin) && z <= (185 + margin)) return true;

    return false;
  }

  /**
   * AST Gökdelenlerinin ve Kentsel Dokunun Araziye Oturtulması (Organic Terrain-Height)
   * 90 derecelik dik uçurumlar kaldırılmış; kıyı şeridi boyunca suya doğru yumuşak sahil şevi uygulanır.
   */
  getTerrainHeight(x, z) {
    return this.getGroundElevation(x, z);
  }

  getGroundElevation(x, z) {
    const shoreDist = this.getShoreDistance(x, z);

    // 1. İç Plato Taban Kotu
    let plateauHeight = 8;
    if (x < -70 && z >= 95 && z <= 190) {
      const distToSarayburnu = Math.hypot(x - (-85), z - 130);
      plateauHeight = distToSarayburnu < 35 ? 10 : 13;
    } else if (x < -60 && z >= 15 && z < 70) {
      const distToGalata = Math.hypot(x - (-105), z - 35);
      plateauHeight = Math.max(10, 18 - distToGalata * 0.06);
    } else if (x < -55 && z >= -40 && z < 15) {
      plateauHeight = 8;
    } else if (x < -65 && z < -40) {
      const distToMaslak = Math.hypot(x - (-180), z - (-160));
      plateauHeight = Math.max(12, 28 - distToMaslak * 0.05);
    } else if (x > 50) {
      const distToCamlica = Math.hypot(x - 175, z - 0);
      if (distToCamlica < 90) plateauHeight = Math.max(8, 36 - distToCamlica * 0.32);
      else if (z < -60) plateauHeight = 20;
      else plateauHeight = 8;
    }

    // 2. Organik Kıyı Şevi (Sahil Dolgusu - Su Seviyesi Y=0.5 İle Yumuşak Kavuşma)
    const slopeWidth = 14;
    if (shoreDist <= 0) {
      // Su altı deniz tabanı şelfi (0.4'ten -14'e yumuşak derinleşme)
      return Math.max(-14, 0.4 + shoreDist * 0.7);
    } else if (shoreDist < slopeWidth) {
      const t = shoreDist / slopeWidth;
      const smoothT = t * t * (3 - 2 * t);
      return 0.6 + smoothT * (plateauHeight - 0.6);
    }

    return plateauHeight;
  }

  /**
   * Gerçekçi İstanbul 3D Topografya ve Coğrafya Modeli (Kesintisiz İki Kıta)
   * Yüzen adacıklar kaldırılmış; Avrupa ve Asya kıta plakaları ufka kadar uzanır.
   */
  createBosphorusTerrain() {
    // 1. Gerçekçi Boğaz Suyu Materyali (Marine PBR Caustics & Waves)
    const waterGeo = new THREE.PlaneGeometry(1600, 1600, 128, 128);
    const waterCausticTex = createWaterCausticTexture();
    this.waterMat = new THREE.MeshStandardMaterial({
      color: 0x052d42,
      map: waterCausticTex,
      roughness: 0.12,
      metalness: 0.85,
      emissive: 0x011a26,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.88,
      flatShading: true
    });
    this.waterMesh = new THREE.Mesh(waterGeo, this.waterMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.y = 0.5;
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);

    // 2. Kademeli Kara Kütlesi Materyali
    this.landMat = new THREE.MeshStandardMaterial({
      color: 0x0c162d,
      roughness: 0.65,
      metalness: 0.3,
      emissive: 0x050b18,
      emissiveIntensity: 0.35,
      flatShading: true
    });

    // 3. Kesintisiz Kıtasal Kara Kütleleri (Continental Landmasses)
    // Avrupa Kıta Plakası: X: -550 -> 0, Z: -450 -> +450
    const eurWidth = 550;
    const depth = 900;
    const segX = 110;
    const segZ = 180;
    const europeGeo = new THREE.PlaneGeometry(eurWidth, depth, segX, segZ);
    europeGeo.rotateX(-Math.PI / 2);
    europeGeo.translate(-eurWidth / 2, 0, 0);

    const eurPos = europeGeo.attributes.position;
    for (let i = 0; i < eurPos.count; i++) {
      const vx = eurPos.getX(i);
      const vz = eurPos.getZ(i);
      const elev = this.getGroundElevation(vx, vz);
      eurPos.setY(i, elev);
    }
    europeGeo.computeVertexNormals();

    this.europeContinent = new THREE.Mesh(europeGeo, this.landMat);
    this.europeContinent.receiveShadow = true;
    this.europeContinent.castShadow = true;
    this.scene.add(this.europeContinent);

    // Anadolu Kıta Plakası: X: 0 -> +550, Z: -450 -> +450
    const asiaGeo = new THREE.PlaneGeometry(eurWidth, depth, segX, segZ);
    asiaGeo.rotateX(-Math.PI / 2);
    asiaGeo.translate(eurWidth / 2, 0, 0);

    const asiaPos = asiaGeo.attributes.position;
    for (let i = 0; i < asiaPos.count; i++) {
      const vx = asiaPos.getX(i);
      const vz = asiaPos.getZ(i);
      const elev = this.getGroundElevation(vx, vz);
      asiaPos.setY(i, elev);
    }
    asiaGeo.computeVertexNormals();

    this.asiaContinent = new THREE.Mesh(asiaGeo, this.landMat);
    this.asiaContinent.receiveShadow = true;
    this.asiaContinent.castShadow = true;
    this.scene.add(this.asiaContinent);

    // 4. Şehir Damarları ve Karayolu Arterleri (Road Infrastructure)
    this.createRoadNetworks();

    // 5. Yeşil Kuşaklar ve Koruluklar (Gülhane, Yıldız, Çamlıca)
    this.createGreenBelts();

    // 6. Neon Kıyı Kılavuz Çizgileri (Boğaz S-Kıvrımı, Haliç & Tarihi Yarımada)
    this.createShorelines();

    // İnce Cyber Izgara
    this.gridHelper = new THREE.GridHelper(900, 45, 0x1e293b, 0x0f172a);
    this.gridHelper.position.y = 0.52;
    this.scene.add(this.gridHelper);
  }

  /**
   * Karayolu Ağı ve Asfalt Arterler (D-100 Otoyolu, Kennedy Caddesi & Boğaz Sahil Yolu)
   */
  createRoadNetworks() {
    // 1. D-100 Otoyolu (Avrupa Ana Karası: Köprüden Batı Ufkuna Kesintisiz Akış)
    const d100EuropePts = [
      new THREE.Vector3(-55, 21.5, -30),   // Köprü Ayağı Bağlantısı
      new THREE.Vector3(-95, 17.5, -32),   // Barbaros / Zincirlikuyu
      new THREE.Vector3(-155, 13.5, -35),  // Mecidiyeköy Viyadüğü
      new THREE.Vector3(-230, 10.5, -38),  // Çağlayan / Okmeydanı
      new THREE.Vector3(-330, 8.5, -42),   // Haliç Köprüsü Geçişi
      new THREE.Vector3(-430, 8.5, -48),   // Merter / Bakırköy Sırtları
      new THREE.Vector3(-525, 8.5, -52),   // Kıta Batı Çıkışı
      new THREE.Vector3(-548, 8.5, -54)    // Kıta Kenarı
    ];
    this.createRoadRibbon(d100EuropePts, 8.0, 0x121826, true);

    // 2. D-100 Otoyolu (Anadolu Ana Karası: Havada Kesilmez, Doğu Ufkuna Kadar Uzanır)
    const d100AsiaPts = [
      new THREE.Vector3(55, 21.5, -30),    // Köprü Ayağı Bağlantısı
      new THREE.Vector3(95, 17.5, -32),    // Altunizade Viyadüğü
      new THREE.Vector3(150, 14.0, -36),   // Ümraniye / Çamlıca Girişi
      new THREE.Vector3(230, 10.0, -42),   // Ataşehir / Kozyatağı Kavşağı
      new THREE.Vector3(320, 8.5, -50),    // Doğu Platosu / Sancaktepe
      new THREE.Vector3(420, 8.5, -60),    // Sultanbeyli / Kartal Sırtları
      new THREE.Vector3(510, 8.5, -72),    // Kıta Doğu Çıkışı
      new THREE.Vector3(548, 8.5, -78)     // Kıta Kenarı Sınırı
    ];
    this.createRoadRibbon(d100AsiaPts, 8.0, 0x121826, true);

    // 3. Kadıköy / E-5 Bağlantı Arter Kavşağı (Doğal Şehir Karayolu Ağı)
    const e5AsiaBranchPts = [
      new THREE.Vector3(210, 11.0, -40),   // D-100 Ataşehir Ayrımı
      new THREE.Vector3(215, 9.5, 15),     // Göztepe Köprüsü
      new THREE.Vector3(205, 8.5, 75),     // Kozyatağı E-5
      new THREE.Vector3(185, 8.5, 135),    // Bostancı / Maltepe
      new THREE.Vector3(155, 8.5, 195)     // Kadıköy Sahil Birleşimi
    ];
    this.createRoadRibbon(e5AsiaBranchPts, 6.0, 0x161f33, false, true);

    // 4. Kennedy Caddesi (Tarihi Yarımada Güney Marmara Sahil Yolu)
    const kennedyPts = [
      new THREE.Vector3(-88, 8.5, 135),
      new THREE.Vector3(-102, 8.5, 165),
      new THREE.Vector3(-135, 8.5, 182),
      new THREE.Vector3(-185, 8.5, 192),
      new THREE.Vector3(-245, 8.5, 190),
      new THREE.Vector3(-325, 8.5, 185),
      new THREE.Vector3(-440, 8.5, 185),
      new THREE.Vector3(-545, 8.5, 185)    // Batı Ufku
    ];
    this.createRoadRibbon(kennedyPts, 5.5, 0x161f33, false, true);

    // 5. Boğaz Sahil Yolu (Karaköy - Kabataş - Beşiktaş - Ortaköy - Sarıyer)
    const coastalPts = [
      new THREE.Vector3(-75, 8.5, 55),
      new THREE.Vector3(-68, 8.5, 30),
      new THREE.Vector3(-62, 8.5, -5),
      new THREE.Vector3(-55, 8.5, -30),
      new THREE.Vector3(-62, 8.5, -65),
      new THREE.Vector3(-68, 8.5, -110),
      new THREE.Vector3(-75, 8.5, -180),
      new THREE.Vector3(-88, 8.5, -280),
      new THREE.Vector3(-98, 8.5, -380),
      new THREE.Vector3(-105, 8.5, -440)   // Karadeniz Boğaz Çıkışı
    ];
    this.createRoadRibbon(coastalPts, 5.0, 0x161f33, false, true);
  }

  /**
   * Topografyaya Birebir Oturan Asfalt Yol Şeridi (Z-Fighting ve Havada Asılı Kalma Engellenmiştir)
   */
  createRoadRibbon(points, width = 6.0, color = 0x121826, hasCenterLine = true, isBranch = false) {
    const curve = new THREE.CatmullRomCurve3(points);
    const sampleCount = Math.max(32, points.length * 10);
    const samplePoints = curve.getPoints(sampleCount);

    // Tüm örnek noktaları arazi kotuna kusursuz şekilde yapıştır
    for (let i = 0; i < samplePoints.length; i++) {
      const p = samplePoints[i];
      const groundY = this.getGroundElevation(p.x, p.z);
      // Köprü viyadük rampası geçişi (x=-130 ile +130 arası tabliyeden zemine tatlı iniş)
      if (Math.abs(p.x) < 130 && !isBranch) {
        p.y = Math.max(groundY + 0.22, p.y);
      } else {
        p.y = groundY + 0.22;
      }
    }

    const vertices = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i < samplePoints.length; i++) {
      const p = samplePoints[i];
      let tangent;
      if (i < samplePoints.length - 1) {
        tangent = new THREE.Vector3().subVectors(samplePoints[i + 1], p).normalize();
      } else {
        tangent = new THREE.Vector3().subVectors(p, samplePoints[i - 1]).normalize();
      }
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(width / 2);

      const left = new THREE.Vector3().addVectors(p, side);
      const right = new THREE.Vector3().subVectors(p, side);

      // Yan köşeleri de arazi kotuna oturt
      left.y = Math.max(left.y, this.getGroundElevation(left.x, left.z) + 0.20);
      right.y = Math.max(right.y, this.getGroundElevation(right.x, right.z) + 0.20);

      vertices.push(left.x, left.y, left.z);
      vertices.push(right.x, right.y, right.z);

      const u = i / (samplePoints.length - 1);
      uvs.push(0, u, 1, u);

      if (i < samplePoints.length - 1) {
        const row = i * 2;
        indices.push(row, row + 1, row + 2);
        indices.push(row + 1, row + 3, row + 2);
      }
    }

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeo.setIndex(indices);
    roadGeo.computeVertexNormals();

    const asphaltTex = createAsphaltTexture();
    const roadMat = new THREE.MeshStandardMaterial({
      color: color,
      map: asphaltTex,
      roughness: 0.85,
      metalness: 0.18,
      side: THREE.DoubleSide
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    this.scene.add(roadMesh);

    // Otantik Beyaz Kesikli Şerit Çizgisi
    if (hasCenterLine) {
      const lineCurve = new THREE.CatmullRomCurve3(samplePoints.map(pt => new THREE.Vector3(pt.x, pt.y + 0.10, pt.z)));
      const lineGeo = new THREE.TubeGeometry(lineCurve, sampleCount, 0.20, 4, false);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
      const lineMesh = new THREE.Mesh(lineGeo, lineMat);
      this.scene.add(lineMesh);
    }

    // Sokak Aydınlatma Direkleri (Street Mast Lights - her 12 noktada bir yol kenarı T-direk)
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.18, 5.5, 6);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7, roughness: 0.3 });
    const lampGlowMat = new THREE.MeshBasicMaterial({ color: 0xffd54f });

    for (let i = 4; i < samplePoints.length - 4; i += 12) {
      const p = samplePoints[i];
      let tangent;
      if (i < samplePoints.length - 1) {
        tangent = new THREE.Vector3().subVectors(samplePoints[i + 1], p).normalize();
      } else {
        tangent = new THREE.Vector3().subVectors(p, samplePoints[i - 1]).normalize();
      }
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(width / 2 + 1.2);
      const polePos = new THREE.Vector3().addVectors(p, side);
      polePos.y = this.getGroundElevation(polePos.x, polePos.z);

      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(polePos.x, polePos.y + 2.75, polePos.z);
      this.scene.add(pole);

      const lampArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 1.4), poleMat);
      lampArm.position.set(polePos.x, polePos.y + 5.5, polePos.z);
      lampArm.lookAt(p.x, polePos.y + 5.5, p.z);
      this.scene.add(lampArm);

      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), lampGlowMat);
      bulb.position.set(polePos.x, polePos.y + 5.3, polePos.z);
      this.scene.add(bulb);
    }

    return roadMesh;
  }

  /**
   * Yeşil Kuşaklar ve Şehir Korulukları (Gülhane, Yıldız, Maslak & Çamlıca)
   * Yapay düz diskler kaldırılmış; topografyaya gömülü, kenarları araziyle kaynaşan organik tepe korulukları
   */
  /**
   * İstanbul Yeşil Kuşakları ve İkonik Korulukları (Nakkaştepe, Yıldız, Fethi Paşa, Otağtepe, Emirgan, Gülhane)
   * Boğaz'ın gerçek coğrafi ve topoğrafik konumlarına birebir oturan, konutlarla çakışmayan otantik peyzaj
   */
  createGreenBelts() {
    this.parkObjects = [];

    // 1. Anadolu Yakası: Nakkaştepe Millet Bahçesi (15 Temmuz Şehitler Köprüsü Anadolu Ayağı & Uçan Yol)
    this.createNakkastepePark();

    // 2. Avrupa Yakası: Yıldız Parkı & Korusu (15 Temmuz Şehitler Köprüsü Avrupa Ayağı, Malta Köşkü, Asma Köprü)
    this.createYildizPark();

    // 3. Anadolu Yakası: Fethi Paşa Korusu (Kuzguncuk & Üsküdar Sırtları, Dilruba Köşkü & Erguvanlar)
    this.createFethiPasaPark();

    // 4. Anadolu Yakası: Otağtepe Parkı / Fatih Korusu (FSM Köprüsü Anadolu Ayağı & Panoramik Seyir Terası)
    this.createOtagtepePark();

    // 5. Avrupa Yakası: Emirgan Korusu (FSM Köprüsü Avrupa Sırtı, Sarı Köşk & Lale Bahçeleri)
    this.createEmirganPark();

    // 6. Tarihi Yarımada: Gülhane Parkı & Sarayburnu (Gotlar Sütunu & Asırlık Çınar Yolu)
    this.createGulhanePark();

    // 7. Anadolu Yakası: Büyük Çamlıca Koruluğu & Tepesi (İstanbul'un En Yüksek Masifi)
    this.createCamlicaPark();

    // 8. Anadolu Yakası: Moda Sahil Parkı & Burnu (Kadıköy Sahil Çimliği & Palmiyeler)
    this.createModaPark();
  }

  /**
   * Nakkaştepe Millet Bahçesi (Üsküdar / Kuzguncuk)
   * 15 Temmuz Şehitler Köprüsü Anadolu ayağının hemen sırtında, Boğaz ve köprüye bakan
   * ünlü ahşap seyir balkonu ("Uçan Yol"), biyolojik gölet, kavisli ahşap köprü ve fıstık çamları.
   */
  createNakkastepePark() {
    const parkGroup = new THREE.Group();
    parkGroup.name = 'park_Nakkastepe';
    const centerX = 88;
    const centerZ = -30;
    const baseElev = this.getGroundElevation(centerX, centerZ);

    // 1. Organik Hakim Tepe Yükseltisi
    const moundGeo = new THREE.CylinderGeometry(24, 30, 5.8, 36, 2);
    moundGeo.scale(1.0, 1.0, 0.85);
    const turfMat = new THREE.MeshStandardMaterial({
      color: 0x166534,
      roughness: 0.85,
      metalness: 0.0,
      side: THREE.DoubleSide,
      flatShading: true
    });
    const mound = new THREE.Mesh(moundGeo, turfMat);
    mound.position.set(centerX, baseElev + 2.6, centerZ);
    mound.receiveShadow = true;
    parkGroup.add(mound);

    // 2. "Uçan Yol" (İkonik Ahşap Konsol Seyir Balkonu / Skywalk)
    // 15 Temmuz Köprüsüne doğru havada uzanan ahşap teras ve cam korkuluklar
    const deckW = 18;
    const deckD = 8.5;
    const deckY = baseElev + 5.6;
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.65 });
    const deckGeo = new THREE.BoxGeometry(deckW, 1.2, deckD);
    const deck = new THREE.Mesh(deckGeo, woodMat);
    deck.position.set(centerX - 16, deckY, centerZ);
    deck.castShadow = true;
    deck.receiveShadow = true;
    parkGroup.add(deck);

    // Konsol Ahşap Taşıyıcı Dikmeler (Yamaçtan yükselen ayaklar)
    const pylonMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
    const pylonGeo = new THREE.CylinderGeometry(0.35, 0.45, 6.5, 8);
    for (const [px, pz] of [[centerX - 22, centerZ - 3], [centerX - 22, centerZ + 3], [centerX - 13, centerZ - 3], [centerX - 13, centerZ + 3]]) {
      const pylon = new THREE.Mesh(pylonGeo, pylonMat);
      pylon.position.set(px, deckY - 3.2, pz);
      parkGroup.add(pylon);
    }

    // Cam Güvenlik Korkulukları (Köprüye ve Boğaza bakan şeffaf paneller)
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.15,
      metalness: 0.8,
      transparent: true,
      opacity: 0.55
    });
    const railFront = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.3, deckD), glassMat);
    railFront.position.set(centerX - 24.9, deckY + 1.2, centerZ);
    parkGroup.add(railFront);
    const railNorth = new THREE.Mesh(new THREE.BoxGeometry(deckW, 1.3, 0.2), glassMat);
    railNorth.position.set(centerX - 16, deckY + 1.2, centerZ - deckD / 2);
    parkGroup.add(railNorth);
    const railSouth = new THREE.Mesh(new THREE.BoxGeometry(deckW, 1.3, 0.2), glassMat);
    railSouth.position.set(centerX - 16, deckY + 1.2, centerZ + deckD / 2);
    parkGroup.add(railSouth);

    // Seyir Terası Gölgelik Pergola (Modern Ahşap Tente)
    const pergolaBeamMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 });
    for (let b = 0; b < 5; b++) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(10, 0.35, 0.4), pergolaBeamMat);
      beam.position.set(centerX - 12, deckY + 3.8, centerZ - 3.2 + b * 1.6);
      parkGroup.add(beam);
    }

    // 3. Nakkaştepe Biyolojik Göleti & Kavisli Ahşap Köprü
    const pondMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.35,
      emissive: 0x0369a1,
      emissiveIntensity: 0.2
    });
    const pondGeo = new THREE.CylinderGeometry(6.2, 7.2, 0.5, 24);
    pondGeo.scale(1.2, 1.0, 0.8);
    const pond = new THREE.Mesh(pondGeo, pondMat);
    pond.position.set(centerX + 8, baseElev + 5.1, centerZ - 2);
    parkGroup.add(pond);

    // Gölet Doğal Taş Kenarlığı
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 });
    const stoneRim = new THREE.Mesh(new THREE.TorusGeometry(6.6, 0.55, 6, 24), stoneMat);
    stoneRim.rotation.x = Math.PI / 2;
    stoneRim.scale.set(1.2, 0.8, 1.0);
    stoneRim.position.set(centerX + 8, baseElev + 5.3, centerZ - 2);
    parkGroup.add(stoneRim);

    // Gölet Üzerindeki Kavisli Ahşap Yürüyüş Köprüsü
    const bridgeCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-4.5, 0, 0),
      new THREE.Vector3(0, 1.4, 0),
      new THREE.Vector3(4.5, 0, 0)
    );
    const bridgeGeo = new THREE.TubeGeometry(bridgeCurve, 16, 0.65, 8, false);
    const bridgeMesh = new THREE.Mesh(bridgeGeo, woodMat);
    bridgeMesh.position.set(centerX + 8, baseElev + 5.6, centerZ - 2);
    parkGroup.add(bridgeMesh);

    // 4. Otantik İstanbul Ağaçları (Fıstık Çamı, Karaçam, Erguvan Çiçekleri)
    const treeCoords = [
      [centerX - 5, centerZ - 12, 'pine', 1.1, 0x1e5128],
      [centerX - 10, centerZ + 10, 'pine', 1.25, 0x1b4332],
      [centerX + 12, centerZ - 14, 'pine', 1.0, 0x2d6a4f],
      [centerX + 14, centerZ + 12, 'pine', 1.15, 0x1e5128],
      [centerX - 18, centerZ - 8, 'cypress', 1.1, 0x133e21],
      [centerX - 18, centerZ + 8, 'cypress', 1.0, 0x0f381e],
      [centerX + 2, centerZ + 12, 'judas', 1.0, 0xdb2777],
      [centerX + 18, centerZ - 2, 'judas', 0.95, 0xe11d48],
      [centerX - 2, centerZ - 14, 'judas', 1.05, 0xec4899]
    ];
    for (const [tx, tz, type, scale, col] of treeCoords) {
      const tree = createRealisticIstanbulTree(type, scale, col);
      tree.position.set(tx, baseElev + 5.2, tz);
      tree.rotation.y = Math.random() * Math.PI * 2;
      parkGroup.add(tree);
    }

    // 5. Sıcak Park Fenerleri (Peyzaj Aydınlatması)
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xffd54f });
    const lampPostMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    for (const [lx, lz] of [[centerX - 14, centerZ - 6], [centerX - 14, centerZ + 6], [centerX + 3, centerZ], [centerX + 14, centerZ]]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 2.2, 6), lampPostMat);
      post.position.set(lx, baseElev + 6.2, lz);
      parkGroup.add(post);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 6, 6), lampMat);
      bulb.position.set(lx, baseElev + 7.3, lz);
      parkGroup.add(bulb);
    }

    this.parkObjects.push(parkGroup);
    this.scene.add(parkGroup);
    return parkGroup;
  }

  /**
   * Yıldız Parkı & Korusu (Beşiktaş / Çırağan / Ortaköy)
   * 15 Temmuz Köprüsü Avrupa ayağı karşısındaki tarihi vadi, Malta Köşkü, asma köprü ve asırlık çınarlar.
   */
  createYildizPark() {
    const parkGroup = new THREE.Group();
    parkGroup.name = 'park_Yildiz';
    const centerX = -88;
    const centerZ = -30;
    const baseElev = this.getGroundElevation(centerX, centerZ);

    // 1. Vadi ve Sırt Topoğrafyası
    const moundGeo = new THREE.CylinderGeometry(26, 32, 5.2, 36, 2);
    moundGeo.scale(1.0, 1.0, 0.9);
    const turfMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85, flatShading: true });
    const mound = new THREE.Mesh(moundGeo, turfMat);
    mound.position.set(centerX, baseElev + 2.3, centerZ);
    parkGroup.add(mound);

    // 2. Tarihi Malta / Çadır Köşkü (Osmanlı Klasik Pavyonu)
    const koskW = 11;
    const koskD = 8;
    const koskH = 6;
    const koskGeo = new THREE.BoxGeometry(koskW, koskH, koskD);
    const koskMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.5 });
    const kosk = new THREE.Mesh(koskGeo, koskMat);
    kosk.position.set(centerX - 4, baseElev + 5.2 + koskH / 2, centerZ - 4);
    parkGroup.add(kosk);

    // Köşk Osmanlı Kırma Çatısı
    const roofGeo = new THREE.ConeGeometry(koskW * 0.72, 3.2, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(centerX - 4, baseElev + 5.2 + koskH + 1.6, centerZ - 4);
    parkGroup.add(roof);

    // 3. Yıldız Parkı Asma Ahşap Köprüsü (Vadi Geçişi)
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
    const footBridgeCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-6, 0, 0),
      new THREE.Vector3(0, 0.8, 0),
      new THREE.Vector3(6, 0, 0)
    );
    const footBridgeGeo = new THREE.TubeGeometry(footBridgeCurve, 16, 0.7, 6, false);
    const footBridge = new THREE.Mesh(footBridgeGeo, woodMat);
    footBridge.position.set(centerX + 8, baseElev + 5.2, centerZ + 6);
    parkGroup.add(footBridge);

    // 4. Yıldız Ördek Göleti
    const pondGeo = new THREE.CylinderGeometry(5.5, 6.5, 0.4, 20);
    const pondMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.15 });
    const pond = new THREE.Mesh(pondGeo, pondMat);
    pond.position.set(centerX + 8, baseElev + 4.9, centerZ - 8);
    parkGroup.add(pond);

    // 5. Asırlık Ağaçlar
    const treeCoords = [
      [centerX - 16, centerZ - 10, 'plane', 1.25, 0x386641],
      [centerX - 12, centerZ + 12, 'plane', 1.2, 0x4c956c],
      [centerX + 16, centerZ - 12, 'pine', 1.15, 0x1e5128],
      [centerX + 14, centerZ + 12, 'cypress', 1.2, 0x133e21],
      [centerX - 2, centerZ + 14, 'cypress', 1.1, 0x0f381e],
      [centerX + 2, centerZ - 14, 'judas', 1.05, 0xdb2777]
    ];
    for (const [tx, tz, type, scale, col] of treeCoords) {
      const tree = createRealisticIstanbulTree(type, scale, col);
      tree.position.set(tx, baseElev + 4.8, tz);
      tree.rotation.y = Math.random() * Math.PI * 2;
      parkGroup.add(tree);
    }

    this.parkObjects.push(parkGroup);
    this.scene.add(parkGroup);
    return parkGroup;
  }

  /**
   * Fethi Paşa Korusu (Kuzguncuk / Üsküdar)
   */
  createFethiPasaPark() {
    const parkGroup = new THREE.Group();
    parkGroup.name = 'park_FethiPasa';
    const centerX = 88;
    const centerZ = 24;
    const baseElev = this.getGroundElevation(centerX, centerZ);

    const moundGeo = new THREE.CylinderGeometry(24, 30, 4.8, 32, 2);
    const turfMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 });
    const mound = new THREE.Mesh(moundGeo, turfMat);
    mound.position.set(centerX, baseElev + 2.2, centerZ);
    parkGroup.add(mound);

    // Dilruba Köşkü
    const koskGeo = new THREE.BoxGeometry(9, 5, 7);
    const koskMat = new THREE.MeshStandardMaterial({ color: 0xffedd5, roughness: 0.6 });
    const kosk = new THREE.Mesh(koskGeo, koskMat);
    kosk.position.set(centerX - 4, baseElev + 4.6 + 2.5, centerZ);
    parkGroup.add(kosk);

    const roofGeo = new THREE.ConeGeometry(6.2, 2.6, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x991b1b });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(centerX - 4, baseElev + 4.6 + 5 + 1.3, centerZ);
    parkGroup.add(roof);

    // Erguvan ve Çam Florası
    const trees = [
      [centerX - 12, centerZ - 10, 'judas', 1.1, 0xdb2777],
      [centerX - 10, centerZ + 10, 'judas', 1.0, 0xe11d48],
      [centerX + 10, centerZ - 8, 'pine', 1.15, 0x1e5128],
      [centerX + 12, centerZ + 10, 'plane', 1.1, 0x2d6a4f],
      [centerX, centerZ + 12, 'cypress', 1.2, 0x133e21]
    ];
    for (const [tx, tz, type, scale, col] of trees) {
      const tree = createRealisticIstanbulTree(type, scale, col);
      tree.position.set(tx, baseElev + 4.6, tz);
      tree.rotation.y = Math.random() * Math.PI * 2;
      parkGroup.add(tree);
    }

    this.parkObjects.push(parkGroup);
    this.scene.add(parkGroup);
    return parkGroup;
  }

  /**
   * Otağtepe Parkı / Fatih Korusu (Kavacık / FSM Köprüsü Anadolu Ayağı)
   */
  createOtagtepePark() {
    const parkGroup = new THREE.Group();
    parkGroup.name = 'park_Otagtepe';
    const centerX = 86;
    const centerZ = -170;
    const baseElev = this.getGroundElevation(centerX, centerZ);

    const moundGeo = new THREE.CylinderGeometry(25, 32, 5.5, 32, 2);
    const turfMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.85 });
    const mound = new THREE.Mesh(moundGeo, turfMat);
    mound.position.set(centerX, baseElev + 2.5, centerZ);
    parkGroup.add(mound);

    // İkonik Dairesel Seyir Balkonu (FSM ve Rumeli Hisarı Manzarası)
    const plazaGeo = new THREE.CylinderGeometry(8, 8.5, 0.8, 24);
    const plazaMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.7 });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.position.set(centerX - 14, baseElev + 5.2, centerZ);
    parkGroup.add(plaza);

    const stoneRailMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.8 });
    const stoneRail = new THREE.Mesh(new THREE.TorusGeometry(8, 0.45, 6, 24, Math.PI), stoneRailMat);
    stoneRail.rotation.x = Math.PI / 2;
    stoneRail.rotation.z = Math.PI / 2;
    stoneRail.position.set(centerX - 14, baseElev + 5.9, centerZ);
    parkGroup.add(stoneRail);

    // Serviler ve Çamlar
    const trees = [
      [centerX - 4, centerZ - 10, 'cypress', 1.25, 0x133e21],
      [centerX - 4, centerZ + 10, 'cypress', 1.2, 0x0f381e],
      [centerX + 12, centerZ - 8, 'pine', 1.1, 0x1e5128],
      [centerX + 10, centerZ + 12, 'pine', 1.15, 0x2d6a4f]
    ];
    for (const [tx, tz, type, scale, col] of trees) {
      const tree = createRealisticIstanbulTree(type, scale, col);
      tree.position.set(tx, baseElev + 5.0, tz);
      tree.rotation.y = Math.random() * Math.PI * 2;
      parkGroup.add(tree);
    }

    this.parkObjects.push(parkGroup);
    this.scene.add(parkGroup);
    return parkGroup;
  }

  /**
   * Emirgan Korusu (Sarıyer / FSM Köprüsü Avrupa Sırtı)
   */
  createEmirganPark() {
    const parkGroup = new THREE.Group();
    parkGroup.name = 'park_Emirgan';
    const centerX = -88;
    const centerZ = -170;
    const baseElev = this.getGroundElevation(centerX, centerZ);

    const moundGeo = new THREE.CylinderGeometry(26, 32, 5.0, 32, 2);
    const turfMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 });
    const mound = new THREE.Mesh(moundGeo, turfMat);
    mound.position.set(centerX, baseElev + 2.3, centerZ);
    parkGroup.add(mound);

    // Sarı Köşk (Tarihi Sarı Ahşap Pavyon)
    const koskGeo = new THREE.BoxGeometry(10, 5.5, 7.5);
    const koskMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
    const kosk = new THREE.Mesh(koskGeo, koskMat);
    kosk.position.set(centerX - 4, baseElev + 4.8 + 2.75, centerZ - 2);
    parkGroup.add(kosk);

    const roofGeo = new THREE.ConeGeometry(7, 2.8, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(centerX - 4, baseElev + 4.8 + 5.5 + 1.4, centerZ - 2);
    parkGroup.add(roof);

    // Emirgan Lale Bahçeleri (Renkli Çiçek Parselleri)
    const tulipColors = [0xef4444, 0xfacc15, 0xa855f7, 0xec4899];
    for (let b = 0; b < tulipColors.length; b++) {
      const bedGeo = new THREE.BoxGeometry(5.5, 0.4, 3.2);
      const bedMat = new THREE.MeshStandardMaterial({ color: tulipColors[b], roughness: 0.6 });
      const bed = new THREE.Mesh(bedGeo, bedMat);
      bed.position.set(centerX + 6, baseElev + 5.0, centerZ - 6 + b * 4.2);
      parkGroup.add(bed);
    }

    // Ağaçlar
    const trees = [
      [centerX - 14, centerZ - 10, 'plane', 1.2, 0x386641],
      [centerX - 12, centerZ + 12, 'pine', 1.15, 0x1e5128],
      [centerX + 16, centerZ - 10, 'cypress', 1.2, 0x133e21],
      [centerX + 14, centerZ + 12, 'judas', 1.05, 0xdb2777]
    ];
    for (const [tx, tz, type, scale, col] of trees) {
      const tree = createRealisticIstanbulTree(type, scale, col);
      tree.position.set(tx, baseElev + 4.8, tz);
      tree.rotation.y = Math.random() * Math.PI * 2;
      parkGroup.add(tree);
    }

    this.parkObjects.push(parkGroup);
    this.scene.add(parkGroup);
    return parkGroup;
  }

  /**
   * Gülhane Parkı (Tarihi Yarımada / Sarayburnu)
   */
  createGulhanePark() {
    const parkGroup = new THREE.Group();
    parkGroup.name = 'park_Gulhane';
    const centerX = -82;
    const centerZ = 145;
    const baseElev = this.getGroundElevation(centerX, centerZ);

    const moundGeo = new THREE.CylinderGeometry(28, 34, 4.2, 36, 2);
    const turfMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 });
    const mound = new THREE.Mesh(moundGeo, turfMat);
    mound.position.set(centerX, baseElev + 2.0, centerZ);
    parkGroup.add(mound);

    // Gotlar Sütunu (Roman Column of the Goths)
    const colPedMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.7 });
    const pedestal = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 2.4), colPedMat);
    pedestal.position.set(centerX + 6, baseElev + 4.2 + 0.9, centerZ - 6);
    parkGroup.add(pedestal);

    const colShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 7.5, 12), colPedMat);
    colShaft.position.set(centerX + 6, baseElev + 4.2 + 1.8 + 3.75, centerZ - 6);
    parkGroup.add(colShaft);

    // Asırlık Gülhane Çınarları Yürüyüş Yolu
    const avenueMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 });
    const avenue = new THREE.Mesh(new THREE.BoxGeometry(6, 0.25, 34), avenueMat);
    avenue.position.set(centerX - 4, baseElev + 4.2, centerZ);
    parkGroup.add(avenue);

    const trees = [
      [centerX - 8, centerZ - 12, 'plane', 1.3, 0x2d6a4f],
      [centerX - 8, centerZ, 'plane', 1.35, 0x386641],
      [centerX - 8, centerZ + 12, 'plane', 1.3, 0x4c956c],
      [centerX + 1, centerZ - 12, 'plane', 1.25, 0x2d6a4f],
      [centerX + 1, centerZ + 12, 'plane', 1.3, 0x386641],
      [centerX + 12, centerZ, 'cypress', 1.2, 0x133e21]
    ];
    for (const [tx, tz, type, scale, col] of trees) {
      const tree = createRealisticIstanbulTree(type, scale, col);
      tree.position.set(tx, baseElev + 4.3, tz);
      tree.rotation.y = Math.random() * Math.PI * 2;
      parkGroup.add(tree);
    }

    this.parkObjects.push(parkGroup);
    this.scene.add(parkGroup);
    return parkGroup;
  }

  /**
   * Büyük Çamlıca Koruluğu & Tepesi
   */
  createCamlicaPark() {
    const parkGroup = new THREE.Group();
    parkGroup.name = 'park_Camlica';
    const centerX = 185;
    const centerZ = -10;
    const baseElev = this.getGroundElevation(centerX, centerZ);

    const moundGeo = new THREE.CylinderGeometry(35, 45, 6.5, 36, 2);
    const turfMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 });
    const mound = new THREE.Mesh(moundGeo, turfMat);
    mound.position.set(centerX, baseElev + 3.0, centerZ);
    parkGroup.add(mound);

    // Çamlıca Çamları Kümeleri
    for (let i = 0; i < 28; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = Math.random() * 26;
      const tx = centerX + Math.cos(ang) * r;
      const tz = centerZ + Math.sin(ang) * r;
      const tree = createRealisticIstanbulTree('pine', 1.0 + Math.random() * 0.4, 0x1b4332);
      tree.position.set(tx, baseElev + 6.2, tz);
      parkGroup.add(tree);
    }

    this.parkObjects.push(parkGroup);
    this.scene.add(parkGroup);
    return parkGroup;
  }

  /**
   * Moda Sahil Parkı & Burnu (Kadıköy)
   */
  createModaPark() {
    const parkGroup = new THREE.Group();
    parkGroup.name = 'park_Moda';
    const centerX = 90;
    const centerZ = 148;
    const baseElev = this.getGroundElevation(centerX, centerZ);

    const lawnGeo = new THREE.CylinderGeometry(24, 28, 2.5, 32, 2);
    const lawnMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.85 });
    const lawn = new THREE.Mesh(lawnGeo, lawnMat);
    lawn.position.set(centerX, baseElev + 1.2, centerZ);
    parkGroup.add(lawn);

    for (let i = 0; i < 12; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = Math.random() * 18;
      const tx = centerX + Math.cos(ang) * r;
      const tz = centerZ + Math.sin(ang) * r;
      const tree = createRealisticIstanbulTree(i % 2 === 0 ? 'plane' : 'pine', 0.95 + Math.random() * 0.3, 0x2d6a4f);
      tree.position.set(tx, baseElev + 2.5, tz);
      parkGroup.add(tree);
    }

    this.parkObjects.push(parkGroup);
    this.scene.add(parkGroup);
    return parkGroup;
  }

  /**
   * Belirgin Nefti Yeşil Organik Zemin Yükseltisi ve Koru Kümeleri
   * Standard solid geometries, roughness: 0.8, emissive: 0x000000, DoubleSide, polygonOffset
   */
  createParkZone(name, centerX, centerZ, radX, radZ, treeCount, baseColor = 0x15803d, peakHeight = 4.2, phaseShift = 0.8) {
    const parkGroup = new THREE.Group();
    parkGroup.name = 'park_' + name;
    parkGroup.visible = true;
    parkGroup.frustumCulled = false;

    const centerBaseElev = this.getGroundElevation(centerX, centerZ);

    // 1. Ana Organik Tepe Yükseltisi (Solid Elevated 3D Turf Mound)
    const moundGeo = new THREE.CylinderGeometry(radX * 0.75, radX, peakHeight, 36, 2);
    moundGeo.scale(1.0, 1.0, radZ / radX);

    // Organik harmonik asimetri
    const pos = moundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      const angle = Math.atan2(vz, vx);
      const noise = 1.0 
        + 0.16 * Math.sin(angle * 3 + phaseShift) 
        + 0.12 * Math.cos(angle * 2 - phaseShift * 0.7) 
        + 0.08 * Math.sin(angle * 5 + 1.8);
      pos.setX(i, vx * noise);
      pos.setZ(i, vz * noise);
    }
    moundGeo.computeVertexNormals();
    moundGeo.computeBoundingBox();
    moundGeo.computeBoundingSphere();

    // Material directly complying with directive:
    // MeshStandardMaterial roughness: 0.8, emissive kapalı, doğrudan #15803d
    const turfMat = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.8,
      metalness: 0.0,
      emissive: 0x000000,
      emissiveIntensity: 0.0,
      side: THREE.DoubleSide,
      flatShading: true,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    });

    const turfMesh = new THREE.Mesh(moundGeo, turfMat);
    turfMesh.position.set(centerX, centerBaseElev + peakHeight * 0.45, centerZ);
    turfMesh.receiveShadow = true;
    turfMesh.castShadow = true;
    turfMesh.visible = true;
    turfMesh.frustumCulled = false;
    turfMesh.renderOrder = 2;
    parkGroup.add(turfMesh);

    // 2. İkincil Organik Yan Tepe (Asimetrik Doğal Topografik Şev)
    const flankOffsetX = radX * 0.32 * Math.cos(phaseShift);
    const flankOffsetZ = radZ * 0.32 * Math.sin(phaseShift);
    const flankGeo = new THREE.CylinderGeometry(radX * 0.48, radX * 0.65, peakHeight * 0.82, 28, 2);
    flankGeo.scale(1.0, 1.0, radZ / radX);
    const flankPos = flankGeo.attributes.position;
    for (let i = 0; i < flankPos.count; i++) {
      const vx = flankPos.getX(i);
      const vz = flankPos.getZ(i);
      const angle = Math.atan2(vz, vx);
      const noise = 1.0 + 0.14 * Math.sin(angle * 4 + phaseShift * 1.5);
      flankPos.setX(i, vx * noise);
      flankPos.setZ(i, vz * noise);
    }
    flankGeo.computeVertexNormals();
    flankGeo.computeBoundingBox();
    flankGeo.computeBoundingSphere();

    const flankMesh = new THREE.Mesh(flankGeo, turfMat);
    const flankBaseElev = this.getGroundElevation(centerX + flankOffsetX, centerZ + flankOffsetZ);
    flankMesh.position.set(centerX + flankOffsetX, flankBaseElev + peakHeight * 0.38, centerZ + flankOffsetZ);
    flankMesh.receiveShadow = true;
    flankMesh.castShadow = true;
    flankMesh.visible = true;
    flankMesh.frustumCulled = false;
    flankMesh.renderOrder = 2;
    parkGroup.add(flankMesh);

    // 3. 3D Otantik İstanbul Çam, Servi & Çınar Koruları (Gerçekçi Şehir Florası)
    const pineColors = [0x1e5128, 0x2d6a4f, 0x1b4332];
    const cypressColors = [0x133e21, 0x0f381e, 0x14532d];
    const planeColors = [0x386641, 0x4c956c, 0x2d6a4f];

    for (let i = 0; i < treeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const noise = 1.0 
        + 0.16 * Math.sin(angle * 3 + phaseShift) 
        + 0.12 * Math.cos(angle * 2 - phaseShift * 0.7);
      const distFrac = Math.sqrt(Math.random()) * 0.88;
      const tx = centerX + Math.cos(angle) * radX * distFrac * noise;
      const tz = centerZ + Math.sin(angle) * radZ * distFrac * noise;

      const groundElev = this.getGroundElevation(tx, tz);
      const ty = groundElev + peakHeight * 0.82;

      // Tür dağılımı: %45 Fıstık Çamı, %35 Akdeniz Servisi, %20 Boğaziçi Çınarı
      const rand = Math.random();
      let type = 'pine';
      let col = pineColors[Math.floor(Math.random() * pineColors.length)];
      if (rand < 0.45) {
        type = 'pine';
        col = pineColors[Math.floor(Math.random() * pineColors.length)];
      } else if (rand < 0.80) {
        type = 'cypress';
        col = cypressColors[Math.floor(Math.random() * cypressColors.length)];
      } else {
        type = 'plane';
        col = planeColors[Math.floor(Math.random() * planeColors.length)];
      }

      const treeScale = 0.8 + Math.random() * 0.45;
      const tree = createRealisticIstanbulTree(type, treeScale, col);
      tree.position.set(tx, ty, tz);
      tree.rotation.y = Math.random() * Math.PI * 2;
      parkGroup.add(tree);
    }

    this.parkObjects.push(parkGroup);
    this.scene.add(parkGroup);
    return parkGroup;
  }

  createShorelines() {
    // 1. Neon Turkuaz (#00f0ff) Avrupa, Haliç ve Tarihi Yarımada Kıyı Kılavuz Çizgisi
    const eurPoints = [
      new THREE.Vector3(-80, 1.2, -380),
      new THREE.Vector3(-75, 1.2, -300),
      new THREE.Vector3(-70, 1.2, -220),
      new THREE.Vector3(-65, 1.2, -140),
      new THREE.Vector3(-60, 1.2, -70),
      new THREE.Vector3(-55, 1.2, -30),   // Ortaköy Köprü Ayağı
      new THREE.Vector3(-60, 1.2, 5),     // Beşiktaş
      new THREE.Vector3(-66, 1.2, 40),    // Kabataş
      new THREE.Vector3(-65, 1.2, 55),    // Karaköy Kıyı Girişi (Açık Boğaz Bağlantısı)
      new THREE.Vector3(-95, 1.2, 58),
      new THREE.Vector3(-145, 1.2, 52),
      new THREE.Vector3(-210, 1.2, 42),
      new THREE.Vector3(-280, 1.2, 30),
      new THREE.Vector3(-330, 1.2, 24),   // Haliç Başı (Eyüp / Alibeyköy)
      new THREE.Vector3(-280, 1.2, 46),
      new THREE.Vector3(-210, 1.2, 62),
      new THREE.Vector3(-145, 1.2, 78),
      new THREE.Vector3(-95, 1.2, 94),
      new THREE.Vector3(-65, 1.2, 108),   // Sarayburnu Kıyı Girişi
      new THREE.Vector3(-82, 1.2, 134),
      new THREE.Vector3(-88, 1.2, 150),
      new THREE.Vector3(-105, 1.2, 172),
      new THREE.Vector3(-140, 1.2, 186),
      new THREE.Vector3(-190, 1.2, 194),
      new THREE.Vector3(-260, 1.2, 192),
      new THREE.Vector3(-350, 1.2, 188),
      new THREE.Vector3(-450, 1.2, 188)
    ];

    const eurCurve = new THREE.CatmullRomCurve3(eurPoints);
    const eurGeo = new THREE.TubeGeometry(eurCurve, 140, 1.2, 8, false);
    this.europeShorelineMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.0,
      roughness: 0.2
    });
    this.europeShoreline = new THREE.Mesh(eurGeo, this.europeShorelineMat);
    this.scene.add(this.europeShoreline);

    // 2. Neon Pembe (#ff007f) Anadolu Kıyı Kılavuz Çizgisi
    const asiaPoints = [
      new THREE.Vector3(75, 1.2, -380),
      new THREE.Vector3(68, 1.2, -300),
      new THREE.Vector3(62, 1.2, -220),
      new THREE.Vector3(58, 1.2, -140),
      new THREE.Vector3(52, 1.2, -70),
      new THREE.Vector3(55, 1.2, -30),    // Beylerbeyi Köprü Ayağı
      new THREE.Vector3(62, 1.2, 10),     // Kuzguncuk
      new THREE.Vector3(72, 1.2, 45),     // Üsküdar
      new THREE.Vector3(78, 1.2, 75),     // Salacak (Kız Kulesi Açıkları)
      new THREE.Vector3(88, 1.2, 120),    // Harem
      new THREE.Vector3(92, 1.2, 155),    // Kadıköy Rıhtım
      new THREE.Vector3(108, 1.2, 190),   // Moda Burnu
      new THREE.Vector3(135, 1.2, 215),   // Fenerbahçe
      new THREE.Vector3(220, 1.2, 222),   // Bostancı
      new THREE.Vector3(340, 1.2, 222),   // Maltepe
      new THREE.Vector3(450, 1.2, 222)
    ];
    const asiaCurve = new THREE.CatmullRomCurve3(asiaPoints);
    const asiaGeo = new THREE.TubeGeometry(asiaCurve, 110, 1.2, 8, false);
    this.asiaShorelineMat = new THREE.MeshStandardMaterial({
      color: 0xff007f,
      emissive: 0xff007f,
      emissiveIntensity: 1.0,
      roughness: 0.2
    });
    this.asiaShoreline = new THREE.Mesh(asiaGeo, this.asiaShorelineMat);
    this.scene.add(this.asiaShoreline);

    // 3. Fotogerçekçi Kıyı Köpüğü Şeritleri (Shoreline Foam Ribbons)
    const foamTex = createShoreFoamTexture();
    this.shoreFoamMat = new THREE.MeshStandardMaterial({
      map: foamTex,
      transparent: true,
      opacity: 0.85,
      roughness: 0.2,
      color: 0xffffff,
      emissive: 0x99f6e4,
      emissiveIntensity: 0.35
    });

    const eurFoamGeo = new THREE.TubeGeometry(eurCurve, 160, 2.2, 6, false);
    const eurFoam = new THREE.Mesh(eurFoamGeo, this.shoreFoamMat);
    eurFoam.position.y = -0.6;
    this.scene.add(eurFoam);

    const asiaFoamGeo = new THREE.TubeGeometry(asiaCurve, 130, 2.2, 6, false);
    const asiaFoam = new THREE.Mesh(asiaFoamGeo, this.shoreFoamMat);
    asiaFoam.position.y = -0.6;
    this.scene.add(asiaFoam);

    // 4. Granit Sahil Rıhtımı & Kıyı Dalgakıran Kayalıkları (Seawalls & Riprap)
    const seawallMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85, metalness: 0.15 });
    const riprapMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.95 });

    // Karaköy & Eminönü Granit Rıhtımları
    const emQuay = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.8, 55), seawallMat);
    emQuay.position.set(-66, 1.4, 82);
    this.scene.add(emQuay);

    const kkQuay = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.8, 48), seawallMat);
    kkQuay.position.set(-66, 1.4, 32);
    this.scene.add(kkQuay);

    // Üsküdar & Kadıköy Rıhtımları
    const uskQuay = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.8, 52), seawallMat);
    uskQuay.position.set(73, 1.4, 52);
    this.scene.add(uskQuay);

    const kadQuay = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.8, 64), seawallMat);
    kadQuay.position.set(93, 1.4, 155);
    this.scene.add(kadQuay);

    // Sarayburnu ve Moda Burnu Doğal Dalgakıran Kayalıkları (Riprap)
    for (let i = 0; i < 18; i++) {
      const rockGeo = new THREE.DodecahedronGeometry(1.8 + Math.random() * 1.5);
      const sarayRock = new THREE.Mesh(rockGeo, riprapMat);
      sarayRock.position.set(-82 + (Math.random() - 0.5) * 12, 0.9, 134 + i * 2.2);
      sarayRock.rotation.set(Math.random(), Math.random(), Math.random());
      this.scene.add(sarayRock);

      const modaRock = new THREE.Mesh(rockGeo, riprapMat);
      modaRock.position.set(108 + (Math.random() - 0.5) * 10, 0.9, 185 + i * 2.5);
      modaRock.rotation.set(Math.random(), Math.random(), Math.random());
      this.scene.add(modaRock);
    }
  }

  /**
   * 1600 Binalık Procedural Ambient Şehir Dokusu (InstancedMesh - 4 Farklı Semt Renk Paleti)
   * Tarihi Yarımada: Alçak katlı (#b45309 kiremit, #78350f taş/ahşap)
   * Maslak/Levent: Yüksek (#0284c7 cam mavisi, #1e293b çelik antrasit)
   * Kadıköy/Üsküdar: Konut (#cbd5e1 açık arduvaz, #e2e8f0 konut beji)
   */
  createAmbientMetropole() {
    // 2800 Binalık Genişletilmiş ve Doğu Platosunu Kesintisiz Dolduran Kentsel Doku
    const ambientCount = 2800;
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);

    const ambientFacadeTex = createSkyscraperFacadeTexture();
    if (ambientFacadeTex) {
      ambientFacadeTex.wrapS = THREE.RepeatWrapping;
      ambientFacadeTex.wrapT = THREE.RepeatWrapping;
      ambientFacadeTex.repeat.set(2, 4);
    }

    this.ambientMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Beyaz taban: Instance renklerinin bozulmadan görüntülenmesi için
      map: ambientFacadeTex,
      roughness: 0.45,
      metalness: 0.35,
      emissive: 0x071120,
      emissiveMap: ambientFacadeTex,
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.95
    });

    this.ambientMesh = new THREE.InstancedMesh(boxGeo, this.ambientMat, ambientCount);
    this.ambientMesh.raycast = () => {};
    this.ambientMesh.frustumCulled = false;

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const euler = new THREE.Euler();

    // Semt ve Bölge Renk Paletleri (Hem Açık Hem Koyu Temada Güçlü Kontrast)
    const colorHistoric1 = new THREE.Color(0xb45309); // Kiremit / Terracotta
    const colorHistoric2 = new THREE.Color(0x78350f); // Ahşap / Sıcak Taş
    const colorMaslak1 = new THREE.Color(0x0284c7);   // Cam Mavisi
    const colorMaslak2 = new THREE.Color(0x1e293b);   // Çelik Antrasit
    const colorGalata1 = new THREE.Color(0x475569);   // Beyoğlu Taşı
    const colorGalata2 = new THREE.Color(0x64748b);   // Arduvaz Gri

    // Anadolu Yakası Paleti: Beyaz zeminde kaybolmayan belirgin arduvaz, taş ve çelik tonları
    const colorAsiaSlate = new THREE.Color(0x475569); // Koyu Arduvaz (#475569)
    const colorAsiaSteel = new THREE.Color(0x334155); // Çelik Grafit (#334155)
    const colorAsiaStone = new THREE.Color(0x64748b); // Orta Arduvaz (#64748b)
    const colorAsiaWarm  = new THREE.Color(0x78716c); // Sıcak Taş / Beton (#78716c)
    const colorAsiaSand  = new THREE.Color(0xa8a29e); // Kumtaşı (#a8a29e)
    const colorAsiaGlass = new THREE.Color(0x0284c7); // Ticari Cam Mavisi (#0284c7)
    const asiaPalette = [colorAsiaSlate, colorAsiaSteel, colorAsiaStone, colorAsiaWarm, colorAsiaSand];

    let placed = 0;

    // ─── Aşama 1: Avrupa Yakası (900 Bina) ───
    let attempts1 = 0;
    while (placed < 900 && attempts1++ < 6000) {
      const x = -68 - (Math.random() * 260);
      const z = (Math.random() * 660) - 330;
      if (!this.isPointOnLand(x, z, 6) || this.isInPark(x, z, 4)) continue;

      const groundY = this.getGroundElevation(x, z);
      let height = 8;
      let width = 6 + Math.random() * 6;
      let depth = width * (0.8 + Math.random() * 0.4);
      let chosenColor = colorGalata2;

      if (x < -70 && z >= 105 && z <= 185) {
        // Tarihi Yarımada: Alçak katlı kiremit ve taş doku
        height = 6 + Math.random() * 8;
        width = 8 + Math.random() * 7;
        depth = width * (0.8 + Math.random() * 0.4);
        chosenColor = Math.random() < 0.55 ? colorHistoric1 : colorHistoric2;
      } else if (x < -65 && z < -40) {
        // Maslak / Levent: Yüksek modern gökdelenler
        height = 26 + Math.random() * 60;
        width = 8 + Math.random() * 8;
        depth = width * (0.8 + Math.random() * 0.4);
        chosenColor = Math.random() < 0.5 ? colorMaslak1 : colorMaslak2;
      } else if (x < -60 && z >= 15 && z <= 60) {
        // Galata / Beyoğlu: Orta ölçek kentsel doku
        height = 9 + Math.random() * 10;
        width = 7 + Math.random() * 6;
        depth = width;
        chosenColor = Math.random() < 0.5 ? colorGalata1 : colorGalata2;
      } else {
        height = 7 + Math.random() * 12;
        width = 7 + Math.random() * 6;
        chosenColor = colorGalata2;
      }

      position.set(x, groundY + (height / 2), z);
      euler.set(0, (Math.random() - 0.5) * 0.25, 0);
      quaternion.setFromEuler(euler);
      scale.set(width, height, depth);

      matrix.compose(position, quaternion, scale);
      this.ambientMesh.setMatrixAt(placed, matrix);
      this.ambientMesh.setColorAt(placed, chosenColor);
      placed++;
    }

    // ─── Aşama 2: Anadolu Kıyı & Çekirdek Hattı (700 Bina, X: 68 - 150) ───
    let attempts2 = 0;
    while (placed < 1600 && attempts2++ < 6000) {
      const x = 68 + Math.random() * 82; // 68 - 150
      const z = (Math.random() * 440) - 220;
      if (!this.isPointOnLand(x, z, 6) || this.isInPark(x, z, 4)) continue;

      const groundY = this.getGroundElevation(x, z);
      let height = 8;
      let width = 7 + Math.random() * 6;
      let depth = width * (0.8 + Math.random() * 0.4);
      let chosenColor = asiaPalette[Math.floor(Math.random() * asiaPalette.length)];

      if (x > 120 && z < -30) {
        // Ataşehir / Kozyatağı kuleleri
        height = 18 + Math.random() * 30;
        width = 8 + Math.random() * 7;
        chosenColor = Math.random() < 0.35 ? colorAsiaGlass : colorAsiaSteel;
      } else {
        // Kadıköy & Üsküdar sahil konutları
        height = 8 + Math.random() * 12;
      }

      position.set(x, groundY + (height / 2), z);
      euler.set(0, (Math.random() - 0.5) * 0.25, 0);
      quaternion.setFromEuler(euler);
      scale.set(width, height, depth);

      matrix.compose(position, quaternion, scale);
      this.ambientMesh.setMatrixAt(placed, matrix);
      this.ambientMesh.setColorAt(placed, chosenColor);
      placed++;
    }

    // ─── Aşama 3: Anadolu Doğu Platosu Kararlı Izgara (X: 100 - 450, Z: -220 - 200) ───
    // Boş beyaz çölü ortadan kaldıran, X ekseni boyunca kesintisiz dağılan kentsel bloklar
    const gridCols = 24;
    const gridRows = 24;
    const colStep = (450 - 100) / gridCols; // ~14.5 birim
    const rowStep = (200 - (-220)) / gridRows; // ~17.5 birim

    for (let c = 0; c < gridCols && placed < ambientCount; c++) {
      const baseX = 100 + c * colStep;
      for (let r = 0; r < gridRows && placed < ambientCount; r++) {
        const baseZ = -220 + r * rowStep;
        const x = baseX + (Math.random() - 0.5) * (colStep * 0.9);
        const z = baseZ + (Math.random() - 0.5) * (rowStep * 0.9);

        if (!this.isPointOnLand(x, z, 6) || this.isInPark(x, z, 4)) continue;

        // Ufka doğru yumuşak seyrelme (%35)
        const taper = 1.0 - ((x - 100) / 350) * 0.35;
        if (Math.random() > taper) continue;

        const groundY = this.getGroundElevation(x, z);
        // Belirgin 3D gölgeli hacimli kütleler (8 - 22 birim yükseklik)
        const height = 8.0 + Math.random() * 14.0;
        const width = 7.5 + Math.random() * 6.5;
        const depth = width * (0.8 + Math.random() * 0.4);
        const chosenColor = asiaPalette[Math.floor(Math.random() * asiaPalette.length)];

        position.set(x, groundY + (height / 2), z);
        euler.set(0, (Math.random() - 0.5) * 0.25, 0);
        quaternion.setFromEuler(euler);
        scale.set(width, height, depth);

        matrix.compose(position, quaternion, scale);
        this.ambientMesh.setMatrixAt(placed, matrix);
        this.ambientMesh.setColorAt(placed, chosenColor);
        placed++;
      }
    }

    // Kalan yuvaları doğu platosu boyunca aralıklı doldur
    let attempts3 = 0;
    while (placed < ambientCount && attempts3++ < 6000) {
      const x = 110 + Math.random() * 330;
      const z = (Math.random() * 400) - 200;
      if (!this.isPointOnLand(x, z, 6) || this.isInPark(x, z, 4)) continue;

      const groundY = this.getGroundElevation(x, z);
      const height = 8.0 + Math.random() * 12.0;
      const width = 7.5 + Math.random() * 6.0;
      const depth = width * (0.8 + Math.random() * 0.4);
      const chosenColor = asiaPalette[Math.floor(Math.random() * asiaPalette.length)];

      position.set(x, groundY + (height / 2), z);
      euler.set(0, (Math.random() - 0.5) * 0.25, 0);
      quaternion.setFromEuler(euler);
      scale.set(width, height, depth);

      matrix.compose(position, quaternion, scale);
      this.ambientMesh.setMatrixAt(placed, matrix);
      this.ambientMesh.setColorAt(placed, chosenColor);
      placed++;
    }

    this.ambientMesh.instanceMatrix.needsUpdate = true;
    if (this.ambientMesh.instanceColor) {
      this.ambientMesh.instanceColor.needsUpdate = true;
    }
    this.ambientMesh.receiveShadow = true;
    this.ambientMesh.castShadow = true;
    this.scene.add(this.ambientMesh);
  }

  /**
   * 15 Temmuz Şehitler Köprüsü (Asma Köprü Mimarisi, Portallar & AKOM Telemetrisi)
   */
  /**
   * İstanbul'un Tüm İkonik Köprüleri (15 Temmuz, Fatih Sultan Mehmet, Yavuz Sultan Selim, Haliç Metro ve Tarihi Galata)
   */
  createBridge() {
    this.bridgeGroup = new THREE.Group();

    // 1. 15 Temmuz Şehitler Köprüsü (1. Boğaziçi Köprüsü - Ortaköy & Beylerbeyi)
    this.create15TemmuzBridge();

    // 2. Fatih Sultan Mehmet Köprüsü (FSM / 2. Boğaziçi Köprüsü - Hisarüstü & Kavacık)
    const fsmBridge = this.createFSMBridge();
    this.bridgeGroup.add(fsmBridge);

    // 3. Yavuz Sultan Selim Köprüsü (YSS / 3. Boğaziçi Köprüsü - Garipçe & Poyrazköy)
    const yssBridge = this.createYSSBridge();
    this.bridgeGroup.add(yssBridge);

    // 4. Haliç Metro Geçiş Köprüsü (Golden Horn Metro Bridge & Su Üstü İstasyonu)
    const halicBridge = this.createHalicMetroBridge();
    this.bridgeGroup.add(halicBridge);

    // 5. Tarihi Galata Köprüsü (Karaköy - Eminönü, Çift Katlı, Restoranlar & Balıkçılar)
    const galataBridge = this.createGalataBridge();
    this.bridgeGroup.add(galataBridge);

    this.scene.add(this.bridgeGroup);
  }

  create15TemmuzBridge() {
    const bridgeZ = -30;

    // 1. Köprü Tabliyesi ve Asfalt Yol
    const deckGeo = new THREE.BoxGeometry(220, 2.5, 14);
    const bridgeAsphaltTex = createAsphaltTexture();
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x181e28,
      map: bridgeAsphaltTex,
      roughness: 0.85,
      metalness: 0.2
    });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(0, 21.5, bridgeZ);
    this.bridgeGroup.add(deck);

    // Beyaz Şerit Çizgisi
    const laneGeo = new THREE.BoxGeometry(216, 0.1, 0.4);
    const laneMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const laneLine = new THREE.Mesh(laneGeo, laneMat);
    laneLine.position.set(0, 22.8, bridgeZ);
    this.bridgeGroup.add(laneLine);

    // Kenar Korkulukları
    const railGeo = new THREE.BoxGeometry(220, 1.2, 0.6);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4 });
    const northRail = new THREE.Mesh(railGeo, railMat);
    northRail.position.set(0, 23.3, bridgeZ - 6.7);
    this.bridgeGroup.add(northRail);

    const southRail = new THREE.Mesh(railGeo, railMat);
    southRail.position.set(0, 23.3, bridgeZ + 6.7);
    this.bridgeGroup.add(southRail);

    // 2. İkiz Çelik H-Kuleler (Ortaköy & Beylerbeyi Portalları)
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0x8a9ba8,
      metalness: 0.65,
      roughness: 0.35
    });

    const createHTower = (xPos) => {
      const towerGroup = new THREE.Group();
      towerGroup.position.set(xPos, 0, bridgeZ);

      const legGeo = new THREE.BoxGeometry(4.5, 75, 4.5);
      const northLeg = new THREE.Mesh(legGeo, towerMat);
      northLeg.position.set(0, 37.5, -5.5);
      towerGroup.add(northLeg);

      const southLeg = new THREE.Mesh(legGeo, towerMat);
      southLeg.position.set(0, 37.5, 5.5);
      towerGroup.add(southLeg);

      const crossGeo = new THREE.BoxGeometry(4.2, 3.5, 11);
      const lowerCross = new THREE.Mesh(crossGeo, towerMat);
      lowerCross.position.set(0, 19, 0);
      towerGroup.add(lowerCross);

      const upperCross = new THREE.Mesh(crossGeo, towerMat);
      upperCross.position.set(0, 68, 0);
      towerGroup.add(upperCross);

      return towerGroup;
    };

    const europeTower = createHTower(-55);
    const asiaTower = createHTower(55);
    this.bridgeGroup.add(europeTower);
    this.bridgeGroup.add(asiaTower);

    // 3. Kavisli Taşıyıcı Ana Halatlar (Turkuaz / Cyan Tescilli Aydınlatma)
    this.bridgeCableMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });

    const createCatenaryCable = (zOffset) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-105, 9, bridgeZ + zOffset),
        new THREE.Vector3(-55, 74, bridgeZ + zOffset),
        new THREE.Vector3(0, 24, bridgeZ + zOffset),
        new THREE.Vector3(55, 74, bridgeZ + zOffset),
        new THREE.Vector3(105, 9, bridgeZ + zOffset)
      ]);

      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.7, 8, false);
      const cableMesh = new THREE.Mesh(tubeGeo, this.bridgeCableMat);
      this.bridgeGroup.add(cableMesh);

      // Dikey Askı Halatları
      const suspenderMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.7 });
      for (let x = -50; x <= 50; x += 5) {
        const u = (x + 55) / 110;
        const cableY = 24 + Math.pow(u - 0.5, 2) * 200;
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, cableY, bridgeZ + zOffset),
          new THREE.Vector3(x, 22.5, bridgeZ + zOffset)
        ]);
        const suspender = new THREE.Line(lineGeo, suspenderMat);
        this.bridgeGroup.add(suspender);
      }
    };

    createCatenaryCable(-5.5);
    createCatenaryCable(5.5);

    // 4. Kule Tepesi Uçak İkaz Flaşörleri
    const beaconGeo = new THREE.SphereGeometry(0.75, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const bEurope = new THREE.Mesh(beaconGeo, beaconMat);
    bEurope.position.set(-55, 75.8, bridgeZ);
    this.bridgeGroup.add(bEurope);

    const bAsia = new THREE.Mesh(beaconGeo, beaconMat);
    bAsia.position.set(55, 75.8, bridgeZ);
    this.bridgeGroup.add(bAsia);
  }

  createFSMBridge() {
    const fsmGroup = new THREE.Group();
    const fsmZ = -170;
    const centerX = -27.5;

    // 1. 8-Şerit TEM Otoyolu Tabliyesi
    const deckGeo = new THREE.BoxGeometry(220, 2.6, 17);
    const bridgeAsphaltTex = createAsphaltTexture();
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x181e28,
      map: bridgeAsphaltTex,
      roughness: 0.85,
      metalness: 0.2
    });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(centerX, 25.5, fsmZ);
    fsmGroup.add(deck);

    // Beyaz Şerit Çizgisi
    const laneGeo = new THREE.BoxGeometry(216, 0.1, 0.4);
    const laneMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const laneLine = new THREE.Mesh(laneGeo, laneMat);
    laneLine.position.set(centerX, 26.9, fsmZ);
    fsmGroup.add(laneLine);

    // Kenar Çelik Korkulukları
    const railGeo = new THREE.BoxGeometry(220, 1.2, 0.6);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4 });
    const northRail = new THREE.Mesh(railGeo, railMat);
    northRail.position.set(centerX, 27.3, fsmZ - 8.2);
    fsmGroup.add(northRail);

    const southRail = new THREE.Mesh(railGeo, railMat);
    southRail.position.set(centerX, 27.3, fsmZ + 8.2);
    fsmGroup.add(southRail);

    // 2. FSM Çelik Portal Kuleleri (Hisarüstü & Kavacık)
    const fsmTowerMat = new THREE.MeshStandardMaterial({
      color: 0x5a6578,
      metalness: 0.7,
      roughness: 0.3
    });
    const fsmTrussMat = new THREE.MeshStandardMaterial({
      color: 0xc2410c, // Turuncu/kızıl astar koruma detayı
      metalness: 0.5,
      roughness: 0.4
    });

    const createFSMTower = (xPos) => {
      const tower = new THREE.Group();
      tower.position.set(xPos, 0, fsmZ);

      const legGeo = new THREE.BoxGeometry(5.0, 72, 5.0);
      const northLeg = new THREE.Mesh(legGeo, fsmTowerMat);
      northLeg.position.set(0, 36, -7.0);
      tower.add(northLeg);

      const southLeg = new THREE.Mesh(legGeo, fsmTowerMat);
      southLeg.position.set(0, 36, 7.0);
      tower.add(southLeg);

      const beamGeo = new THREE.BoxGeometry(4.8, 3.8, 14);
      const lowerBeam = new THREE.Mesh(beamGeo, fsmTowerMat);
      lowerBeam.position.set(0, 23, 0);
      tower.add(lowerBeam);

      const upperBeam = new THREE.Mesh(beamGeo, fsmTowerMat);
      upperBeam.position.set(0, 66, 0);
      tower.add(upperBeam);

      // Karakteristik X-Çapraz Kafes Kirişleri (Cross-Truss)
      const trussGeo = new THREE.CylinderGeometry(0.45, 0.45, 44, 8);
      const truss1 = new THREE.Mesh(trussGeo, fsmTrussMat);
      truss1.position.set(0, 44.5, 0);
      truss1.rotation.x = Math.atan2(14, 43);
      tower.add(truss1);

      const truss2 = new THREE.Mesh(trussGeo, fsmTrussMat);
      truss2.position.set(0, 44.5, 0);
      truss2.rotation.x = -Math.atan2(14, 43);
      tower.add(truss2);

      return tower;
    };

    const fsmEuropeTower = createFSMTower(-78);
    const fsmAsiaTower = createFSMTower(23);
    fsmGroup.add(fsmEuropeTower);
    fsmGroup.add(fsmAsiaTower);

    // 3. FSM Kavisli Taşıyıcı Halatlar (Tescilli Kor Kırmızısı / Kızıl LED Aydınlatma)
    this.fsmCableMat = new THREE.MeshStandardMaterial({
      color: 0xff2836,
      emissive: 0xff2836,
      emissiveIntensity: 0.85,
      roughness: 0.2
    });

    const createFSMCatenary = (zOffset) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-135, 12, fsmZ + zOffset),
        new THREE.Vector3(-78, 72, fsmZ + zOffset),
        new THREE.Vector3(centerX, 27.5, fsmZ + zOffset),
        new THREE.Vector3(23, 72, fsmZ + zOffset),
        new THREE.Vector3(80, 12, fsmZ + zOffset)
      ]);

      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.75, 8, false);
      const cableMesh = new THREE.Mesh(tubeGeo, this.fsmCableMat);
      fsmGroup.add(cableMesh);

      // Dikey Askı Halatları
      const suspenderMat = new THREE.LineBasicMaterial({ color: 0xff4455, transparent: true, opacity: 0.7 });
      for (let x = -72; x <= 18; x += 6) {
        const u = (x - (-78)) / (23 - (-78));
        const cableY = 27.5 + Math.pow(u - 0.5, 2) * 178;
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, cableY, fsmZ + zOffset),
          new THREE.Vector3(x, 26.5, fsmZ + zOffset)
        ]);
        const suspender = new THREE.Line(lineGeo, suspenderMat);
        fsmGroup.add(suspender);
      }
    };

    createFSMCatenary(-7.0);
    createFSMCatenary(7.0);

    // 4. Kule Tepesi Uçak İkaz Lambaları
    const fsmBeaconGeo = new THREE.SphereGeometry(0.75, 8, 8);
    const fsmBeaconMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const bEuropeFSM = new THREE.Mesh(fsmBeaconGeo, fsmBeaconMat);
    bEuropeFSM.position.set(-78, 73.2, fsmZ);
    fsmGroup.add(bEuropeFSM);

    const bAsiaFSM = new THREE.Mesh(fsmBeaconGeo, fsmBeaconMat);
    bAsiaFSM.position.set(23, 73.2, fsmZ);
    fsmGroup.add(bAsiaFSM);

    return fsmGroup;
  }

  createYSSBridge() {
    const yssGroup = new THREE.Group();
    const yssZ = -320;
    const centerX = -10;

    // 1. 59 Metre Ultra Geniş Tabliye (8 Şerit + Çift Hat Hızlı Tren Ray Koridoru)
    const deckGeo = new THREE.BoxGeometry(360, 3.0, 22);
    const bridgeAsphaltTex = createAsphaltTexture();
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x1e2430,
      map: bridgeAsphaltTex,
      roughness: 0.85,
      metalness: 0.25
    });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(centerX, 30.5, yssZ);
    yssGroup.add(deck);

    // Ortadaki Çift Hat Yüksek Hızlı Tren (YHT) Ray Koridoru
    const trackBedGeo = new THREE.BoxGeometry(356, 0.3, 4.5);
    const trackBedMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
    const trackBed = new THREE.Mesh(trackBedGeo, trackBedMat);
    trackBed.position.set(centerX, 32.1, yssZ);
    yssGroup.add(trackBed);

    const railGeo = new THREE.BoxGeometry(356, 0.2, 0.3);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const rail1 = new THREE.Mesh(railGeo, railMat);
    rail1.position.set(centerX, 32.35, yssZ - 1.2);
    yssGroup.add(rail1);

    const rail2 = new THREE.Mesh(railGeo, railMat);
    rail2.position.set(centerX, 32.35, yssZ + 1.2);
    yssGroup.add(rail2);

    // Beyaz Şerit Çizgileri
    const laneGeo = new THREE.BoxGeometry(356, 0.1, 0.4);
    const laneMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const laneNorth = new THREE.Mesh(laneGeo, laneMat);
    laneNorth.position.set(centerX, 32.1, yssZ - 5.5);
    yssGroup.add(laneNorth);

    const laneSouth = new THREE.Mesh(laneGeo, laneMat);
    laneSouth.position.set(centerX, 32.1, yssZ + 5.5);
    yssGroup.add(laneSouth);

    // 2. YSS 322 Metrelik Ters-Y / Elmas (Diamond A-Frame) Kuleleri (Garipçe & Poyrazköy)
    const yssTowerMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.6,
      roughness: 0.3
    });

    const createDiamondTower = (xPos) => {
      const tower = new THREE.Group();
      tower.position.set(xPos, 0, yssZ);

      const legGeo = new THREE.CylinderGeometry(2.4, 3.8, 55, 8);
      const northLeg = new THREE.Mesh(legGeo, yssTowerMat);
      northLeg.position.set(0, 27, -8.0);
      northLeg.rotation.x = Math.atan2(8, 54);
      tower.add(northLeg);

      const southLeg = new THREE.Mesh(legGeo, yssTowerMat);
      southLeg.position.set(0, 27, 8.0);
      southLeg.rotation.x = -Math.atan2(8, 54);
      tower.add(southLeg);

      const throatGeo = new THREE.BoxGeometry(6.5, 5.0, 7.0);
      const throat = new THREE.Mesh(throatGeo, yssTowerMat);
      throat.position.set(0, 54, 0);
      tower.add(throat);

      const upperGeo = new THREE.CylinderGeometry(1.6, 2.8, 41, 8);
      const upperPylon = new THREE.Mesh(upperGeo, yssTowerMat);
      upperPylon.position.set(0, 74.5, 0);
      tower.add(upperPylon);

      return tower;
    };

    const yssEuropeTower = createDiamondTower(-105);
    const yssAsiaTower = createDiamondTower(85);
    yssGroup.add(yssEuropeTower);
    yssGroup.add(yssAsiaTower);

    // 3. YSS Hibrit Askı Sistemi (Ana Katener + Eğik Gergi Yelpaze Halatları)
    this.yssCableMat = new THREE.MeshStandardMaterial({
      color: 0xdbeafe, // Buz Mavisi / Platin Safir Aydınlatma
      emissive: 0xdbeafe,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });

    // Ana Katener Kablosu
    const yssCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-190, 14, yssZ),
      new THREE.Vector3(-105, 94, yssZ),
      new THREE.Vector3(centerX, 33, yssZ),
      new THREE.Vector3(85, 94, yssZ),
      new THREE.Vector3(170, 14, yssZ)
    ]);
    const yssTubeGeo = new THREE.TubeGeometry(yssCurve, 72, 0.8, 8, false);
    const yssMainCable = new THREE.Mesh(yssTubeGeo, this.yssCableMat);
    yssGroup.add(yssMainCable);

    // Eğik Gergili Yelpaze Halatlar (Cable-Stayed Fan Cables)
    const fanMat = new THREE.LineBasicMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.75 });
    const createStayFan = (towerX) => {
      for (let offset = 12; offset <= 72; offset += 10) {
        const stayGeo1 = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(towerX, 84, yssZ),
          new THREE.Vector3(towerX - offset, 31.8, yssZ - 9)
        ]);
        yssGroup.add(new THREE.Line(stayGeo1, fanMat));

        const stayGeo2 = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(towerX, 84, yssZ),
          new THREE.Vector3(towerX + offset, 31.8, yssZ + 9)
        ]);
        yssGroup.add(new THREE.Line(stayGeo2, fanMat));
      }
    };
    createStayFan(-105);
    createStayFan(85);

    // 4. Kule Zirvesi Uçak İkaz Lambaları
    const yssBeaconGeo = new THREE.SphereGeometry(0.85, 8, 8);
    const yssBeaconMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const bEuropeYSS = new THREE.Mesh(yssBeaconGeo, yssBeaconMat);
    bEuropeYSS.position.set(-105, 95.8, yssZ);
    yssGroup.add(bEuropeYSS);

    const bAsiaYSS = new THREE.Mesh(yssBeaconGeo, yssBeaconMat);
    bAsiaYSS.position.set(85, 95.8, yssZ);
    yssGroup.add(bAsiaYSS);

    return yssGroup;
  }

  createHalicMetroBridge() {
    const halicGroup = new THREE.Group();
    const halicX = -120;
    const centerZ = 77.5;

    // 1. Köprü Tabliyesi (Metro Rayları & Yaya Yolu)
    const deckGeo = new THREE.BoxGeometry(10, 2.2, 70);
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.5,
      roughness: 0.5
    });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(halicX, 11.5, centerZ);
    halicGroup.add(deck);

    // Çift Hat Metro Rayları
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const r1 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 68), railMat);
    r1.position.set(halicX - 1.5, 12.7, centerZ);
    halicGroup.add(r1);

    const r2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 68), railMat);
    r2.position.set(halicX + 1.5, 12.7, centerZ);
    halicGroup.add(r2);

    // 2. İkonik Eğik Beyaz Çelik Pilonlar (Tilted Horn Pylons)
    const pylonMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.4,
      roughness: 0.2
    });

    const pylonGeo = new THREE.CylinderGeometry(0.8, 1.6, 36, 12);
    const northPylon = new THREE.Mesh(pylonGeo, pylonMat);
    northPylon.position.set(halicX - 3.8, 25, centerZ - 8);
    northPylon.rotation.z = 0.12;
    northPylon.rotation.x = -0.16;
    halicGroup.add(northPylon);

    const southPylon = new THREE.Mesh(pylonGeo, pylonMat);
    southPylon.position.set(halicX + 3.8, 25, centerZ + 8);
    southPylon.rotation.z = -0.12;
    southPylon.rotation.x = 0.16;
    halicGroup.add(southPylon);

    // 3. Beyaz Yelpaze Gergi Kabloları
    this.halicCableMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    for (let zOffset = -24; zOffset <= 24; zOffset += 8) {
      if (Math.abs(zOffset) < 4) continue;
      const stayGeo1 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(halicX - 3.8, 38, centerZ - 8),
        new THREE.Vector3(halicX - 4.5, 12.6, centerZ + zOffset)
      ]);
      halicGroup.add(new THREE.Line(stayGeo1, this.halicCableMat));

      const stayGeo2 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(halicX + 3.8, 38, centerZ + 8),
        new THREE.Vector3(halicX + 4.5, 12.6, centerZ + zOffset)
      ]);
      halicGroup.add(new THREE.Line(stayGeo2, this.halicCableMat));
    }

    // 4. Su Üstü Haliç Metro İstasyonu (Cam Kanopi & Yolcu Platformu)
    const canopyGeo = new THREE.CylinderGeometry(5.5, 5.5, 22, 16, 1, false, 0, Math.PI);
    const canopyMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
      transmission: 0.6
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(halicX, 15, centerZ);
    canopy.rotation.x = Math.PI / 2;
    canopy.rotation.y = Math.PI;
    halicGroup.add(canopy);

    // İstasyon Peron İç Aydınlatması
    const stationLight = new THREE.PointLight(0xfffbeb, 1.8, 35);
    stationLight.position.set(halicX, 14, centerZ);
    halicGroup.add(stationLight);

    // 5. M2 Metro Tren Vagonları
    const trainMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.3 });
    const trainGeo = new THREE.BoxGeometry(3.2, 2.4, 18);
    const metroTrain = new THREE.Mesh(trainGeo, trainMat);
    metroTrain.position.set(halicX, 13.8, centerZ - 4);
    halicGroup.add(metroTrain);

    return halicGroup;
  }

  createGalataBridge() {
    const galataGroup = new THREE.Group();
    const galataX = -48;
    const centerZ = 97;

    // 1. Çift Katlı Tarihi Baskül Köprü Tabliyesi
    // Alt Kat: Restoranlar, Teraslar ve Balkonlar
    const lowerDeckGeo = new THREE.BoxGeometry(14, 1.5, 48);
    const lowerDeckMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.9 });
    const lowerDeck = new THREE.Mesh(lowerDeckGeo, lowerDeckMat);
    lowerDeck.position.set(galataX, 4.2, centerZ);
    galataGroup.add(lowerDeck);

    // Restoran Tente ve Işıkları
    const awningMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
    for (let z = 78; z <= 116; z += 9) {
      const awning = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 5.5), awningMat);
      awning.position.set(galataX - 6.2, 5.5, z);
      galataGroup.add(awning);

      const awningEast = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 5.5), awningMat);
      awningEast.position.set(galataX + 6.2, 5.5, z);
      galataGroup.add(awningEast);

      const restLight = new THREE.PointLight(0xffb703, 0.9, 12);
      restLight.position.set(galataX - 5.5, 4.8, z);
      galataGroup.add(restLight);
    }

    // Üst Kat: Asfalt Taşıt Yolu, T1 Tramvay Hattı & Kaldırımlar
    const upperDeckGeo = new THREE.BoxGeometry(13.5, 1.4, 48);
    const bridgeAsphaltTex = createAsphaltTexture();
    const upperDeckMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      map: bridgeAsphaltTex,
      roughness: 0.85
    });
    const upperDeck = new THREE.Mesh(upperDeckGeo, upperDeckMat);
    upperDeck.position.set(galataX, 7.2, centerZ);
    galataGroup.add(upperDeck);

    // T1 Tramvay Rayları
    const tramRailMat = new THREE.MeshStandardMaterial({ color: 0xa1a1aa, metalness: 0.9, roughness: 0.2 });
    const tr1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 46), tramRailMat);
    tr1.position.set(galataX - 0.9, 8.0, centerZ);
    galataGroup.add(tr1);

    const tr2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 46), tramRailMat);
    tr2.position.set(galataX + 0.9, 8.0, centerZ);
    galataGroup.add(tr2);

    // Tarihi Yeşil Ferforje Korkuluklar
    const railMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.5 });
    const westRail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 48), railMat);
    westRail.position.set(galataX - 6.5, 8.4, centerZ);
    galataGroup.add(westRail);

    const eastRail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 48), railMat);
    eastRail.position.set(galataX + 6.5, 8.4, centerZ);
    galataGroup.add(eastRail);

    // Nostaljik Döküm Sokak Lambaları & Oltasıyla Balık Tutan İstanbullular
    const fisherMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 });
    for (let z = 79; z <= 115; z += 6) {
      const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 2.2, 8), railMat);
      lampPost.position.set(galataX + 6.4, 9.3, z);
      galataGroup.add(lampPost);

      const lampHead = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffeedd }));
      lampHead.position.set(galataX + 6.4, 10.5, z);
      galataGroup.add(lampHead);

      const fisher = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.4, 6), fisherMat);
      fisher.position.set(galataX + 6.1, 8.6, z + 1.8);
      galataGroup.add(fisher);

      const rodGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(galataX + 6.1, 9.2, z + 1.8),
        new THREE.Vector3(galataX + 11.0, 1.2, z + 2.4)
      ]);
      galataGroup.add(new THREE.Line(rodGeo, new THREE.LineBasicMaterial({ color: 0xd4d4d8 })));
    }

    return galataGroup;
  }


  /**
   * İkonik Tarihi ve Mimari Landmark'lar (Kesin Coğrafi Koordinatlar)
   */
  createLandmarks() {
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd6cbb6, roughness: 0.6 });
    const balconyMat = new THREE.MeshStandardMaterial({ color: 0xa89985, roughness: 0.5 });

    // 1. KIZ KULESİ — YÜKSEK DETAYLI TARİHİ OSMANLI MİMARİSİ (Salacak Açıkları)
    this.maidenTowerGroup = new THREE.Group();
    this.maidenTowerGroup.position.set(35, 0, 65);

    const maidenRockMat = new THREE.MeshStandardMaterial({ color: 0x27303f, roughness: 0.92 });
    const maidenFortressMat = new THREE.MeshStandardMaterial({ color: 0xd5cbb6, roughness: 0.72 });
    const maidenTowerMat = new THREE.MeshStandardMaterial({ color: 0xf1ece1, roughness: 0.65 });
    const maidenRoofMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.45, metalness: 0.15 });
    const maidenGoldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.88, roughness: 0.2 });
    const maidenIronMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.7 });

    // A. Salacak Doğal Andezit Kayalık Adacığı ve Dalgakıran
    const isletGeo = new THREE.CylinderGeometry(25, 30, 4.2, 10);
    const islet = new THREE.Mesh(isletGeo, maidenRockMat);
    islet.position.y = 2.1;
    this.maidenTowerGroup.add(islet);

    // Kıyı Dalgakıran İri Kayaları
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const bRad = 27 + Math.sin(i * 3.7) * 2.5;
      const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2 + Math.random() * 1.2), maidenRockMat);
      boulder.position.set(Math.sin(angle) * bRad, 1.2, Math.cos(angle) * bRad);
      boulder.rotation.set(Math.random(), Math.random(), Math.random());
      this.maidenTowerGroup.add(boulder);
    }

    // B. Tarihi Çokgen Avlu ve Mazgallı Bastiyon Duvarları
    const fortressGeo = new THREE.CylinderGeometry(15.5, 16.5, 6.8, 8);
    const fortress = new THREE.Mesh(fortressGeo, maidenFortressMat);
    fortress.position.y = 7.4;
    this.maidenTowerGroup.add(fortress);

    // Bastiyon Mazgal Siperlikleri (Crenellations)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const merlon = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.4, 1.4), maidenFortressMat);
      merlon.position.set(Math.sin(angle) * 15.8, 11.2, Math.cos(angle) * 15.8);
      merlon.rotation.y = angle;
      this.maidenTowerGroup.add(merlon);
    }

    // C. Sekizgen Beyaz Kesme Taş Fener Kulesi
    const towerGeo = new THREE.CylinderGeometry(6.6, 7.6, 12, 8);
    const tower = new THREE.Mesh(towerGeo, maidenTowerMat);
    tower.position.y = 16.8;
    this.maidenTowerGroup.add(tower);

    const towerCorniceGeo = new THREE.CylinderGeometry(7.8, 6.8, 1.2, 8);
    const towerCornice = new THREE.Mesh(towerCorniceGeo, maidenTowerMat);
    towerCornice.position.y = 23.2;
    this.maidenTowerGroup.add(towerCornice);

    // D. Seyir Balkonu ve Dövme Demir Korkuluk
    const maidenBalconyGeo = new THREE.CylinderGeometry(8.6, 8.6, 1.4, 8);
    const maidenBalcony = new THREE.Mesh(maidenBalconyGeo, maidenTowerMat);
    maidenBalcony.position.y = 24.5;
    this.maidenTowerGroup.add(maidenBalcony);

    const maidenRailGeo = new THREE.TorusGeometry(8.3, 0.12, 6, 16);
    const maidenRail = new THREE.Mesh(maidenRailGeo, maidenIronMat);
    maidenRail.rotation.x = Math.PI / 2;
    maidenRail.position.y = 26.2;
    this.maidenTowerGroup.add(maidenRail);

    // E. Camlı Fener Odası (Lantern Room)
    const lanternGlassMat = new THREE.MeshStandardMaterial({
      color: 0xfff3b0,
      transparent: true,
      opacity: 0.88,
      roughness: 0.1,
      emissive: 0xffd54f,
      emissiveIntensity: 0.5
    });
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 4.8, 5.2, 12), lanternGlassMat);
    lantern.position.y = 27.8;
    this.maidenTowerGroup.add(lantern);

    // F. Kırmızı Osmanlı Kiremit Çatısı & Külah
    const maidenRoofGeo = new THREE.ConeGeometry(5.6, 7.8, 8);
    const maidenRoof = new THREE.Mesh(maidenRoofGeo, maidenRoofMat);
    maidenRoof.position.y = 34.0;
    this.maidenTowerGroup.add(maidenRoof);

    // G. Altın Yaldızlı Zirve Mili & Hilal Alem
    const maidenSpireGeo = new THREE.CylinderGeometry(0.2, 0.5, 6, 8);
    const maidenSpire = new THREE.Mesh(maidenSpireGeo, maidenGoldMat);
    maidenSpire.position.y = 39.8;
    this.maidenTowerGroup.add(maidenSpire);

    const maidenCrescentGeo = new THREE.TorusGeometry(0.85, 0.20, 6, 16, Math.PI * 1.35);
    const maidenCrescent = new THREE.Mesh(maidenCrescentGeo, maidenGoldMat);
    maidenCrescent.position.set(0, 43.0, 0);
    maidenCrescent.rotation.y = Math.PI / 4;
    this.maidenTowerGroup.add(maidenCrescent);

    // H. Ahşap Palamar İskelesi & Giriş Feneri
    const pierWoodMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.8 });
    const pierGeo = new THREE.BoxGeometry(6, 1.2, 12);
    const pier = new THREE.Mesh(pierGeo, pierWoodMat);
    pier.position.set(0, 1.8, 26);
    this.maidenTowerGroup.add(pier);

    const pierLight = new THREE.PointLight(0xffaa33, 1.2, 18);
    pierLight.position.set(0, 3.5, 30);
    this.maidenTowerGroup.add(pierLight);

    // I. Kız Kulesi 360° Dönen Hacimsel Fener Işığı (Volumetric Horizon Beam)
    const beamLength = 48;
    const beamGeo = new THREE.CylinderGeometry(0.6, 4.2, beamLength, 16, 1, true);
    beamGeo.rotateX(Math.PI / 2);
    beamGeo.translate(0, 0, beamLength / 2);

    let beamAlphaTex = null;
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      grad.addColorStop(0.35, 'rgba(255, 240, 150, 0.45)');
      grad.addColorStop(0.8, 'rgba(255, 230, 100, 0.1)');
      grad.addColorStop(1, 'rgba(255, 230, 100, 0.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 256);
      beamAlphaTex = new THREE.CanvasTexture(canvas);
    }

    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfff499,
      alphaMap: beamAlphaTex,
      transparent: true,
      opacity: 0.46,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.maidenLightBeam = new THREE.Mesh(beamGeo, beamMat);
    this.maidenLightBeam.position.set(0, 28.0, 0);
    this.maidenTowerGroup.add(this.maidenLightBeam);

    this.scene.add(this.maidenTowerGroup);

    // 2. GALATA KULESİ — YÜKSEK DETAYLI MİMARİ ENTEGRASYONU (Ceneviz & Osmanlı Tarihi Silüeti)
    this.galataTowerGroup = new THREE.Group();
    this.galataTowerGroup.position.set(-105, 18, 35);

    // ─── Prosedürel PBR Kalker Taş ve Külah Dokuları ───
    let galataStoneTex = null;
    let galataStoneBump = null;
    let galataRoofTex = null;

    if (typeof document !== 'undefined') {
      // 1. Kalker kesme taş dokusu (Doğal taş tonları, derzler, doku granülleri)
      const stoneCanvas = document.createElement('canvas');
      stoneCanvas.width = 512;
      stoneCanvas.height = 512;
      const sCtx = stoneCanvas.getContext('2d');
      if (sCtx) {
        sCtx.fillStyle = '#bfaea0';
        sCtx.fillRect(0, 0, 512, 512);

        const rows = 16;
        const rowH = 512 / rows;
        for (let r = 0; r < rows; r++) {
          const y = r * rowH;
          const cols = 8;
          const colW = 512 / cols;
          const offset = (r % 2 === 0) ? 0 : colW / 2;

          for (let c = -1; c <= cols; c++) {
            const x = c * colW + offset;
            const jitter = (Math.sin(r * 12.9898 + c * 78.233) * 0.5 + 0.5);
            const rVal = Math.floor(185 + jitter * 26);
            const gVal = Math.floor(168 + jitter * 24);
            const bVal = Math.floor(150 + jitter * 22);

            sCtx.fillStyle = `rgb(${rVal}, ${gVal}, ${bVal})`;
            sCtx.fillRect(x + 1, y + 1, colW - 2, rowH - 2);

            // Üst & Sol yontulmuş pah ışığı
            sCtx.fillStyle = 'rgba(255, 255, 255, 0.12)';
            sCtx.fillRect(x + 1, y + 1, colW - 2, 2);
            sCtx.fillRect(x + 1, y + 1, 2, rowH - 2);

            // Alt & Sağ derz gölgesi
            sCtx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            sCtx.fillRect(x + 1, y + rowH - 3, colW - 2, 2);
            sCtx.fillRect(x + colW - 3, y + 1, 2, rowH - 2);
          }
        }

        // Koyu mineral derz hatları
        sCtx.strokeStyle = '#6b5a4b';
        sCtx.lineWidth = 2;
        for (let r = 0; r <= rows; r++) {
          sCtx.beginPath();
          sCtx.moveTo(0, r * rowH);
          sCtx.lineTo(512, r * rowH);
          sCtx.stroke();
        }

        // Doğal traverten mineral benekleri
        for (let i = 0; i < 2000; i++) {
          const px = Math.random() * 512;
          const py = Math.random() * 512;
          const alpha = Math.random() * 0.16;
          sCtx.fillStyle = Math.random() > 0.5 ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`;
          sCtx.fillRect(px, py, 1.5, 1.5);
        }
      }
      galataStoneTex = new THREE.CanvasTexture(stoneCanvas);
      galataStoneTex.wrapS = THREE.RepeatWrapping;
      galataStoneTex.wrapT = THREE.RepeatWrapping;
      galataStoneTex.repeat.set(3, 6);

      // 2. Rölyef Derz Bump Map (Yüksek kontrastlı derinlik haritası)
      const bumpCanvas = document.createElement('canvas');
      bumpCanvas.width = 512;
      bumpCanvas.height = 512;
      const bCtx = bumpCanvas.getContext('2d');
      if (bCtx) {
        bCtx.fillStyle = '#181818';
        bCtx.fillRect(0, 0, 512, 512);

        const rows = 16;
        const rowH = 512 / rows;
        for (let r = 0; r < rows; r++) {
          const y = r * rowH;
          const cols = 8;
          const colW = 512 / cols;
          const offset = (r % 2 === 0) ? 0 : colW / 2;

          for (let c = -1; c <= cols; c++) {
            const x = c * colW + offset;
            const grad = bCtx.createRadialGradient(
              x + colW / 2, y + rowH / 2, 2,
              x + colW / 2, y + rowH / 2, colW / 1.7
            );
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.75, '#c8c8c8');
            grad.addColorStop(1, '#282828');

            bCtx.fillStyle = grad;
            bCtx.fillRect(x + 2, y + 2, colW - 4, rowH - 4);
          }
        }
      }
      galataStoneBump = new THREE.CanvasTexture(bumpCanvas);
      galataStoneBump.wrapS = THREE.RepeatWrapping;
      galataStoneBump.wrapT = THREE.RepeatWrapping;
      galataStoneBump.repeat.set(3, 6);

      // 3. Kenetli Kurşun/Okside Bakır Çatı Dokusu
      const roofCanvas = document.createElement('canvas');
      roofCanvas.width = 512;
      roofCanvas.height = 512;
      const rCtx = roofCanvas.getContext('2d');
      if (rCtx) {
        rCtx.fillStyle = '#22484f';
        rCtx.fillRect(0, 0, 512, 512);

        for (let x = 0; x < 512; x += 16) {
          const grad = rCtx.createLinearGradient(x, 0, x + 16, 0);
          grad.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
          grad.addColorStop(0.4, 'rgba(42, 100, 108, 0.4)');
          grad.addColorStop(0.8, 'rgba(56, 126, 134, 0.3)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
          rCtx.fillStyle = grad;
          rCtx.fillRect(x, 0, 16, 512);

          rCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          rCtx.fillRect(x, 0, 1.5, 512);
        }
      }
      galataRoofTex = new THREE.CanvasTexture(roofCanvas);
    }

    // ─── Mimari Materyal Tanımları ───
    const galataStoneMat = new THREE.MeshStandardMaterial({
      color: 0xc4b49f,
      map: galataStoneTex,
      bumpMap: galataStoneBump,
      bumpScale: 0.65,
      roughness: 0.82,
      metalness: 0.12
    });

    const galataCorbelMat = new THREE.MeshStandardMaterial({
      color: 0x9a8874,
      bumpMap: galataStoneBump,
      bumpScale: 0.4,
      roughness: 0.78,
      metalness: 0.15
    });

    const galataIronMat = new THREE.MeshStandardMaterial({
      color: 0x1a222d,
      roughness: 0.5,
      metalness: 0.8
    });

    const galataRoofMat = new THREE.MeshStandardMaterial({
      color: 0x22484e,
      map: galataRoofTex,
      roughness: 0.38,
      metalness: 0.48
    });

    const galataWindowGlowMat = new THREE.MeshBasicMaterial({
      color: 0xffb74d,
      transparent: true,
      opacity: 0.94
    });

    const galataDoorWoodMat = new THREE.MeshStandardMaterial({
      color: 0x3d2817,
      roughness: 0.75,
      metalness: 0.2
    });

    // ─── 1. Kademeli Zemin Kaidesi ve Giriş Meydanı ───
    const basePaveGeo = new THREE.CylinderGeometry(24, 25, 2, 32);
    const basePave = new THREE.Mesh(basePaveGeo, galataStoneMat);
    basePave.position.y = 1;
    this.galataTowerGroup.add(basePave);

    const basePlinthGeo = new THREE.CylinderGeometry(18.5, 19.5, 3.2, 32);
    const basePlinth = new THREE.Mesh(basePlinthGeo, galataStoneMat);
    basePlinth.position.y = 3.6;
    this.galataTowerGroup.add(basePlinth);

    const plinthBevelGeo = new THREE.CylinderGeometry(17.2, 18.5, 1.4, 32);
    const plinthBevel = new THREE.Mesh(plinthBevelGeo, galataStoneMat);
    plinthBevel.position.y = 5.9;
    this.galataTowerGroup.add(plinthBevel);

    // ─── 2. Ceneviz Kemerli Giriş Portali ve Mermer Kitabe (Haliç/Güney Cephesi) ───
    const portalArchGeo = new THREE.BoxGeometry(4.4, 7.6, 2.4);
    const portalArch = new THREE.Mesh(portalArchGeo, galataCorbelMat);
    portalArch.position.set(0, 7.8, 17.2);
    this.galataTowerGroup.add(portalArch);

    const doorGeo = new THREE.BoxGeometry(2.8, 5.8, 0.4);
    const door = new THREE.Mesh(doorGeo, galataDoorWoodMat);
    door.position.set(0, 7.1, 18.4);
    this.galataTowerGroup.add(door);

    const plaqueGeo = new THREE.BoxGeometry(2.6, 1.2, 0.2);
    const plaque = new THREE.Mesh(plaqueGeo, goldMat);
    plaque.position.set(0, 10.6, 18.4);
    this.galataTowerGroup.add(plaque);

    const doorLight = new THREE.PointLight(0xffb74d, 0.8, 14);
    doorLight.position.set(0, 10.2, 19.5);
    this.galataTowerGroup.add(doorLight);

    // ─── 3. Masif Konik Silindirik Gövde ve Kat Silmeleri (Cornices) ───
    const lowerShaftGeo = new THREE.CylinderGeometry(15.2, 16.5, 26, 32);
    const lowerShaft = new THREE.Mesh(lowerShaftGeo, galataStoneMat);
    lowerShaft.position.y = 19.6;
    this.galataTowerGroup.add(lowerShaft);

    const cornice1Geo = new THREE.CylinderGeometry(15.9, 15.9, 1.3, 32);
    const cornice1 = new THREE.Mesh(cornice1Geo, galataCorbelMat);
    cornice1.position.y = 33.2;
    this.galataTowerGroup.add(cornice1);

    const midShaftGeo = new THREE.CylinderGeometry(14.2, 15.1, 18, 32);
    const midShaft = new THREE.Mesh(midShaftGeo, galataStoneMat);
    midShaft.position.y = 42.8;
    this.galataTowerGroup.add(midShaft);

    const cornice2Geo = new THREE.CylinderGeometry(14.8, 14.8, 1.3, 32);
    const cornice2 = new THREE.Mesh(cornice2Geo, galataCorbelMat);
    cornice2.position.y = 52.4;
    this.galataTowerGroup.add(cornice2);

    const upperShaftGeo = new THREE.CylinderGeometry(13.5, 14.1, 9, 32);
    const upperShaft = new THREE.Mesh(upperShaftGeo, galataStoneMat);
    upperShaft.position.y = 57.5;
    this.galataTowerGroup.add(upperShaft);

    // ─── 4. Kademeli Mazgal ve Kemerli Duvar Pencereleri (4 Kat Boyunca) ───
    const slitWinGeo = new THREE.BoxGeometry(1.2, 2.6, 0.8);
    const tiers = [
      { y: 17, count: 4, rotOffset: 0 },
      { y: 27, count: 4, rotOffset: Math.PI / 4 },
      { y: 41, count: 4, rotOffset: 0 },
      { y: 53, count: 4, rotOffset: Math.PI / 4 }
    ];

    tiers.forEach(t => {
      const radiusAtY = 16.2 - (t.y / 60) * 2.5;
      for (let i = 0; i < t.count; i++) {
        const angle = (i / t.count) * Math.PI * 2 + t.rotOffset;
        const win = new THREE.Mesh(slitWinGeo, galataWindowGlowMat);
        win.position.set(Math.sin(angle) * radiusAtY, t.y, Math.cos(angle) * radiusAtY);
        win.rotation.y = angle;
        this.galataTowerGroup.add(win);
      }
    });

    // ─── 5. 16 Adet Taşıyıcı Taş Konsol Kemeri (Corbel Brackets) ───
    const corbelGeo = new THREE.BoxGeometry(1.3, 3.4, 3.8);
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const corbel = new THREE.Mesh(corbelGeo, galataCorbelMat);
      corbel.position.set(Math.sin(angle) * 15.6, 62.2, Math.cos(angle) * 15.6);
      corbel.rotation.y = angle;
      this.galataTowerGroup.add(corbel);
    }

    // ─── 6. Çıkıntılı Seyir Terası ve Dövme Demir Korkuluk ───
    const galataBalconyGeo = new THREE.CylinderGeometry(18.4, 18.4, 1.8, 32);
    const galataBalcony = new THREE.Mesh(galataBalconyGeo, galataStoneMat);
    galataBalcony.position.y = 64.6;
    this.galataTowerGroup.add(galataBalcony);

    // Üst korkuluk çemberi
    const railTopGeo = new THREE.TorusGeometry(18.0, 0.16, 6, 32);
    const railTop = new THREE.Mesh(railTopGeo, galataIronMat);
    railTop.rotation.x = Math.PI / 2;
    railTop.position.y = 67.9;
    this.galataTowerGroup.add(railTop);

    // Orta korkuluk çemberi
    const railMidGeo = new THREE.TorusGeometry(18.0, 0.11, 6, 32);
    const railMid = new THREE.Mesh(railMidGeo, galataIronMat);
    railMid.rotation.x = Math.PI / 2;
    railMid.position.y = 66.8;
    this.galataTowerGroup.add(railMid);

    // 32 adet dikey dövme demir dikme
    const picketGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.3, 6);
    for (let i = 0; i < 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      const picket = new THREE.Mesh(picketGeo, galataIronMat);
      picket.position.set(Math.sin(angle) * 18.0, 66.8, Math.cos(angle) * 18.0);
      this.galataTowerGroup.add(picket);
    }

    // ─── 7. Köşk Katı ve 14 Romanesk Çift Kemerli Pencere Arkadı ───
    const pavilionGeo = new THREE.CylinderGeometry(13.4, 13.8, 9, 32);
    const pavilion = new THREE.Mesh(pavilionGeo, galataStoneMat);
    pavilion.position.y = 70.1;
    this.galataTowerGroup.add(pavilion);

    const winGlassGeo = new THREE.BoxGeometry(1.2, 3.8, 0.7);
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const win = new THREE.Mesh(winGlassGeo, galataWindowGlowMat);
      win.position.set(Math.sin(angle) * 13.6, 70.4, Math.cos(angle) * 13.6);
      win.rotation.y = angle;
      this.galataTowerGroup.add(win);
    }

    // Köşk katı iç sıcak aydınlatma
    const pavilionGlowLight = new THREE.PointLight(0xffa726, 1.4, 38);
    pavilionGlowLight.position.set(0, 71.0, 0);
    this.galataTowerGroup.add(pavilionGlowLight);

    const upperCorniceGeo = new THREE.CylinderGeometry(15.4, 14.3, 1.8, 32);
    const upperCornice = new THREE.Mesh(upperCorniceGeo, galataCorbelMat);
    upperCornice.position.y = 75.5;
    this.galataTowerGroup.add(upperCornice);

    // ─── 8. Saçaklı Konik Külah ve 24 Dikey Kenet Çıtası ───
    const roofEavesGeo = new THREE.CylinderGeometry(16.2, 15.3, 1.2, 32);
    const roofEaves = new THREE.Mesh(roofEavesGeo, galataRoofMat);
    roofEaves.position.y = 77.0;
    this.galataTowerGroup.add(roofEaves);

    const galataConeGeo = new THREE.ConeGeometry(15.6, 26, 32);
    const galataCone = new THREE.Mesh(galataConeGeo, galataRoofMat);
    galataCone.position.y = 90.6;
    this.galataTowerGroup.add(galataCone);

    // 24 dikey kurşun kenet kaburgası
    const seamGeo = new THREE.BoxGeometry(0.18, 26, 0.28);
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const seam = new THREE.Mesh(seamGeo, galataRoofMat);
      seam.position.set(Math.sin(angle) * 7.8, 90.6, Math.cos(angle) * 7.8);
      seam.rotation.y = angle;
      seam.rotation.z = -Math.sin(angle) * 0.52;
      seam.rotation.x = Math.cos(angle) * 0.52;
      this.galataTowerGroup.add(seam);
    }

    // ─── 9. Altın Yaldızlı Zirve Mili ve Hilal Alem (Crescent) ───
    const ballLowerGeo = new THREE.SphereGeometry(1.3, 16, 16);
    const ballLower = new THREE.Mesh(ballLowerGeo, goldMat);
    ballLower.position.y = 104.4;
    this.galataTowerGroup.add(ballLower);

    const galataSpireGeo = new THREE.CylinderGeometry(0.3, 0.8, 9, 12);
    const galataSpire = new THREE.Mesh(galataSpireGeo, goldMat);
    galataSpire.position.y = 109.4;
    this.galataTowerGroup.add(galataSpire);

    const ballUpperGeo = new THREE.SphereGeometry(0.7, 12, 12);
    const ballUpper = new THREE.Mesh(ballUpperGeo, goldMat);
    ballUpper.position.y = 114.4;
    this.galataTowerGroup.add(ballUpper);

    // Hilal Alem
    const crescentGeo = new THREE.TorusGeometry(1.15, 0.28, 8, 24, Math.PI * 1.35);
    const crescent = new THREE.Mesh(crescentGeo, goldMat);
    crescent.position.set(0, 116.0, 0);
    crescent.rotation.y = Math.PI / 4;
    this.galataTowerGroup.add(crescent);

    // ─── 10. İBB Mimari Gece Cephe Aydınlatması (Warm Uplight) ───
    const floodLightSouth = new THREE.SpotLight(0xffb347, 2.6, 130, Math.PI / 4.5, 0.65, 1.2);
    floodLightSouth.position.set(12, 4, 30);
    floodLightSouth.target.position.set(0, 50, 0);
    this.galataTowerGroup.add(floodLightSouth);
    this.galataTowerGroup.add(floodLightSouth.target);

    const floodLightNorth = new THREE.SpotLight(0xffb347, 2.0, 130, Math.PI / 4.5, 0.65, 1.2);
    floodLightNorth.position.set(-18, 4, -26);
    floodLightNorth.target.position.set(0, 50, 0);
    this.galataTowerGroup.add(floodLightNorth);
    this.galataTowerGroup.add(floodLightNorth.target);

    this.scene.add(this.galataTowerGroup);

    // 3. TARİHİ YARIMADA — AYASOFYA-İ KEBİR CAMİİ & SULTANAHMET SİLÜETİ
    this.hagiaSophiaGroup = new THREE.Group();
    this.hagiaSophiaGroup.position.set(-125, 13, 155);

    const hagiaBrickMat = new THREE.MeshStandardMaterial({ color: 0xb85d43, roughness: 0.82 }); // Horasan Tuğlası
    const hagiaStoneMat = new THREE.MeshStandardMaterial({ color: 0xd8cca6, roughness: 0.72 }); // Küfeki Taşı
    const hagiaDomeMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.42, metalness: 0.45 }); // Kurşun Kaplama
    const hagiaGoldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.88, roughness: 0.2 });

    // A. Masif Bazilika Gövdesi ve Uçan Payandalar (Buttress Piers)
    const hagiaBase = new THREE.Mesh(new THREE.BoxGeometry(48, 16, 48), hagiaBrickMat);
    hagiaBase.position.y = 8;
    this.hagiaSophiaGroup.add(hagiaBase);

    // 4 Masif Köşe Payandası
    const hagiaPierGeo = new THREE.BoxGeometry(7, 18, 9);
    [[-24, 0], [24, 0], [0, -24], [0, 24]].forEach(([px, pz]) => {
      const pier = new THREE.Mesh(hagiaPierGeo, hagiaBrickMat);
      pier.position.set(px, 9, pz);
      this.hagiaSophiaGroup.add(pier);
    });

    // B. Büyük Kubbe Kasnağı (Drum) ve Kemerli Kasnak Pencereleri
    const hagiaDrum = new THREE.Mesh(new THREE.CylinderGeometry(19.2, 19.8, 5.2, 40), hagiaBrickMat);
    hagiaDrum.position.y = 18.6;
    this.hagiaSophiaGroup.add(hagiaDrum);

    // C. Basık Bizans Ana Kubbesi (32m Basık Kubbe Formu)
    const hagiaDome = new THREE.Mesh(new THREE.SphereGeometry(18.8, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), hagiaDomeMat);
    hagiaDome.position.y = 21.2;
    this.hagiaSophiaGroup.add(hagiaDome);

    // Doğu ve Batı Kademeli Yarım Kubbeler (Semi-Domes)
    const semiDomeGeo = new THREE.SphereGeometry(13.8, 24, 12, 0, Math.PI, 0, Math.PI / 2);
    const semiEast = new THREE.Mesh(semiDomeGeo, hagiaDomeMat);
    semiEast.position.set(0, 16.2, 16.5);
    this.hagiaSophiaGroup.add(semiEast);

    const semiWest = new THREE.Mesh(semiDomeGeo, hagiaDomeMat);
    semiWest.position.set(0, 16.2, -16.5);
    semiWest.rotation.y = Math.PI;
    this.hagiaSophiaGroup.add(semiWest);

    // D. Kubbe Zirvesi Altın Hilal Alem
    const domeAlem = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.28, 8, 20, Math.PI * 1.3), hagiaGoldMat);
    domeAlem.position.set(0, 40.8, 0);
    domeAlem.rotation.y = Math.PI / 4;
    this.hagiaSophiaGroup.add(domeAlem);

    // E. 4 İkonik Minare (2 Kırmızı Tuğla, 2 Beyaz Kesme Taş)
    const minaretSpecs = [
      [-23, -23, hagiaBrickMat],
      [23, -23, hagiaStoneMat],
      [-23, 23, hagiaStoneMat],
      [23, 23, hagiaBrickMat]
    ];

    minaretSpecs.forEach(([mx, mz, mat]) => {
      // Minare küp kaidesi
      const mBase = new THREE.Mesh(new THREE.BoxGeometry(4.6, 12, 4.6), mat);
      mBase.position.set(mx, 6, mz);
      this.hagiaSophiaGroup.add(mBase);

      // İnce silindirik gövde
      const mShaft = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.6, 42, 12), mat);
      mShaft.position.set(mx, 32, mz);
      this.hagiaSophiaGroup.add(mShaft);

      // Mukarnaslı Şerefe Balkonu
      const sherefe = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 1.4, 2.2, 12), hagiaStoneMat);
      sherefe.position.set(mx, 52, mz);
      this.hagiaSophiaGroup.add(sherefe);

      // Üst petek
      const mTop = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 8, 12), mat);
      mTop.position.set(mx, 56.5, mz);
      this.hagiaSophiaGroup.add(mTop);

      // Kurşun Külah
      const mCone = new THREE.Mesh(new THREE.ConeGeometry(1.3, 8, 12), hagiaDomeMat);
      mCone.position.set(mx, 64.5, mz);
      this.hagiaSophiaGroup.add(mCone);

      // Minare Hilali
      const mAlem = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), hagiaGoldMat);
      mAlem.position.set(mx, 69, mz);
      this.hagiaSophiaGroup.add(mAlem);
    });

    // F. Ayasofya Tarihi Cephe Gece Projektörleri
    const hagiaLightSouth = new THREE.SpotLight(0xffb74d, 2.2, 120, Math.PI / 4, 0.6);
    hagiaLightSouth.position.set(-10, 4, 35);
    hagiaLightSouth.target.position.set(0, 25, 0);
    this.hagiaSophiaGroup.add(hagiaLightSouth);
    this.hagiaSophiaGroup.add(hagiaLightSouth.target);

    this.scene.add(this.hagiaSophiaGroup);

    // 4. Sahil Güvenlik Botu (Coast Guard Patrol)
    this.coastGuardGroup = new THREE.Group();
    this.coastGuardGroup.position.set(16, 0.5, -45);

    const hullGeo = new THREE.BoxGeometry(9, 4.2, 24);
    const hullMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.5 });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 2.1;
    this.coastGuardGroup.add(hull);

    const stripeGeo = new THREE.BoxGeometry(9.2, 1.2, 24.2);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = 3.1;
    this.coastGuardGroup.add(stripe);

    const cabinGeo = new THREE.BoxGeometry(6.5, 4.8, 10);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 5.2, -2);
    this.coastGuardGroup.add(cabin);

    this.coastGuardStrobe = new THREE.PointLight(0x00ff88, 1.2, 120);
    this.coastGuardStrobe.position.set(0, 8.5, -2);
    this.coastGuardGroup.add(this.coastGuardStrobe);

    const strobeBulbGeo = new THREE.SphereGeometry(1.1, 8, 8);
    this.coastGuardBulbMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const strobeBulb = new THREE.Mesh(strobeBulbGeo, this.coastGuardBulbMat);
    strobeBulb.position.set(0, 8.5, -2);
    this.coastGuardGroup.add(strobeBulb);

    this.scene.add(this.coastGuardGroup);

    // 5. Maslak & Levent Modern Gökdelen Landmarkları (Sapphire, Spine Tower, İş Kuleleri, İFM)
    this.createMaslakSkyscraperLandmarks();
  }

  createMaslakSkyscraperLandmarks() {
    this.skyscraperLandmarkGroup = new THREE.Group();
    const glassTex = createSkyscraperFacadeTexture();

    // 1. ISTANBUL SAPPHIRE (Levent / 261m, Kademeli Çift Cidar Cam Kule & Seyir Terası)
    const sapphireGroup = new THREE.Group();
    sapphireGroup.position.set(-125, 18, -55);

    const sapphireMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      map: glassTex,
      roughness: 0.12,
      metalness: 0.88,
      emissive: 0x031024,
      emissiveIntensity: 0.4
    });

    const s1 = new THREE.Mesh(new THREE.BoxGeometry(18, 55, 18), sapphireMat);
    s1.position.y = 27.5;
    sapphireGroup.add(s1);

    const s2 = new THREE.Mesh(new THREE.BoxGeometry(15, 38, 15), sapphireMat);
    s2.position.y = 55 + 19;
    sapphireGroup.add(s2);

    const s3 = new THREE.Mesh(new THREE.BoxGeometry(12, 22, 12), sapphireMat);
    s3.position.y = 55 + 38 + 11;
    sapphireGroup.add(s3);

    const sAntenna = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.9, 28, 8), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 }));
    sAntenna.position.y = 55 + 38 + 22 + 14;
    sapphireGroup.add(sAntenna);

    const sBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.85, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0044 }));
    sBeacon.position.y = 55 + 38 + 22 + 28 + 0.5;
    sapphireGroup.add(sBeacon);

    this.skyscraperLandmarkGroup.add(sapphireGroup);

    // 2. SPINE TOWER (Maslak / 202m, Dairesel Spiral Form, Düşey Kanatlar & Aydınlatmalı Taç)
    const spineGroup = new THREE.Group();
    spineGroup.position.set(-180, 28, -170);

    const spineMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      map: glassTex,
      roughness: 0.15,
      metalness: 0.85,
      emissive: 0x082f49,
      emissiveIntensity: 0.45
    });

    const spineBody = new THREE.Mesh(new THREE.CylinderGeometry(9.5, 10.5, 85, 24), spineMat);
    spineBody.position.y = 42.5;
    spineGroup.add(spineBody);

    const finMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.8 });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.4, 84, 1.8), finMat);
      fin.position.set(Math.sin(angle) * 10.2, 42.5, Math.cos(angle) * 10.2);
      fin.rotation.y = angle;
      spineGroup.add(fin);
    }

    const spineCrown = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 9.5, 6, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    spineCrown.position.y = 88;
    spineGroup.add(spineCrown);

    const spineBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.75, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0044 }));
    spineBeacon.position.y = 92;
    spineGroup.add(spineBeacon);

    this.skyscraperLandmarkGroup.add(spineGroup);

    // 3. İŞ KULELERİ (Levent / 3 İkiz Kule, 45° Pahlı Köşeler, Granit Kaide & Piramit Çatılar)
    const isKuleGroup = new THREE.Group();
    isKuleGroup.position.set(-115, 22, -35);

    const isMat = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      map: glassTex,
      roughness: 0.18,
      metalness: 0.82
    });
    const graniteMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8 });

    const is1 = new THREE.Mesh(new THREE.BoxGeometry(14, 75, 14), isMat);
    is1.position.set(0, 37.5, 0);
    isKuleGroup.add(is1);

    const is1Crown = new THREE.Mesh(new THREE.ConeGeometry(9.8, 12, 4), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 }));
    is1Crown.position.set(0, 81, 0);
    is1Crown.rotation.y = Math.PI / 4;
    isKuleGroup.add(is1Crown);

    const is1Beacon = new THREE.Mesh(new THREE.SphereGeometry(0.75, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0044 }));
    is1Beacon.position.set(0, 87.5, 0);
    isKuleGroup.add(is1Beacon);

    const is2 = new THREE.Mesh(new THREE.BoxGeometry(11, 52, 11), isMat);
    is2.position.set(-18, 26, 6);
    isKuleGroup.add(is2);
    const is2Crown = new THREE.Mesh(new THREE.ConeGeometry(7.8, 8, 4), graniteMat);
    is2Crown.position.set(-18, 56, 6);
    is2Crown.rotation.y = Math.PI / 4;
    isKuleGroup.add(is2Crown);

    const is3 = new THREE.Mesh(new THREE.BoxGeometry(11, 52, 11), isMat);
    is3.position.set(18, 26, -6);
    isKuleGroup.add(is3);
    const is3Crown = new THREE.Mesh(new THREE.ConeGeometry(7.8, 8, 4), graniteMat);
    is3Crown.position.set(18, 56, -6);
    is3Crown.rotation.y = Math.PI / 4;
    isKuleGroup.add(is3Crown);

    this.skyscraperLandmarkGroup.add(isKuleGroup);

    // 4. İSTANBUL ULUSLARARASI FİNANS MERKEZİ (İFM Kulesi - Ataşehir / Kademeli Finans Obeliski)
    const ifmGroup = new THREE.Group();
    ifmGroup.position.set(195, 25, -160);

    const ifmMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      map: glassTex,
      roughness: 0.14,
      metalness: 0.86,
      emissive: 0x022c43,
      emissiveIntensity: 0.5
    });

    const ifm1 = new THREE.Mesh(new THREE.BoxGeometry(22, 60, 22), ifmMat);
    ifm1.position.y = 30;
    ifmGroup.add(ifm1);

    const ifm2 = new THREE.Mesh(new THREE.BoxGeometry(16, 35, 16), ifmMat);
    ifm2.position.y = 60 + 17.5;
    ifmGroup.add(ifm2);

    const ifm3 = new THREE.Mesh(new THREE.BoxGeometry(10, 20, 10), ifmMat);
    ifm3.position.y = 60 + 35 + 10;
    ifmGroup.add(ifm3);

    const ifmCrownLight = new THREE.PointLight(0x00f0ff, 1.8, 60);
    ifmCrownLight.position.y = 126;
    ifmGroup.add(ifmCrownLight);

    const ifmBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0044 }));
    ifmBeacon.position.y = 127;
    ifmGroup.add(ifmBeacon);

    if (this.aviationBeacons) {
      this.aviationBeacons.push(sBeacon, spineBeacon, is1Beacon, ifmBeacon);
    }

    this.skyscraperLandmarkGroup.add(ifmGroup);
    this.scene.add(this.skyscraperLandmarkGroup);
  }

  createYaliMansions() {
    this.yaliGroup = new THREE.Group();

    // 12 İkonik Boğaziçi Sahil Yalısı (Bebek, Arnavutköy, Yeniköy, Kandilli, Kanlıca, Çengelköy, Kuzguncuk)
    const yaliLocations = [
      // Avrupa Yakası (Bebek & Arnavutköy Sahili)
      { x: -58, z: -10, rot: -0.15, color: '#8b1e1e', name: 'Zarif Mustafa Paşa Yalısı' },
      { x: -59, z: 12, rot: -0.12, color: '#f8fafc', name: 'Hekimbaşı Salih Efendi Yalısı' },
      { x: -62, z: 32, rot: -0.18, color: '#d97706', name: 'Kıbrıslı Yalısı' },
      { x: -66, z: -70, rot: -0.05, color: '#f8fafc', name: 'Şerifler Yalısı (Emirgan)' },
      { x: -70, z: -110, rot: -0.08, color: '#8b1e1e', name: 'Said Halim Paşa Yalısı (Yeniköy)' },
      { x: -74, z: -145, rot: -0.10, color: '#d97706', name: 'Afif Paşa Yalısı (Yeniköy)' },

      // Anadolu Yakası (Kandilli, Kanlıca, Beylerbeyi, Kuzguncuk)
      { x: 53, z: -130, rot: Math.PI + 0.10, color: '#8b1e1e', name: 'Yılanlı Yalı (Bebek Karşısı)' },
      { x: 54, z: -90, rot: Math.PI + 0.08, color: '#f8fafc', name: 'Edib Efendi Yalısı (Kandilli)' },
      { x: 52, z: -55, rot: Math.PI + 0.05, color: '#d97706', name: 'Kont Ostrorog Yalısı' },
      { x: 56, z: -15, rot: Math.PI - 0.08, color: '#8b1e1e', name: 'Hasip Paşa Yalısı (Beylerbeyi)' },
      { x: 60, z: 22, rot: Math.PI - 0.15, color: '#f8fafc', name: 'Sadullah Paşa Yalısı (Çengelköy)' },
      { x: 65, z: 52, rot: Math.PI - 0.20, color: '#d97706', name: 'Fethi Ahmet Paşa Yalısı (Kuzguncuk)' }
    ];

    const roofTexMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.85 });
    const stonePlinthMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
    const jettyMat = new THREE.MeshStandardMaterial({ color: 0x543821, roughness: 0.9 });
    const boatHullMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
    const boatSeatMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 });

    yaliLocations.forEach(loc => {
      const yali = new THREE.Group();
      yali.position.set(loc.x, 0.6, loc.z);
      yali.rotation.y = loc.rot;

      // 1. Taş Rıhtım Kaidesi
      const plinthGeo = new THREE.BoxGeometry(14, 1.4, 9);
      const plinth = new THREE.Mesh(plinthGeo, stonePlinthMat);
      plinth.position.set(0, 0.7, 0);
      yali.add(plinth);

      // 2. Ana Ahşap Yalı Gövdesi (Yalıbaskı Doku)
      const facadeTex = createYaliFacadeTexture(loc.color);
      const bodyMat = new THREE.MeshStandardMaterial({
        map: facadeTex,
        roughness: 0.65,
        metalness: 0.1
      });
      const bodyGeo = new THREE.BoxGeometry(13.2, 8.5, 8.2);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(0, 5.5, 0);
      body.castShadow = true;
      yali.add(body);

      // 3. Karakteristik Osmanlı Cumbası (Denize Doğru Taşan Oriel Pencere)
      const cumbaGeo = new THREE.BoxGeometry(5.5, 4.0, 2.2);
      const cumba = new THREE.Mesh(cumbaGeo, bodyMat);
      cumba.position.set(0, 6.8, 4.8);
      cumba.castShadow = true;
      yali.add(cumba);

      // Cumbayı alttan taşıyan ahşap konsol payandaları (Eli Böğründe)
      const bracketGeo = new THREE.CylinderGeometry(0.15, 0.25, 2.4, 6);
      const b1 = new THREE.Mesh(bracketGeo, jettyMat);
      b1.position.set(-2.2, 4.6, 4.4);
      b1.rotation.x = Math.PI / 4;
      yali.add(b1);

      const b2 = new THREE.Mesh(bracketGeo, jettyMat);
      b2.position.set(2.2, 4.6, 4.4);
      b2.rotation.x = Math.PI / 4;
      yali.add(b2);

      // 4. Geniş Saçaklı Kırma Kiremit Çatı
      const roofGeo = new THREE.ConeGeometry(9.6, 3.5, 4);
      const roof = new THREE.Mesh(roofGeo, roofTexMat);
      roof.position.set(0, 11.5, 0);
      roof.rotation.y = Math.PI / 4;
      roof.scale.set(1.45, 1.0, 1.05);
      roof.castShadow = true;
      yali.add(roof);

      const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.8), roofTexMat);
      chimney.position.set(2.8, 12.8, 0);
      yali.add(chimney);

      // 5. Ahşap Kayıkhane İskelesi
      const jettyGeo = new THREE.BoxGeometry(3.5, 0.4, 7.5);
      const jetty = new THREE.Mesh(jettyGeo, jettyMat);
      jetty.position.set(0, 0.6, 7.8);
      yali.add(jetty);

      const pileGeo = new THREE.CylinderGeometry(0.2, 0.25, 2.2, 6);
      const p1 = new THREE.Mesh(pileGeo, jettyMat);
      p1.position.set(-1.4, -0.4, 11.2);
      yali.add(p1);

      const p2 = new THREE.Mesh(pileGeo, jettyMat);
      p2.position.set(1.4, -0.4, 11.2);
      yali.add(p2);

      const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.6, 8), stonePlinthMat);
      bollard.position.set(1.2, 1.0, 11.0);
      yali.add(bollard);

      // 6. İskelede Bağlı Ahşap Boğaz Sandalı
      const boatGroup = new THREE.Group();
      boatGroup.position.set(-3.2, 0.3, 9.5);
      boatGroup.rotation.y = 0.25;

      const boatHullGeo = new THREE.BoxGeometry(2.2, 0.8, 5.0);
      const boatHull = new THREE.Mesh(boatHullGeo, boatHullMat);
      boatGroup.add(boatHull);

      const seat1 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 0.6), boatSeatMat);
      seat1.position.set(0, 0.4, 0.5);
      boatGroup.add(seat1);

      const seat2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 0.6), boatSeatMat);
      seat2.position.set(0, 0.4, -1.2);
      boatGroup.add(seat2);

      yali.add(boatGroup);

      // 7. Yalıdan Suya Yansıyan Sıcak Gece Işığı
      const nightGlow = new THREE.PointLight(0xfef08a, 1.2, 22);
      nightGlow.position.set(0, 3.5, 4.5);
      yali.add(nightGlow);

      this.yaliGroup.add(yali);
    });

    this.scene.add(this.yaliGroup);
  }


  /**
   * Yaşayan Deniz Trafiği: Kadıköy-Karaköy-Üsküdar Şehir Hatları Vapuru
   */
  createFerry() {
    this.ferryGroup = new THREE.Group();

    // Siyah Alt Gövde (Karina)
    const lowerHullGeo = new THREE.BoxGeometry(7.5, 2.2, 22);
    const lowerHullMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const lowerHull = new THREE.Mesh(lowerHullGeo, lowerHullMat);
    lowerHull.position.y = 1.1;
    this.ferryGroup.add(lowerHull);

    // Kırmızı Su Hattı Şeridi (Boot-topping)
    const bootTopGeo = new THREE.BoxGeometry(7.4, 0.4, 21.8);
    const bootTopMat = new THREE.MeshBasicMaterial({ color: 0xb91c1c });
    const bootTop = new THREE.Mesh(bootTopGeo, bootTopMat);
    bootTop.position.y = 2.0;
    this.ferryGroup.add(bootTop);

    // Beyaz Üst Gövde (Borda)
    const upperHullGeo = new THREE.BoxGeometry(7.2, 2.0, 21.6);
    const upperHullMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const upperHull = new THREE.Mesh(upperHullGeo, upperHullMat);
    upperHull.position.y = 2.9;
    this.ferryGroup.add(upperHull);

    // Yolcu Salonu (Pencereli Kabin)
    const cabinGeo = new THREE.BoxGeometry(5.8, 3.2, 14);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 5.0, 0);
    this.ferryGroup.add(cabin);

    // Pencereler ve Sıcak İç Yolcu Aydınlatması
    const windowGeo = new THREE.BoxGeometry(6.0, 1.2, 13);
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xffd54f });
    const windows = new THREE.Mesh(windowGeo, windowMat);
    windows.position.set(0, 5.1, 0);
    this.ferryGroup.add(windows);

    // Açık Kıç Güverte Ahşap Yolcu Bankları
    const benchWoodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
    const rearBenchGeo = new THREE.BoxGeometry(5.4, 0.5, 1.0);
    const rearBench = new THREE.Mesh(rearBenchGeo, benchWoodMat);
    rearBench.position.set(0, 4.2, -8.5);
    this.ferryGroup.add(rearBench);

    // Üst Güverte & Kaptan Köşkü
    const deckHouseGeo = new THREE.BoxGeometry(4.8, 2.2, 7.5);
    const deckHouse = new THREE.Mesh(deckHouseGeo, cabinMat);
    deckHouse.position.set(0, 7.3, 1.5);
    this.ferryGroup.add(deckHouse);

    // Seyir Fenerleri (Yeşil Sancak / Kırmızı İskele)
    const navLightGeo = new THREE.SphereGeometry(0.3, 6, 6);
    const greenNavMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const redNavMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    const starboardLight = new THREE.Mesh(navLightGeo, greenNavMat);
    starboardLight.position.set(2.6, 7.5, 2.0);
    this.ferryGroup.add(starboardLight);

    const portLight = new THREE.Mesh(navLightGeo, redNavMat);
    portLight.position.set(-2.6, 7.5, 2.0);
    this.ferryGroup.add(portLight);

    // Sarı & Siyah Klasik Şehir Hatları Bacası
    const stackGeo = new THREE.CylinderGeometry(0.9, 0.9, 3.4, 12);
    const stackMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
    const stack = new THREE.Mesh(stackGeo, stackMat);
    stack.position.set(0, 9.8, -1.5);
    this.ferryGroup.add(stack);

    const stackRimGeo = new THREE.CylinderGeometry(0.95, 0.95, 0.8, 12);
    const stackRimMat = new THREE.MeshBasicMaterial({ color: 0x020617 });
    const stackRim = new THREE.Mesh(stackRimGeo, stackRimMat);
    stackRim.position.set(0, 11.1, -1.5);
    this.ferryGroup.add(stackRim);

    this.scene.add(this.ferryGroup);

    // Vapur Navigasyon Rotası (Kapalı Döngü Spline)
    this.ferryCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(85, 0.8, 140),   // Kadıköy İskelesi
      new THREE.Vector3(15, 0.8, 110),   // Güney Boğaz Ortası
      new THREE.Vector3(-75, 0.8, 75),   // Karaköy İskelesi
      new THREE.Vector3(0, 0.8, 55),     // Orta Boğaz Geçişi
      new THREE.Vector3(60, 0.8, 40),    // Üsküdar İskelesi
      new THREE.Vector3(45, 0.8, 90)     // Salacak / Kız Kulesi Açıkları
    ], true, 'centripetal');

    // Suda Bırakılan Köpük İzi (Wake Trail Particles)
    const wakeGeo = new THREE.PlaneGeometry(3.5, 3.5);
    wakeGeo.rotateX(-Math.PI / 2);
    const wakeMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    for (let i = 0; i < 16; i++) {
      const wakeMesh = new THREE.Mesh(wakeGeo, wakeMat.clone());
      wakeMesh.visible = false;
      this.scene.add(wakeMesh);
      this.ferryWakeParticles.push({
        mesh: wakeMesh,
        life: 0,
        maxLife: 1.8 + (i * 0.1)
      });
    }
  }

  /**
   * Kullanıcının AST Kod Modüllerini 1500 Ambient Binanın Arasından Yükselen
   * Parlak Merkez Gökdelenler (Primary Landmarks) Olarak İnşa Eder
   */
  buildCity(modules, bridges, circularChains) {
    this.clearCity();

    // AKOM Deadlock Durumu Güncelle
    const hasDeadlock = (circularChains && circularChains.length > 0) || (bridges && bridges.some(b => b.isJammed));
    this.isDeadlockAlert = hasDeadlock;

    let europeX = -120;
    let europeZ = -220;

    let asiaX = 120;
    let asiaZ = -220;

    let historicX = -135;
    let historicZ = 130;

    // İzole / ayrık modüller Maslak/Levent sırtlarının batı platosuna yerleştirilir (Denizde asla bina olamaz!)
    let isolatedX = -230;
    let isolatedZ = -220;

    for (const mod of modules) {
      let targetPos = new THREE.Vector3();

      if (mod.district && mod.district.isLandmark === 'maiden_tower') {
        targetPos.set(35, 30, 65);
        this.buildingObjects.push(this.maidenTowerGroup);
        this.buildingsMeshMap.set(this.maidenTowerGroup, mod);
        this.maidenTowerGroup.userData = { module: mod };
        mod.worldPosition = targetPos.clone();
        continue;
      }
      if (mod.district && mod.district.isLandmark === 'galata_tower') {
        targetPos.set(-105, 50, 35);
        this.buildingObjects.push(this.galataTowerGroup);
        this.buildingsMeshMap.set(this.galataTowerGroup, mod);
        this.galataTowerGroup.userData = { module: mod };
        mod.worldPosition = targetPos.clone();
        continue;
      }

      if (mod.district && mod.district.side === 'europe') {
        // Maslak & Levent Finans Platosu: Dinamik AST kod binaları buraya kümelenir
        targetPos.set(europeX, 0, europeZ);
        europeZ += 45;
        if (europeZ > -45) {
          europeZ = -220;
          europeX -= 45;
        }
      } else if (mod.district && mod.district.side === 'asia') {
        targetPos.set(asiaX, 0, asiaZ);
        asiaZ += 45;
        if (asiaZ > -45) {
          asiaZ = -220;
          asiaX += 45;
        }
      } else if (mod.district && mod.district.side === 'historic') {
        // Tarihi Yarımada: Asla gökdelen olmayacak! Alçak katlı bloklar
        targetPos.set(historicX, 0, historicZ);
        historicZ += 24;
        if (historicZ > 175) {
          historicZ = 130;
          historicX -= 30;
        }
      } else {
        // İzole / ayrık alt grafik modülleri ana karanın batı/kuzey güvenli platosuna yerleştirilir
        targetPos.set(isolatedX, 0, isolatedZ);
        isolatedZ += 40;
        if (isolatedZ > -80) {
          isolatedZ = -220;
          isolatedX -= 40;
        }
      }

      // ZORUNLU GÜVENLİK KONTROLÜ: Hiçbir AST binası denizin ortasına veya yeşil parklara bırakılamaz!
      if (!this.isPointOnLand(targetPos.x, targetPos.z, 8)) {
        targetPos.set(-210 - (Math.abs(targetPos.x) % 50), 0, -150 - (Math.abs(targetPos.z) % 70));
      }
      if (this.isInPark(targetPos.x, targetPos.z, 6)) {
        if (targetPos.x < 0) targetPos.x -= 40;
        else targetPos.x += 40;
      }

      const isHistoricPeninsula = mod.district && mod.district.side === 'historic';
      const groundY = this.getTerrainHeight(targetPos.x, targetPos.z);
      const height = isHistoricPeninsula
        ? Math.min(14, Math.max(6, (mod.loc / 25) + 6))
        : Math.min(190, Math.max(35, (mod.loc / 7) + (mod.complexity * 1.6)));
      const width = Math.min(42, Math.max(18, Math.sqrt(mod.loc) * 1.3));
      const depth = width;

      const isInCircularJam = circularChains.some(chain => chain.includes(mod.id));

      const buildingMesh = this.createSkyscraper(width, height, depth, (mod.district && mod.district.color) || '#00f0ff', isInCircularJam, mod);
      buildingMesh.position.set(targetPos.x, groundY + (height / 2), targetPos.z);
      this.scene.add(buildingMesh);

      this.buildingObjects.push(buildingMesh);
      this.buildingsMeshMap.set(buildingMesh, mod);

      // Lazerlerin bina gövdesinin içinden değil, tam çatı kotundan çıkması için:
      const roofY = groundY + height;
      mod.worldPosition = new THREE.Vector3(targetPos.x, roofY, targetPos.z);
    }
  }

  createSkyscraper(width, height, depth, baseHexColor, isJammed, moduleData) {
    const group = new THREE.Group();

    const isHistoric = moduleData?.district?.side === 'historic';
    const accentColor = isJammed ? 0xff0044 : parseInt(String(baseHexColor).replace('#', '0x'));

    // 1. Fotogerçekçi Prosedürel PBR Cephe Dokusu (Tarihi Yarımada vs Maslak/Levent Plazaları)
    const facadeTex = isHistoric ? createHistoricApartmentTexture() : createSkyscraperFacadeTexture();
    let mat;
    if (facadeTex) {
      const bTex = facadeTex.clone();
      bTex.needsUpdate = true;
      bTex.wrapS = THREE.RepeatWrapping;
      bTex.wrapT = THREE.RepeatWrapping;
      bTex.repeat.set(
        Math.max(1, Math.round(width / (isHistoric ? 8 : 10))),
        Math.max(2, Math.round(height / (isHistoric ? 6 : 14)))
      );

      mat = new THREE.MeshStandardMaterial({
        color: 0xffffff, // Beyaz taban ile cam yansıması ve ofis pencereleri zifiri karanlık olmadan parlar
        map: bTex,
        roughness: isHistoric ? 0.8 : 0.18,
        metalness: isHistoric ? 0.1 : 0.65,
        emissive: isJammed ? 0xff0033 : (isHistoric ? 0x221105 : 0x0a2540),
        emissiveMap: bTex,
        emissiveIntensity: isJammed ? 1.0 : (isHistoric ? 0.35 : 0.75)
      });
    } else {
      mat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.22,
        metalness: 0.72,
        emissive: isJammed ? 0xff0033 : 0x0a2540,
        emissiveIntensity: isJammed ? 0.85 : 0.4
      });
    }

    const geo = new THREE.BoxGeometry(width, height, depth);
    const body = new THREE.Mesh(geo, mat);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // 4 Köşe Düşey Mimari Taşıyıcı Pilonlar (Accent Color ile gökdelene derinlik ve kimlik katan hatlar)
    if (!isHistoric) {
      const pylonMat = new THREE.MeshStandardMaterial({
        color: accentColor,
        emissive: accentColor,
        emissiveIntensity: 0.45,
        roughness: 0.25,
        metalness: 0.8
      });
      const pw = Math.max(1.2, width * 0.045);
      const pylonGeo = new THREE.BoxGeometry(pw, height, pw);
      const offsets = [
        [-width / 2 + pw / 2, -depth / 2 + pw / 2],
        [width / 2 - pw / 2, -depth / 2 + pw / 2],
        [-width / 2 + pw / 2, depth / 2 - pw / 2],
        [width / 2 - pw / 2, depth / 2 - pw / 2]
      ];
      for (const [ox, oz] of offsets) {
        const pylon = new THREE.Mesh(pylonGeo, pylonMat);
        pylon.position.set(ox, 0, oz);
        group.add(pylon);
      }
    }

    // Mimari Hatları Vurgulayan Kenar Çizgileri (Gökdelenin semt ve rol renginde ışıldaması)
    const edgeGeo = new THREE.EdgesGeometry(geo);
    const edgeMat = new THREE.LineBasicMaterial({
      color: isJammed ? 0xff1744 : (isHistoric ? 0xf59e0b : accentColor),
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    group.add(edges);

    const roofY = height / 2;

    if (!isHistoric && height > 35) {
      // 2. Kademeli Çatı Katı & Mekanik Penthouse
      const pentW = width * 0.72;
      const pentD = depth * 0.72;
      const pentH = Math.min(12, height * 0.12);
      const pentGeo = new THREE.BoxGeometry(pentW, pentH, pentD);
      const pentMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.4,
        metalness: 0.7,
        emissive: 0x0f172a,
        emissiveIntensity: 0.3
      });
      const penthouse = new THREE.Mesh(pentGeo, pentMat);
      penthouse.position.y = roofY + (pentH / 2);
      penthouse.castShadow = true;
      group.add(penthouse);

      // Penthouse Tepe Işıltı Halosu (Accent Color)
      const crownGeo = new THREE.BoxGeometry(pentW * 1.02, 0.8, pentD * 1.02);
      const crownMat = new THREE.MeshStandardMaterial({
        color: accentColor,
        emissive: accentColor,
        emissiveIntensity: 0.8,
        roughness: 0.2,
        metalness: 0.8
      });
      const crownMesh = new THREE.Mesh(crownGeo, crownMat);
      crownMesh.position.y = roofY + pentH + 0.4;
      group.add(crownMesh);

      const pentRoofY = roofY + pentH;

      // 3. HVAC Soğutma Kuleleri & Asansör Dairesi
      const hvacMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5, metalness: 0.6 });
      const hvac1 = new THREE.Mesh(new THREE.BoxGeometry(pentW * 0.32, 2.8, pentD * 0.28), hvacMat);
      hvac1.position.set(-pentW * 0.2, pentRoofY + 1.4, pentD * 0.18);
      group.add(hvac1);

      const hvac2 = new THREE.Mesh(new THREE.BoxGeometry(pentW * 0.26, 3.4, pentD * 0.25), hvacMat);
      hvac2.position.set(pentW * 0.22, pentRoofY + 1.7, -pentD * 0.18);
      group.add(hvac2);

      // 4. Çatı Helikopter Pisti (Helipad with 'H' Marking)
      if (width >= 24 && height >= 55) {
        const helipadTex = createHelipadTexture();
        const heliMat = new THREE.MeshStandardMaterial({
          map: helipadTex,
          roughness: 0.6,
          metalness: 0.2
        });
        const heliGeo = new THREE.CylinderGeometry(pentW * 0.36, pentW * 0.36, 0.8, 16);
        const helipad = new THREE.Mesh(heliGeo, heliMat);
        helipad.position.set(0, pentRoofY + 0.4, 0);
        group.add(helipad);
      }

      // 5. Havacılık İkaz Anteni ve Yanıp Sönen Kırmızı Tepe Feneri (Aviation Obstruction Beacon)
      if (height > 50) {
        const spireH = Math.min(32, 14 + height * 0.12);
        const spireGeo = new THREE.CylinderGeometry(0.35, 1.2, spireH, 8);
        const spireMat = new THREE.MeshStandardMaterial({
          color: isJammed ? 0xff0044 : 0x94a3b8,
          metalness: 0.9,
          roughness: 0.2
        });
        const spire = new THREE.Mesh(spireGeo, spireMat);
        spire.position.set(0, pentRoofY + (spireH / 2), 0);
        group.add(spire);

        const beaconGeo = new THREE.SphereGeometry(1.0, 8, 8);
        const beaconMat = new THREE.MeshBasicMaterial({
          color: isJammed ? 0xff0000 : 0xff1744
        });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.set(0, pentRoofY + spireH + 0.5, 0);
        group.add(beacon);

        if (this.aviationBeacons) {
          this.aviationBeacons.push(beacon);
        }
      }
    } else if (isHistoric) {
      // Tarihi Yarımada Yapıları İçin Geleneksel Çatı ve Saçak
      const roofH = 3.2;
      const roofGeo = new THREE.ConeGeometry(Math.max(width, depth) * 0.72, roofH, 4);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.85 });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.rotation.y = Math.PI / 4;
      roof.position.y = roofY + (roofH / 2);
      group.add(roof);
    }

    group.userData = { module: moduleData, bodyMesh: body, defaultColor: accentColor };
    return group;
  }

  drawLaserConnections(sourceMod, trafficEngine) {
    this.clearLaserConnections();
    if (!sourceMod || !sourceMod.worldPosition) return;

    // Doğrudan çatı kotunu (rooftop) al
    const sourcePos = sourceMod.worldPosition.clone();

    const targets = Array.from(trafficEngine.adjacencyList.get(sourceMod.id) || []);
    const dependents = Array.from(trafficEngine.reverseAdjacencyList.get(sourceMod.id) || []);

    targets.forEach(targetId => {
      const targetMod = trafficEngine.modules.get(targetId);
      if (targetMod && targetMod.worldPosition) {
        this.createLaserArc(sourcePos, targetMod.worldPosition, 0x00f0ff);
      }
    });

    dependents.forEach(depId => {
      const depMod = trafficEngine.modules.get(depId);
      if (depMod && depMod.worldPosition) {
        this.createLaserArc(depMod.worldPosition, sourcePos, 0xff007f);
      }
    });
  }

  createLaserArc(start, end, hexColor) {
    const distance = start.distanceTo(end);
    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    // İki çatının en yükseğinden en az 30 birim yukarıda ve mesafeye göre artan yay yüksekliği (Arc Clearance)
    midPoint.y = Math.max(start.y, end.y) + 30 + (distance * 0.15);

    const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
    const points = curve.getPoints(28);
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: hexColor,
      linewidth: 3,
      transparent: true,
      opacity: 0.95
    });

    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.activeLaserLines.push(line);
  }

  clearLaserConnections() {
    if (!this.activeLaserLines) this.activeLaserLines = [];
    for (const line of this.activeLaserLines) {
      this.scene.remove(line);
    }
    this.activeLaserLines = [];
  }

  /**
   * KURAL 2: Sadece dinamik kod binalarını ve lazerleri temizler.
   * Ambient şehre, köprüye ve landmark'lara KESİNLİKLE dokunmaz.
   */
  clearCity() {
    for (const obj of this.buildingObjects) {
      if (obj !== this.maidenTowerGroup && obj !== this.galataTowerGroup && obj !== this.hagiaSophiaGroup) {
        this.scene.remove(obj);
      }
    }
    this.buildingObjects = [];
    this.buildingsMeshMap.clear();
    this.clearLaserConnections();
  }

  setupRainSystem() {
    const rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.rainCount * 3);
    for (let i = 0; i < this.rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 800;
      positions[i * 3 + 1] = Math.random() * 320;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 800;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x88bbff,
      size: 2.2,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });

    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.rainParticles.visible = this.isRaining;
    this.scene.add(this.rainParticles);
  }

  /**
   * Light & Dark Tema Motoru (Açık temada yeşil CAD grid'i tamamen yok eder)
   */
  setTheme(theme) {
    this.activeTheme = theme;
    const isDark = theme !== 'light';

    // 1. Sahne Arka Planı ve Sis (Zift siyahı değil, derin siber gece mavisi #060913)
    if (this.scene) {
      this.scene.background = new THREE.Color(isDark ? 0x060913 : 0xf1f5f9);
      if (this.scene.fog) {
        this.scene.fog.color.setHex(isDark ? 0x060913 : 0xd8eaf8);
        this.scene.fog.density = isDark ? 0.0005 : 0.0006;
      }
    }

    // 2. Işıklandırma (Luminous Night Lighting)
    if (this.ambientLight) {
      this.ambientLight.color.setHex(isDark ? 0x1e293b : 0xffffff);
      this.ambientLight.intensity = isDark ? 0.7 : 0.95;
    }

    if (this.dirLight) {
      this.dirLight.color.setHex(isDark ? 0x38bdf8 : 0xfff4e0);
      this.dirLight.intensity = isDark ? 0.9 : 1.15;
    }

    // 3. Parlayan Boğaz Suyu (Luminous Bosphorus Glow)
    if (this.waterMat) {
      this.waterMat.color.setHex(0x0284c7);
      this.waterMat.emissive.setHex(0x0369a1);
      this.waterMat.emissiveIntensity = isDark ? 0.4 : 0.15;
      this.waterMat.roughness = 0.15;
      this.waterMat.metalness = 0.8;
      this.waterMat.opacity = isDark ? 0.82 : 0.88;
      this.waterMat.needsUpdate = true;
    }

    // 4. Kara Kütleleri
    if (this.landMat) {
      this.landMat.color.setHex(isDark ? 0x0b1329 : 0xf1f5f9);
      this.landMat.emissive.setHex(isDark ? 0x040814 : 0x000000);
      this.landMat.emissiveIntensity = isDark ? 0.35 : 0.0;
      this.landMat.roughness = isDark ? 0.65 : 0.9;
      this.landMat.needsUpdate = true;
    }

    // 5. 2800 Ambient Binalar (Kenar ve Pencere Silüetleri)
    if (this.ambientMat) {
      this.ambientMat.color.setHex(0xffffff);
      this.ambientMat.emissive.setHex(isDark ? 0x0c1e38 : 0x030712);
      this.ambientMat.emissiveIntensity = isDark ? 0.65 : 0.15;
      this.ambientMat.opacity = isDark ? 0.95 : 0.92;
      this.ambientMat.needsUpdate = true;
    }

    // 6. Kıyı Köpükleri Şeridi (Shoreline Foam)
    if (this.shoreFoamMat) {
      this.shoreFoamMat.opacity = isDark ? 0.85 : 0.65;
      this.shoreFoamMat.emissiveIntensity = isDark ? 0.35 : 0.15;
      this.shoreFoamMat.needsUpdate = true;
    }

    // 7. Açık Temada Yeşil CAD Izgarasının Tamamen Kaldırılması
    if (this.gridHelper) {
      this.gridHelper.visible = isDark;
    }

    // 7. Kız Kulesi Işık Huzmesi
    if (this.maidenLightBeam) {
      this.maidenLightBeam.visible = isDark;
    }

    if (this.renderer) {
      this.renderer.toneMappingExposure = isDark ? 1.10 : 1.15;
    }
  }

  setAtmosphere(isJammed, trafficDensity = 50, hasSecurityLeaks = false) {
    this.isRaining = isJammed || trafficDensity >= 60;
    this.hasSecurityLeaks = hasSecurityLeaks;
    this.isDeadlockAlert = isJammed;

    if (this.rainParticles) {
      this.rainParticles.visible = this.isRaining;
    }

    const isDark = this.activeTheme !== 'light';
    if (this.isRaining) {
      if (this.scene.fog) {
        this.scene.fog.density = isDark ? 0.0007 : 0.0006;
        this.scene.fog.color.setHex(isDark ? 0x0a1020 : 0xd8eaf8);
      }
      if (this.renderer) this.renderer.toneMappingExposure = isDark ? 1.05 : 1.25;
      if (this.ambientLight) {
        this.ambientLight.color.setHex(isDark ? 0x1e293b : 0xe2e8f0);
        this.ambientLight.intensity = isDark ? 0.65 : 1.0;
      }
    } else {
      if (this.scene.fog) {
        this.scene.fog.density = isDark ? 0.0005 : 0.0006;
        this.scene.fog.color.setHex(isDark ? 0x060913 : 0xd8eaf8);
      }
      if (this.renderer) this.renderer.toneMappingExposure = isDark ? 1.10 : 1.15;
      if (this.ambientLight) {
        this.ambientLight.color.setHex(isDark ? 0x1e293b : 0xffffff);
        this.ambientLight.intensity = isDark ? 0.7 : 0.95;
      }
      if (this.dirLight) {
        this.dirLight.color.setHex(isDark ? 0x38bdf8 : 0xfff4e0);
        this.dirLight.intensity = isDark ? 0.9 : 1.15;
      }
    }
  }

  flyToDistrict(districtKey) {
    const coords = {
      'maslak': { x: -180, y: 35, z: -160, camX: -180, camY: 160, camZ: 40 },
      'levent': { x: -120, y: 25, z: -45, camX: -120, camY: 130, camZ: 140 },
      'besiktas': { x: -75, y: 15, z: -10, camX: -75, camY: 100, camZ: 150 },
      'bridge': { x: 0, y: 25, z: -30, camX: 0, camY: 120, camZ: 160 },
      'bridge-15temmuz': { x: 0, y: 25, z: -30, camX: 0, camY: 120, camZ: 160 },
      'bridge-fsm': { x: -27.5, y: 28, z: -170, camX: -27.5, camY: 130, camZ: -30 },
      'bridge-yss': { x: -10, y: 35, z: -320, camX: -10, camY: 160, camZ: -170 },
      'bridge-halic': { x: -120, y: 14, z: 77, camX: -120, camY: 65, camZ: 175 },
      'bridge-galata': { x: -48, y: 10, z: 97, camX: -48, camY: 55, camZ: 195 },
      'kadikoy': { x: 95, y: 18, z: 160, camX: 95, camY: 110, camZ: 280 },
      'uskudar': { x: 80, y: 18, z: 40, camX: 80, camY: 100, camZ: 160 },
      'atasehir': { x: 190, y: 25, z: -160, camX: 190, camY: 150, camZ: 20 },
      'historic': { x: -125, y: 18, z: 155, camX: -125, camY: 95, camZ: 280 },
      'islands': { x: -230, y: 30, z: -180, camX: -230, camY: 150, camZ: 30 },
      'maiden': { x: 35, y: 15, z: 65, camX: 30, camY: 55, camZ: 140 },
      'galata': { x: -105, y: 25, z: 35, camX: -85, camY: 80, camZ: 125 },
      'nakkastepe': { x: 88, y: 28, z: -30, camX: 52, camY: 55, camZ: 35 },
      'yildiz': { x: -88, y: 25, z: -30, camX: -55, camY: 60, camZ: 35 },
      'coastguard': { x: 16, y: 10, z: -45, camX: 16, camY: 45, camZ: 25 },
      'ferry': { x: 0, y: 5, z: 80, camX: -30, camY: 35, camZ: 140 }
    };

    const target = coords[districtKey] || coords['bridge'];
    this.controlsLerpTarget = new THREE.Vector3(target.x, target.y, target.z);
    this.cameraLerpTarget = new THREE.Vector3(target.camX, target.camY, target.camZ);
  }

  /**
   * Vapur Butonuna Tıklandığında Kamerayı Yumuşakça Vapura odaklar
   */
  focusOnFerry() {
    if (!this.ferryGroup) return;
    const fPos = this.ferryGroup.position;
    this.controlsLerpTarget = new THREE.Vector3(fPos.x, fPos.y + 4, fPos.z);
    this.cameraLerpTarget = new THREE.Vector3(fPos.x - 38, fPos.y + 26, fPos.z + 42);
  }

  focusOnBuilding(pos) {
    this.controlsLerpTarget = new THREE.Vector3(pos.x, pos.y, pos.z);
    this.cameraLerpTarget = new THREE.Vector3(pos.x, pos.y + 60, pos.z + 90);
  }

  addSearchBeacon(pos) {
    this.clearSearchBeacon();
    const group = new THREE.Group();
    group.position.set(pos.x, 19, pos.z);

    const ringGeo = new THREE.RingGeometry(4, 16, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    group.add(ring);

    const beamGeo = new THREE.CylinderGeometry(1.5, 3.5, 90, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 45;
    group.add(beam);

    this.scene.add(group);
    this.searchBeaconGroup = group;
    this.searchBeaconStartTime = this.clock.getElapsedTime();
  }

  clearSearchBeacon() {
    if (this.searchBeaconGroup) {
      this.scene.remove(this.searchBeaconGroup);
      this.searchBeaconGroup = null;
    }
  }

  toggleCinematicTour() {
    this.isCinematicTour = !this.isCinematicTour;
    if (this.isCinematicTour) {
      this.cinematicAngle = Math.atan2(this.camera.position.z, this.camera.position.x);
      this.cinematicRadius = 340;
    }
    if (typeof this.onCinematicChange === 'function') {
      this.onCinematicChange(this.isCinematicTour);
    }
  }

  onPointerDown(event) {
    if (event.button !== 0) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.buildingObjects, true);

    if (intersects.length > 0) {
      let topGroup = intersects[0].object;
      while (topGroup.parent && topGroup.parent !== this.scene) {
        topGroup = topGroup.parent;
      }

      if (topGroup.userData && topGroup.userData.module) {
        this.focusOnBuilding(topGroup.position);
        if (this.onBuildingClick) {
          this.onBuildingClick(topGroup.userData.module);
        }
      }
    }
  }

  onPointerMove(event) {
    if (!this.onBuildingHover) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.buildingObjects, true);

    if (intersects.length > 0) {
      let topGroup = intersects[0].object;
      while (topGroup.parent && topGroup.parent !== this.scene) {
        topGroup = topGroup.parent;
      }

      if (topGroup.userData && topGroup.userData.module) {
        this.renderer.domElement.style.cursor = 'pointer';
        this.onBuildingHover(topGroup.userData.module, event.clientX, event.clientY);
        return;
      }
    }

    this.renderer.domElement.style.cursor = 'default';
    this.onBuildingHover(null);
  }

  onWindowResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.far = 4000;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Canlı Boğaz Dalgası Hareketi
    if (this.waterMesh) {
      const pos = this.waterMesh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getY(i);
        const z = Math.sin(u * 0.03 + elapsedTime * 1.5) * Math.cos(v * 0.025 + elapsedTime * 1.2) * 0.8
                + Math.sin(u * 0.07 - elapsedTime * 0.9) * 0.3;
        pos.setZ(i, z);
      }
      this.waterMesh.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Kız Kulesi 360° Dönen Fener Işığı (Cone Mesh)
    if (this.maidenLightBeam && this.maidenLightBeam.visible) {
      this.maidenLightBeam.rotation.y += 0.025;
    }

    // 3. İstanbul Köprüleri Dinamik AKOM Telemetrisi (Deadlock Kırmızı Nabız & Tescilli Aydınlatmalar)
    const bridgeMats = [
      { mat: this.bridgeCableMat, normalDark: 0x00f0ff, normalLight: 0x0284c7, intDark: 0.8, intLight: 0.3 },
      { mat: this.fsmCableMat, normalDark: 0xff2836, normalLight: 0xd91d2c, intDark: 0.85, intLight: 0.35 },
      { mat: this.yssCableMat, normalDark: 0xdbeafe, normalLight: 0x93c5fd, intDark: 0.8, intLight: 0.3 }
    ];

    for (const b of bridgeMats) {
      if (!b.mat) continue;
      if (this.isDeadlockAlert) {
        const pulse = 0.5 + 0.5 * Math.sin(elapsedTime * 8);
        b.mat.color.setHex(0xff0044);
        b.mat.emissive.setHex(0xff0044);
        b.mat.emissiveIntensity = 0.5 + pulse * 1.5;
      } else {
        const isDark = this.activeTheme !== 'light';
        const hex = isDark ? b.normalDark : b.normalLight;
        b.mat.color.setHex(hex);
        b.mat.emissive.setHex(hex);
        b.mat.emissiveIntensity = isDark ? b.intDark : b.intLight;
      }
    }


    // 4. Şehir Hatları Vapuru Hareketi & Köpük İzi
    if (this.ferryGroup && this.ferryCurve) {
      this.ferryProgress = (this.ferryProgress + delta * 0.016) % 1.0;
      const currentPoint = this.ferryCurve.getPointAt(this.ferryProgress);
      const nextPoint = this.ferryCurve.getPointAt((this.ferryProgress + 0.006) % 1.0);

      this.ferryGroup.position.copy(currentPoint);
      this.ferryGroup.position.y = 0.8 + Math.sin(elapsedTime * 2.5) * 0.25; // Hafif su salınımı
      this.ferryGroup.lookAt(nextPoint.x, 0.8, nextPoint.z);

      // Suda Köpük Parçacıklarının Güncellenmesi
      if (this.ferryWakeParticles && this.ferryWakeParticles.length > 0) {
        const wakeIdx = Math.floor(elapsedTime * 4) % this.ferryWakeParticles.length;
        const p = this.ferryWakeParticles[wakeIdx];
        if (p) {
          p.mesh.position.set(currentPoint.x, 0.6, currentPoint.z);
          p.mesh.scale.set(1, 1, 1);
          p.mesh.material.opacity = 0.45;
          p.mesh.visible = true;
          p.life = 0;
        }

        for (const wp of this.ferryWakeParticles) {
          if (wp.mesh.visible) {
            wp.life += delta;
            const progress = wp.life / wp.maxLife;
            if (progress >= 1.0) {
              wp.mesh.visible = false;
            } else {
              wp.mesh.scale.set(1 + progress * 1.8, 1 + progress * 1.8, 1);
              wp.mesh.material.opacity = 0.45 * (1 - progress);
            }
          }
        }
      }
    }

    // 5. Sahil Güvenlik Botu Çakar Işık Animasyonu
    if (this.coastGuardGroup) {
      this.coastGuardGroup.position.y = 0.5 + Math.sin(elapsedTime * 2.2) * 0.35;
      this.coastGuardGroup.rotation.z = Math.sin(elapsedTime * 1.8) * 0.035;

      if (this.hasSecurityLeaks) {
        const isRed = Math.sin(elapsedTime * 12) > 0;
        const leakColor = isRed ? 0xff0044 : 0x0066ff;
        if (this.coastGuardStrobe) {
          this.coastGuardStrobe.color.setHex(leakColor);
          this.coastGuardStrobe.intensity = 4.5;
        }
        if (this.coastGuardBulbMat) {
          this.coastGuardBulbMat.color.setHex(leakColor);
        }
      } else {
        if (this.coastGuardStrobe) {
          this.coastGuardStrobe.color.setHex(0x00ff88);
          this.coastGuardStrobe.intensity = 0.8;
        }
        if (this.coastGuardBulbMat) {
          this.coastGuardBulbMat.color.setHex(0x00ff88);
        }
      }
    }

    // 6. Yağmur Parçacıkları
    if (this.rainParticles && this.isRaining) {
      const pos = this.rainParticles.geometry.attributes.position;
      for (let i = 0; i < this.rainCount; i++) {
        let y = pos.getY(i) - 5.5;
        let x = pos.getX(i) - 0.8;
        if (y < 0) {
          y = 300;
          x = (Math.random() - 0.5) * 800;
        }
        pos.setY(i, y);
        pos.setX(i, x);
      }
      this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 7. Kamera Yumuşak Takibi (Lerp) & Sinematik Tur
    if (this.isCinematicTour) {
      this.cinematicAngle += delta * 0.14;
      const radius = 280;
      const height = 120 + Math.sin(this.cinematicAngle * 1.5) * 30;
      this.camera.position.x = Math.cos(this.cinematicAngle) * radius;
      this.camera.position.z = Math.sin(this.cinematicAngle) * radius;
      this.camera.position.y = height;
      this.camera.lookAt(-10, 20, 0);
      this.controls.target.set(-10, 20, 0);
    } else if (this.cameraLerpTarget) {
      this.camera.position.lerp(this.cameraLerpTarget, 0.05);
      if (this.camera.position.distanceTo(this.cameraLerpTarget) < 2) {
        this.cameraLerpTarget = null;
      }
    }
    if (this.controlsLerpTarget) {
      this.controls.target.lerp(this.controlsLerpTarget, 0.05);
      if (this.controls.target.distanceTo(this.controlsLerpTarget) < 1) {
        this.controlsLerpTarget = null;
      }
    }
    // 8. Kıyı Köpüğü Dalga Animasyonu (Rolling Shoreline Wave Foam)
    if (this.shoreFoamMat && this.shoreFoamMat.map) {
      this.shoreFoamMat.map.offset.y -= delta * 0.08;
    }

    // 9. İstanbul Gökdelenleri & Kuleleri Senkronize Havacılık İkaz Çakarları (Aviation Obstruction Beacons)
    if (this.aviationBeacons && this.aviationBeacons.length > 0) {
      const flash = (Math.sin(elapsedTime * 6.5) > 0.25) ? 1.0 : 0.15;
      const flashColor = this.isDeadlockAlert ? 0xff0044 : 0xff1744;
      for (let i = 0; i < this.aviationBeacons.length; i++) {
        const b = this.aviationBeacons[i];
        if (b && b.material) {
          b.material.color.setHex(flashColor);
          b.visible = flash > 0.5;
        }
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
