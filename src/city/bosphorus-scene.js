/**
 * ZenithIstanbul - 3D Bosphorus Scene & WebGL City Renderer
 * High-performance Three.js architecture with realistic water shaders,
 * suspension bridges, European & Asian coastlines, and interactive camera controls.
 */

import * as THREE from 'https://esm.sh/three@0.170.0';
import { OrbitControls } from 'https://esm.sh/three@0.170.0/examples/jsm/controls/OrbitControls.js';

export class BosphorusScene {
  constructor(canvasContainer, onBuildingClick) {
    this.container = canvasContainer;
    this.onBuildingClick = onBuildingClick;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.buildingsMeshMap = new Map(); // mesh -> module
    this.buildingObjects = []; // Clickable meshes
    this.bridgeMeshes = []; // 3D Bridge lines
    this.trafficLightBeams = []; // Animated data packets

    this.waterMesh = null;
    this.clock = new THREE.Clock();
    this.activeTheme = 'night';

    // Hava Durumu & Sis Motoru (Rain & Fog)
    this.rainParticles = null;
    this.isRaining = true;
    this.rainCount = 1800;

    // Kamera Uçuş Animasyonu (Smooth Lerp)
    this.cameraLerpTarget = null;
    this.controlsLerpTarget = null;

    this.init();
  }

