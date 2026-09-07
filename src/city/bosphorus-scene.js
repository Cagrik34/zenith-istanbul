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

    const roadMat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.88,
      metalness: 0.15,
      side: THREE.DoubleSide
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    this.scene.add(roadMesh);

    if (hasCenterLine) {
      const lineCurve = new THREE.CatmullRomCurve3(samplePoints.map(pt => new THREE.Vector3(pt.x, pt.y + 0.08, pt.z)));
      const lineGeo = new THREE.TubeGeometry(lineCurve, sampleCount, 0.25, 4, false);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.85 });
      const lineMesh = new THREE.Mesh(lineGeo, lineMat);
      this.scene.add(lineMesh);
    }

    return roadMesh;
  }

  /**
   * Yeşil Kuşaklar ve Şehir Korulukları (Gülhane, Yıldız, Maslak & Çamlıca)
   * Yapay düz diskler kaldırılmış; topografyaya gömülü, kenarları araziyle kaynaşan organik tepe korulukları
   */
  createGreenBelts() {
    // 1. Tarihi Yarımada Burnu: Gülhane Parkı (#15803d zengin nefti yeşil)
    this.createParkZone('Gülhane Parkı', -105, 136, 28, 20, 24, 0x15803d, 3.6, 0.7);

    // 2. Beşiktaş Sırtları: Yıldız Parkı & Koruluğu (#166534 zümrüt nefti)
    this.createParkZone('Yıldız Parkı', -92, -15, 30, 22, 26, 0x166534, 3.8, 1.4);

    // 3. Maslak / Belgrad Etekleri: Maslak Koruluğu
    this.createParkZone('Maslak Koruluğu', -185, -145, 36, 26, 28, 0x15803d, 4.0, 2.1);

    // 4. Anadolu Yakası: Çamlıca Sırtları Masifi (Geniş organik tepe yükseltileri ve çam ormanları)
    this.createParkZone('Büyük Çamlıca Tepesi Koruluğu', 180, -10, 56, 36, 42, 0x15803d, 4.8, 0.9);
    this.createParkZone('Küçük Çamlıca & Nakkaştepe Sırtları', 148, 35, 42, 28, 32, 0x166534, 4.0, 2.3);
    this.createParkZone('Çamlıca Doğu Yamaçları', 235, 10, 38, 25, 24, 0x15803d, 3.5, 1.7);
  }

  /**
   * Belirgin Nefti Yeşil Organik Zemin Yükseltisi ve Koru Kümeleri
   * Sert dairesel poker pulu kenarları kaldırılmış; araziye yayılan asimetrik tepe yükseltileri (#15803d / #166534)
   */
  createParkZone(name, centerX, centerZ, radX, radZ, treeCount, baseColor = 0x15803d, peakHeight = 4.2, phaseShift = 0.8) {
    const parkGroup = new THREE.Group();

    // 1. Belirgin Organik Zemin Yükseltisi (Elevated Organic Mound Mesh)
    const segments = 40;
    const rings = 8;
    const vertices = [];
    const indices = [];
    const uvs = [];

    // Merkez tepe kotu (Zemin seviyesinden peakHeight kadar yukarıda belirgin 3D tepe)
    const centerBaseElev = this.getGroundElevation(centerX, centerZ);
    vertices.push(centerX, centerBaseElev + peakHeight, centerZ);
    uvs.push(0.5, 0.5);

    // Konsantrik asimetrik organik halkalar
    for (let r = 1; r <= rings; r++) {
      const ringFrac = r / rings;
      for (let s = 0; s < segments; s++) {
        const angle = (s / segments) * Math.PI * 2;
        // Poker pulu daireselliğini tamamen yok eden çok-frekanslı harmonik asimetri
        const noise = 0.72 
          + 0.22 * Math.sin(angle * 3 + phaseShift) 
          + 0.16 * Math.cos(angle * 2 - phaseShift * 0.7) 
          + 0.10 * Math.sin(angle * 5 + 1.8);

        const vx = centerX + Math.cos(angle) * radX * ringFrac * noise;
        const vz = centerZ + Math.sin(angle) * radZ * ringFrac * noise;

        const groundElev = this.getGroundElevation(vx, vz);
        // Tepe merkezinden kenarlara doğru yumuşak kubbe şevi
        const domeProfile = Math.cos(ringFrac * Math.PI * 0.5);
        const vy = groundElev + 0.18 + domeProfile * peakHeight;

        vertices.push(vx, vy, vz);
        uvs.push(0.5 + Math.cos(angle) * 0.5 * ringFrac, 0.5 + Math.sin(angle) * 0.5 * ringFrac);
      }
    }

    // Yukarı bakan (+Y) düzgün normal yönü (Counter-clockwise winding)
    // Merkez üçgenleri
    for (let s = 0; s < segments; s++) {
      const nextS = (s + 1) % segments;
      indices.push(0, 1 + nextS, 1 + s);
    }

    // Konsantrik halka üçgenleri
    for (let r = 1; r < rings; r++) {
      const innerStart = 1 + (r - 1) * segments;
      const outerStart = 1 + r * segments;
      for (let s = 0; s < segments; s++) {
        const nextS = (s + 1) % segments;
        const i0 = innerStart + s;
        const i1 = innerStart + nextS;
        const o0 = outerStart + s;
        const o1 = outerStart + nextS;
        indices.push(i0, i1, o0);
        indices.push(i1, o1, o0);
      }
    }

    const turfGeo = new THREE.BufferGeometry();
    turfGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    turfGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    turfGeo.setIndex(indices);
    turfGeo.computeVertexNormals();

    const turfMat = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.85,
      metalness: 0.08,
      emissive: 0x072810,
      emissiveIntensity: 0.22,
      side: THREE.DoubleSide,
      flatShading: true
    });
    const turfMesh = new THREE.Mesh(turfGeo, turfMat);
    turfMesh.receiveShadow = true;
    turfMesh.castShadow = true;
    parkGroup.add(turfMesh);

    // 2. 3D Cyber Çam & Servi Koruları (Gür Koru Kümeleri)
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.55, 3.2, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x24180a, roughness: 0.95 });
    const foliageGeo = new THREE.ConeGeometry(2.2, 6.4, 7);
    const foliageMat = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.72,
      metalness: 0.12,
      emissive: 0x072810,
      emissiveIntensity: 0.25
    });

    for (let i = 0; i < treeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const noise = 0.72 
        + 0.22 * Math.sin(angle * 3 + phaseShift) 
        + 0.16 * Math.cos(angle * 2 - phaseShift * 0.7) 
        + 0.10 * Math.sin(angle * 5 + 1.8);
      const distFrac = Math.random() * 0.82;
      const tx = centerX + Math.cos(angle) * radX * distFrac * noise;
      const tz = centerZ + Math.sin(angle) * radZ * distFrac * noise;

      const groundElev = this.getGroundElevation(tx, tz);
      const domeProfile = Math.cos(distFrac * Math.PI * 0.5);
      const ty = groundElev + 0.15 + domeProfile * peakHeight;

      const tree = new THREE.Group();
      tree.position.set(tx, ty, tz);
      tree.rotation.y = Math.random() * Math.PI * 2;
      const treeScale = 0.85 + Math.random() * 0.55;
      tree.scale.set(treeScale, treeScale, treeScale);

      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1.6;
      tree.add(trunk);

      const foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.y = 5.2;
      foliage.castShadow = true;
      tree.add(foliage);

      parkGroup.add(tree);
    }

    this.scene.add(parkGroup);
    return parkGroup;
  }

  /**
   * Avrupa, Haliç ve Anadolu Kıyı Sınırlarına Parlayan Kıyı Kılavuz Çizgileri
   */
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
      // Haliç Kuzey Kıyısı (Karaköy -> Kasımpaşa -> Eyüp)
      new THREE.Vector3(-95, 1.2, 58),
      new THREE.Vector3(-145, 1.2, 52),
      new THREE.Vector3(-210, 1.2, 42),
      new THREE.Vector3(-280, 1.2, 30),
      new THREE.Vector3(-330, 1.2, 24),   // Haliç Başı (Eyüp / Alibeyköy)
      // Haliç Güney Kıyısı (Balat -> Fener -> Cibali -> Eminönü)
      new THREE.Vector3(-280, 1.2, 46),
      new THREE.Vector3(-210, 1.2, 62),
      new THREE.Vector3(-145, 1.2, 78),
      new THREE.Vector3(-95, 1.2, 94),
      new THREE.Vector3(-65, 1.2, 108),   // Sarayburnu Kıyı Girişi (53 birim açık su kanalı)
      // Sarayburnu Burnu (Yarımada Doğu Ucu)
      new THREE.Vector3(-82, 1.2, 134),
      new THREE.Vector3(-88, 1.2, 150),
      // Marmara Kıyısı (Kennedy Caddesi Boyu)
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
  }

  /**
   * 1600 Binalık Procedural Ambient Şehir Dokusu (InstancedMesh - 4 Farklı Semt Renk Paleti)
   * Tarihi Yarımada: Alçak katlı (#b45309 kiremit, #78350f taş/ahşap)
   * Maslak/Levent: Yüksek (#0284c7 cam mavisi, #1e293b çelik antrasit)
   * Kadıköy/Üsküdar: Konut (#cbd5e1 açık arduvaz, #e2e8f0 konut beji)
   */
  createAmbientMetropole() {
    // 2600 Binalık Genişletilmiş ve Kıtayı Dolduran Kentsel Doku
    const ambientCount = 2600;
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);

    this.ambientMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.45,
      metalness: 0.35,
      emissive: 0x071120,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.92
    });

    this.ambientMesh = new THREE.InstancedMesh(boxGeo, this.ambientMat, ambientCount);
    this.ambientMesh.raycast = () => {};

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const euler = new THREE.Euler();

    // Semt Renk Paletleri
    const colorHistoric1 = new THREE.Color(0xb45309); // Kiremit / Terracotta
    const colorHistoric2 = new THREE.Color(0x78350f); // Ahşap / Sıcak Taş
    const colorMaslak1 = new THREE.Color(0x0284c7);   // Cam Mavisi
    const colorMaslak2 = new THREE.Color(0x1e293b);   // Çelik Antrasit
    const colorGalata1 = new THREE.Color(0x475569);   // Beyoğlu Taşı
    const colorGalata2 = new THREE.Color(0x64748b);   // Arduvaz Gri
    const colorAsia1 = new THREE.Color(0xcbd5e1);     // Açık Arduvaz
    const colorAsia2 = new THREE.Color(0xe2e8f0);     // Konut Beji
    const colorSuburbs = new THREE.Color(0xd1d5db);   // Doğal Açık Gri / Varoş Konut

    let placed = 0;
    let attempts = 0;

    while (placed < ambientCount && attempts < 10000) {
      attempts++;

      // Avrupa (%38) ve Anadolu (%62 - Doğu Platosunun Dolumu İçin)
      const isEurope = Math.random() < 0.38;
      let x = 0;
      let z = (Math.random() * 680) - 340;

      if (isEurope) {
        x = -68 - (Math.random() * 260);
      } else {
        // Anadolu Yakası: Boğaz kıyısından (X: 68) doğu kıta sınırına (X: 500) kadar kesintisiz akış
        const r = Math.random();
        if (r < 0.52) {
          x = 68 + Math.random() * 170; // Kadıköy / Üsküdar / Ataşehir Çekirdeği (68 - 238)
        } else {
          x = 238 + Math.random() * 262; // Doğu Platosu (Ümraniye, Sancaktepe, Kartal sırtları: 238 - 500)
          // Kademeli seyrelme (Tapering): Doğuya doğru yoğunluk bıçakla kesilmez, yumuşakça erir
          const taper = 1.0 - (x - 238) / 262;
          if (Math.random() > (taper * 0.78 + 0.22)) continue;
        }
      }

      // Su poligonuna taşmama (Deniz güvenliği)
      if (!this.isPointOnLand(x, z, 6)) continue;

      const groundY = this.getGroundElevation(x, z);

      let height = 8;
      let width = 6 + Math.random() * 6;
      let depth = width * (0.8 + Math.random() * 0.4);
      let chosenColor = colorAsia2;

      if (isEurope) {
        if (x < -70 && z >= 110 && z <= 185) {
          // 1. Tarihi Yarımada: Alçak katlı (Y: 5-13), kiremit & kumtaşı
          height = 5 + Math.random() * 8;
          width = 8 + Math.random() * 7;
          depth = width * (0.8 + Math.random() * 0.4);
          chosenColor = Math.random() < 0.55 ? colorHistoric1 : colorHistoric2;
        } else if (x < -65 && z < -40) {
          // 2. Maslak / Levent: Yüksek modern gökdelenler (Y: 30-85)
          height = 25 + Math.random() * 60;
          width = 8 + Math.random() * 8;
          depth = width * (0.8 + Math.random() * 0.4);
          chosenColor = Math.random() < 0.5 ? colorMaslak1 : colorMaslak2;
        } else if (x < -60 && z >= 15 && z <= 56) {
          // 3. Galata / Beyoğlu: Orta ölçek geleneksel doku (Y: 8-16)
          height = 8 + Math.random() * 9;
          width = 7 + Math.random() * 6;
          depth = width;
          chosenColor = Math.random() < 0.5 ? colorGalata1 : colorGalata2;
        } else {
          height = 7 + Math.random() * 12;
          width = 7 + Math.random() * 6;
          chosenColor = colorGalata2;
        }
      } else {
        // ANADOLU YAKASI KENTSAL DOKUSU
        if (x > 140 && x < 240 && z < -40) {
          // Ataşehir / Kozyatağı: Modern finans kuleleri (Y: 18-42)
          height = 18 + Math.random() * 32;
          width = 8 + Math.random() * 7;
          chosenColor = Math.random() < 0.5 ? colorMaslak1 : colorAsia1;
        } else if (x > 240) {
          // Doğu Platosu (Ümraniye, Çekmeköy, Sancaktepe, Kartal sırtları)
          // Kademeli alçalan alçak katlı açık gri ve konut beji bloklar (Beyaz çölü doldurur)
          const taper = 1.0 - (x - 240) / 260;
          height = 4.5 + Math.random() * (7.5 * taper + 2.5);
          width = 7 + Math.random() * 7;
          depth = width * (0.8 + Math.random() * 0.5);
          chosenColor = Math.random() < 0.45 ? colorAsia2 : (Math.random() < 0.5 ? colorAsia1 : colorSuburbs);
        } else {
          // Kadıköy, Üsküdar: Konut beji ve açık arduvaz (Y: 7-16)
          height = 7 + Math.random() * 10;
          width = 7 + Math.random() * 6;
          chosenColor = Math.random() < 0.5 ? colorAsia1 : colorAsia2;
        }
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

    // 3. Kavisli Taşıyıcı Ana Halatlar
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

      // 4. Dikey Askı Halatları
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
   * İkonik Tarihi ve Mimari Landmark'lar (Kesin Coğrafi Koordinatlar)
   */
  createLandmarks() {
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd6cbb6, roughness: 0.6 });
    const balconyMat = new THREE.MeshStandardMaterial({ color: 0xa89985, roughness: 0.5 });

    // 1. KIZ KULESİ (Salacak/Üsküdar açıklarında, Boğaz suyunun ortasındaki kayalık adacıkta)
    this.maidenTowerGroup = new THREE.Group();
    this.maidenTowerGroup.position.set(35, 0, 65);

    const isletGeo = new THREE.CylinderGeometry(24, 28, 4.5, 8);
    const isletMat = new THREE.MeshStandardMaterial({ color: 0x222a36, roughness: 0.9 });
    const islet = new THREE.Mesh(isletGeo, isletMat);
    islet.position.y = 2.2;
    this.maidenTowerGroup.add(islet);

    const fortressGeo = new THREE.CylinderGeometry(14, 15, 8, 8);
    const fortress = new THREE.Mesh(fortressGeo, stoneMat);
    fortress.position.y = 8;
    this.maidenTowerGroup.add(fortress);

    const towerGeo = new THREE.CylinderGeometry(7, 8, 12, 16);
    const tower = new THREE.Mesh(towerGeo, stoneMat);
    tower.position.y = 17;
    this.maidenTowerGroup.add(tower);

    const balconyGeo = new THREE.CylinderGeometry(9.5, 9.5, 1.6, 16);
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

    // Kız Kulesi 360° Dönen Fener Işığı (Volumetric Horizon Beam - Sıfır Su Kesişimi & Yumuşak Degrade)
    // Eğim: Tamamen yatay / ufka paralel (rotation.x = Math.PI / 2), Kot: Y = 24.5 (Suyun 20 birim üstü)
    const beamLength = 42;
    const beamGeo = new THREE.CylinderGeometry(0.6, 3.8, beamLength, 16, 1, true);
    beamGeo.rotateX(Math.PI / 2);
    beamGeo.translate(0, 0, beamLength / 2);

    // Yumuşak degrade kanvas dokusu (Kenardaki sert beyaz daire çizgisini %100 yok eder)
    let beamAlphaTex = null;
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.4)');
      grad.addColorStop(0.8, 'rgba(255, 255, 255, 0.08)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 256);
      beamAlphaTex = new THREE.CanvasTexture(canvas);
    }

    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfff499,
      alphaMap: beamAlphaTex,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.maidenLightBeam = new THREE.Mesh(beamGeo, beamMat);
    this.maidenLightBeam.position.set(0, 24.5, 0);
    this.maidenTowerGroup.add(this.maidenLightBeam);

    this.scene.add(this.maidenTowerGroup);

    // 2. GALATA KULESİ (Haliç'in tam karşısı, Karaköy/Beyoğlu tepesi zirvesinde)
    this.galataTowerGroup = new THREE.Group();
    this.galataTowerGroup.position.set(-105, 18, 35);

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

    // 3. TARİHİ YARIMADA SİLÜETİ (Ayasofya & Sultanahmet Kubbeleri ve 4 Minare)
    // Sarayburnu sırtında, Boğaz girişi ve Marmara'ya hakim tepe
    this.hagiaSophiaGroup = new THREE.Group();
    this.hagiaSophiaGroup.position.set(-125, 13, 155);

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

      // ZORUNLU GÜVENLİK KONTROLÜ: Hiçbir AST binası denizin ortasına bırakılamaz!
      if (!this.isPointOnLand(targetPos.x, targetPos.z, 8)) {
        targetPos.set(-210 - (Math.abs(targetPos.x) % 50), 0, -150 - (Math.abs(targetPos.z) % 70));
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
        this.scene.fog.density = isDark ? 0.0005 : 0.0006;
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
      'maslak': { x: -180, y: 35, z: -160, camX: -180, camY: 160, camZ: 40 },
      'levent': { x: -120, y: 25, z: -45, camX: -120, camY: 130, camZ: 140 },
      'besiktas': { x: -75, y: 15, z: -10, camX: -75, camY: 100, camZ: 150 },
      'bridge': { x: 0, y: 25, z: -30, camX: 0, camY: 120, camZ: 160 },
      'kadikoy': { x: 95, y: 18, z: 160, camX: 95, camY: 110, camZ: 280 },
      'uskudar': { x: 80, y: 18, z: 40, camX: 80, camY: 100, camZ: 160 },
      'atasehir': { x: 190, y: 25, z: -160, camX: 190, camY: 150, camZ: 20 },
      'historic': { x: -125, y: 18, z: 155, camX: -125, camY: 95, camZ: 280 },
      'islands': { x: -230, y: 30, z: -180, camX: -230, camY: 150, camZ: 30 },
      'maiden': { x: 35, y: 15, z: 65, camX: 30, camY: 55, camZ: 140 },
      'galata': { x: -105, y: 25, z: 35, camX: -85, camY: 80, camZ: 125 },
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
