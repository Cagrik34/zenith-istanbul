/**
 * ZenithIstanbul - Traffic Particles Simulation
 * Simulates data packets & vehicles crossing the Bosphorus bridges.
 * Visualizes smooth flow vs. red circular dependency traffic gridlocks.
 */

import * as THREE from 'https://esm.sh/three@0.170.0';

export class TrafficParticles {
  constructor(scene) {
    this.scene = scene;
    this.particleCount = 180;
    this.particles = [];
    this.particleSystem = null;
    this.isJammed = false;

    this.init();
  }

  init() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);

    // 15 Temmuz (Z: -30) ve FSM (Z: 60) köprü hatları
    const bridgeZCoordinates = [-30, 60];

    for (let i = 0; i < this.particleCount; i++) {
      const zTrack = bridgeZCoordinates[i % bridgeZCoordinates.length];
      const x = (Math.random() * 120) - 60; // Köprü üzerinde X: -60 ile +60 arası
      const y = 25.5; // Asfaltın hemen üstü
      const z = zTrack + ((Math.random() * 8) - 4); // Şeritler

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Hız ve yön (Avrupa'dan Anadolu'ya veya tersi)
      this.particles.push({
        x,
        y,
        z,
        zTrack,
        speed: (Math.random() * 0.8 + 0.4) * (i % 2 === 0 ? 1 : -1),
        baseColor: i % 2 === 0 ? new THREE.Color(0x00f0ff) : new THREE.Color(0xffaa00)
      });

      // Başlangıç rengi
      colors[i * 3] = 0.0;
      colors[i * 3 + 1] = 0.94;
      colors[i * 3 + 2] = 1.0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Glow noktaları için özel materyal
    const mat = new THREE.PointsMaterial({
      size: 4.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
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

      if (this.isJammed) {
        // Trafik Kilitlendi! Hız %90 düşer, araçlar birbirine yapışır (Kırmızı alarm)
        p.x += p.speed * 0.08;
        // Kırmızı / Turuncu alarm renkleri
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.08;
        colors[i * 3 + 2] = 0.15;
      } else {
        // Akıcı Trafik! Hızlı yeşil ve mavi veri paketleri
        p.x += p.speed;
        colors[i * 3] = 0.0;
        colors[i * 3 + 1] = 0.95;
        colors[i * 3 + 2] = 0.55;
      }

      // Köprünün sonuna gelince başa dön
      if (p.x > 60) {
        p.x = -60;
      } else if (p.x < -60) {
        p.x = 60;
      }

      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    }

    this.particleSystem.geometry.attributes.position.needsUpdate = true;
    this.particleSystem.geometry.attributes.color.needsUpdate = true;
  }
}