  init() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060913);
    this.scene.fog = new THREE.FogExp2(0x060913, 0.0035);

    // 2. Camera
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 1, 3000);
    this.camera.position.set(0, 280, 420);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2.05;
    this.controls.minDistance = 50;
    this.controls.maxDistance = 1200;
    this.controls.target.set(0, 20, 0);

    // 5. Lights
    this.setupLights();

    // 6. Boğaz Coğrafyası (Su, Kıyılar, Adalar)
    this.createBosphorusTerrain();

    // 7. Yağmur & Sis Parçacık Sistemi
    this.setupRainSystem();

    // 8. Event Listeners
    window.addEventListener('resize', () => this.onWindowResize());
    this.renderer.domElement.addEventListener('pointerdown', (e) => this.onPointerDown(e));

    // 9. Render Loop Başlat
    this.animate();
  }

  setupLights() {
    // Ortam Işığı (Gece mavisi)
    this.ambientLight = new THREE.AmbientLight(0x101b38, 1.8);
    this.scene.add(this.ambientLight);

    // Ay / Şehir Projektörü (Directional Light)
    this.dirLight = new THREE.DirectionalLight(0x5080ff, 2.2);
    this.dirLight.position.set(150, 350, 100);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 800;
    this.dirLight.shadow.camera.left = -300;
    this.dirLight.shadow.camera.right = 300;
    this.dirLight.shadow.camera.top = 300;
    this.dirLight.shadow.camera.bottom = -300;
    this.scene.add(this.dirLight);

    // Boğaz Köprüsü Neon Vurgu Işığı
    this.bridgeSpot = new THREE.SpotLight(0x00f0ff, 3, 600, Math.PI / 4, 0.4);
    this.bridgeSpot.position.set(0, 160, 50);
    this.bridgeSpot.target.position.set(0, 0, 0);
    this.scene.add(this.bridgeSpot);
    this.scene.add(this.bridgeSpot.target);
  }

  createBosphorusTerrain() {
    // 1. Boğaz Suyu (Water Mesh with dynamic vertex animation)
    const waterGeo = new THREE.PlaneGeometry(1600, 1600, 64, 64);
    this.waterMat = new THREE.MeshStandardMaterial({
      color: 0x051329,
      roughness: 0.15,
      metalness: 0.85,
      flatShading: true
    });
    this.waterMesh = new THREE.Mesh(waterGeo, this.waterMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.y = -2;
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);

    // 2. Avrupa Yakası Kıyısı (Sol Taraf: X: -380 ile -60 arası)
    const europeGeo = new THREE.BoxGeometry(320, 20, 700);
    const landMat = new THREE.MeshStandardMaterial({
      color: 0x0a101f,
      roughness: 0.8,
      metalness: 0.2
    });
    const europeCoast = new THREE.Mesh(europeGeo, landMat);
    europeCoast.position.set(-220, 8, 0);
    europeCoast.receiveShadow = true;
    this.scene.add(europeCoast);

    // Kıyı Rıhtım Işığı (Avrupa Bordürü)
    const dockGeo = new THREE.BoxGeometry(4, 2, 700);
    const dockNeonMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const europeDock = new THREE.Mesh(dockGeo, dockNeonMat);
    europeDock.position.set(-58, 18, 0);
    this.scene.add(europeDock);

    // 3. Anadolu Yakası Kıyısı (Sağ Taraf: X: 60 ile 380 arası)
    const asiaGeo = new THREE.BoxGeometry(320, 20, 700);
    const asiaCoast = new THREE.Mesh(asiaGeo, landMat);
    asiaCoast.position.set(220, 8, 0);
    asiaCoast.receiveShadow = true;
    this.scene.add(asiaCoast);

    // Anadolu Bordürü
    const asiaDockNeonMat = new THREE.MeshBasicMaterial({ color: 0xff007f });
    const asiaDock = new THREE.Mesh(dockGeo, asiaDockNeonMat);
    asiaDock.position.set(58, 18, 0);
    this.scene.add(asiaDock);

    // 4. Tarihi Yarımada (Güneybatı burnu / Sarayburnu)
    const historicGeo = new THREE.CylinderGeometry(80, 95, 22, 32);
    const historicLand = new THREE.Mesh(historicGeo, landMat);
    historicLand.position.set(-180, 9, 280);
    historicLand.receiveShadow = true;
    this.scene.add(historicLand);

    // 5. Prens Adaları (Marmara Açıkları - Güneyde izole adalar)
    const island1 = new THREE.Mesh(new THREE.CylinderGeometry(35, 45, 16, 24), landMat);
    island1.position.set(60, 6, 330);
    this.scene.add(island1);

    const island2 = new THREE.Mesh(new THREE.CylinderGeometry(25, 32, 14, 24), landMat);
    island2.position.set(140, 5, 360);
    this.scene.add(island2);

    // Tabela ve Semt İsimleri (3D Neon Zemin Yazıları)
    this.createDistrictGroundMarks();
  }

  createDistrictGroundMarks() {
    // Semt sınırları ızgarası (Subtle Cyberpunk Grid)
    const gridHelper = new THREE.GridHelper(800, 40, 0x1a294d, 0x0c162e);
    gridHelper.position.y = 18.2;
    this.scene.add(gridHelper);
  }

  /**
   * Modülleri 3D Şehir Binalarına Dönüştürür
   */
  buildCity(modules, bridges, circularChains) {
    // Önceki binaları ve köprüleri temizle
    this.clearCity();

    // Yakalara göre binaları yerleştirme koordinatörleri
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

      if (mod.district.side === 'europe') {
        targetPos.set(europeX, 18, europeZ);
        europeZ += 55;
        if (europeZ > 180) {
          europeZ = -220;
          europeX -= 60;
        }
      } else if (mod.district.side === 'asia') {
        targetPos.set(asiaX, 18, asiaZ);
        asiaZ += 55;
        if (asiaZ > 180) {
          asiaZ = -220;
          asiaX += 60;
        }
      } else if (mod.district.side === 'historic') {
        targetPos.set(historicX, 19, historicZ);
        historicZ += 30;
      } else {
        // Prens Adaları (Dead Code)
        targetPos.set(islandX, 15, islandZ);
        islandX += 35;
      }

      // Bina yüksekliği LOC'a ve karmaşıklığa göre (Maslak Gökdelenleri vs Alçak Yapılar)
      const height = Math.min(180, Math.max(25, (mod.loc / 8) + (mod.complexity * 1.5)));
      const width = Math.min(38, Math.max(16, Math.sqrt(mod.loc) * 1.2));
      const depth = width;

      // Döngüsel bağımlılıkta mı? (Kırmızı alarm)
      const isInCircularJam = circularChains.some(chain => chain.includes(mod.id));

      const buildingMesh = this.createSkyscraper(width, height, depth, mod.district.color, isInCircularJam, mod);
      buildingMesh.position.set(targetPos.x, targetPos.y + (height / 2), targetPos.z);
      this.scene.add(buildingMesh);

      this.buildingObjects.push(buildingMesh);
      this.buildingsMeshMap.set(buildingMesh, mod);
      mod.worldPosition = buildingMesh.position.clone();
    }

    // Boğaziçi Köprülerini İnşa Et (15 Temmuz & FSM)
    this.buildBridges(bridges);
  }

  createSkyscraper(width, height, depth, baseHexColor, isJammed, moduleData) {
    const group = new THREE.Group();

    // 1. Ana Bina Gövdesi
    const geo = new THREE.BoxGeometry(width, height, depth);
    const color = isJammed ? 0xff0044 : parseInt(baseHexColor.replace('#', '0x'));

    const mat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.2,
      metalness: 0.8,
      emissive: isJammed ? 0xff0033 : 0x031024,
      emissiveIntensity: isJammed ? 0.6 : 0.2
    });

    const body = new THREE.Mesh(geo, mat);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // 2. Siberpunk Neon Çerçeveler (Edge Wireframe)
    const edgeGeo = new THREE.EdgesGeometry(geo);
    const edgeMat = new THREE.LineBasicMaterial({
      color: isJammed ? 0xff1744 : 0x00f0ff,
      linewidth: 1.5
    });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    group.add(edges);

    // 3. Çatı Anteni / Uyarı Işığı (Yüksek Maslak Gökdelenleri İçin)
    if (height > 90) {
      const spireGeo = new THREE.CylinderGeometry(0.8, 1.5, 20, 8);
      const spireMat = new THREE.MeshBasicMaterial({ color: isJammed ? 0xff0000 : 0x00f0ff });
      const spire = new THREE.Mesh(spireGeo, spireMat);
      spire.position.y = (height / 2) + 10;
      group.add(spire);
    }

    // Tıklanabilir referans için kullanıcı verisini ata
    group.userData = { module: moduleData, bodyMesh: body, defaultColor: color };
    return group;
  }

  /**
   * Seçilen bina ile bağımlı olduğu binalar arasına 3D Neon Lazer Hatları çizer
   */
  drawLaserConnections(sourceMod, trafficEngine) {
    this.clearLaserConnections();
    if (!sourceMod || !sourceMod.worldPosition) return;

    const sourcePos = sourceMod.worldPosition.clone();
    sourcePos.y += 10;

    const targets = Array.from(trafficEngine.adjacencyList.get(sourceMod.id) || []);
    const dependents = Array.from(trafficEngine.reverseAdjacencyList.get(sourceMod.id) || []);

    // 1. Dışa giden importlar (Cyan Neon Lazerler)
    targets.forEach(targetId => {
      const targetMod = trafficEngine.modules.get(targetId);
      if (targetMod && targetMod.worldPosition) {
        this.createLaserArc(sourcePos, targetMod.worldPosition, 0x00f0ff);
      }
    });

    // 2. İçe gelen çağıranlar (Pink / Red Neon Lazerler)
    dependents.forEach(depId => {
      const depMod = trafficEngine.modules.get(depId);
      if (depMod && depMod.worldPosition) {
        this.createLaserArc(depMod.worldPosition, sourcePos, 0xff007f);
      }
    });
  }

  createLaserArc(start, end, hexColor) {
    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    midPoint.y += 45; // Havada kavis yapan lazer köprüsü

    const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
    const points = curve.getPoints(24);
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

  buildBridges(bridges) {
    // Boğaziçi Köprü Hatları (Z: -60 -> 15 Temmuz Şehitler, Z: 60 -> FSM Köprüsü)
    const bridgeLocations = [
      { name: '15 Temmuz Şehitler Köprüsü', z: -30 },
      { name: 'Fatih Sultan Mehmet Köprüsü', z: 60 },
      { name: 'Yavuz Sultan Selim Köprüsü', z: -160 }
    ];

    for (let i = 0; i < bridgeLocations.length; i++) {
      const loc = bridgeLocations[i];
      // Bu köprüye denk gelen kilit var mı?
      const isAnyJammed = bridges.some(b => b.isJammed);

      const bridgeGroup = new THREE.Group();

      // Köprü Tabliyesi (Asfalt Yolu: X: -60'tan +60'a)
      const deckGeo = new THREE.BoxGeometry(130, 4, 18);
      const deckMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a24,
        roughness: 0.9,
        metalness: 0.1
      });
      const deck = new THREE.Mesh(deckGeo, deckMat);
      deck.position.set(0, 24, loc.z);
      bridgeGroup.add(deck);

      // Köprü Kuleleri (Avrupa Kulesi X: -58, Anadolu Kulesi X: 58)
      const towerGeo = new THREE.BoxGeometry(5, 75, 6);
      const towerMat = new THREE.MeshStandardMaterial({
        color: isAnyJammed ? 0xff0033 : 0xd8e2ec,
        metalness: 0.6,
        roughness: 0.3
      });

      const europeTower = new THREE.Mesh(towerGeo, towerMat);
      europeTower.position.set(-58, 45, loc.z);
      bridgeGroup.add(europeTower);

      const asiaTower = new THREE.Mesh(towerGeo, towerMat);
      asiaTower.position.set(58, 45, loc.z);
      bridgeGroup.add(asiaTower);

      // Asma Çelik Halatlar (Neon Işıklı)
      const cableMat = new THREE.LineBasicMaterial({
        color: isAnyJammed ? 0xff0044 : 0x00f0ff,
        linewidth: 2
      });

      // Çelik eğrisi (Parabola)
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-58, 75, loc.z - 7),
        new THREE.Vector3(0, 28, loc.z - 7),
        new THREE.Vector3(58, 75, loc.z - 7)
      );
      const points = curve.getPoints(30);
      const cableGeo = new THREE.BufferGeometry().setFromPoints(points);
      const cable = new THREE.Line(cableGeo, cableMat);
      bridgeGroup.add(cable);

      this.scene.add(bridgeGroup);
      this.bridgeMeshes.push(bridgeGroup);
    }
  }

  clearCity() {
    for (const obj of this.buildingObjects) {
      this.scene.remove(obj);
    }
    for (const b of this.bridgeMeshes) {
      this.scene.remove(b);
    }
    this.buildingObjects = [];
    this.buildingsMeshMap.clear();
    this.bridgeMeshes = [];
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
   * Kod sağlığına göre atmosferi değiştirir (Sis, Yağmur, Gece berraklığı)
   */
  setAtmosphere(isJammed, trafficDensity = 50) {
    this.isRaining = isJammed || trafficDensity >= 60;
    if (this.rainParticles) {
      this.rainParticles.visible = this.isRaining;
    }

    if (this.isRaining) {
      // Yoğun Cyberpunk Sis ve Yağmurlu Boğaz
      this.scene.fog.density = 0.0075;
      this.scene.fog.color.setHex(0x0e111a);
      this.renderer.toneMappingExposure = 0.95;
      this.ambientLight.color.setHex(0x1a1224);
    } else {
      // Açık Neon Gecesi, Berrak Su
      this.scene.fog.density = 0.0022;
      this.scene.fog.color.setHex(0x060913);
      this.renderer.toneMappingExposure = 1.15;
      this.ambientLight.color.setHex(0x101b38);
    }
  }

  /**
   * 2D Radardan veya HUD'dan tıklanan semte yumuşakça uçar (Camera Lerp)
   */
  flyToDistrict(districtKey) {
    const coords = {
      'maslak': { x: -180, y: 30, z: -160, camX: -180, camY: 160, camZ: 40 },
      'levent': { x: -120, y: 20, z: -40, camX: -120, camY: 130, camZ: 140 },
      'besiktas': { x: -80, y: 15, z: 60, camX: -80, camY: 110, camZ: 220 },
      'bridge': { x: 0, y: 25, z: -10, camX: 0, camY: 120, camZ: 180 },
      'kadikoy': { x: 140, y: 20, z: -40, camX: 140, camY: 130, camZ: 140 },
      'uskudar': { x: 100, y: 20, z: 80, camX: 100, camY: 120, camZ: 240 },
      'atasehir': { x: 180, y: 25, z: -160, camX: 180, camY: 150, camZ: 20 },
      'historic': { x: -180, y: 15, z: 280, camX: -180, camY: 100, camZ: 420 },
      'islands': { x: 100, y: 10, z: 340, camX: 100, camY: 90, camZ: 480 }
    };

    const target = coords[districtKey] || coords['bridge'];
    this.controlsLerpTarget = new THREE.Vector3(target.x, target.y, target.z);
    this.cameraLerpTarget = new THREE.Vector3(target.camX, target.camY, target.camZ);
  }

  onPointerDown(event) {
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

  focusOnBuilding(pos) {
    this.controlsLerpTarget = new THREE.Vector3(pos.x, pos.y, pos.z);
    this.cameraLerpTarget = new THREE.Vector3(pos.x, pos.y + 60, pos.z + 90);
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

    // Su dalgası hareketi (Boğaz akıntısı)
    if (this.waterMesh) {
      const pos = this.waterMesh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getY(i);
        const z = Math.sin(u * 0.05 + elapsedTime * 1.5) * Math.cos(v * 0.05 + elapsedTime * 1.2) * 1.2;
        pos.setZ(i, z);
      }
      this.waterMesh.geometry.attributes.position.needsUpdate = true;
    }

    // Yağmur Parçacıkları Animasyonu
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

    // Kamera Yumuşak Uçuş (Lerp)
    if (this.cameraLerpTarget) {
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

    // Controls
    this.controls.update();

    // Render
    this.renderer.render(this.scene, this.camera);
  }
}
