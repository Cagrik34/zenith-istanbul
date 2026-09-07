/**
 * ZenithIstanbul - 3D Bosphorus Scene & WebGL City Renderer
 * High-performance Three.js architecture with realistic water shaders,
 * 15 July Martyrs suspension bridge, European & Asian terraced topography,
 * 1500+ instanced ambient metropole, iconic landmarks, and living maritime ferry traffic.
 */

import * as THREE from 'https://esm.sh/three@0.170.0';
import { OrbitControls } from 'https://esm.sh/three@0.170.0/examples/jsm/controls/OrbitControls.js';

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

    // Bridge & Dynamic Telemetry
    this.bridgeGroup = null;
    this.bridgeCableMat = null;
    this.isDeadlockAlert = false;

    // Landmarks
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
    this.scene.fog = new THREE.FogExp2(0x060913, 0.0012);

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 4000);
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
   * Coğrafi Boğaz Hattı Matematiksel Sınırları (S-Kıvrımı & Haliç)
   */
  getBosphorusCenter(z) {
    return Math.sin(z * 0.007) * 25 + Math.sin(z * 0.015) * 10;
  }

  getStraitHalfWidth(z) {
    if (z > 180) return 80 + (z - 180) * 0.3; // Marmara Denizi Girişi
    if (z < -180) return 70 + (-180 - z) * 0.25; // Karadeniz Boğazı
    if (z >= -60 && z <= 10) return 50; // 15 Temmuz Köprüsü Boğaz Boğazı
    return 55 + Math.cos(z * 0.01) * 8;
  }

  isInHalic(x, z, bufferMargin = 8) {
    // Haliç girintisi: Sarayburnu/Galata arasından (-55, 105) kuzeybatıya (-240, 40) uzanır
    if (x > -55 + bufferMargin || x < -245) return false;
    const halicCenterZ = 105 + (x + 55) * 0.35;
    const halfWidth = 20 + (x + 55) * 0.04 + bufferMargin;
    return Math.abs(z - halicCenterZ) < halfWidth;
  }

  /**
   * Kıyı Şeridi ve Su Güvenlik Tamponu (Shoreline Buffer Margin)
   * Minimum 8 birimlik kıyı emniyet payı ile binaların suya taşmasını kesin olarak engeller.
   */
  isPointOnLand(x, z, bufferMargin = 8) {
    const center = this.getBosphorusCenter(z);
    const halfWidth = this.getStraitHalfWidth(z) + bufferMargin;
    if (x > center - halfWidth && x < center + halfWidth) return false; // Boğaz suyu + güvenlik tamponu
    if (this.isInHalic(x, z, bufferMargin)) return false; // Haliç suyu + güvenlik tamponu
    return true; // Kara
  }

  /**
   * AST Gökdelenlerinin Araziye Oturtulması (Terrain-Height Snapping)
   */
  getTerrainHeight(x, z) {
    return this.getGroundElevation(x, z);
  }

  getGroundElevation(x, z) {
    if (!this.isPointOnLand(x, z, 0)) return 0;

    // Tarihi Yarımada (Haliç güneyi)
    if (x < -60 && z > 130) {
      const distToSarayburnu = Math.hypot(x - (-160), z - 220);
      return Math.max(8, 15 - distToSarayburnu * 0.04);
    }
    // Maslak / Levent Platosu (Avrupa kuzeyi sırtları)
    if (x < -60 && z < -40) {
      const distToMaslak = Math.hypot(x - (-180), z - (-160));
      return Math.max(10, 24 - distToMaslak * 0.06);
    }
    // Galata / Beşiktaş sahil şeridi
    if (x < -50 && z >= -40 && z <= 130) {
      return 7;
    }
    // Anadolu Yakası
    if (x > 50) {
      // Çamlıca Tepesi Kubbesi
      const distToCamlica = Math.hypot(x - 175, z - 0);
      if (distToCamlica < 100) {
        return Math.max(8, 32 - distToCamlica * 0.22);
      }
      // Ataşehir Platosu
      if (z < -80) {
        return 18;
      }
      // Kadıköy & Üsküdar kıyısı
      return 8;
    }
    return 0;
  }

  /**
   * Gerçekçi İstanbul 3D Topografya ve Coğrafya Modeli
   */
  createBosphorusTerrain() {
    // 1. Parlayan Boğaz Suyu Materyali (Luminous Cyber Bosphorus)
    const waterGeo = new THREE.PlaneGeometry(1600, 1600, 96, 96);
    this.waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.15,
      metalness: 0.8,
      emissive: 0x0369a1,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.82,
      flatShading: true
    });
    this.waterMesh = new THREE.Mesh(waterGeo, this.waterMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.y = 0.5;
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);

    // 2. Kademeli Kara Kütlesi Materyali (Hafif Kenar Işıltılı Arduvaz Gece Mavisi)
    this.landMat = new THREE.MeshStandardMaterial({
      color: 0x0b1329,
      roughness: 0.65,
      metalness: 0.3,
      emissive: 0x040814,
      emissiveIntensity: 0.35
    });

    // 3. Avrupa Yakası Kademeli Platosu
    // Tarihi Yarımada (Sarayburnu, Fatih)
    const historicGeo = new THREE.CylinderGeometry(85, 105, 14, 32);
    const historicLand = new THREE.Mesh(historicGeo, this.landMat);
    historicLand.position.set(-165, 7, 230);
    historicLand.receiveShadow = true;
    this.scene.add(historicLand);

    // Sarayburnu Burnu (Marmara ve Boğaz birleşimine uzanan belirgin coğrafi burun)
    const sarayburnuGeo = new THREE.CylinderGeometry(18, 75, 12, 16);
    sarayburnuGeo.scale(1.5, 1, 0.9);
    const sarayburnuLand = new THREE.Mesh(sarayburnuGeo, this.landMat);
    sarayburnuLand.position.set(-110, 6, 175);
    sarayburnuLand.rotation.y = -0.4;
    sarayburnuLand.receiveShadow = true;
    this.scene.add(sarayburnuLand);

    // Galata / Beyoğlu / Beşiktaş Sahil Kütlesi
    const galataCoastGeo = new THREE.BoxGeometry(110, 8, 180);
    const galataCoast = new THREE.Mesh(galataCoastGeo, this.landMat);
    galataCoast.position.set(-115, 4, 35);
    galataCoast.receiveShadow = true;
    this.scene.add(galataCoast);

    // Maslak & Levent Yükseltilmiş Platosu
    const maslakPlateauGeo = new THREE.BoxGeometry(180, 24, 250);
    const maslakPlateau = new THREE.Mesh(maslakPlateauGeo, this.landMat);
    maslakPlateau.position.set(-190, 12, -170);
    maslakPlateau.receiveShadow = true;
    this.scene.add(maslakPlateau);

    // 4. Anadolu Yakası Kademeli Tepeleri
    // Üsküdar & Beylerbeyi Kıyı Hattı
    const uskudarCoastGeo = new THREE.BoxGeometry(110, 8, 180);
    const uskudarCoast = new THREE.Mesh(uskudarCoastGeo, this.landMat);
    uskudarCoast.position.set(115, 4, 15);
    uskudarCoast.receiveShadow = true;
    this.scene.add(uskudarCoast);

    // Çamlıca Tepesi (Yumuşak Kubbe Yükseltisi)
    const camlicaGeo = new THREE.SphereGeometry(75, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const camlicaHill = new THREE.Mesh(camlicaGeo, this.landMat);
    camlicaHill.position.set(175, 0, 5);
    camlicaHill.scale.set(1, 0.42, 1);
    camlicaHill.receiveShadow = true;
    this.scene.add(camlicaHill);

    // Kadıköy & Moda Burnu
    const kadikoyGeo = new THREE.CylinderGeometry(85, 100, 10, 32);
    const kadikoyLand = new THREE.Mesh(kadikoyGeo, this.landMat);
    kadikoyLand.position.set(155, 5, 205);
    kadikoyLand.receiveShadow = true;
    this.scene.add(kadikoyLand);

    // Ataşehir Arka Platosu
    const atasehirGeo = new THREE.BoxGeometry(160, 20, 200);
    const atasehirLand = new THREE.Mesh(atasehirGeo, this.landMat);
    atasehirLand.position.set(210, 10, -160);
    atasehirLand.receiveShadow = true;
    this.scene.add(atasehirLand);

    // Prens Adaları (Marmara Denizi)
    const island1 = new THREE.Mesh(new THREE.CylinderGeometry(35, 45, 10, 24), this.landMat);
    island1.position.set(70, 4, 325);
    this.scene.add(island1);

    const island2 = new THREE.Mesh(new THREE.CylinderGeometry(25, 35, 8, 24), this.landMat);
    island2.position.set(150, 3.5, 355);
    this.scene.add(island2);

    // Neon Kıyı Kılavuz Çizgileri (Shoreline Glowing Lines - Boğaz S-Kıvrımı & Haliç)
    this.createShorelines();

    // İnce Cyber Izgara
    this.gridHelper = new THREE.GridHelper(800, 40, 0x1e293b, 0x0f172a);
    this.gridHelper.position.y = 8.1;
    this.scene.add(this.gridHelper);
  }

  /**
   * 1500+ Binalık Procedural Ambient Şehir Dokusu (InstancedMesh Tek Draw-Call)
   * KURAL 1: ambientMesh.raycast = () => {} (Inspector tıklamasını engellemez)
   * KURAL 2: init aşamasında 1 KEZ üretilir; buildCity() içinde sıfırdan üretilip VRAM sızdırmaz.
   */
  /**
   * Avrupa ve Anadolu Kıyı Sınırlarına Parlayan Kıyı Kılavuz Çizgileri (Shoreline Glowing Lines)
   * Boğaz'ın S-kıvrımı ve Haliç uzaydan bakıldığında neon turkuaz ve neon pembe hatlarla parıldayan bir su yolu olarak ayrışır.
   */
  createShorelines() {
    // 1. Neon Turkuaz (#00f0ff) Avrupa ve Haliç Kıyı Kılavuz Çizgisi
    const eurPoints = [];
    for (let z = -380; z <= 60; z += 20) {
      const x = this.getBosphorusCenter(z) - this.getStraitHalfWidth(z);
      eurPoints.push(new THREE.Vector3(x, 1.2, z));
    }
    // Haliç girintisi (Galata kıyısından kuzeybatıya, oradan Sarayburnu'na dönüş)
    eurPoints.push(new THREE.Vector3(-65, 1.2, 75));
    eurPoints.push(new THREE.Vector3(-120, 1.2, 60));
    eurPoints.push(new THREE.Vector3(-190, 1.2, 45));
    eurPoints.push(new THREE.Vector3(-220, 1.2, 40));
    eurPoints.push(new THREE.Vector3(-190, 1.2, 55));
    eurPoints.push(new THREE.Vector3(-120, 1.2, 95));
    eurPoints.push(new THREE.Vector3(-75, 1.2, 140)); // Sarayburnu Burnu ucu

    for (let z = 160; z <= 380; z += 20) {
      const x = this.getBosphorusCenter(z) - this.getStraitHalfWidth(z);
      eurPoints.push(new THREE.Vector3(x, 1.2, z));
    }

    const eurCurve = new THREE.CatmullRomCurve3(eurPoints);
    const eurGeo = new THREE.TubeGeometry(eurCurve, 120, 1.3, 8, false);
    this.europeShorelineMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.0,
      roughness: 0.2
    });
    this.europeShoreline = new THREE.Mesh(eurGeo, this.europeShorelineMat);
    this.scene.add(this.europeShoreline);

    // 2. Neon Pembe (#ff007f) Anadolu Kıyı Kılavuz Çizgisi
    const asiaPoints = [];
    for (let z = -380; z <= 380; z += 20) {
      const x = this.getBosphorusCenter(z) + this.getStraitHalfWidth(z);
      asiaPoints.push(new THREE.Vector3(x, 1.2, z));
    }
    const asiaCurve = new THREE.CatmullRomCurve3(asiaPoints);
    const asiaGeo = new THREE.TubeGeometry(asiaCurve, 90, 1.3, 8, false);
    this.asiaShorelineMat = new THREE.MeshStandardMaterial({
      color: 0xff007f,
      emissive: 0xff007f,
      emissiveIntensity: 1.0,
      roughness: 0.2
    });
    this.asiaShoreline = new THREE.Mesh(asiaGeo, this.asiaShorelineMat);
    this.scene.add(this.asiaShoreline);
  }

  createAmbientMetropole() {
    const ambientCount = 1500;
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);

    this.ambientMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.5,
      emissive: 0x0c1e38,
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.88
    });

    this.ambientMesh = new THREE.InstancedMesh(boxGeo, this.ambientMat, ambientCount);
    // Mimari Kural 1: Sıfır Raycast yükü & AST bina seçimlerine engel olmama
    this.ambientMesh.raycast = () => {};

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const euler = new THREE.Euler();

    let placed = 0;
    let attempts = 0;

    while (placed < ambientCount && attempts < 5000) {
      attempts++;

      // Avrupa veya Anadolu Yakasına ağırlıklı dağıtım
      const side = Math.random() < 0.54 ? 'europe' : 'asia';
      let x = 0;
      let z = (Math.random() * 660) - 330;

      if (side === 'europe') {
        x = -72 - (Math.random() * 185);
      } else {
        x = 72 + (Math.random() * 185);
      }

      // Su poligonuna (Boğaz ve Haliç) taşmama ve 8 birimlik kıyı güvenlik payı koruması
      if (!this.isPointOnLand(x, z, 8)) continue;

      const groundY = this.getGroundElevation(x, z);

      // Bölgesel Yükseklik Hiyerarşisi
      let height = 8;
      let width = 6 + Math.random() * 6;
      let depth = width * (0.8 + Math.random() * 0.4);

      if (x < -100 && z < -60) {
        // Maslak & Levent: Yüksek gökdelenler
        height = 20 + Math.random() * 45;
        width = 8 + Math.random() * 7;
      } else if (x < -70 && z > 130) {
        // Tarihi Yarımada: Alçak ve yayvan geleneksel doku
        height = 6 + Math.random() * 12;
        width = 9 + Math.random() * 8;
      } else if (x > 140 && z < -60) {
        // Ataşehir: Modern finans kuleleri
        height = 18 + Math.random() * 38;
      } else {
        // Kadıköy, Üsküdar, Beşiktaş: Orta ölçek metropol
        height = 8 + Math.random() * 18;
      }

      position.set(x, groundY + (height / 2), z);
      euler.set(0, (Math.random() - 0.5) * 0.25, 0);
      quaternion.setFromEuler(euler);
      scale.set(width, height, depth);

      matrix.compose(position, quaternion, scale);
      this.ambientMesh.setMatrixAt(placed, matrix);
      placed++;
    }

    this.ambientMesh.instanceMatrix.needsUpdate = true;
    this.ambientMesh.receiveShadow = true;
    this.ambientMesh.castShadow = true;
    this.scene.add(this.ambientMesh);
  }

  /**
   * 15 Temmuz Şehitler Köprüsü (Asma Köprü Mimarisi, Portallar & AKOM Telemetrisi)
   */
  createBridge() {
    this.bridgeGroup = new THREE.Group();
    const bridgeZ = -30;

    // 1. Köprü Tabliyesi ve Asfalt Yol
    const deckGeo = new THREE.BoxGeometry(220, 2.5, 14);
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x1e222d,
      roughness: 0.9,
      metalness: 0.1
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

      // İki bacak
      const legGeo = new THREE.BoxGeometry(4.5, 75, 4.5);
      const northLeg = new THREE.Mesh(legGeo, towerMat);
      northLeg.position.set(0, 37.5, -5.5);
      towerGroup.add(northLeg);

      const southLeg = new THREE.Mesh(legGeo, towerMat);
      southLeg.position.set(0, 37.5, 5.5);
      towerGroup.add(southLeg);

      // Alt ve Üst Enine Kirişler
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

    // 3. Kavisli Taşıyıcı Ana Halatlar (CatmullRomCurve3 Parabolik Katenar Eğrisi)
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

      // 4. Dikey Askı Halatları (Suspenders)
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

    this.scene.add(this.bridgeGroup);
  }

  /**
   * İkonik Tarihi ve Mimari Landmark'lar
   * KURAL 3: Kız Kulesi feneri SpotLight yerine yarı saydam ConeGeometry mesh ile 144 FPS çalışır.
   */
  createLandmarks() {
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 });

    // 1. KIZ KULESİ (Salacak açıklarında, Boğaz suyunun ortasında taş adacık üzerinde)
    this.maidenTowerGroup = new THREE.Group();
    this.maidenTowerGroup.position.set(20, 0, 65);

    const isletGeo = new THREE.CylinderGeometry(24, 28, 4.5, 8);
    const isletMat = new THREE.MeshStandardMaterial({ color: 0x222a36, roughness: 0.9 });
    const islet = new THREE.Mesh(isletGeo, isletMat);
    islet.position.y = 2.2;
    this.maidenTowerGroup.add(islet);

    const fortressGeo = new THREE.CylinderGeometry(14, 15, 8, 8);
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd6cbb6, roughness: 0.6 });
    const fortress = new THREE.Mesh(fortressGeo, stoneMat);
    fortress.position.y = 8;
    this.maidenTowerGroup.add(fortress);

    const towerGeo = new THREE.CylinderGeometry(7, 8, 12, 16);
    const tower = new THREE.Mesh(towerGeo, stoneMat);
    tower.position.y = 17;
    this.maidenTowerGroup.add(tower);

    const balconyGeo = new THREE.CylinderGeometry(9.5, 9.5, 1.6, 16);
    const balconyMat = new THREE.MeshStandardMaterial({ color: 0xa89985, roughness: 0.5 });
    const balcony = new THREE.Mesh(balconyGeo, balconyMat);
    balcony.position.y = 23;
    this.maidenTowerGroup.add(balcony);

    const domeGeo = new THREE.ConeGeometry(7.5, 10, 16);
    const domeMat = new THREE.MeshStandardMaterial({ color: 0x8a3c2c, roughness: 0.4 });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 28.5;
    this.maidenTowerGroup.add(dome);

    const spireGeo = new THREE.CylinderGeometry(0.3, 0.6, 5, 8);
    const spire = new THREE.Mesh(spireGeo, goldMat);
    spire.position.y = 34;
    this.maidenTowerGroup.add(spire);

    // KURAL 3: Kız Kulesi 360° Dönen Yarı Saydam Fener Konisi (ConeGeometry - Zero Heavy Spotlight)
    const beamGeo = new THREE.ConeGeometry(7, 55, 16, 1, true);
    beamGeo.rotateX(Math.PI / 2);
    beamGeo.translate(0, 0, 27.5);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfff499,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.maidenLightBeam = new THREE.Mesh(beamGeo, beamMat);
    this.maidenLightBeam.position.set(0, 23.5, 0);
    this.maidenTowerGroup.add(this.maidenLightBeam);

    this.scene.add(this.maidenTowerGroup);

    // 2. GALATA KULESİ (Karaköy/Beyoğlu tepesi zirvesinde)
    this.galataTowerGroup = new THREE.Group();
    this.galataTowerGroup.position.set(-100, 8, 55);

    const galataMainGeo = new THREE.CylinderGeometry(13, 15, 60, 24);
    const galataStoneMat = new THREE.MeshStandardMaterial({ color: 0xb5a692, roughness: 0.7 });
    const galataMain = new THREE.Mesh(galataMainGeo, galataStoneMat);
    galataMain.position.y = 30;
    this.galataTowerGroup.add(galataMain);

    const galataBalconyGeo = new THREE.CylinderGeometry(16.5, 16.5, 4, 24);
    const galataBalcony = new THREE.Mesh(galataBalconyGeo, balconyMat);
    galataBalcony.position.y = 62;
    this.galataTowerGroup.add(galataBalcony);

    const galataUpperGeo = new THREE.CylinderGeometry(13, 14, 8, 24);
    const galataUpper = new THREE.Mesh(galataUpperGeo, galataStoneMat);
    galataUpper.position.y = 68;
    this.galataTowerGroup.add(galataUpper);

    const galataConeGeo = new THREE.ConeGeometry(14.5, 24, 24);
    const galataRoofMat = new THREE.MeshStandardMaterial({ color: 0x22494f, roughness: 0.35, metalness: 0.3 });
    const galataCone = new THREE.Mesh(galataConeGeo, galataRoofMat);
    galataCone.position.y = 84;
    this.galataTowerGroup.add(galataCone);

    const galataSpireGeo = new THREE.CylinderGeometry(0.4, 0.8, 8, 8);
    const galataSpire = new THREE.Mesh(galataSpireGeo, goldMat);
    galataSpire.position.y = 99;
    this.galataTowerGroup.add(galataSpire);

    this.scene.add(this.galataTowerGroup);

    // 3. TARİHİ YARIMADA SİLÜETİ (Ayasofya & Sultanahmet Temsili Domes ve Minareler)
    this.hagiaSophiaGroup = new THREE.Group();
    this.hagiaSophiaGroup.position.set(-165, 14, 225);

    const mosqueBaseGeo = new THREE.BoxGeometry(42, 14, 42);
    const mosqueBaseMat = new THREE.MeshStandardMaterial({ color: 0xc49a7a, roughness: 0.7 });
    const mosqueBase = new THREE.Mesh(mosqueBaseGeo, mosqueBaseMat);
    mosqueBase.position.y = 7;
    this.hagiaSophiaGroup.add(mosqueBase);

    const mainDomeGeo = new THREE.SphereGeometry(17, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeLeadMat = new THREE.MeshStandardMaterial({ color: 0x5a6472, roughness: 0.4, metalness: 0.4 });
    const mainDome = new THREE.Mesh(mainDomeGeo, domeLeadMat);
    mainDome.position.y = 14;
    this.hagiaSophiaGroup.add(mainDome);

    // 4 İnce Kalem Minare
    const minaretGeo = new THREE.CylinderGeometry(0.8, 1.4, 46, 12);
    const minaretMat = new THREE.MeshStandardMaterial({ color: 0xd4cbb8, roughness: 0.6 });
    const minaretOffsets = [
      [-19, -19], [19, -19], [-19, 19], [19, 19]
    ];
    minaretOffsets.forEach(([mx, mz]) => {
      const minaret = new THREE.Mesh(minaretGeo, minaretMat);
      minaret.position.set(mx, 23, mz);
      this.hagiaSophiaGroup.add(minaret);

      const minaretCone = new THREE.Mesh(new THREE.ConeGeometry(1.2, 7, 12), domeLeadMat);
      minaretCone.position.set(mx, 49.5, mz);
      this.hagiaSophiaGroup.add(minaretCone);
    });

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

    // Pencereler
    const windowGeo = new THREE.BoxGeometry(6.0, 1.2, 13);
    const windowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const windows = new THREE.Mesh(windowGeo, windowMat);
    windows.position.set(0, 5.1, 0);
    this.ferryGroup.add(windows);

    // Üst Güverte & Kaptan Köşkü
    const deckHouseGeo = new THREE.BoxGeometry(4.8, 2.2, 7.5);
    const deckHouse = new THREE.Mesh(deckHouseGeo, cabinMat);
    deckHouse.position.set(0, 7.3, 1.5);
    this.ferryGroup.add(deckHouse);

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

    let historicX = -180;
    let historicZ = 260;

    let islandX = 70;
    let islandZ = 330;

    for (const mod of modules) {
      let targetPos = new THREE.Vector3();

      if (mod.district && mod.district.isLandmark === 'maiden_tower') {
        targetPos.set(20, 30, 65);
        this.buildingObjects.push(this.maidenTowerGroup);
        this.buildingsMeshMap.set(this.maidenTowerGroup, mod);
        this.maidenTowerGroup.userData = { module: mod };
        mod.worldPosition = targetPos.clone();
        continue;
      }
      if (mod.district && mod.district.isLandmark === 'galata_tower') {
        targetPos.set(-100, 45, 55);
        this.buildingObjects.push(this.galataTowerGroup);
        this.buildingsMeshMap.set(this.galataTowerGroup, mod);
        this.galataTowerGroup.userData = { module: mod };
        mod.worldPosition = targetPos.clone();
        continue;
      }

      if (mod.district && mod.district.side === 'europe') {
        targetPos.set(europeX, 0, europeZ);
        europeZ += 55;
        if (europeZ > 180) {
          europeZ = -220;
          europeX -= 60;
        }
      } else if (mod.district && mod.district.side === 'asia') {
        targetPos.set(asiaX, 0, asiaZ);
        asiaZ += 55;
        if (asiaZ > 180) {
          asiaZ = -220;
          asiaX += 60;
        }
      } else if (mod.district && mod.district.side === 'historic') {
        targetPos.set(historicX, 0, historicZ);
        historicZ += 30;
      } else {
        targetPos.set(islandX, 0, islandZ);
        islandX += 35;
      }

      const groundY = this.getTerrainHeight(targetPos.x, targetPos.z);
      const height = Math.min(190, Math.max(35, (mod.loc / 7) + (mod.complexity * 1.6)));
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

    const geo = new THREE.BoxGeometry(width, height, depth);
    const color = isJammed ? 0xff0044 : parseInt(String(baseHexColor).replace('#', '0x'));

    const mat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.18,
      metalness: 0.82,
      emissive: isJammed ? 0xff0033 : 0x031024,
      emissiveIntensity: isJammed ? 0.75 : 0.25
    });

    const body = new THREE.Mesh(geo, mat);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const edgeGeo = new THREE.EdgesGeometry(geo);
    const edgeMat = new THREE.LineBasicMaterial({
      color: isJammed ? 0xff1744 : 0x00f0ff,
      linewidth: 2
    });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    group.add(edges);

    if (height > 80) {
      const spireGeo = new THREE.CylinderGeometry(0.8, 1.6, 22, 8);
      const spireMat = new THREE.MeshBasicMaterial({ color: isJammed ? 0xff0000 : 0x00f0ff });
      const spire = new THREE.Mesh(spireGeo, spireMat);
      spire.position.y = (height / 2) + 11;
      group.add(spire);
    }

    group.userData = { module: moduleData, bodyMesh: body, defaultColor: color };
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
        this.scene.fog.density = isDark ? 0.0012 : 0.0014;
      }
    }

    // 2. Işıklandırma (Luminous Night Lighting)
    if (this.ambientLight) {
      this.ambientLight.color.setHex(isDark ? 0x1e293b : 0xffffff);
      this.ambientLight.intensity = isDark ? 0.7 : 1.25;
    }

    if (this.dirLight) {
      this.dirLight.color.setHex(isDark ? 0x38bdf8 : 0xfff4e0);
      this.dirLight.intensity = isDark ? 0.9 : 1.7;
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

    // 5. 1500 Ambient Binalar (Kenar ve Pencere Silüetleri)
    if (this.ambientMat) {
      this.ambientMat.color.setHex(isDark ? 0x1e293b : 0xcfd8e3);
      this.ambientMat.emissive.setHex(isDark ? 0x0c1e38 : 0x000000);
      this.ambientMat.emissiveIntensity = isDark ? 0.55 : 0.0;
      this.ambientMat.opacity = isDark ? 0.88 : 0.85;
      this.ambientMat.needsUpdate = true;
    }

    // 6. Açık Temada Yeşil CAD Izgarasının Tamamen Kaldırılması
    if (this.gridHelper) {
      this.gridHelper.visible = isDark;
    }

    // 7. Kız Kulesi Işık Huzmesi
    if (this.maidenLightBeam) {
      this.maidenLightBeam.visible = isDark;
    }

    if (this.renderer) {
      this.renderer.toneMappingExposure = isDark ? 1.15 : 1.35;
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
        this.scene.fog.density = isDark ? 0.0018 : 0.0016;
        this.scene.fog.color.setHex(isDark ? 0x0a1020 : 0xd8eaf8);
      }
      if (this.renderer) this.renderer.toneMappingExposure = isDark ? 1.05 : 1.25;
      if (this.ambientLight) {
        this.ambientLight.color.setHex(isDark ? 0x1e293b : 0xe2e8f0);
        this.ambientLight.intensity = isDark ? 0.65 : 1.0;
      }
    } else {
      if (this.scene.fog) {
        this.scene.fog.density = isDark ? 0.0012 : 0.0014;
        this.scene.fog.color.setHex(isDark ? 0x060913 : 0xd8eaf8);
      }
      if (this.renderer) this.renderer.toneMappingExposure = isDark ? 1.15 : 1.35;
      if (this.ambientLight) {
        this.ambientLight.color.setHex(isDark ? 0x1e293b : 0xffffff);
        this.ambientLight.intensity = isDark ? 0.7 : 1.25;
      }
      if (this.dirLight) {
        this.dirLight.color.setHex(isDark ? 0x38bdf8 : 0xfff4e0);
        this.dirLight.intensity = isDark ? 0.9 : 1.7;
      }
    }
  }

  flyToDistrict(districtKey) {
    const coords = {
      'maslak': { x: -180, y: 30, z: -160, camX: -180, camY: 160, camZ: 40 },
      'levent': { x: -120, y: 20, z: -40, camX: -120, camY: 130, camZ: 140 },
      'besiktas': { x: -80, y: 15, z: 60, camX: -80, camY: 110, camZ: 220 },
      'bridge': { x: 0, y: 25, z: -30, camX: 0, camY: 120, camZ: 160 },
      'kadikoy': { x: 140, y: 20, z: -40, camX: 140, camY: 130, camZ: 140 },
      'uskudar': { x: 90, y: 18, z: 40, camX: 90, camY: 110, camZ: 210 },
      'atasehir': { x: 190, y: 25, z: -160, camX: 190, camY: 150, camZ: 20 },
      'historic': { x: -165, y: 20, z: 225, camX: -165, camY: 110, camZ: 380 },
      'islands': { x: 100, y: 10, z: 340, camX: 100, camY: 90, camZ: 480 },
      'maiden': { x: 20, y: 15, z: 65, camX: 20, camY: 60, camZ: 135 },
      'galata': { x: -100, y: 35, z: 55, camX: -100, camY: 90, camZ: 155 },
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
        const z = Math.sin(u * 0.04 + elapsedTime * 1.4) * Math.cos(v * 0.04 + elapsedTime * 1.1) * 1.1;
        pos.setZ(i, z);
      }
      this.waterMesh.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Kız Kulesi 360° Dönen Fener Işığı (Cone Mesh)
    if (this.maidenLightBeam && this.maidenLightBeam.visible) {
      this.maidenLightBeam.rotation.y += 0.025;
    }

    // 3. 15 Temmuz Köprüsü Dinamik AKOM Telemetrisi (Deadlock Kırmızı Nabız)
    if (this.bridgeCableMat) {
      if (this.isDeadlockAlert) {
        const pulse = 0.5 + 0.5 * Math.sin(elapsedTime * 8);
        this.bridgeCableMat.color.setHex(0xff0044);
        this.bridgeCableMat.emissive.setHex(0xff0044);
        this.bridgeCableMat.emissiveIntensity = 0.5 + pulse * 1.5;
      } else {
        const isDark = this.activeTheme !== 'light';
        this.bridgeCableMat.color.setHex(isDark ? 0x00f0ff : 0x0284c7);
        this.bridgeCableMat.emissive.setHex(isDark ? 0x00f0ff : 0x0284c7);
        this.bridgeCableMat.emissiveIntensity = isDark ? 0.8 : 0.3;
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

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
