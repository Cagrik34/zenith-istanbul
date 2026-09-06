/**
 * ZenithIstanbul - Architectural Telemetry HUD & Spatial Audio Synthesizer
 * Web Audio API procedural sound synthesizer (Low-frequency ingress, ambient acoustic resonance, gridlock alarm),
 * Telemetry gauge controller, and building inspector drawer.
 */

export class TrafficHUD {
  constructor() {
    this.audioCtx = null;
    this.audioEnabled = false;
    this.initAudio();
  }

  initAudio() {
    const enableAudioOnce = () => {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
        this.audioEnabled = true;
      }
      window.removeEventListener('click', enableAudioOnce);
    };
    window.addEventListener('click', enableAudioOnce);
  }

  /**
   * Low-frequency acoustic ingress horn synthesizer (Maritime Bosphorus harmonic resonance)
   */
  playVapurDudugu() {
    if (!this.audioCtx || !this.audioEnabled) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(110, now);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(113.5, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 3.0);
      osc2.stop(now + 3.0);
    } catch (e) {
      console.warn('Audio synthesis telemetry note:', e);
    }
  }

  /**
   * Bridge Ingress Cyclic Deadlock Alert Synthesizer
   */
  playGridlockAlertTone() {
    if (!this.audioCtx || !this.audioEnabled) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(340, now + 0.4);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {}
  }

  /**
   * Backward-compatibility alias for deadlock alarm
   */
  playTrafficHonk() {
    return this.playGridlockAlertTone();
  }

  /**
   * Ambient coastal seagull resonance
   */
  playSeagull() {
    if (!this.audioCtx || !this.audioEnabled) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.exponentialRampToValueAtTime(2600, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(1900, now + 0.35);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {}
  }

  /**
   * Invariant Decoupled & Cycle Remediated Chime
   */
  playSuccessChime() {
    if (!this.audioCtx || !this.audioEnabled) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const now = this.audioCtx.currentTime + (idx * 0.12);
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.85);
      });
    } catch (e) {}
  }

  /**
   * Acoustic feedback when inspecting a historical architecture snapshot
   */
  playSnapshotClickTone() {
    if (!this.audioCtx || !this.audioEnabled) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  }

  /**
   * Render Pure SVG Architecture Drift Sparkline
   * Zero external dependencies: calculates polyline coordinates directly.
   * @param {SVGElement} svg 
   * @param {HTMLElement} tooltip 
   * @param {Array} history 
   * @param {number|null} activeIndex 
   * @param {Function} onSelectPoint 
   */
  renderDriftChart(svg, tooltip, history, activeIndex, onSelectPoint) {
    if (!svg) return;
    svg.innerHTML = '';

    if (!history || history.length === 0) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', '140');
      text.setAttribute('y', '44');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', 'rgba(255,255,255,0.3)');
      text.setAttribute('font-size', '10');
      text.textContent = 'No telemetry history points recorded yet';
      svg.appendChild(text);
      return;
    }

    const width = 280;
    const height = 80;
    const padX = 14;
    const padY = 12;
    const plotW = width - padX * 2;
    const plotH = height - padY * 2;

    [0, 0.5, 1].forEach(ratio => {
      const y = padY + plotH * (1 - ratio);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', padX);
      line.setAttribute('y1', y);
      line.setAttribute('x2', width - padX);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', 'rgba(255,255,255,0.06)');
      line.setAttribute('stroke-dasharray', '2,2');
      svg.appendChild(line);
    });

    const count = history.length;
    const trafficPoints = [];
    const deadlockPoints = [];
    const coords = [];

    // Division-by-zero protection: when all historical points are identical (min === max), render baseline at center
    const calcY = (val, min, max, height = plotH) => {
      const range = max - min;
      const y = range === 0 ? height / 2 : height - ((val - min) / range) * height;
      return padY + y;
    };

    const trafficVals = history.map(h => Math.min(100, Math.max(0, h.trafficIndex ?? 0)));
    const minTraffic = Math.min(0, ...trafficVals);
    const maxTraffic = Math.max(100, ...trafficVals);

    const deadlockVals = history.map(h => Math.max(0, h.cyclicDeadlocks ?? 0));
    const minDeadlocks = Math.min(...deadlockVals);
    const maxDeadlocks = Math.max(3, ...deadlockVals);

    if (count <= 1) {
      // Guard against count <= 1: draw flat horizontal line and center node
      const rec = history[0];
      const yTraffic = calcY(rec.trafficIndex || 0, minTraffic, maxTraffic);
      trafficPoints.push(`${padX.toFixed(1)},${yTraffic.toFixed(1)}`);
      trafficPoints.push(`${(width - padX).toFixed(1)},${yTraffic.toFixed(1)}`);

      const yDeadlock = calcY(rec.cyclicDeadlocks || 0, minDeadlocks, maxDeadlocks);
      deadlockPoints.push(`${padX.toFixed(1)},${yDeadlock.toFixed(1)}`);
      deadlockPoints.push(`${(width - padX).toFixed(1)},${yDeadlock.toFixed(1)}`);

      coords.push({ x: padX + plotW / 2, yTraffic, yDeadlock, rec, idx: 0 });
    } else {
      history.forEach((rec, idx) => {
        const x = padX + (idx / (count - 1)) * plotW;
        const yTraffic = calcY(rec.trafficIndex || 0, minTraffic, maxTraffic);
        trafficPoints.push(`${x.toFixed(1)},${yTraffic.toFixed(1)}`);

        const yDeadlock = calcY(rec.cyclicDeadlocks || 0, minDeadlocks, maxDeadlocks);
        deadlockPoints.push(`${x.toFixed(1)},${yDeadlock.toFixed(1)}`);

        coords.push({ x, yTraffic, yDeadlock, rec, idx });
      });
    }

    const polyTraffic = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyTraffic.setAttribute('points', trafficPoints.join(' '));
    polyTraffic.setAttribute('fill', 'none');
    polyTraffic.setAttribute('stroke', '#00f0ff');
    polyTraffic.setAttribute('stroke-width', '2');
    polyTraffic.setAttribute('stroke-linecap', 'round');
    polyTraffic.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(polyTraffic);

    if (history.some(h => (h.cyclicDeadlocks || 0) > 0)) {
      const polyDeadlock = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      polyDeadlock.setAttribute('points', deadlockPoints.join(' '));
      polyDeadlock.setAttribute('fill', 'none');
      polyDeadlock.setAttribute('stroke', '#ff1744');
      polyDeadlock.setAttribute('stroke-width', '1.5');
      polyDeadlock.setAttribute('stroke-dasharray', '3,2');
      polyDeadlock.setAttribute('stroke-linecap', 'round');
      svg.appendChild(polyDeadlock);
    }

    coords.forEach(({ x, yTraffic, rec, idx }) => {
      const isSelected = activeIndex === idx;
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x.toFixed(1));
      circle.setAttribute('cy', yTraffic.toFixed(1));
      circle.setAttribute('r', isSelected ? '5.5' : '3.5');
      circle.setAttribute('fill', rec.cyclicDeadlocks > 0 ? '#ff1744' : '#00f0ff');
      circle.setAttribute('stroke', isSelected ? '#ffffff' : '#060b18');
      circle.setAttribute('stroke-width', isSelected ? '2' : '1.5');
      circle.style.cursor = 'pointer';
      circle.style.transition = 'r 0.15s ease, stroke 0.15s ease';

      circle.addEventListener('mouseenter', () => {
        circle.setAttribute('r', isSelected ? '6.5' : '5.5');
        if (tooltip) {
          const timeStr = rec.timestamp ? new Date(rec.timestamp).toLocaleTimeString() : 'N/A';
          tooltip.innerHTML = `
            <div style="font-weight: 700; color: var(--accent-cyan); margin-bottom: 2px;">
              Snapshot #${idx + 1} (${rec.gitCommit || 'HEAD'})
            </div>
            <div style="font-size: 9px; color: var(--text-muted); margin-bottom: 4px;">${timeStr}</div>
            <div style="display: flex; gap: 8px;">
              <span>Traffic: <strong style="color: #00f0ff">%${rec.trafficIndex}</strong></span>
              <span>Cycles: <strong style="color: #ff1744">${rec.cyclicDeadlocks}</strong></span>
              <span>Leaks: <strong style="color: #ff9100">${rec.securityExposures}</strong></span>
            </div>
            <div style="font-size: 8px; color: rgba(255,255,255,0.4); margin-top: 3px;">Click to inspect in HUD</div>
          `;
          tooltip.style.display = 'block';
          tooltip.style.left = `${Math.min(width - 135, Math.max(5, x - 55))}px`;
          tooltip.style.top = `${Math.max(0, yTraffic - 48)}px`;
        }
      });

      circle.addEventListener('mouseleave', () => {
        circle.setAttribute('r', isSelected ? '5.5' : '3.5');
        if (tooltip) tooltip.style.display = 'none';
      });

      circle.addEventListener('click', () => {
        this.playSnapshotClickTone();
        if (onSelectPoint) onSelectPoint(rec, idx);
      });

      svg.appendChild(circle);
    });
  }

  /**
   * Render Time-Series Snapshot History List
   * @param {HTMLElement} container 
   * @param {Array} history 
   * @param {number|null} activeIndex 
   * @param {Function} onSelectPoint 
   */
  renderHistoryList(container, history, activeIndex, onSelectPoint) {
    if (!container) return;
    container.innerHTML = '';

    if (!history || history.length === 0) {
      container.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:10px; padding:6px;">No history records</div>`;
      return;
    }

    const reversed = [...history].map((rec, origIdx) => ({ rec, origIdx })).reverse();

    reversed.forEach(({ rec, origIdx }) => {
      const item = document.createElement('div');
      item.className = `drift-history-item ${activeIndex === origIdx ? 'active' : ''}`;
      const timeStr = rec.timestamp ? new Date(rec.timestamp).toLocaleTimeString() : 'N/A';
      const isDeadlocked = (rec.cyclicDeadlocks || 0) > 0;
      const statusIcon = isDeadlocked ? '🚨' : (rec.securityExposures > 0 ? '🛡️' : '🟢');

      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px;">
          <span>${statusIcon}</span>
          <span style="font-weight: 600; color: #fff;">${rec.gitCommit || 'HEAD'}</span>
          <span style="color: var(--text-muted); font-size: 9px;">${timeStr}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 9px; color: ${isDeadlocked ? 'var(--accent-red)' : 'var(--accent-green)'}; font-weight: 700;">%${rec.trafficIndex}</span>
          ${isDeadlocked ? `<span style="font-size: 8px; background: rgba(255, 23, 68, 0.2); color: #ff1744; padding: 1px 4px; border-radius: 3px;">${rec.cyclicDeadlocks} SCC</span>` : ''}
        </div>
      `;

      item.addEventListener('click', () => {
        this.playSnapshotClickTone();
        if (onSelectPoint) onSelectPoint(rec, origIdx);
      });

      container.appendChild(item);
    });
  }
}

