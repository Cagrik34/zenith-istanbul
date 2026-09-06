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
    this.activeTheme = 'night'; // 'night', 'sunset', 'cyberpunk'

    this.init();
  }

  init() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060913); // Deep night sky
    this.scene.fog = new THREE.FogExp2(0x060913, 0.0035);

    // 2. Camera
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 1, 3000);
    this.camera.position.set(0, 280, 420);

    // 3. Renderer (High performance WebGL with tone mapping & antialiasing)
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
    this.controls.maxPolarAngle = Math.PI / 2.05; // Yerin altına inmesin
    this.controls.minDistance = 50;
    this.controls.maxDistance = 1200;
    this.controls.target.set(0, 20, 0);

    // 5. Lights
    this.setupLights();

    // 6. Boğaz Coğrafyası (Su, Kıyılar, Adalar)
    this.createBosphorusTerrain();

    // 7. Event Listeners
    window.addEventListener('resize', () => this.onWindowResize());
    this.renderer.domElement.addEventListener('pointerdown', (e) => this.onPointerDown(e));

    // 8. Render Loop Başlat
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
        // Kamerayı seçilen binaya doğru yumuşakça yaklaştır
        this.focusOnBuilding(topGroup.position);
        if (this.onBuildingClick) {
          this.onBuildingClick(topGroup.userData.module);
        }
      }
    }
  }

  focusOnBuilding(pos) {
    this.controls.target.set(pos.x, pos.y, pos.z);
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
        // Akıntı formülü
        const z = Math.sin(u * 0.05 + elapsedTime * 1.5) * Math.cos(v * 0.05 + elapsedTime * 1.2) * 1.2;
        pos.setZ(i, z);
      }
      this.waterMesh.geometry.attributes.position.needsUpdate = true;
    }

    // Controls
    this.controls.update();

    // Render
    this.renderer.render(this.scene, this.camera);
  }
}
