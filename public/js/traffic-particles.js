/**
 * ZenithIstanbul - Traffic Particles Simulation
 * Simulates data packets & vehicles crossing the Bosphorus bridges.
 * Visualizes smooth flow vs. red circular dependency traffic gridlocks.
 */

import * as THREE from '../vendor/three/three.module.js';

export class TrafficParticles {
  constructor(scene) {
    this.scene = scene;
    this.particleCount = 380;
    this.particles = [];
    this.particleSystem = null;
    this.isJammed = false;

    this.init();
  }

  init() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);

    // 1. 15 Temmuz Şehitler Köprüsü (Z: -30, Y: 23.15, X: -105 .. 105) - 6 Şerit
    const bridge15Lanes = [
      { axis: 'X', min: -105, max: 105, y: 23.15, z: -30 - 4.5, dir: 1, speed: 0.95, isHeadlight: true },
      { axis: 'X', min: -105, max: 105, y: 23.15, z: -30 - 2.8, dir: 1, speed: 0.80, isHeadlight: true },
      { axis: 'X', min: -105, max: 105, y: 23.15, z: -30 - 1.1, dir: 1, speed: 0.65, isHeadlight: true },
      { axis: 'X', min: -105, max: 105, y: 23.15, z: -30 + 1.1, dir: -1, speed: 0.65, isHeadlight: false },
      { axis: 'X', min: -105, max: 105, y: 23.15, z: -30 + 2.8, dir: -1, speed: 0.80, isHeadlight: false },
      { axis: 'X', min: -105, max: 105, y: 23.15, z: -30 + 4.5, dir: -1, speed: 0.95, isHeadlight: false }
    ];

    // 2. Fatih Sultan Mehmet Köprüsü (FSM) (Z: -170, Y: 27.15, X: -135 .. 75) - 8 Şerit TEM Otoyolu
    const fsmLanes = [
      { axis: 'X', min: -135, max: 75, y: 27.15, z: -170 - 6.2, dir: 1, speed: 1.05, isHeadlight: true },
      { axis: 'X', min: -135, max: 75, y: 27.15, z: -170 - 4.2, dir: 1, speed: 0.90, isHeadlight: true },
      { axis: 'X', min: -135, max: 75, y: 27.15, z: -170 - 2.2, dir: 1, speed: 0.78, isHeadlight: true },
      { axis: 'X', min: -135, max: 75, y: 27.15, z: -170 - 0.7, dir: 1, speed: 0.68, isHeadlight: true },
      { axis: 'X', min: -135, max: 75, y: 27.15, z: -170 + 0.7, dir: -1, speed: 0.68, isHeadlight: false },
      { axis: 'X', min: -135, max: 75, y: 27.15, z: -170 + 2.2, dir: -1, speed: 0.78, isHeadlight: false },
      { axis: 'X', min: -135, max: 75, y: 27.15, z: -170 + 4.2, dir: -1, speed: 0.90, isHeadlight: false },
      { axis: 'X', min: -135, max: 75, y: 27.15, z: -170 + 6.2, dir: -1, speed: 1.05, isHeadlight: false }
    ];

    // 3. Yavuz Sultan Selim Köprüsü (YSS) (Z: -320, Y: 32.15, X: -180 .. 160) - 6 Geniş Şerit
    const yssLanes = [
      { axis: 'X', min: -180, max: 160, y: 32.15, z: -320 - 7.5, dir: 1, speed: 1.15, isHeadlight: true },
      { axis: 'X', min: -180, max: 160, y: 32.15, z: -320 - 5.5, dir: 1, speed: 0.95, isHeadlight: true },
      { axis: 'X', min: -180, max: 160, y: 32.15, z: -320 - 3.5, dir: 1, speed: 0.80, isHeadlight: true },
      { axis: 'X', min: -180, max: 160, y: 32.15, z: -320 + 3.5, dir: -1, speed: 0.80, isHeadlight: false },
      { axis: 'X', min: -180, max: 160, y: 32.15, z: -320 + 5.5, dir: -1, speed: 0.95, isHeadlight: false },
      { axis: 'X', min: -180, max: 160, y: 32.15, z: -320 + 7.5, dir: -1, speed: 1.15, isHeadlight: false }
    ];

    // 4. Tarihi Galata Köprüsü (X: -48, Y: 8.6, Z: 76 .. 118) - 4 Şerit (Haliç Geçişi)
    const galataLanes = [
      { axis: 'Z', min: 76, max: 118, y: 8.6, x: -48 - 4.2, dir: 1, speed: 0.55, isHeadlight: true },
      { axis: 'Z', min: 76, max: 118, y: 8.6, x: -48 - 2.0, dir: 1, speed: 0.45, isHeadlight: true },
      { axis: 'Z', min: 76, max: 118, y: 8.6, x: -48 + 2.0, dir: -1, speed: 0.45, isHeadlight: false },
      { axis: 'Z', min: 76, max: 118, y: 8.6, x: -48 + 4.2, dir: -1, speed: 0.55, isHeadlight: false }
    ];

    const allBridgeLanes = [
      ...bridge15Lanes, ...bridge15Lanes,
      ...fsmLanes, ...fsmLanes,
      ...yssLanes,
      ...galataLanes
    ];

    for (let i = 0; i < this.particleCount; i++) {
      const lane = allBridgeLanes[i % allBridgeLanes.length];
      let x, y, z;

      if (lane.axis === 'X') {
        x = lane.min + Math.random() * (lane.max - lane.min);
        y = lane.y + (Math.random() * 0.35);
        z = lane.z + ((Math.random() - 0.5) * 0.7);
      } else {
        // Z Ekseni (Galata Köprüsü)
        x = lane.x + ((Math.random() - 0.5) * 0.5);
        y = lane.y + (Math.random() * 0.3);
        z = lane.min + Math.random() * (lane.max - lane.min);
      }

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      let r, g, b;
      if (lane.isHeadlight) {
        if (Math.random() > 0.4) {
          r = 0.88; g = 0.95; b = 1.0; // Xenon LED
        } else {
          r = 1.0; g = 0.88; b = 0.65; // Sıcak Halojen
        }
      } else {
        r = 1.0;
        g = 0.10 + Math.random() * 0.12;
        b = 0.12; // Yakut Kırmızı Arka Stop
      }

      this.particles.push({
        x,
        y,
        z,
        lane,
        speed: (lane.speed + (Math.random() * 0.25 - 0.12)) * lane.dir,
        baseR: r,
        baseG: g,
        baseB: b
      });

      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 3.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending
    });

    this.particleSystem = new THREE.Points(geo, mat);
    this.scene.add(this.particleSystem);
  }

  setTrafficState(isJammed) {
    this.isJammed = isJammed;
  }

  update() {
    if (!this.particleSystem) return;

    const positions = this.particleSystem.geometry.attributes.position.array;
    const colors = this.particleSystem.geometry.attributes.color.array;

    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];
      const lane = p.lane;

      if (lane.axis === 'X') {
        if (this.isJammed) {
          p.x += p.speed * 0.08;
          colors[i * 3] = 1.0;
          colors[i * 3 + 1] = 0.06;
          colors[i * 3 + 2] = 0.08;
        } else {
          p.x += p.speed;
          colors[i * 3] = p.baseR;
          colors[i * 3 + 1] = p.baseG;
          colors[i * 3 + 2] = p.baseB;
        }

        // Köprü sınırlarından loop
        if (p.x > lane.max) {
          p.x = lane.min;
        } else if (p.x < lane.min) {
          p.x = lane.max;
        }
      } else {
        // Z Ekseni Haliç / Galata Köprüsü
        if (this.isJammed) {
          p.z += p.speed * 0.08;
          colors[i * 3] = 1.0;
          colors[i * 3 + 1] = 0.06;
          colors[i * 3 + 2] = 0.08;
        } else {
          p.z += p.speed;
          colors[i * 3] = p.baseR;
          colors[i * 3 + 1] = p.baseG;
          colors[i * 3 + 2] = p.baseB;
        }

        // Galata köprüsü sınırlarından loop
        if (p.z > lane.max) {
          p.z = lane.min;
        } else if (p.z < lane.min) {
          p.z = lane.max;
        }
      }

      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    }

    this.particleSystem.geometry.attributes.position.needsUpdate = true;
    this.particleSystem.geometry.attributes.color.needsUpdate = true;
  }
}

