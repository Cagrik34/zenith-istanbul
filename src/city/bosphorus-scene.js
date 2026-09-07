/**
 * ZenithIstanbul - 3D Bosphorus Scene & WebGL City Renderer
 * High-performance Three.js architecture with realistic water shaders,
 * suspension bridges, European & Asian coastlines, and interactive camera controls.
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
    this.buildingObjects = []; // Clickable meshes
    this.bridgeMeshes = []; // 3D Bridge lines
    this.trafficLightBeams = []; // Animated data packets

    this.waterMesh = null;
    this.clock = new THREE.Clock();
    this.activeTheme = 'night';

    this.rainParticles = null;
    this.isRaining = true;
    this.rainCount = 1800;

    this.maidenTowerGroup = null;
    this.maidenBeacon = null;
    this.galataTowerGroup = null;
    this.coastGuardGroup = null;
    this.coastGuardStrobe = null;
    this.coastGuardBulbMat = null;
    this.hasSecurityLeaks = false;

    this.cameraLerpTarget = null;
    this.controlsLerpTarget = null;

    this.init();
  }

  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060913);
    this.scene.fog = new THREE.FogExp2(0x060913, 0.0035);

    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 1, 3000);
    this.camera.position.set(0, 280, 420);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2.05;
    this.controls.minDistance = 50;
    this.controls.maxDistance = 1200;
    this.controls.target.set(0, 20, 0);

    this.setupLights();

    this.createBosphorusTerrain();

    this.setupRainSystem();

    this.controls.addEventListener('start', () => {
      if (this.isCinematicTour) {
        this.isCinematicTour = false;
        if (this.onCinematicChange) this.onCinematicChange(false);
      }
    });

    window.addEventListener('resize', () => this.onWindowResize());
    this.renderer.domElement.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.renderer.domElement.addEventListener('pointermove', (e) => this.onPointerMove(e));

    this.animate();
  }

  setupLights() {
    this.ambientLight = new THREE.AmbientLight(0x101b38, 1.8);
    this.scene.add(this.ambientLight);

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

    this.bridgeSpot = new THREE.SpotLight(0x00f0ff, 3, 600, Math.PI / 4, 0.4);
    this.bridgeSpot.position.set(0, 160, 50);
    this.bridgeSpot.target.position.set(0, 0, 0);
    this.scene.add(this.bridgeSpot);
    this.scene.add(this.bridgeSpot.target);
  }

  createBosphorusTerrain() {
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

    const europeGeo = new THREE.BoxGeometry(320, 20, 700);
    this.landMat = new THREE.MeshStandardMaterial({
      color: 0x0a101f,
      roughness: 0.8,
      metalness: 0.2
    });
    const landMat = this.landMat;
    const europeCoast = new THREE.Mesh(europeGeo, landMat);
    europeCoast.position.set(-220, 8, 0);
    europeCoast.receiveShadow = true;
    this.scene.add(europeCoast);

    const dockGeo = new THREE.BoxGeometry(4, 2, 700);
    const dockNeonMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const europeDock = new THREE.Mesh(dockGeo, dockNeonMat);
    europeDock.position.set(-58, 18, 0);
    this.scene.add(europeDock);

    const asiaGeo = new THREE.BoxGeometry(320, 20, 700);
    const asiaCoast = new THREE.Mesh(asiaGeo, landMat);
    asiaCoast.position.set(220, 8, 0);
    asiaCoast.receiveShadow = true;
    this.scene.add(asiaCoast);

    const asiaDockNeonMat = new THREE.MeshBasicMaterial({ color: 0xff007f });
    const asiaDock = new THREE.Mesh(dockGeo, asiaDockNeonMat);
    asiaDock.position.set(58, 18, 0);
    this.scene.add(asiaDock);

    const historicGeo = new THREE.CylinderGeometry(80, 95, 22, 32);
    const historicLand = new THREE.Mesh(historicGeo, landMat);
    historicLand.position.set(-180, 9, 280);
    historicLand.receiveShadow = true;
    this.scene.add(historicLand);

    const island1 = new THREE.Mesh(new THREE.CylinderGeometry(35, 45, 16, 24), landMat);
    island1.position.set(60, 6, 330);
    this.scene.add(island1);

    const island2 = new THREE.Mesh(new THREE.CylinderGeometry(25, 32, 14, 24), landMat);
    island2.position.set(140, 5, 360);
    this.scene.add(island2);

    this.createDistrictGroundMarks();

    this.createLandmarks();
  }

  createDistrictGroundMarks() {
    const gridHelper = new THREE.GridHelper(800, 40, 0x1a294d, 0x0c162e);
    gridHelper.position.y = 18.2;
    this.scene.add(gridHelper);
  }

  createLandmarks() {
    this.maidenTowerGroup = new THREE.Group();
    this.maidenTowerGroup.position.set(0, 0, 45);

    const isletGeo = new THREE.CylinderGeometry(28, 34, 5, 8);
    const isletMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 });
    const islet = new THREE.Mesh(isletGeo, isletMat);
    islet.position.y = 2.5;
    this.maidenTowerGroup.add(islet);

    const castleGeo = new THREE.BoxGeometry(20, 10, 20);
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd6cbb6, roughness: 0.6 });
    const castle = new THREE.Mesh(castleGeo, stoneMat);
    castle.position.y = 9;
    this.maidenTowerGroup.add(castle);

    const towerGeo = new THREE.CylinderGeometry(5.5, 6.5, 16, 12);
    const tower = new THREE.Mesh(towerGeo, stoneMat);
    tower.position.y = 20;
    this.maidenTowerGroup.add(tower);

    const lanternGeo = new THREE.CylinderGeometry(6.8, 6.8, 4, 8);
    const lanternMat = new THREE.MeshStandardMaterial({ color: 0xffea9f, emissive: 0xffaa00, emissiveIntensity: 0.6 });
    const lantern = new THREE.Mesh(lanternGeo, lanternMat);
    lantern.position.y = 29;
    this.maidenTowerGroup.add(lantern);

    const coneGeo = new THREE.ConeGeometry(7, 10, 8);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x244238, roughness: 0.4 });
    const roof = new THREE.Mesh(coneGeo, roofMat);
    roof.position.y = 35;
    this.maidenTowerGroup.add(roof);

    const spireGeo = new THREE.CylinderGeometry(0.3, 0.6, 6, 6);
    const goldMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    const spire = new THREE.Mesh(spireGeo, goldMat);
    spire.position.y = 40;
    this.maidenTowerGroup.add(spire);

    this.maidenBeacon = new THREE.Group();
    this.maidenBeacon.position.y = 29;

    const beamGeo = new THREE.ConeGeometry(10, 90, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfff0b0,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });

    const beam1 = new THREE.Mesh(beamGeo, beamMat);
    beam1.rotation.x = Math.PI / 2;
    beam1.position.z = 45;
    this.maidenBeacon.add(beam1);

    const beam2 = new THREE.Mesh(beamGeo, beamMat);
    beam2.rotation.x = -Math.PI / 2;
    beam2.position.z = -45;
    this.maidenBeacon.add(beam2);

    this.maidenTowerGroup.add(this.maidenBeacon);
    this.scene.add(this.maidenTowerGroup);

    this.galataTowerGroup = new THREE.Group();
    this.galataTowerGroup.position.set(-110, 18, 120);

    const galataMainGeo = new THREE.CylinderGeometry(14, 16, 65, 24);
    const galataStoneMat = new THREE.MeshStandardMaterial({ color: 0xb5a692, roughness: 0.7 });
    const galataMain = new THREE.Mesh(galataMainGeo, galataStoneMat);
    galataMain.position.y = 32.5;
    this.galataTowerGroup.add(galataMain);

    const balconyGeo = new THREE.CylinderGeometry(17.5, 17.5, 5, 24);
    const balconyMat = new THREE.MeshStandardMaterial({ color: 0x8a7968, roughness: 0.5 });
    const balcony = new THREE.Mesh(balconyGeo, balconyMat);
    balcony.position.y = 66;
    this.galataTowerGroup.add(balcony);

    const upperGeo = new THREE.CylinderGeometry(14, 15, 10, 24);
    const upper = new THREE.Mesh(upperGeo, galataStoneMat);
    upper.position.y = 72;
    this.galataTowerGroup.add(upper);

    const galataConeGeo = new THREE.ConeGeometry(16, 28, 24);
    const galataRoofMat = new THREE.MeshStandardMaterial({ color: 0x22494f, roughness: 0.35, metalness: 0.3 });
    const galataCone = new THREE.Mesh(galataConeGeo, galataRoofMat);
    galataCone.position.y = 90;
    this.galataTowerGroup.add(galataCone);

    const galataSpireGeo = new THREE.CylinderGeometry(0.4, 0.8, 8, 8);
    const galataSpire = new THREE.Mesh(galataSpireGeo, goldMat);
    galataSpire.position.y = 106;
    this.galataTowerGroup.add(galataSpire);

    this.scene.add(this.galataTowerGroup);

    this.coastGuardGroup = new THREE.Group();
    this.coastGuardGroup.position.set(16, 0, -45);

    const hullGeo = new THREE.BoxGeometry(9, 4.5, 26);
    const hullMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.5 });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 2.2;
    this.coastGuardGroup.add(hull);

    const stripeGeo = new THREE.BoxGeometry(9.2, 1.2, 26.2);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = 3.2;
    this.coastGuardGroup.add(stripe);

    const cabinGeo = new THREE.BoxGeometry(6.5, 5, 11);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 5.5, -2);
    this.coastGuardGroup.add(cabin);

    this.coastGuardStrobe = new THREE.PointLight(0x00ff88, 1.2, 120);
    this.coastGuardStrobe.position.set(0, 9, -2);
    this.coastGuardGroup.add(this.coastGuardStrobe);

    const strobeBulbGeo = new THREE.SphereGeometry(1.2, 8, 8);
    this.coastGuardBulbMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const strobeBulb = new THREE.Mesh(strobeBulbGeo, this.coastGuardBulbMat);
    strobeBulb.position.set(0, 9, -2);
    this.coastGuardGroup.add(strobeBulb);

    this.scene.add(this.coastGuardGroup);
  }

  /**
   * Modülleri 3D Şehir Binalarına Dönüştürür
   */
  buildCity(modules, bridges, circularChains) {
    this.clearCity();

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
        targetPos.set(0, 30, 45);
        this.buildingObjects.push(this.maidenTowerGroup);
        this.buildingsMeshMap.set(this.maidenTowerGroup, mod);
        this.maidenTowerGroup.userData = { module: mod };
        mod.worldPosition = targetPos.clone();
        continue;
      }
      if (mod.district && mod.district.isLandmark === 'galata_tower') {
        targetPos.set(-110, 45, 120);
        this.buildingObjects.push(this.galataTowerGroup);
        this.buildingsMeshMap.set(this.galataTowerGroup, mod);
        this.galataTowerGroup.userData = { module: mod };
        mod.worldPosition = targetPos.clone();
        continue;
      }

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
        targetPos.set(islandX, 15, islandZ);
        islandX += 35;
      }

      const height = Math.min(180, Math.max(25, (mod.loc / 8) + (mod.complexity * 1.5)));
      const width = Math.min(38, Math.max(16, Math.sqrt(mod.loc) * 1.2));
      const depth = width;

      const isInCircularJam = circularChains.some(chain => chain.includes(mod.id));

      const buildingMesh = this.createSkyscraper(width, height, depth, mod.district.color, isInCircularJam, mod);
      buildingMesh.position.set(targetPos.x, targetPos.y + (height / 2), targetPos.z);
      this.scene.add(buildingMesh);

      this.buildingObjects.push(buildingMesh);
      this.buildingsMeshMap.set(buildingMesh, mod);
      mod.worldPosition = buildingMesh.position.clone();
    }

    this.buildBridges(bridges);
  }

  createSkyscraper(width, height, depth, baseHexColor, isJammed, moduleData) {
    const group = new THREE.Group();

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

    const edgeGeo = new THREE.EdgesGeometry(geo);
    const edgeMat = new THREE.LineBasicMaterial({
      color: isJammed ? 0xff1744 : 0x00f0ff,
      linewidth: 1.5
    });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    group.add(edges);

    if (height > 90) {
      const spireGeo = new THREE.CylinderGeometry(0.8, 1.5, 20, 8);
      const spireMat = new THREE.MeshBasicMaterial({ color: isJammed ? 0xff0000 : 0x00f0ff });
      const spire = new THREE.Mesh(spireGeo, spireMat);
      spire.position.y = (height / 2) + 10;
      group.add(spire);
    }

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
    const bridgeLocations = [
      { name: '15 Temmuz Şehitler Köprüsü', z: -30 },
      { name: 'Fatih Sultan Mehmet Köprüsü', z: 60 },
      { name: 'Yavuz Sultan Selim Köprüsü', z: -160 }
    ];

    for (let i = 0; i < bridgeLocations.length; i++) {
      const loc = bridgeLocations[i];
      const isAnyJammed = bridges.some(b => b.isJammed);

      const bridgeGroup = new THREE.Group();

      const deckGeo = new THREE.BoxGeometry(130, 4, 18);
      const deckMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a24,
        roughness: 0.9,
        metalness: 0.1
      });
      const deck = new THREE.Mesh(deckGeo, deckMat);
      deck.position.set(0, 24, loc.z);
      bridgeGroup.add(deck);

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

      const cableMat = new THREE.LineBasicMaterial({
        color: isAnyJammed ? 0xff0044 : 0x00f0ff,
        linewidth: 2
      });

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
      if (obj !== this.maidenTowerGroup && obj !== this.galataTowerGroup) {
        this.scene.remove(obj);
      }
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

  /**
   * Switches the entire 3D scene between Dark (Cyber Night) and Light (Daylight Bosphorus) modes.
   * @param {'dark'|'light'} theme
   */
  setTheme(theme) {
    const isDark = theme === 'dark';

    // Sky / Background
    this.scene.background.setHex(isDark ? 0x060913 : 0xc8e6f5);

    // Fog
    if (this.scene.fog) {
      this.scene.fog.color.setHex(isDark ? 0x060913 : 0xd0e8f8);
      this.scene.fog.density = isDark ? 0.0035 : 0.0018;
    }

    // Ambient Light
    if (this.ambientLight) {
      this.ambientLight.color.setHex(isDark ? 0x101b38 : 0xffffff);
      this.ambientLight.intensity = isDark ? 1.8 : 1.1;
    }

    // Directional (Sun) Light
    if (this.dirLight) {
      this.dirLight.color.setHex(isDark ? 0x5080ff : 0xfff4e0);
      this.dirLight.intensity = isDark ? 2.2 : 1.6;
      this.dirLight.position.set(isDark ? 150 : 200, isDark ? 350 : 500, isDark ? 100 : 250);
    }

    // Bridge Spotlight
    if (this.bridgeSpot) {
      this.bridgeSpot.intensity = isDark ? 3.5 : 1.0;
    }

    // Water surface
    if (this.waterMat) {
      this.waterMat.color.setHex(isDark ? 0x051329 : 0x007799);
      this.waterMat.roughness = isDark ? 0.15 : 0.3;
      this.waterMat.metalness = isDark ? 0.85 : 0.6;
      this.waterMat.needsUpdate = true;
    }

    // Land masses
    if (this.landMat) {
      this.landMat.color.setHex(isDark ? 0x0a101f : 0x8fbc8f);
      this.landMat.needsUpdate = true;
    }

    // Tone mapping exposure
    if (this.renderer) {
      this.renderer.toneMappingExposure = isDark ? 1.15 : 1.4;
    }

    // Building emissive balance
    for (const obj of this.buildingObjects) {
      obj.traverse((child) => {
        if (child.isMesh && child.material && child.material.emissiveIntensity !== undefined) {
          child.material.emissiveIntensity = isDark
            ? (child.material._zenithOriginalEmissive || child.material.emissiveIntensity)
            : Math.min(0.08, child.material.emissiveIntensity);
          if (isDark && !child.material._zenithOriginalEmissive) {
            child.material._zenithOriginalEmissive = child.material.emissiveIntensity;
          }
        }
      });
    }
  }

  setAtmosphere(isJammed, trafficDensity = 50, hasSecurityLeaks = false) {
    this.isRaining = isJammed || trafficDensity >= 60;
    this.hasSecurityLeaks = hasSecurityLeaks;
    if (this.rainParticles) {
      this.rainParticles.visible = this.isRaining;
    }

    if (this.isRaining) {
      this.scene.fog.density = 0.0075;
      this.scene.fog.color.setHex(0x0e111a);
      this.renderer.toneMappingExposure = 0.95;
      this.ambientLight.color.setHex(0x1a1224);
    } else {
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
      'islands': { x: 100, y: 10, z: 340, camX: 100, camY: 90, camZ: 480 },
      'maiden': { x: 0, y: 25, z: 45, camX: 0, camY: 55, camZ: 110 },
      'galata': { x: -110, y: 35, z: 120, camX: -110, camY: 90, camZ: 210 },
      'coastguard': { x: 16, y: 10, z: -45, camX: 16, camY: 45, camZ: 25 }
    };

    const target = coords[districtKey] || coords['bridge'];
    this.controlsLerpTarget = new THREE.Vector3(target.x, target.y, target.z);
    this.cameraLerpTarget = new THREE.Vector3(target.camX, target.camY, target.camZ);
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

  toggleCinematicTour() {
    this.isCinematicTour = !this.isCinematicTour;
    if (this.isCinematicTour) {
      this.cinematicAngle = Math.atan2(this.camera.position.z, this.camera.position.x);
      this.cinematicRadius = 340;
      this.cinematicHeight = 170;
      this.controls.target.set(-20, 25, 0);
    }
    return this.isCinematicTour;
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

    if (this.maidenBeacon) {
      this.maidenBeacon.rotation.y += 0.025;
    }

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

    if (this.isCinematicTour) {
      this.cinematicAngle += delta * 0.12;
      const radius = this.cinematicRadius || 340;
      this.camera.position.x = Math.cos(this.cinematicAngle) * radius;
      this.camera.position.z = Math.sin(this.cinematicAngle) * radius;
      this.camera.position.y = this.cinematicHeight || 170;
      this.controls.target.set(-20, 25, 0);
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
