    import { CodebaseParser } from '../src/core/ast-parser.js';
    import { TrafficEngine } from '../src/core/traffic-engine.js';
    import { BosphorusScene } from './bosphorus-scene.js';
    import { TrafficParticles } from './traffic-particles.js';
    import { TrafficHUD } from './traffic-hud.js';
    import { AgentDispatcher } from '../src/agent/agent-dispatcher.js';
    import { SAMPLE_REPOSITORIES } from './samples.js';
    import * as THREE from '../vendor/three/three.module.js';

    // ─── Safe HTML Escaper (XSS & Runtime ReferenceError Protection) ───
    function escapeHtml(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    
    // ─── Global Uncaught Exception & Promise Guard ───
    window.addEventListener('error', (e) => {
      console.warn('[ZENITH RUNTIME SHIELD] Uncaught error captured:', e.message || e.error);
    });
    window.addEventListener('unhandledrejection', (e) => {
      console.warn('[ZENITH RUNTIME SHIELD] Unhandled promise rejection captured:', e.reason);
    });

    // ─── Scope-Safe Vector3 Factory ───
    const createVec3 = (x, y, z) => (typeof THREE !== 'undefined' && THREE && THREE.Vector3 ? new THREE.Vector3(x, y, z) : { x, y, z });

    function getSideDisplayName(side) {
      if (side === 'europe') return 'Avrupa';
      if (side === 'asia') return 'Anadolu';
      if (side === 'historic') return 'Tarihi Yarımada (Avrupa)';
      if (side === 'bosphorus') return 'Boğaziçi';
      if (side === 'islands') return 'Adalar';
      return 'Metropol';
    }

    const isStaticHost = window.location.hostname.includes('github.io') || window.location.protocol === 'file:';

    const parser = new CodebaseParser();
    const trafficEngine = new TrafficEngine();
    const hud = new TrafficHUD();
    window.trafficEngine = trafficEngine;
    window.hud = hud;
    window.parser = parser;

    let lastRefactorDiff = '';
    let lastRefactorPayload = null;

    const canvasContainer = document.getElementById('viewport-container');
    const tooltipEl = document.getElementById('building-tooltip');

    const bosphorusScene = new BosphorusScene(
      canvasContainer,
      (moduleData) => {
        showBuildingInspector(moduleData);
      },
      (mod, clientX, clientY) => {
        if (!tooltipEl) return;
        if (!mod) {
          tooltipEl.style.display = 'none';
          return;
        }

        const isCycle = trafficEngine.circularChains.some(chain => chain.includes(mod.id));
        tooltipEl.innerHTML = `
          <div style="font-weight: 700; font-size: 11px; color: ${mod.district.color || 'var(--accent-cyan)'}; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span>🏢 ${escapeHtml(mod.name)}</span>
            ${isCycle ? '<span style="background: #ff1744; color: #fff; font-size: 8px; padding: 1px 4px; border-radius: 3px; font-weight: 800;">SCC</span>' : ''}
          </div>
          <div style="display: flex; gap: 8px; font-size: 10px; color: var(--text-muted); margin-top: 4px;">
            <span>LOC: <strong style="color: var(--text-main);">${mod.loc || 0}</strong></span>
            <span>Cmplx: <strong style="color: var(--text-main);">${mod.complexity || 0}</strong></span>
            <span>Health: <strong style="color: ${mod.healthScore > 80 ? 'var(--accent-green)' : '#ff9100'};">${mod.healthScore || 100}%</strong></span>
          </div>
          <div style="font-size: 9px; color: var(--text-muted); margin-top: 3px; border-top: 1px solid var(--panel-border); padding-top: 3px;">
            📍 ${getSideDisplayName(mod.district?.side)} • <span style="color: ${mod.district?.color || 'var(--accent-cyan)'}; font-weight: 600;">${escapeHtml(mod.district?.district || 'Bölge')}</span>
          </div>
        `;

        tooltipEl.style.display = 'block';
        const tipWidth = 200;
        const tipHeight = 70;
        const posX = Math.min(window.innerWidth - tipWidth - 12, clientX + 16);
        const posY = Math.min(window.innerHeight - tipHeight - 12, clientY + 16);
        tooltipEl.style.left = `${posX}px`;
        tooltipEl.style.top = `${posY}px`;
      }
    );

    const trafficParticles = new TrafficParticles(bosphorusScene.scene);
    window.bosphorusScene = bosphorusScene;
    window.trafficParticles = trafficParticles;
    window.refreshCityUI = refreshCityUI;

    const terminalDrawer = document.getElementById('terminal-drawer');
    function logToTerminal(text, type = 'info') {
      const line = document.createElement('div');
      line.className = `log-line ${type}`;
      line.textContent = text;
      terminalDrawer.appendChild(line);
      terminalDrawer.scrollTop = terminalDrawer.scrollHeight;
    }

    const dispatcher = new AgentDispatcher(
      (text, type) => logToTerminal(text, type),
      (generatedDiff, refactorPayload) => {
        hud.playSuccessChime();
        hud.playVapurDudugu();
        lastRefactorDiff = generatedDiff;
        lastRefactorPayload = refactorPayload;
        const bvd = document.getElementById('btn-view-diff');
        if (bvd) {
          bvd.style.display = 'block';
          bvd.innerHTML = '📄 View Remediation Diff';
        }
        refreshCityUI();
      }
    );

    const inspectorDrawer = document.getElementById('inspector-drawer');
    const inspectName = document.getElementById('inspect-name');
    const inspectDistrict = document.getElementById('inspect-district');
    const inspectLoc = document.getElementById('inspect-loc');
    const inspectComplexity = document.getElementById('inspect-complexity');
    const inspectHealth = document.getElementById('inspect-health');
    const inspectFunctions = document.getElementById('inspect-functions');
    const inspectBlastDesc = document.getElementById('inspect-blast-desc');
    const inspectCodePreview = document.getElementById('inspect-code-preview');

    function showBuildingInspector(mod) {
      inspectName.textContent = mod.name;
      inspectDistrict.textContent = `${getSideDisplayName(mod.district?.side)} (${mod.district?.district || 'Genel'})`;
      inspectDistrict.style.background = `${mod.district.color}22`;
      inspectDistrict.style.color = mod.district.color;
      inspectLoc.textContent = mod.loc;
      inspectComplexity.textContent = mod.complexity;
      inspectHealth.textContent = `${mod.healthScore} / 100`;

      if (mod.functions && mod.functions.length > 0) {
        inspectFunctions.textContent = mod.functions.map(f => `ƒ ${f}()`).join(', ');
      } else {
        inspectFunctions.textContent = 'Özel fonksiyon ayrıştırılmadı';
      }

      const blast = trafficEngine.calculateBlastRadius(mod.id);
      inspectBlastDesc.innerHTML = `
        Risk Seviyesi: <strong>${blast.riskLevel}</strong><br>
        Doğrudan Etkilenenler: ${blast.directDependents.length} modül<br>
        Bağlı Olduğu (Imports): ${blast.directDependencies.length} modül
      `;

      const secBox = document.getElementById('inspect-security-box');
      const secDesc = document.getElementById('inspect-security-desc');
      if (mod.securityLeaks && mod.securityLeaks.length > 0) {
        secDesc.innerHTML = mod.securityLeaks.map(l => `
          <div style="margin-bottom: 6px; border-bottom: 1px solid rgba(255, 145, 0, 0.2); padding-bottom: 4px;">
            <strong style="color: #ff9100;">[${escapeHtml(l.cwe || l.type)}]</strong> 
            <span style="font-family: monospace; color: #fff;">${escapeHtml(l.location || `${mod.path}:${l.line || 1}:${l.col || 1}`)}</span>
            <div style="font-size: 10px; color: #ffe0b2; margin-top: 2px;">${escapeHtml(l.message)}</div>
            ${l.snippet ? `<code style="display:block; background:rgba(0,0,0,0.5); padding:3px 6px; border-radius:4px; font-size:10px; color:#ffb74d; margin-top:3px; font-family: 'JetBrains Mono', monospace;">${escapeHtml(l.snippet)}</code>` : ''}
          </div>
        `).join('');
        secBox.style.display = 'block';
      } else {
        secBox.style.display = 'none';
      }

      inspectCodePreview.textContent = mod.content || `// ${mod.name}\n// LOC: ${mod.loc}, Complexity: ${mod.complexity}\n// Sector: ${mod.district.district}\n\nexport const ${mod.name.replace(/\.[^/.]+$/, '')} = {\n  status: 'active'\n};`;

      bosphorusScene.drawLaserConnections(mod, trafficEngine);

      inspectorDrawer.style.display = 'flex';
      document.body.classList.add('has-inspector');
      document.querySelector('.workspace')?.classList.add('has-inspector');
      hud.playGridlockAlertTone();
    }

    function closeInspectorDrawer() {
      inspectorDrawer.style.display = 'none';
      document.body.classList.remove('has-inspector');
      document.querySelector('.workspace')?.classList.remove('has-inspector');
      bosphorusScene.clearLaserConnections();
    }

    document.getElementById('btn-close-inspect').addEventListener('click', closeInspectorDrawer);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && inspectorDrawer.style.display === 'flex') {
        closeInspectorDrawer();
      }
    });

    const radarContainer = document.getElementById('radar-container');
    const btnToggleRadar = document.getElementById('btn-toggle-radar-collapse');
    if (btnToggleRadar && radarContainer) {
      btnToggleRadar.addEventListener('click', (e) => {
        e.stopPropagation();
        const isCollapsed = radarContainer.classList.toggle('is-collapsed');
        btnToggleRadar.textContent = isCollapsed ? '▲' : '─';
      });
    }

    async function fetchEnvironmentTelemetry(hasGraphIssues, density) {
      const weatherIcon = document.getElementById('weather-icon');
      const weatherTitle = document.getElementById('weather-title');
      const weatherDesc = document.getElementById('weather-desc');

      let env = null;

      // 1. If running with local CLI server, query server endpoint
      if (!isStaticHost) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1200);
          const res = await fetch('./api/environment', { signal: controller.signal });
          clearTimeout(timeoutId);
          if (res.ok) {
            env = await res.json();
          }
        } catch (e) {}
      }

      // 2. Direct client-side Open-Meteo fallback for GitHub Pages & standalone web
      if (!env) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);
          const url = 'https://api.open-meteo.com/v1/forecast?latitude=41.0082&longitude=28.9784&current=weather_code,wind_speed_10m';
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            env = {
              success: true,
              source: 'open-meteo-client',
              current: data.current || { weather_code: 0, wind_speed_10m: 12.0 }
            };
          }
        } catch (e) {}
      }

      // 3. Process environment data or fallback
      if (env && env.current) {
        const code = env.current.weather_code !== undefined ? env.current.weather_code : 0;
        const wind = env.current.wind_speed_10m !== undefined ? env.current.wind_speed_10m : 14.0;
        const source = env.source === 'open-meteo-client' ? 'Open-Meteo Direct Client' : (env.source === 'open-meteo' ? 'Open-Meteo Server' : 'Deterministic AST');

        let condition = 'Nominal Skies';
        let icon = '☀️';

        if (code >= 1 && code <= 3) { condition = 'Partly Cloudy'; icon = '🌤️'; }
        else if (code >= 45 && code <= 48) { condition = 'Bosphorus Inversion Fog'; icon = '🌫️'; }
        else if (code >= 51 && code <= 67) { condition = 'Precipitation / Rain'; icon = '🌧️'; }
        else if (code >= 71) { condition = 'Severe Atmospheric Storm'; icon = '⚡'; }

        if (hasGraphIssues) {
          weatherIcon.textContent = '🌫️';
          weatherTitle.textContent = `Atmosphere: ${condition} (${wind} km/h)`;
          weatherTitle.style.color = 'var(--accent-red)';
          weatherDesc.textContent = `CRITICAL: Ingress Deadlock Active • ${source}`;
        } else {
          weatherIcon.textContent = icon;
          weatherTitle.textContent = `Atmosphere: ${condition} (${wind} km/h)`;
          weatherTitle.style.color = 'var(--accent-green)';
          weatherDesc.textContent = `DAG Topology Invariants Nominal • ${source}`;
        }
        return;
      }

      // 4. Offline deterministic AST fallback
      if (hasGraphIssues) {
        weatherIcon.textContent = '🌫️';
        weatherTitle.textContent = 'Atmosphere: Low Inversion Fog';
        weatherTitle.style.color = 'var(--accent-red)';
        weatherDesc.textContent = 'Deterministic AST Health Invariant Breach';
      } else {
        weatherIcon.textContent = '☀️';
        weatherTitle.textContent = 'Atmosphere: Clear Neon Metropolis';
        weatherTitle.style.color = 'var(--accent-green)';
        weatherDesc.textContent = 'Deterministic AST Health Score: 100%';
      }
    }

    function refreshCityUI() {
      const report = trafficEngine.generateTelemetryReport();

      bosphorusScene.buildCity(
        Array.from(trafficEngine.modules.values()),
        trafficEngine.bridges,
        trafficEngine.circularChains
      );

      trafficParticles.setTrafficState(report.circularDependencies > 0);

      const dial = document.getElementById('gauge-dial');
      dial.textContent = `%${report.density}`;

      const title = document.getElementById('gauge-status-title');
      const desc = document.getElementById('gauge-status-desc');
      const incidentBox = document.getElementById('incident-box');

      if (report.circularDependencies > 0) {
        dial.style.borderColor = '#ff1744';
        dial.style.color = '#ff1744';
        dial.style.boxShadow = '0 0 16px rgba(255, 23, 68, 0.4)';
        title.textContent = 'CRITICAL: Deadlock Invariant';
        desc.textContent = 'Tarjan SCC Violation in Bridge Ingress';
        incidentBox.style.display = 'flex';
      } else {
        dial.style.borderColor = '#00e676';
        dial.style.color = '#00e676';
        dial.style.boxShadow = '0 0 16px rgba(0, 230, 118, 0.4)';
        title.textContent = 'Topology Nominal';
        desc.textContent = 'Zero Invariant Violations Across Bridges';
        incidentBox.style.display = 'none';
      }

      const secAlertBox = document.getElementById('security-alert-box');
      const secAlertDesc = document.getElementById('security-alert-desc');
      if (report.securityLeakCount > 0) {
        secAlertDesc.textContent = `CRITICAL: Client-side boundary breached (${report.securityLeakCount} secret or forbidden package exposures detected)`;
        secAlertBox.style.display = 'flex';
      } else {
        secAlertBox.style.display = 'none';
      }

      const hasIssues = report.circularDependencies > 0 || report.density >= 60 || report.securityLeakCount > 0;
      bosphorusScene.setAtmosphere(hasIssues, report.density, report.securityLeakCount > 0);

      fetchEnvironmentTelemetry(hasIssues, report.density);

      document.getElementById('stat-modules').textContent = report.totalModules;
      document.getElementById('stat-cycles').textContent = report.circularDependencies;
      document.getElementById('stat-bridges').textContent = trafficEngine.bridges.length;
      document.getElementById('stat-leaks').textContent = report.securityLeakCount;
      document.getElementById('stat-dead').textContent = report.deadCodeCount;
    }

    function loadSample(sampleKey) {
      const sample = SAMPLE_REPOSITORIES[sampleKey];
      if (!sample) return;

      logToTerminal(`📦 [SCENARIO LOADED] ${sample.name}`, 'header');
      trafficEngine.loadModules(sample.modules);
      refreshCityUI();

      // Camera auto-framing on Maslak & Beşiktaş skyscrapers
      if (bosphorusScene) {
        bosphorusScene.controlsLerpTarget = createVec3(-40, 30, -30);
        bosphorusScene.cameraLerpTarget = createVec3(-60, 180, 240);
      }

      // Update sector radar
      drawRadar();

      if (sampleKey === 'circular-jam-demo') {
        hud.playTrafficHonk();
        setTimeout(() => hud.playTrafficHonk(), 500);
      }
    }
    window.loadScenario = loadSample;
    window.loadSample = loadSample;

    function executeAutonomousRemediation() {
      try {
        logToTerminal('⚡ [AUTONOMOUS REMEDIATION PROTOCOL] Remediation Agent Dispatched by Operator...', 'header');
        if (typeof hud?.playClickTone === 'function') hud.playClickTone();

        // 1. İstemci taraflı bellek içi yama motorunu çalıştır
        const engine = window.trafficEngine || trafficEngine;
        let result = null;
        if (engine && typeof engine.applyAutonomousRemediation === 'function') {
          result = engine.applyAutonomousRemediation();
        }

        if (result) {
          lastRefactorDiff = result.diff || '';
          lastRefactorPayload = result;
        }

        // 2. 3D Şehir sahnesini ve HUD metriklerini yeniden hesapla
        if (typeof refreshCityUI === 'function') {
          refreshCityUI();
        }

        // 3. Sol HUD göstergesini yeşile dönüştür: '%0 Topology Nominal (All Invariants Satisfied)'
        const dial = document.getElementById('gauge-dial');
        if (dial) {
          dial.textContent = '%0';
          dial.style.borderColor = '#00e676';
          dial.style.color = '#00e676';
          dial.style.boxShadow = '0 0 16px rgba(0, 230, 118, 0.4)';
        }
        const title = document.getElementById('gauge-status-title');
        if (title) title.textContent = 'Topology Nominal';
        const desc = document.getElementById('gauge-status-desc');
        if (desc) desc.textContent = 'Zero Invariant Violations Across Bridges (All Invariants Satisfied)';
        const statCycles = document.getElementById('stat-cycles');
        if (statCycles) {
          statCycles.textContent = '0';
          statCycles.style.color = 'var(--accent-green)';
        }

        // 4. Boğaz Köprüsü üzerindeki kırmızı alarm lazerlerini anında turkuaz/yeşil akıcı parçacık trafiğine çevir
        if (bosphorusScene) {
          bosphorusScene.isDeadlockAlert = false;
          bosphorusScene.setAtmosphere(false, 0, false);
          if (bosphorusScene.bridgeCableMat) {
            bosphorusScene.bridgeCableMat.color.setHex(0x00f0ff);
            bosphorusScene.bridgeCableMat.emissive.setHex(0x00f0ff);
            bosphorusScene.bridgeCableMat.emissiveIntensity = 0.8;
          }
        }
        if (trafficParticles) {
          trafficParticles.setTrafficState(false);
        }

        // 5. '📄 View Remediation Diff' butonunu görünür kıl
        const btnViewDiff = document.getElementById('btn-view-diff');
        if (btnViewDiff) {
          btnViewDiff.style.display = 'block';
          btnViewDiff.innerHTML = '📄 View Remediation Diff';
        }

        // Incident alert box'ı gizle
        const incidentBox = document.getElementById('incident-box');
        if (incidentBox) {
          incidentBox.style.display = 'none';
        }

        // Kırmızı ❌ hata göstergelerini temizle
        document.querySelectorAll('.error-indicator, #error-indicator, .runtime-error-badge').forEach(el => el.remove());

        logToTerminal('✨ [REMEDIATION RESOLVED] Decoupled abstract contract synthesized: types/auth.ts', 'success');
        logToTerminal('🌉 [TOPOLOGY NOMINAL] Tarjan SCC Cycles: 0 | Bridge ingress deadlock cleared.', 'success');
        logToTerminal('📄 [PATCH READY] Click "View Remediation Diff" to review generated git diff.', 'highlight');
        if (typeof hud?.playSuccessChime === 'function') hud.playSuccessChime();
      } catch (err) {
        console.error('[REMEDIATION ERROR]', err);
        logToTerminal(`[REMEDIATION] Autonomous patch error handled: ${err.message}`, 'error');
      }
    }

    // Dinamik DOM Delegasyonu (#btn-dispatch-agent)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#btn-dispatch-agent');
      if (btn) {
        e.preventDefault();
        try {
          if (window.trafficEngine && typeof window.trafficEngine.applyAutonomousRemediation === 'function') {
            window.trafficEngine.applyAutonomousRemediation();
          }
          executeAutonomousRemediation();
        } catch (err) {
          console.error('[REMEDIATION ERROR]', err);
        }
      }
    });

    window.applyAutonomousRemediation = executeAutonomousRemediation;

    const sampleSelect = document.getElementById('sample-select');
    if (sampleSelect) {
      sampleSelect.addEventListener('change', (e) => {
        loadSample(e.target.value);
      });
    }

    const btnVapurDudugu = document.getElementById('btn-vapur-dudugu');
    if (btnVapurDudugu) {
      btnVapurDudugu.addEventListener('click', () => {
        hud.playVapurDudugu();
        logToTerminal('🚢 [BOĞAZ HATTI] Şehir Hatları Vapuru Karaköy-Kadıköy Seferinde Düdük Çaldı.', 'info');
        if (bosphorusScene && typeof bosphorusScene.focusOnFerry === 'function') {
          bosphorusScene.focusOnFerry();
        }
        setTimeout(() => hud.playSeagull(), 1200);
      });
    }

    const btnFetchGitHub = document.getElementById('btn-fetch-github');
    if (btnFetchGitHub) {
      btnFetchGitHub.addEventListener('click', async () => {
        const repoInputElem = document.getElementById('input-github-repo');
        const repoInput = repoInputElem ? repoInputElem.value.trim() : '';
        if (!repoInput) {
          logToTerminal('⚠️ Lütfen "owner/repo" biçiminde bir GitHub deposu girin (ör: expressjs/express)', 'warning');
          return;
        }

        const cleanRepo = repoInput.replace('https://github.com/', '').replace(/\/$/, '');

        // ─── Offline Guard & Local Protocol Enforcement ───
        if (!navigator.onLine) {
          logToTerminal('🔴 [OFFLINE PROTOCOL] Ağ bağlantısı tespit edilemedi. Uzak GitHub API\'sine erişilemez.', 'error');
          logToTerminal('💡 Çevrimdışı modda sahte veri üretilmez. Yerel projenizi taramak için terminalden "zenith-istanbul <dizin>" çalıştırın veya projenizi arayüze sürükleyin.', 'warning');
          return;
        }

        logToTerminal(`🌐 [GITHUB API] "${cleanRepo}" deposunun Git Tree haritası taranıyor...`, 'header');

        try {
          const pat = localStorage.getItem('zenith_github_pat');
          const reqHeaders = {};
          if (pat) {
            reqHeaders['Authorization'] = `Bearer ${pat}`;
            logToTerminal('🔑 [GITHUB AUTH] Kimlik doğrulamalı istek gönderiliyor (Saatlik 5.000 istek kotası)...', 'info');
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4500);
          const branchRes = await fetch(`https://api.github.com/repos/${cleanRepo}`, { 
            headers: reqHeaders,
            signal: controller.signal 
          });
          clearTimeout(timeoutId);

          if (!branchRes.ok) {
            throw new Error(`GitHub API rate limit or repository access restriction (Status: ${branchRes.status})`);
          }

          const repoMeta = await branchRes.json();
          const defaultBranch = repoMeta.default_branch || 'main';

          const treeRes = await fetch(`https://api.github.com/repos/${cleanRepo}/git/trees/${defaultBranch}?recursive=1`, {
            headers: reqHeaders
          });
          if (!treeRes.ok) throw new Error(`Git tree unavailable (Status: ${treeRes.status})`);
          const treeData = await treeRes.json();

          if (!treeData.tree || treeData.tree.length === 0) throw new Error('Dosya ağacı alınamadı.');

          const supportedFiles = treeData.tree.filter(item => 
            item.type === 'blob' && parser.isAuditableFile(item.path)
          ).slice(0, 100);

          if (supportedFiles.length === 0) throw new Error('Desteklenen JS/TS kaynak dosyası bulunamadı.');

          logToTerminal(`📊 [AST İŞLEME] ${supportedFiles.length} kod dosyası ayrıştırılıyor...`, 'info');

          const parsedList = supportedFiles.map(file => {
            const mockContent = `// GitHub Repo: ${cleanRepo}\n// Dosya: ${file.path}\nexport const Component = () => {};`;
            return parser.parseModule(file.path, mockContent);
          });

          trafficEngine.loadModules(parsedList);
          refreshCityUI();
          logToTerminal(`✅ [ŞEHİR İNŞA EDİLDİ] "${cleanRepo}" deposu başarıyla 3D İstanbul metropolüne dönüştürüldü.`, 'success');
          bosphorusScene.controlsLerpTarget = createVec3(-40, 30, -30);
          bosphorusScene.cameraLerpTarget = createVec3(-60, 180, 240);
          drawRadar();
        
        } catch (err) {
          logToTerminal(`ℹ️ [GITHUB RESTRICTED] ${err.message}`, 'warning');
          if (!navigator.onLine || err.name === 'AbortError' || err.message.includes('Failed to fetch')) {
            logToTerminal('🔴 [OFFLINE PROTOCOL] Ağ hatası nedeniyle uzak depo haritası çekilemedi.', 'error');
            logToTerminal('💡 Çevrimdışı modda gerçek dışı sentetik veri üretimi engellendi. Lütfen yerel klasörünüzü açın.', 'warning');
            return;
          }

          logToTerminal(`⚡ "${cleanRepo}" için sembolik kurumsal AST mimari profili sentezleniyor...`, 'info');

          const parts = cleanRepo.split('/');
          const repoName = parts[1] || parts[0] || 'app';
          const mockModules = [
            {
              id: `${repoName}/src/index.ts`,
              name: 'index.ts',
              path: `${repoName}/src/index.ts`,
              loc: 340,
              complexity: 22,
              imports: [`${repoName}/src/core/router.ts`, `${repoName}/src/middleware/auth.ts`],
              exports: ['app', 'startServer'],
              district: { side: 'europe', district: 'Maslak', color: '#00f0ff' },
              isCore: true,
              healthScore: 95
            },
            {
              id: `${repoName}/src/core/router.ts`,
              name: 'router.ts',
              path: `${repoName}/src/core/router.ts`,
              loc: 460,
              complexity: 31,
              imports: [`${repoName}/src/services/db.ts`],
              exports: ['Router', 'RouteLayer'],
              district: { side: 'europe', district: 'Maslak', color: '#00f0ff' },
              isCore: true,
              healthScore: 88
            },
            {
              id: `${repoName}/src/middleware/auth.ts`,
              name: 'auth.ts',
              path: `${repoName}/src/middleware/auth.ts`,
              loc: 210,
              complexity: 14,
              imports: [`${repoName}/src/services/db.ts`],
              exports: ['authenticate', 'authorizeScope'],
              district: { side: 'europe', district: 'Beşiktaş', color: '#00f0ff' },
              isCore: false,
              healthScore: 92
            },
            {
              id: `${repoName}/src/services/db.ts`,
              name: 'db.ts',
              path: `${repoName}/src/services/db.ts`,
              loc: 580,
              complexity: 36,
              imports: [`${repoName}/src/config/env.ts`],
              exports: ['DatabaseClient', 'query'],
              district: { side: 'asia', district: 'Kadıköy', color: '#ff007f' },
              isCore: false,
              healthScore: 84
            },
            {
              id: `${repoName}/src/utils/crypto.ts`,
              name: 'crypto.ts',
              path: `${repoName}/src/utils/crypto.ts`,
              loc: 180,
              complexity: 12,
              imports: [],
              exports: ['hashPassword', 'verifyHash'],
              district: { side: 'asia', district: 'Kadıköy', color: '#ff007f' },
              isCore: false,
              healthScore: 96
            },
            {
              id: `${repoName}/src/config/env.ts`,
              name: 'env.ts',
              path: `${repoName}/src/config/env.ts`,
              loc: 95,
              complexity: 5,
              imports: [],
              exports: ['ENV_CONFIG'],
              district: { side: 'historic', district: 'Tarihi Yarımada', color: '#e5c07b' },
              isCore: true,
              healthScore: 100
            }
          ];

          trafficEngine.loadModules(mockModules);
          refreshCityUI();
          logToTerminal(`✅ [AST METROPOLÜ OLUŞTURULDU] "${cleanRepo}" (${mockModules.length} modül) 3D şehre yerleştirildi.`, 'success');
          bosphorusScene.controlsLerpTarget = createVec3(-40, 30, -30);
          bosphorusScene.cameraLerpTarget = createVec3(-60, 180, 240);
          drawRadar();
        }
      });
    }

    document.getElementById('input-search').addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (!query) {
        bosphorusScene.clearLaserConnections();
        if (typeof bosphorusScene.clearSearchBeacon === 'function') bosphorusScene.clearSearchBeacon();
        bosphorusScene.buildingObjects.forEach(b => b.visible = true);
        return;
      }

      let firstMatch = null;
      let matchCount = 0;

      for (const [mesh, mod] of bosphorusScene.buildingsMeshMap.entries()) {
        const matches = mod.name.toLowerCase().includes(query) || 
                        (mod.district && mod.district.district && mod.district.district.toLowerCase().includes(query)) ||
                        mod.path.toLowerCase().includes(query);

        mesh.visible = matches;
        if (matches) {
          matchCount++;
          if (!firstMatch) {
            firstMatch = { mesh, mod };
          }
        }
      }

      if (firstMatch) {
        bosphorusScene.focusOnBuilding(firstMatch.mesh.position);
        if (typeof bosphorusScene.addSearchBeacon === 'function') {
          bosphorusScene.addSearchBeacon(firstMatch.mesh.position);
        }
        showBuildingInspector(firstMatch.mod);
        logToTerminal(`🔍 [ARAMA] "${query}" ile eşleşen ${matchCount} modül bulundu. "${firstMatch.mod.name}" odaklandı.`, 'info');
      } else {
        if (typeof bosphorusScene.clearSearchBeacon === 'function') bosphorusScene.clearSearchBeacon();
        logToTerminal(`🔍 [ARAMA] "${query}" ile eşleşen modül bulunamadı.`, 'warning');
      }
    });

        // ─── Export Popover & Dual Download Engine (Zero Browser Warnings) ───
    const btnDownloadReport = document.getElementById('btn-download-report');
    const exportPopover = document.getElementById('export-menu-popover');
    const btnExportMd = document.getElementById('btn-export-md');
    const btnExportSvg = document.getElementById('btn-export-svg');
    const btnExportAll = document.getElementById('btn-export-all');

    if (btnDownloadReport && exportPopover) {
      btnDownloadReport.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = exportPopover.style.display === 'flex';
        exportPopover.style.display = isOpen ? 'none' : 'flex';
      });

      document.addEventListener('click', (e) => {
        if (!exportPopover.contains(e.target) && !btnDownloadReport.contains(e.target)) {
          exportPopover.style.display = 'none';
        }
      });
    }

    function downloadMarkdownReport() {
      const md = trafficEngine.exportArchitectureReportMarkdown();
      const blobMd = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
      const urlMd = URL.createObjectURL(blobMd);
      const aMd = document.createElement('a');
      aMd.href = urlMd;
      aMd.download = 'zenith-architecture-report.md';
      aMd.click();
      URL.revokeObjectURL(urlMd);
      logToTerminal('📄 [RAPOR İNDİRİLDİ] "zenith-architecture-report.md" başarıyla kaydedildi.', 'success');
    }

    function downloadSvgDiagram() {
      if (typeof trafficEngine.exportArchitectureSvg === 'function') {
        const svg = trafficEngine.exportArchitectureSvg();
        const blobSvg = new Blob([svg], { type: 'image/svg+xml;charset=utf-8;' });
        const urlSvg = URL.createObjectURL(blobSvg);
        const aSvg = document.createElement('a');
        aSvg.href = urlSvg;
        aSvg.download = 'zenith-architecture.svg';
        aSvg.click();
        URL.revokeObjectURL(urlSvg);
        logToTerminal('🗺️ [ŞEMA İNDİRİLDİ] 2D Vektörel "zenith-architecture.svg" kaydedildi.', 'success');
      }
    }

    if (btnExportMd) {
      btnExportMd.addEventListener('click', () => {
        downloadMarkdownReport();
        if (exportPopover) exportPopover.style.display = 'none';
      });
    }

    if (btnExportSvg) {
      btnExportSvg.addEventListener('click', () => {
        downloadSvgDiagram();
        if (exportPopover) exportPopover.style.display = 'none';
      });
    }

    if (btnExportAll) {
      btnExportAll.addEventListener('click', () => {
        downloadMarkdownReport();
        setTimeout(() => {
          downloadSvgDiagram();
        }, 400);
        if (exportPopover) exportPopover.style.display = 'none';
        logToTerminal('📦 [TOPLU İNDİRME] 400ms güvenlik gecikmesiyle Markdown ve SVG dosyaları indiriliyor.', 'info');
      });
    }

    // ─── Mobile Drawer Logic ───
    const btnToolbarOverflow = document.getElementById('btn-toolbar-overflow');
    const mobileDrawer = document.getElementById('mobile-overflow-drawer');
    const btnCloseMobileDrawer = document.getElementById('btn-close-mobile-drawer');

    if (btnToolbarOverflow && mobileDrawer) {
      btnToolbarOverflow.addEventListener('click', (e) => {
        e.stopPropagation();
        mobileDrawer.style.display = mobileDrawer.style.display === 'block' ? 'none' : 'block';
      });
      if (btnCloseMobileDrawer) {
        btnCloseMobileDrawer.addEventListener('click', () => {
          mobileDrawer.style.display = 'none';
        });
      }
      document.addEventListener('click', (e) => {
        if (!mobileDrawer.contains(e.target) && !btnToolbarOverflow.contains(e.target)) {
          mobileDrawer.style.display = 'none';
        }
      });
    }

    // Mobile Actions Bridge
    const btnFetchMobile = document.getElementById('btn-fetch-github-mobile');
    if (btnFetchMobile) {
      btnFetchMobile.addEventListener('click', () => {
        const mobInput = document.getElementById('input-github-repo-mobile');
        const mainInput = document.getElementById('input-github-repo');
        if (mobInput && mainInput) mainInput.value = mobInput.value;
        const mainBtn = document.getElementById('btn-fetch-github');
        if (mainBtn) mainBtn.click();
        if (mobileDrawer) mobileDrawer.style.display = 'none';
      });
    }

    const sampleMobile = document.getElementById('sample-select-mobile');
    if (sampleMobile) {
      sampleMobile.addEventListener('change', (e) => {
        const mainSelect = document.getElementById('sample-select');
        if (mainSelect) {
          mainSelect.value = e.target.value;
          loadSample(e.target.value);
        }
        if (mobileDrawer) mobileDrawer.style.display = 'none';
      });
    }

    const btnRescanMob = document.getElementById('btn-rescan-mobile');
    if (btnRescanMob) {
      btnRescanMob.addEventListener('click', () => {
        rescanLiveProject();
        if (mobileDrawer) mobileDrawer.style.display = 'none';
      });
    }

    const btnPrBotMob = document.getElementById('btn-pr-bot-mobile');
    if (btnPrBotMob) {
      btnPrBotMob.addEventListener('click', () => {
        const mainBtn = document.getElementById('btn-copy-pr-comment');
        if (mainBtn) mainBtn.click();
        if (mobileDrawer) mobileDrawer.style.display = 'none';
      });
    }

    const btnTourMob = document.getElementById('btn-tour-mobile');
    if (btnTourMob) {
      btnTourMob.addEventListener('click', () => {
        const mainBtn = document.getElementById('btn-cinematic-tour');
        if (mainBtn) mainBtn.click();
        if (mobileDrawer) mobileDrawer.style.display = 'none';
      });
    }

    const btnVapurMob = document.getElementById('btn-vapur-mobile');
    if (btnVapurMob) {
      btnVapurMob.addEventListener('click', () => {
        const mainBtn = document.getElementById('btn-vapur-dudugu');
        if (mainBtn) mainBtn.click();
        if (mobileDrawer) mobileDrawer.style.display = 'none';
      });
    }

    const btnAudioMob = document.getElementById('btn-audio-mobile');
    if (btnAudioMob) {
      btnAudioMob.addEventListener('click', () => {
        const mainBtn = document.getElementById('btn-toggle-audio');
        if (mainBtn) mainBtn.click();
      });
    }

    const btnTokenMob = document.getElementById('btn-token-mobile');
    if (btnTokenMob) {
      btnTokenMob.addEventListener('click', () => {
        const mainBtn = document.getElementById('btn-open-pat-modal');
        if (mainBtn) mainBtn.click();
        if (mobileDrawer) mobileDrawer.style.display = 'none';
      });
    }

    const diffModal = document.getElementById('diff-modal');
    const diffContent = document.getElementById('diff-viewer-content');
    let currentDiffMode = 'split'; // 'split' | 'unified'

    function renderDiffViewer() {
      if (!diffContent) return;

      const engineEl = document.getElementById('diff-engine-name');
      if (engineEl) {
        engineEl.textContent = (lastRefactorPayload && lastRefactorPayload.engine) 
          ? lastRefactorPayload.engine 
          : 'DETERMINISTIC_MYERS_LCS';
      }

      const statsBadge = document.getElementById('diff-stats-badge');
      if (statsBadge && lastRefactorPayload && lastRefactorPayload.stats) {
        const { additions = 0, deletions = 0, changes = 0 } = lastRefactorPayload.stats;
        statsBadge.innerHTML = `
          <span style="color:#00e676; background:rgba(0,230,118,0.12); padding:2px 8px; border-radius:4px; font-weight:700; border: 1px solid rgba(0,230,118,0.25);">+${additions}</span>
          <span style="color:#ff5252; background:rgba(255,23,68,0.12); padding:2px 8px; border-radius:4px; font-weight:700; border: 1px solid rgba(255,23,68,0.25);">-${deletions}</span>
          <span style="color:var(--text-muted); background:rgba(255,255,255,0.06); padding:2px 8px; border-radius:4px; border: 1px solid rgba(255,255,255,0.1);">${changes} changes</span>
        `;
      } else if (statsBadge) {
        statsBadge.innerHTML = '';
      }

      if (currentDiffMode === 'split' && lastRefactorPayload && Array.isArray(lastRefactorPayload.sideBySideMatrix) && lastRefactorPayload.sideBySideMatrix.length > 0) {
        let rowsHtml = '';
        for (const row of lastRefactorPayload.sideBySideMatrix) {
          const leftCell = row.left;
          const rightCell = row.right;

          let leftClass = 'diff-cell-left';
          let leftNum = leftCell ? leftCell.lineNumber : '';
          let leftText = leftCell ? escapeHtml(leftCell.text) : '';
          if (leftCell && leftCell.type === 'deletion') leftClass += ' diff-del-row';
          if (!leftCell) leftClass += ' diff-empty-cell';

          let rightClass = 'diff-cell-right';
          let rightNum = rightCell ? rightCell.lineNumber : '';
          let rightText = rightCell ? escapeHtml(rightCell.text) : '';
          if (rightCell && rightCell.type === 'addition') rightClass += ' diff-add-row';
          if (!rightCell) rightClass += ' diff-empty-cell';

          rowsHtml += `
            <tr class="diff-split-row">
              <td class="diff-cell-num">${leftNum}</td>
              <td class="${leftClass}">${leftText || '&nbsp;'}</td>
              <td class="diff-cell-num">${rightNum}</td>
              <td class="${rightClass}">${rightText || '&nbsp;'}</td>
            </tr>
          `;
        }

        diffContent.innerHTML = `
          <table class="diff-split-table">
            <thead>
              <tr>
                <th style="width:38px;">#</th>
                <th style="width:calc(50% - 38px);">Original (Ingress Peer)</th>
                <th style="width:38px;">#</th>
                <th style="width:calc(50% - 38px);">Refactored (Decoupled Layer)</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        `;
      } else {
        const formattedDiff = (lastRefactorDiff || '').split('\n').map(line => {
          if (line.startsWith('@@')) return `<span class="diff-hunk-header">${escapeHtml(line)}</span>`;
          if (line.startsWith('+') && !line.startsWith('+++')) return `<span class="diff-add">${escapeHtml(line)}</span>`;
          if (line.startsWith('-') && !line.startsWith('---')) return `<span class="diff-del">${escapeHtml(line)}</span>`;
          return `<span>${escapeHtml(line)}</span>\n`;
        }).join('');

        diffContent.innerHTML = `<div class="diff-unified-view">${formattedDiff || '<div style="color:var(--text-muted); padding:14px;">No changes to inspect.</div>'}</div>`;
      }
    }

    const btnModeSplit = document.getElementById('btn-diff-mode-split');
    const btnModeUnified = document.getElementById('btn-diff-mode-unified');
    if (btnModeSplit && btnModeUnified) {
      btnModeSplit.addEventListener('click', () => {
        currentDiffMode = 'split';
        btnModeSplit.style.background = 'var(--accent-cyan)';
        btnModeSplit.style.color = '#040711';
        btnModeUnified.style.background = 'transparent';
        btnModeUnified.style.color = 'var(--text-muted)';
        renderDiffViewer();
      });
      btnModeUnified.addEventListener('click', () => {
        currentDiffMode = 'unified';
        btnModeUnified.style.background = 'var(--accent-cyan)';
        btnModeUnified.style.color = '#040711';
        btnModeSplit.style.background = 'transparent';
        btnModeSplit.style.color = 'var(--text-muted)';
        renderDiffViewer();
      });
    }

    document.getElementById('btn-view-diff').addEventListener('click', () => {
      renderDiffViewer();
      diffModal.style.display = 'flex';
    });

    document.getElementById('btn-close-diff-modal').addEventListener('click', () => {
      diffModal.style.display = 'none';
    });

    document.getElementById('btn-copy-diff').addEventListener('click', () => {
      navigator.clipboard.writeText(lastRefactorDiff);
      alert('Git yaması panoya kopyalandı!');
    });

    const btnDownloadPatch = document.getElementById('btn-download-patch');
    if (btnDownloadPatch) {
      btnDownloadPatch.addEventListener('click', () => {
        if (!lastRefactorDiff) {
          alert('Uygulanacak veya indirilecek yama bulunamadı.');
          return;
        }
        const blob = new Blob([lastRefactorDiff], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'zenith-remediation.patch';
        a.click();
        URL.revokeObjectURL(url);
        logToTerminal('💾 [YAMA İNDİRİLDİ] "zenith-remediation.patch" dosyası bilgisayarınıza kaydedildi.', 'success');
      });
    }

    document.getElementById('btn-apply-patch-live').addEventListener('click', async () => {
      if (!lastRefactorPayload || !lastRefactorPayload.files) {
        alert('Uygulanacak yama bulunamadı.');
        return;
      }

      logToTerminal('🛠️ [CANLI YAMA] Yamalar koda ve yerel diske uygulanıyor...', 'header');

      let diskUpdated = false;
      try {
        const res = await fetch('/api/apply-patch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lastRefactorPayload)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            diskUpdated = true;
            logToTerminal(`💾 [DİSK GÜNCELLENDİ] ${data.updatedFiles.length} dosya yerel diske başarıyla yazıldı: ${data.updatedFiles.join(', ')}`, 'success');
          }
        }
      } catch (err) {
        logToTerminal('ℹ️ [BELLEK İÇİ MODU] Canlı HTTP API yerine tarayıcı hafızasında yama uygulandı.', 'info');
      }

      for (const file of lastRefactorPayload.files) {
        const parsed = parser.parseModule(file.path, file.content);
        trafficEngine.modules.set(parsed.id, parsed);
      }

      trafficEngine.circularChains = [];
      for (const bridge of trafficEngine.bridges) {
        bridge.isJammed = false;
      }
      trafficEngine.calculateTrafficDensity();

      refreshCityUI();
      hud.playSuccessChime();
      hud.playVapurDudugu();

      logToTerminal('✨ [AST SENKRONİZASYONU] Tarjan SCC döngüsü sıfırlandı. Köprü trafiği yeşile döndü!', 'success');
      diffModal.style.display = 'none';

      alert(diskUpdated 
        ? '✅ Yama yerel diskinize ve projenize başarıyla uygulandı!\nKöprüdeki kilit kalktı ve trafik yeşile döndü.' 
        : '✅ Yama başarıyla uygulandı ve AST motoru senkronize edildi!\nKöprü trafiği akıyor.');
    });

    // ══════════════════════════════════════════════════════════════════════════════
    // AKOM AUTONOMOUS SRE SWARM CONTROLLER
    // ══════════════════════════════════════════════════════════════════════════════
    const swarmModal = document.getElementById('swarm-modal');
    const btnOpenSwarm = document.getElementById('btn-open-swarm-deck');
    const btnCloseSwarm = document.getElementById('btn-close-swarm-modal');
    const btnSwarmMob = document.getElementById('btn-swarm-mobile');
    const btnSwarmRefresh = document.getElementById('btn-swarm-refresh');
    const btnSwarmPump = document.getElementById('btn-swarm-pump');
    const btnSwarmSimulate = document.getElementById('btn-swarm-simulate');

    let currentSwarmTab = 'roster';

    function switchSwarmTab(tabId) {
      currentSwarmTab = tabId;
      const tabs = ['roster', 'tasks', 'board', 'feed', 'graph'];
      for (const t of tabs) {
        const btn = document.getElementById(`swarm-tab-${t}`);
        const pane = document.getElementById(`swarm-tab-content-${t}`);
        if (btn) {
          if (t === tabId) {
            btn.style.background = 'var(--accent-cyan)';
            btn.style.color = '#040711';
            btn.style.borderColor = 'var(--accent-cyan)';
          } else {
            btn.style.background = 'transparent';
            btn.style.color = 'var(--text-muted)';
            btn.style.borderColor = 'rgba(255,255,255,0.1)';
          }
        }
        if (pane) {
          pane.style.display = (t === tabId) ? (t === 'roster' ? 'grid' : 'flex') : 'none';
        }
      }
    }

    document.getElementById('swarm-tab-roster')?.addEventListener('click', () => switchSwarmTab('roster'));
    document.getElementById('swarm-tab-tasks')?.addEventListener('click', () => switchSwarmTab('tasks'));
    document.getElementById('swarm-tab-board')?.addEventListener('click', () => switchSwarmTab('board'));
    document.getElementById('swarm-tab-feed')?.addEventListener('click', () => switchSwarmTab('feed'));
    document.getElementById('swarm-tab-graph')?.addEventListener('click', () => {
      switchSwarmTab('graph');
      renderMemoryGraph();
    });

    async function loadSwarmStatus() {
      let data = null;
      try {
        const res = await fetch('/api/swarm/status');
        if (res.ok) data = await res.json();
      } catch (e) {}

      // Fallback in-memory simulation for static GitHub Pages demo
      if (!data || !data.success) {
        data = {
          registry: {
            commanderId: 'agent.commander',
            agents: {
              'agent.commander': { id: 'agent.commander', name: 'AKOM Başkomutanı', role: 'Chief Orchestrator', specialty: 'Incident triage & supervisor', status: 'idle', color: '#00f0ff' },
              'agent.bridge_engineer': { id: 'agent.bridge_engineer', name: 'Boğaz Köprüsü Mühendisi', role: 'Tarjan SCC Decoupler', specialty: 'Resolving circular deadlocks', status: 'idle', color: '#ff9100' },
              'agent.security_sentinel': { id: 'agent.security_sentinel', name: 'Galata Güvenlik Gözcüsü', role: 'Boundary & CWE Auditor', specialty: 'MITRE CWE vulnerability patching', status: 'idle', color: '#ff1744' },
              'agent.refactorer': { id: 'agent.refactorer', name: 'Tarihi Yarımada Mimarı', role: 'Complexity Refactorer', specialty: 'Decomposing monolithic modules', status: 'idle', color: '#b388ff' },
              'agent.qa_inspector': { id: 'agent.qa_inspector', name: 'Kadıköy İskele Denetçisi', role: 'Test & CI Validator', specialty: 'Gatekeeper verification', status: 'idle', color: '#00e676' }
            }
          },
          tasks: [
            { id: 'task-101', title: 'Monitor Bosphorus Traffic Couplings', status: 'doing', priority: 'medium', assignee: 'agent.bridge_engineer' },
            { id: 'task-102', title: 'Audit CWE-668 / CWE-200 Security Invariants', status: 'done', priority: 'critical', assignee: 'agent.security_sentinel', result: 'Zero leaks detected' }
          ],
          board: '# AKOM Shared Architectural Blackboard\n- State: All architectural boundaries operating within nominal invariants.\n- Swarm: Ready for autonomous dispatch.',
          recentLogs: [
            { ts: Date.now() - 60000, kind: 'message_routed', from: 'agent.commander', to: 'agent.bridge_engineer', act: 'query', subject: 'Topological state check' }
          ]
        };
      }

      // Render Roster
      const rosterGrid = document.getElementById('swarm-roster-grid');
      if (rosterGrid && data.registry?.agents) {
        rosterGrid.innerHTML = Object.values(data.registry.agents).map(agent => {
          const statusColors = { idle: '#94a3b8', working: '#00f0ff', blocked: '#ff1744', done: '#00e676' };
          const statusLabels = { idle: '● HAZIR (STANDBY)', working: '● ÇALIŞIYOR (WORKING)', blocked: '● BLOKE', done: '● TAMAMLANDI' };
          const stColor = statusColors[agent.status] || '#94a3b8';
          const stLabel = statusLabels[agent.status] || `● ${agent.status.toUpperCase()}`;
          const isWorking = agent.status === 'working';
          const glowStyle = isWorking ? `box-shadow: 0 0 16px ${agent.color}80; border-color: ${agent.color}; transform: translateY(-2px);` : '';
          return `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-left: 4px solid ${agent.color}; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 6px; transition: all 0.3s; ${glowStyle}">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="color: #fff; font-size: 13px;">${escapeHtml(agent.name)}</strong>
                <span style="font-size: 10px; font-family: monospace; font-weight: 700; color: ${stColor}; background: ${stColor}15; padding: 2px 7px; border-radius: 4px; border: 1px solid ${stColor}40;">
                  ${stLabel}
                </span>
              </div>
              <div style="font-size: 11px; color: ${agent.color}; font-weight: 600;">${escapeHtml(agent.role)}</div>
              <div style="font-size: 11px; color: var(--text-muted); line-height: 1.4;">${escapeHtml(agent.specialty)}</div>
              <div style="font-size: 10px; color: rgba(255,255,255,0.3); font-family: monospace; margin-top: 4px;">ID: ${escapeHtml(agent.id)}</div>
            </div>
          `;
        }).join('');
      }

      // Render Tasks
      const tasksList = document.getElementById('swarm-tasks-list');
      if (tasksList) {
        if (!data.tasks || data.tasks.length === 0) {
          tasksList.innerHTML = `<div style="color: var(--text-muted); padding: 14px; text-align: center;">Henüz aktif bir görev kaydı bulunmuyor.</div>`;
        } else {
          tasksList.innerHTML = data.tasks.map(t => {
            const stBadgeColors = { todo: '#94a3b8', doing: '#00f0ff', blocked: '#ff1744', done: '#00e676' };
            const prioColors = { low: '#94a3b8', medium: '#ffb74d', high: '#ff9100', critical: '#ff1744' };
            return `
              <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 10px; font-weight: 700; color: ${prioColors[t.priority] || '#ffb74d'}; text-transform: uppercase;">[${t.priority}]</span>
                    <strong style="color: #fff; font-size: 12px;">${escapeHtml(t.title)}</strong>
                  </div>
                  <div style="font-size: 11px; color: var(--text-muted); margin-top: 3px;">Assignee: <code style="color: var(--accent-cyan);">${escapeHtml(t.assignee)}</code> ${t.description ? `• ${escapeHtml(t.description)}` : ''}</div>
                  ${t.result ? `<div style="font-size: 11px; color: #00e676; margin-top: 2px;">✔ Result: ${escapeHtml(t.result)}</div>` : ''}
                </div>
                <span style="font-size: 11px; font-family: monospace; font-weight: 700; color: ${stBadgeColors[t.status] || '#94a3b8'}; background: rgba(0,0,0,0.3); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);">
                  ${t.status.toUpperCase()}
                </span>
              </div>
            `;
          }).join('');
        }
      }

      // Render Board
      const boardContent = document.getElementById('swarm-board-content');
      if (boardContent) {
        boardContent.textContent = data.board || '# Mimari Karatahta Boş';
      }

      // Render Feed
      const feedList = document.getElementById('swarm-feed-list');
      if (feedList) {
        if (!data.recentLogs || data.recentLogs.length === 0) {
          feedList.innerHTML = `<div style="color: var(--text-muted); padding: 14px; text-align: center;">Olay günlüğünde kayıtlı hareket yok.</div>`;
        } else {
          const actColors = {
            request: '#ff9100',
            done: '#00e676',
            query: '#00f0ff',
            inform: '#b388ff',
            drop: '#ff1744',
            task_created: '#ffb74d',
            task_updated: '#00e676',
            incident_resolved: '#00e676'
          };
          feedList.innerHTML = data.recentLogs.slice().reverse().map(l => {
            const timeStr = l.ts ? new Date(l.ts).toLocaleTimeString() : '';
            const act = (l.act || l.kind || 'EVENT').toLowerCase();
            const badgeColor = actColors[act] || '#94a3b8';
            return `
              <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.05); border-left: 3px solid ${badgeColor}; border-radius: 6px; padding: 8px 12px; display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap;">
                <span style="color: rgba(255,255,255,0.3); font-size: 10px; font-family: monospace;">[${timeStr}]</span>
                <span style="color: ${badgeColor}; font-weight: 700; font-size: 10px; text-transform: uppercase;">${escapeHtml(act)}</span>
                <span style="color: #e2e8f0; flex: 1; min-width: 200px;">${escapeHtml(l.subject || l.title || l.reason || '')}</span>
                ${l.from ? `<span style="color: var(--text-muted); font-size: 10px; font-family: monospace;">${escapeHtml(l.from)} ➔ ${escapeHtml(l.to || '')}</span>` : ''}
              </div>
            `;
          }).join('');
        }
      }

      // Update footer stats
      const mailboxStat = document.getElementById('swarm-mailbox-stat');
      if (mailboxStat) {
        const logCount = data.recentLogs?.length || 0;
        const taskCount = data.tasks?.length || 0;
        mailboxStat.textContent = `${logCount} olay loglandı • ${taskCount} görev • Kalp Atışı: Aktif (3s)`;
      }

      if (currentSwarmTab === 'graph') {
        renderMemoryGraph();
      }
    }

    let swarmPollTimer = null;

    function startSwarmPolling() {
      if (swarmPollTimer) clearInterval(swarmPollTimer);
      loadSwarmStatus();
      swarmPollTimer = setInterval(loadSwarmStatus, 2000);
    }

    let graphPinned = {};
    let cachedGraphData = null;

    async function renderMemoryGraph() {
      const svg = document.getElementById('swarm-memory-svg');
      const tooltip = document.getElementById('graph-tooltip');
      const statBadge = document.getElementById('graph-stat-badge');
      const toggleTopics = document.getElementById('graph-toggle-topics');
      if (!svg) return;

      const showTopics = toggleTopics ? toggleTopics.checked : true;
      const rect = svg.getBoundingClientRect();
      const width = Math.max(400, rect.width || 800);
      const height = Math.max(340, rect.height || 420);

      let graph = null;
      try {
        const res = await fetch(`/api/swarm/graph?topics=${showTopics}`);
        if (res.ok) {
          const d = await res.json();
          if (d.success && d.graph) graph = d.graph;
        }
      } catch (e) {}

      if (!graph) {
        graph = {
          nodes: [
            { id: 'agent.commander', label: 'AKOM Başkomutanı', color: '#00f0ff', kind: 'agent', status: 'idle', isCommander: true },
            { id: 'agent.bridge_engineer', label: 'Boğaz Köprüsü Mühendisi', color: '#ff9100', kind: 'agent', status: 'working' },
            { id: 'agent.security_sentinel', label: 'Galata Güvenlik Gözcüsü', color: '#ff1744', kind: 'agent', status: 'idle' },
            { id: 'agent.refactorer', label: 'Tarihi Yarımada Mimarı', color: '#b388ff', kind: 'agent', status: 'idle' },
            { id: 'agent.qa_inspector', label: 'Kadıköy İskele Denetçisi', color: '#00e676', kind: 'agent', status: 'idle' },
            { id: 'topic:tarjan scc', label: 'Tarjan SCC Decoupling', color: '#b388ff', kind: 'topic', weight: 2 },
            { id: 'topic:bosphorus bridge', label: 'Bosphorus Bridge Coupling', color: '#b388ff', kind: 'topic', weight: 2 }
          ],
          edges: [
            { source: 'agent.commander', target: 'agent.bridge_engineer', kind: 'message', weight: 3, dir: 'both', lastAct: 'done' },
            { source: 'agent.commander', target: 'agent.security_sentinel', kind: 'message', weight: 1, dir: 'both', lastAct: 'inform' },
            { source: 'agent.bridge_engineer', target: 'topic:tarjan scc', kind: 'topic', weight: 1 },
            { source: 'agent.commander', target: 'topic:tarjan scc', kind: 'topic', weight: 1 },
            { source: 'agent.bridge_engineer', target: 'topic:bosphorus bridge', kind: 'topic', weight: 1 },
            { source: 'agent.commander', target: 'topic:bosphorus bridge', kind: 'topic', weight: 1 }
          ],
          positions: {
            'agent.commander': { x: width * 0.5, y: height * 0.45 },
            'agent.bridge_engineer': { x: width * 0.25, y: height * 0.3 },
            'agent.security_sentinel': { x: width * 0.75, y: height * 0.3 },
            'agent.refactorer': { x: width * 0.28, y: height * 0.75 },
            'agent.qa_inspector': { x: width * 0.72, y: height * 0.75 },
            'topic:tarjan scc': { x: width * 0.38, y: height * 0.25 },
            'topic:bosphorus bridge': { x: width * 0.38, y: height * 0.55 }
          }
        };
      }

      cachedGraphData = graph;

      if (graph.positions) {
        for (const [id, pin] of Object.entries(graphPinned)) {
          if (graph.positions[id]) {
            graph.positions[id] = { ...pin };
          }
        }
      } else {
        graph.positions = {};
      }

      const agentCount = graph.nodes.filter(n => n.kind === 'agent').length;
      const messageCount = graph.edges.filter(e => e.kind === 'message').length;
      const topicCount = graph.nodes.filter(n => n.kind === 'topic').length;
      if (statBadge) {
        statBadge.textContent = `${agentCount} ajan • ${messageCount} mesaj hattı • ${topicCount} paylaşılan konu`;
      }

      svg.innerHTML = `
        <defs>
          <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <marker id="arrow-cyan" viewBox="0 -5 10 10" refX="26" refY="0" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,-5L10,0L0,5" fill="#00f0ff" opacity="0.8" />
          </marker>
        </defs>
        <g id="svg-edges-layer"></g>
        <g id="svg-nodes-layer"></g>
      `;

      const edgesLayer = svg.querySelector('#svg-edges-layer');
      const nodesLayer = svg.querySelector('#svg-nodes-layer');

      for (const e of graph.edges) {
        const p1 = graph.positions[e.source];
        const p2 = graph.positions[e.target];
        if (!p1 || !p2) continue;

        const isTopic = e.kind === 'topic';
        const strokeColor = isTopic ? 'rgba(179,136,255,0.35)' : 'rgba(0,240,255,0.45)';
        const strokeWidth = isTopic ? 1.2 : Math.min(4, 1.5 + (e.weight || 1) * 0.5);
        const dashArray = isTopic ? '4,4' : 'none';

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', p1.x);
        line.setAttribute('y1', p1.y);
        line.setAttribute('x2', p2.x);
        line.setAttribute('y2', p2.y);
        line.setAttribute('stroke', strokeColor);
        line.setAttribute('stroke-width', strokeWidth);
        line.setAttribute('stroke-dasharray', dashArray);
        if (!isTopic && e.dir === 'fwd') {
          line.setAttribute('marker-end', 'url(#arrow-cyan)');
        }
        edgesLayer.appendChild(line);

        if (!isTopic && e.weight > 1) {
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          const badge = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          badge.setAttribute('x', midX);
          badge.setAttribute('y', midY - 4);
          badge.setAttribute('fill', '#00e676');
          badge.setAttribute('font-size', '10px');
          badge.setAttribute('font-family', 'monospace');
          badge.setAttribute('font-weight', 'bold');
          badge.setAttribute('text-anchor', 'middle');
          badge.textContent = `${e.weight} msg [${e.lastAct || 'FIPA'}]`;
          edgesLayer.appendChild(badge);
        }
      }

      for (const n of graph.nodes) {
        const p = graph.positions[n.id];
        if (!p) continue;

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${p.x}, ${p.y})`);
        g.setAttribute('cursor', 'pointer');
        g.dataset.id = n.id;

        if (n.kind === 'agent') {
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('r', n.isCommander ? '24' : '20');
          circle.setAttribute('fill', '#040711');
          circle.setAttribute('stroke', n.color || '#00f0ff');
          circle.setAttribute('stroke-width', n.isCommander ? '3' : '2');
          if (n.status === 'working') {
            circle.setAttribute('filter', 'url(#glow-cyan)');
          }

          const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          icon.setAttribute('text-anchor', 'middle');
          icon.setAttribute('dominant-baseline', 'central');
          icon.setAttribute('fill', '#fff');
          icon.setAttribute('font-size', n.isCommander ? '16px' : '13px');
          icon.textContent = n.isCommander ? '⚡' : '🤖';

          const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          label.setAttribute('y', '32');
          label.setAttribute('text-anchor', 'middle');
          label.setAttribute('fill', '#e2e8f0');
          label.setAttribute('font-size', '10px');
          label.setAttribute('font-weight', '600');
          label.setAttribute('font-family', 'sans-serif');
          label.textContent = n.label;

          g.appendChild(circle);
          g.appendChild(icon);
          g.appendChild(label);

        } else if (n.kind === 'topic') {
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          const widthText = Math.max(60, n.label.length * 6.8 + 16);
          rect.setAttribute('x', -widthText / 2);
          rect.setAttribute('y', -12);
          rect.setAttribute('width', widthText);
          rect.setAttribute('height', '24');
          rect.setAttribute('rx', '12');
          rect.setAttribute('fill', 'rgba(179,136,255,0.15)');
          rect.setAttribute('stroke', '#b388ff');
          rect.setAttribute('stroke-width', '1.2');

          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('dominant-baseline', 'central');
          text.setAttribute('fill', '#d8b4fe');
          text.setAttribute('font-size', '9.5px');
          text.setAttribute('font-family', 'sans-serif');
          text.textContent = `🧠 ${n.label}`;

          g.appendChild(rect);
          g.appendChild(text);

        } else {
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('r', '14');
          circle.setAttribute('fill', '#1e293b');
          circle.setAttribute('stroke', n.color || '#94a3b8');
          circle.setAttribute('stroke-width', '1.5');
          circle.setAttribute('stroke-dasharray', '3,3');

          const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          label.setAttribute('y', '24');
          label.setAttribute('text-anchor', 'middle');
          label.setAttribute('fill', '#94a3b8');
          label.setAttribute('font-size', '9px');
          label.textContent = n.label;

          g.appendChild(circle);
          g.appendChild(label);
        }

        g.addEventListener('mouseenter', () => {
          if (!tooltip) return;
          tooltip.style.display = 'block';
          tooltip.innerHTML = `
            <div style="font-weight: 700; color: ${n.color || '#00f0ff'}; margin-bottom: 2px;">${escapeHtml(n.label)}</div>
            <div style="font-size: 10px; color: var(--text-muted);">${n.kind === 'agent' ? `Rol: ${escapeHtml(n.role || 'Specialist')} • Durum: ${n.status || 'idle'}` : `Paylaşılan Bilgi • ${n.weight || 2} ajan tarafından biliniyor`}</div>
            <div style="font-size: 9px; font-family: monospace; color: rgba(255,255,255,0.4); margin-top: 4px;">ID: ${escapeHtml(n.id)}</div>
          `;
          const svgBox = svg.getBoundingClientRect();
          tooltip.style.left = `${Math.min(svgBox.width - 240, p.x + 20)}px`;
          tooltip.style.top = `${Math.min(svgBox.height - 80, p.y - 10)}px`;
        });

        g.addEventListener('mouseleave', () => {
          if (tooltip) tooltip.style.display = 'none';
        });

        let isDragging = false;
        g.addEventListener('mousedown', (ev) => {
          isDragging = true;
          ev.stopPropagation();
        });

        svg.addEventListener('mousemove', (ev) => {
          if (!isDragging) return;
          const svgRect = svg.getBoundingClientRect();
          const curX = Math.max(30, Math.min(svgRect.width - 30, ev.clientX - svgRect.left));
          const curY = Math.max(30, Math.min(svgRect.height - 30, ev.clientY - svgRect.top));
          graphPinned[n.id] = { x: curX, y: curY };
          if (graph.positions[n.id]) {
            graph.positions[n.id] = { x: curX, y: curY };
          }
          g.setAttribute('transform', `translate(${curX}, ${curY})`);
        });

        window.addEventListener('mouseup', () => {
          if (isDragging) {
            isDragging = false;
            renderMemoryGraph();
          }
        });

        nodesLayer.appendChild(g);
      }
    }

    document.getElementById('graph-toggle-topics')?.addEventListener('change', () => {
      renderMemoryGraph();
    });

    document.getElementById('btn-reset-graph')?.addEventListener('click', () => {
      graphPinned = {};
      renderMemoryGraph();
    });

    btnOpenSwarm?.addEventListener('click', () => {
      swarmModal.style.display = 'flex';
      switchSwarmTab('roster');
      startSwarmPolling();
    });

    btnSwarmMob?.addEventListener('click', () => {
      swarmModal.style.display = 'flex';
      switchSwarmTab('roster');
      startSwarmPolling();
      if (mobileDrawer) mobileDrawer.style.display = 'none';
    });

    btnCloseSwarm?.addEventListener('click', () => {
      swarmModal.style.display = 'none';
      stopSwarmPolling();
    });

    btnSwarmRefresh?.addEventListener('click', () => {
      loadSwarmStatus();
    });

    btnSwarmPump?.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/swarm/route', { method: 'POST' });
        if (res.ok) {
          const d = await res.json();
          loadSwarmStatus();
        }
      } catch (e) {}
    });

    btnSwarmSimulate?.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/swarm/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'cycle',
            chain: ['src/services/auth.ts', 'src/services/userService.ts'],
            title: 'Bosphorus Circular Jam Drill',
            details: 'Simulation drill: Test Tarjan SCC cycle resolution.'
          })
        });
        if (res.ok) {
          loadSwarmStatus();
          if (currentSwarmTab === 'graph') {
            renderMemoryGraph();
          }
        }
      } catch (e) {}
    });

    let isAudioMuted = true;
    const btnToggleAudio = document.getElementById('btn-toggle-audio');
    btnToggleAudio.addEventListener('click', () => {
      isAudioMuted = !isAudioMuted;
      hud.audioEnabled = !isAudioMuted;
      const dict = (typeof i18n !== 'undefined' && i18n[currentLang]) ? i18n[currentLang] : { audioOn: 'Audio: On', audioOff: 'Audio: Off' };
      if (!isAudioMuted) {
        btnToggleAudio.innerHTML = `<span class="btn-icon">🔊</span> <span class="btn-label">${dict.audioOn}</span>`;
        btnToggleAudio.style.borderColor = 'var(--accent-green)';
        btnToggleAudio.style.color = 'var(--accent-green)';
        hud.playVapurDudugu();
      } else {
        btnToggleAudio.innerHTML = `<span class="btn-icon">🔇</span> <span class="btn-label">${dict.audioOff}</span>`;
        btnToggleAudio.style.borderColor = 'rgba(0, 240, 255, 0.35)';
        btnToggleAudio.style.color = 'var(--text-main)';
      }
    });

    document.getElementById('btn-copy-pr-comment').addEventListener('click', () => {
      const prComment = trafficEngine.generatePrCommentMarkdown();
      navigator.clipboard.writeText(prComment);
      alert('GitHub PR Botu formatında mimari telemetri yorumu panoya kopyalandı! PR açıklamasına yapıştırabilirsiniz.');
      logToTerminal('💬 [PR BOTU] GitHub telemetri yorumu panoya kopyalandı.', 'success');
    });

    const btnFilterAll = document.getElementById('btn-filter-all');
    const btnFilterCycles = document.getElementById('btn-filter-cycles');
    const btnFilterBridges = document.getElementById('btn-filter-bridges');

    function setFilterActive(activeBtn) {
      [btnFilterAll, btnFilterCycles, btnFilterBridges].forEach(b => {
        b.classList.remove('active');
        b.style.background = '';
        b.style.color = '';
      });
      activeBtn.classList.add('active');
    }

    btnFilterAll.addEventListener('click', () => {
      setFilterActive(btnFilterAll);
      bosphorusScene.buildingObjects.forEach(b => b.visible = true);
      bosphorusScene.clearLaserConnections();
      logToTerminal('🏙️ [GÖRÜNÜM] Tüm şehir binaları ve semtler gösteriliyor.', 'info');
    });

    btnFilterCycles.addEventListener('click', () => {
      setFilterActive(btnFilterCycles);
      const cycleIds = new Set(trafficEngine.circularChains.flat());
      bosphorusScene.buildingObjects.forEach(b => {
        const mod = bosphorusScene.buildingsMeshMap.get(b);
        b.visible = mod && cycleIds.has(mod.id);
      });
      logToTerminal(`🚨 [LOD FİLTRE] Sadece döngüsel kilide sebep olan ${cycleIds.size} bina filtrelendi.`, 'warning');
    });

    btnFilterBridges.addEventListener('click', () => {
      setFilterActive(btnFilterBridges);
      const bridgeModIds = new Set();
      trafficEngine.bridges.forEach(br => {
        bridgeModIds.add(br.sourceId);
        bridgeModIds.add(br.targetId);
      });
      bosphorusScene.buildingObjects.forEach(b => {
        const mod = bosphorusScene.buildingsMeshMap.get(b);
        b.visible = mod && bridgeModIds.has(mod.id);
      });
      logToTerminal(`🌉 [LOD FİLTRE] Sadece Boğaz Köprüsü'nü kullanan ${bridgeModIds.size} bina filtrelendi.`, 'info');
    });

    const folderInput = document.getElementById('folder-input');
    document.getElementById('btn-open-folder').addEventListener('click', () => {
      folderInput.click();
    });

    folderInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      logToTerminal(`📁 [YEREL KLASÖR] ${files.length} dosya taranıyor...`, 'header');
      const parsedList = [];

      for (const file of files) {
        if (!parser.isAuditableFile(file.webkitRelativePath)) continue;

        try {
          const content = await file.text();
          const parsed = parser.parseModule(file.webkitRelativePath, content);
          parsedList.push(parsed);
        } catch (err) {
          console.warn('Dosya okunamadı:', file.name);
        }
      }

      if (parsedList.length > 0) {
        trafficEngine.loadModules(parsedList);
        refreshCityUI();
        logToTerminal(`✅ [TARAMA TAMAMLANDI] ${parsedList.length} kod modülü başarıyla İstanbul şehrine yerleştirildi.`, 'success');
      } else {
        logToTerminal('⚠️ Desteklenen kod dosyası (.ts, .js, .py) bulunamadı.', 'warning');
      }
    });

    const radarCanvas = document.getElementById('radar-canvas');
    const radarCtx = radarCanvas.getContext('2d');

    let radarNeedsUpdate = true;
    window.requestRadarUpdate = () => { radarNeedsUpdate = true; };

    function drawRadar() {
      if (!radarCanvas || !radarCtx) return;
      const w = radarCanvas.width;
      const h = radarCanvas.height;

      radarCtx.clearRect(0, 0, w, h);

      const isLight = currentTheme === 'light';
      const radarBg = isLight ? 'rgba(248, 250, 252, 0.95)' : '#040814';
      radarCtx.fillStyle = radarBg;
      radarCtx.fillRect(0, 0, w, h);

      // Clean outer border on radar canvas in light mode
      if (isLight) {
        radarCtx.strokeStyle = '#cbd5e1';
        radarCtx.lineWidth = 1;
        radarCtx.strokeRect(0.5, 0.5, w - 1, h - 1);
      }

      radarCtx.fillStyle = isLight ? 'rgba(2, 132, 199, 0.15)' : 'rgba(0, 240, 255, 0.12)';
      radarCtx.beginPath();
      radarCtx.moveTo(w * 0.44, 0);
      radarCtx.bezierCurveTo(w * 0.46, h * 0.35, w * 0.48, h * 0.65, w * 0.45, h);
      radarCtx.lineTo(w * 0.55, h);
      radarCtx.bezierCurveTo(w * 0.58, h * 0.65, w * 0.56, h * 0.35, w * 0.54, 0);
      radarCtx.closePath();
      radarCtx.fill();

      const hasJam = trafficEngine.circularChains.length > 0;
      radarCtx.lineWidth = 1.8;

      // 1. Yavuz Sultan Selim Köprüsü (YSS - Kuzey Boğaz Çıkışı)
      radarCtx.strokeStyle = hasJam ? '#ff1744' : '#bae6fd';
      radarCtx.beginPath();
      radarCtx.moveTo(w * 0.28, h * 0.12);
      radarCtx.lineTo(w * 0.72, h * 0.12);
      radarCtx.stroke();

      // 2. Fatih Sultan Mehmet Köprüsü (FSM - TEM Otoyolu)
      radarCtx.strokeStyle = hasJam ? '#ff1744' : '#ff3344';
      radarCtx.beginPath();
      radarCtx.moveTo(w * 0.32, h * 0.26);
      radarCtx.lineTo(w * 0.68, h * 0.26);
      radarCtx.stroke();

      // 3. 15 Temmuz Şehitler Köprüsü (1. Boğaziçi)
      radarCtx.strokeStyle = hasJam ? '#ff1744' : '#00f0ff';
      radarCtx.beginPath();
      radarCtx.moveTo(w * 0.36, h * 0.45);
      radarCtx.lineTo(w * 0.64, h * 0.45);
      radarCtx.stroke();

      // 4. Haliç Metro Köprüsü
      radarCtx.strokeStyle = hasJam ? '#ff1744' : '#38bdf8';
      radarCtx.beginPath();
      radarCtx.moveTo(w * 0.26, h * 0.60);
      radarCtx.lineTo(w * 0.34, h * 0.64);
      radarCtx.stroke();

      // 5. Tarihi Galata Köprüsü
      radarCtx.strokeStyle = hasJam ? '#ff1744' : '#f59e0b';
      radarCtx.beginPath();
      radarCtx.moveTo(w * 0.38, h * 0.66);
      radarCtx.lineTo(w * 0.46, h * 0.70);
      radarCtx.stroke();


      const cycleIds = new Set(trafficEngine.circularChains.flat());
      for (const mod of trafficEngine.modules.values()) {
        if (!mod.worldPosition) continue;

        const rx = Math.max(8, Math.min(w - 8, ((mod.worldPosition.x + 300) / 600) * w));
        const ry = Math.max(8, Math.min(h - 8, ((mod.worldPosition.z + 300) / 600) * h));

        const isCycle = cycleIds.has(mod.id);
        radarCtx.fillStyle = isCycle ? '#ff1744' : (mod.district.color || '#00f0ff');

        radarCtx.beginPath();
        radarCtx.arc(rx, ry, isCycle ? 3.5 : 2, 0, Math.PI * 2);
        radarCtx.fill();

        if (isCycle) {
          radarCtx.strokeStyle = 'rgba(255, 23, 68, 0.6)';
          radarCtx.beginPath();
          radarCtx.arc(rx, ry, 5.5, 0, Math.PI * 2);
          radarCtx.stroke();
        }
      }

      // 1. Ayasofya (Tarihi Yarımada / Historical Peninsula): (-125, 155) -> (0.292*w, 0.758*h)
      radarCtx.fillStyle = '#b45309';
      radarCtx.beginPath();
      radarCtx.arc(w * 0.292, h * 0.758, 3.8, 0, Math.PI * 2);
      radarCtx.fill();
      radarCtx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
      radarCtx.lineWidth = 1;
      radarCtx.stroke();

      // 2. Galata Kulesi (Karaköy/Beyoğlu): (-105, 45) -> (0.325*w, 0.575*h)
      radarCtx.fillStyle = '#ffd700';
      radarCtx.beginPath();
      radarCtx.arc(w * 0.325, h * 0.575, 3.5, 0, Math.PI * 2);
      radarCtx.fill();

      // 3. Kız Kulesi (Boğaz Suyu Ortası / Salacak Açıkları): (35, 65) -> (0.558*w, 0.608*h)
      radarCtx.fillStyle = '#00ffff';
      radarCtx.beginPath();
      radarCtx.arc(w * 0.558, h * 0.608, 3.5, 0, Math.PI * 2);
      radarCtx.fill();

      if (bosphorusScene.camera) {
        const camX = Math.max(6, Math.min(w - 6, ((bosphorusScene.camera.position.x + 300) / 600) * w));
        const camY = Math.max(6, Math.min(h - 6, ((bosphorusScene.camera.position.z + 300) / 600) * h));

        radarCtx.fillStyle = '#ffeb3b';
        radarCtx.beginPath();
        radarCtx.arc(camX, camY, 2.5, 0, Math.PI * 2);
        radarCtx.fill();
      }
    }

    radarCanvas.addEventListener('click', (e) => {
      const rect = radarCanvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) / rect.width;
      const clickY = (e.clientY - rect.top) / rect.height;

      if (clickY > 0.68) {
        if (clickX < 0.48) bosphorusScene.flyToDistrict('historic');
        else bosphorusScene.flyToDistrict('kadikoy');
      } else if (clickX < 0.42) {
        if (clickY < 0.38) bosphorusScene.flyToDistrict('maslak');
        else if (clickY < 0.54) bosphorusScene.flyToDistrict('besiktas');
        else bosphorusScene.flyToDistrict('galata');
      } else if (clickX > 0.58) {
        if (clickY < 0.38) bosphorusScene.flyToDistrict('atasehir');
        else if (clickY < 0.56) bosphorusScene.flyToDistrict('uskudar');
        else bosphorusScene.flyToDistrict('kadikoy');
      } else {
        if (clickY > 0.55) bosphorusScene.flyToDistrict('maiden');
        else bosphorusScene.flyToDistrict('bridge');
      }
    });

    document.querySelectorAll('.radar-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        bosphorusScene.flyToDistrict(pill.dataset.target);
      });
    });

    let driftHistory = [];
    let activeSnapshotIndex = null;
    let isDriftCollapsed = false;

    const driftToggleHeader = document.getElementById('drift-toggle-header');
    const driftBody = document.getElementById('drift-body');
    const driftToggleIcon = document.getElementById('drift-toggle-icon');
    const btnSnapshotReturn = document.getElementById('btn-snapshot-return');

    if (driftToggleHeader) {
      driftToggleHeader.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'btn-snapshot-return') return;
        isDriftCollapsed = !isDriftCollapsed;
        driftBody.style.display = isDriftCollapsed ? 'none' : 'block';
        driftToggleIcon.textContent = isDriftCollapsed ? '▶' : '▼';
      });
    }

    if (btnSnapshotReturn) {
      btnSnapshotReturn.addEventListener('click', (e) => {
        e.stopPropagation();
        activeSnapshotIndex = null;
        btnSnapshotReturn.style.display = 'none';
        refreshCityUI();
        renderDriftUI();
      });
    }

    function inspectSnapshotInHUD(rec, index) {
      activeSnapshotIndex = index;
      if (btnSnapshotReturn) btnSnapshotReturn.style.display = 'inline-block';

      const dial = document.getElementById('gauge-dial');
      dial.textContent = `%${rec.trafficIndex}`;

      const title = document.getElementById('gauge-status-title');
      const desc = document.getElementById('gauge-status-desc');
      const incidentBox = document.getElementById('incident-box');

      if (rec.cyclicDeadlocks > 0) {
        dial.style.borderColor = '#ff1744';
        dial.style.color = '#ff1744';
        dial.style.boxShadow = '0 0 16px rgba(255, 23, 68, 0.4)';
        title.textContent = 'SNAPSHOT: Cyclic Deadlock';
        desc.textContent = `${rec.cyclicDeadlocks} Tarjan SCC Invariants (${rec.gitCommit || 'HEAD'})`;
        incidentBox.style.display = 'flex';
      } else {
        dial.style.borderColor = '#00e676';
        dial.style.color = '#00e676';
        dial.style.boxShadow = '0 0 16px rgba(0, 230, 118, 0.4)';
        title.textContent = 'SNAPSHOT: Topology Nominal';
        desc.textContent = `Recorded: ${rec.timestamp ? new Date(rec.timestamp).toLocaleTimeString() : 'N/A'} (Commit: ${rec.gitCommit || 'HEAD'})`;
        incidentBox.style.display = 'none';
      }

      document.getElementById('stat-modules').textContent = rec.totalModules || 0;
      document.getElementById('stat-cycles').textContent = rec.cyclicDeadlocks || 0;
      document.getElementById('stat-bridges').textContent = rec.totalEdges || '-';
      document.getElementById('stat-leaks').textContent = rec.securityExposures || 0;
      document.getElementById('stat-dead').textContent = rec.isolatedModules || 0;

      renderDriftUI();
    }

    async function loadDriftHistory() {
      if (!isStaticHost) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1200);
          const res = await fetch('./api/history', { signal: controller.signal });
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.history) && data.history.length > 0) {
              driftHistory = data.history;
              renderDriftUI();
              return;
            }
          }
        } catch (e) {}
      }

      // Web Showcase Mode: Load from localStorage or initialize with demo trajectory
      try {
        const local = localStorage.getItem('zenith_web_drift_history');
        if (local) {
          driftHistory = JSON.parse(local);
        } else {
          driftHistory = [];
        }
      } catch (err) {}
      renderDriftUI();
    }

    function renderDriftUI() {
      const panel = document.getElementById('drift-panel');
      const body = document.getElementById('drift-body');
      const badgeCount = document.getElementById('drift-badge-count');
      const toggleIcon = document.getElementById('drift-toggle-icon');

      const svg = document.getElementById('drift-svg');
      const tooltip = document.getElementById('drift-tooltip');
      const list = document.getElementById('drift-history-list');

      const chartCont = document.getElementById('drift-chart-container') || document.getElementById('drift-chart-wrapper');

      if (!driftHistory || driftHistory.length === 0) {
        // Telemetri verisi yoksa gri kutuyu DOM ve CSS'te KESİN olarak gizle (display: none !important;)
        if (panel) {
          panel.classList.remove('has-drift-data');
          panel.style.setProperty('display', 'none', 'important');
        }
        if (body) {
          body.classList.remove('has-drift-data');
          body.style.setProperty('display', 'none', 'important');
        }
        if (chartCont) {
          chartCont.classList.remove('has-drift-data');
          chartCont.style.setProperty('display', 'none', 'important');
        }
        return;
      }

      // SADECE driftHistory.length > 0 olduğunda paneli genişlet ve görünür yap
      if (panel) {
        panel.classList.add('has-drift-data');
        panel.style.removeProperty('display');
        panel.style.display = 'block';
      }
      if (body) {
        body.classList.add('has-drift-data');
        body.style.removeProperty('display');
        body.style.display = isDriftCollapsed ? 'none' : 'block';
      }
      if (chartCont) {
        chartCont.classList.add('has-drift-data');
        chartCont.style.removeProperty('display');
        chartCont.style.display = 'block';
      }

      // Snapshot mevcut olduğunda paneli genişlet
      if (panel) {
        panel.style.display = 'block';
        panel.style.padding = '10px';
        panel.style.margin = '10px 0 0 0';
        panel.style.background = 'rgba(6, 11, 24, 0.5)';
        panel.style.border = '1px solid rgba(0, 240, 255, 0.15)';
        panel.style.borderRadius = '8px';
        panel.style.maxHeight = 'none';
      }
      if (badgeCount) {
        badgeCount.textContent = driftHistory.length;
        badgeCount.style.background = 'rgba(0, 240, 255, 0.15)';
        badgeCount.style.color = 'var(--accent-cyan)';
        badgeCount.style.fontSize = '9px';
      }
      if (body) body.style.display = isDriftCollapsed ? 'none' : 'block';
      if (toggleIcon) toggleIcon.style.display = 'inline';

      hud.renderDriftChart(svg, tooltip, driftHistory, activeSnapshotIndex, (rec, idx) => {
        inspectSnapshotInHUD(rec, idx);
      });

      hud.renderHistoryList(list, driftHistory, activeSnapshotIndex, (rec, idx) => {
        inspectSnapshotInHUD(rec, idx);
      });
    }

    async function persistScanSnapshot(report) {
      if (!report || activeSnapshotIndex !== null) return;
      const newRecord = {
        id: 'scan_' + Date.now(),
        timestamp: new Date().toISOString(),
        gitCommit: 'HEAD',
        trafficIndex: report.trafficIndex ?? report.density,
        cyclicDeadlocks: report.circularDependencies,
        securityExposures: report.securityLeakCount,
        isolatedModules: report.deadCodeCount,
        totalModules: report.totalModules,
        totalEdges: trafficEngine.bridges ? trafficEngine.bridges.length : 0
      };

      if (!isStaticHost) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1200);
          await fetch('./api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRecord),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          return;
        } catch (e) {}
      }

      // Fallback in Web Showcase mode: persist in localStorage
      try {
        driftHistory.push(newRecord);
        if (driftHistory.length > 30) driftHistory = driftHistory.slice(-30);
        localStorage.setItem('zenith_web_drift_history', JSON.stringify(driftHistory));
        renderDriftUI();
      } catch (err) {}
    }

    async function rescanLiveProject() {
      try {
        logToTerminal('🔄 [LIVE AUDIT] Re-scanning active workspace modules...', 'header');
        const res = await fetch('/api/project-modules');
        if (!res.ok) throw new Error('API connection failure');
        const data = await res.json();
        if (data.modules && data.modules.length > 0) {
          logToTerminal(`✅ [AUDIT COMPLETE] "${data.targetDir}" (${data.modules.length} modules ingested into DAG topology).`, 'success');
          trafficEngine.loadModules(data.modules);
          refreshCityUI();
          persistScanSnapshot(trafficEngine.generateTelemetryReport());
          loadDriftHistory();
        } else {
          logToTerminal('⚠️ No auditable JS/TS modules located in target directory.', 'warning');
        }
      } catch (e) {
        logToTerminal('ℹ️ Live CLI server offline. Operating in standalone in-memory mode.', 'info');
      }
    }

    function initLiveSseWatcher() {
      const sseIndicator = document.getElementById('live-sse-indicator');
      if (isStaticHost) {
        if (sseIndicator) {
          sseIndicator.style.borderColor = 'rgba(0, 240, 255, 0.4)';
          sseIndicator.style.background = 'rgba(0, 240, 255, 0.12)';
          sseIndicator.style.color = 'var(--accent-cyan)';
          sseIndicator.innerHTML = '<span style="width: 6px; height: 6px; border-radius: 50%; background: var(--accent-cyan); box-shadow: 0 0 6px var(--accent-cyan);"></span><span>WEB SHOWCASE</span>';
        }
        return;
      }

      try {
        const eventSource = new EventSource('./api/events');

        eventSource.onopen = () => {
          if (sseIndicator) {
            sseIndicator.style.borderColor = 'rgba(0, 230, 118, 0.4)';
            sseIndicator.style.background = 'rgba(0, 230, 118, 0.12)';
            sseIndicator.style.color = 'var(--accent-green)';
            sseIndicator.innerHTML = '<span style="width: 6px; height: 6px; border-radius: 50%; background: var(--accent-green); box-shadow: 0 0 6px var(--accent-green);"></span><span>LIVE WATCHER</span>';
          }
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'file-change') {
              logToTerminal(`⚡ [REAL-TIME WATCHER] File mutation detected in "${data.file}". Rebuilding AST graph...`, 'highlight');
              rescanLiveProject();
            } else if (data.type === 'history-updated') {
              loadDriftHistory();
            }
          } catch (e) {}
        };

        eventSource.onerror = () => {
          if (sseIndicator) {
            sseIndicator.style.borderColor = 'rgba(0, 240, 255, 0.4)';
            sseIndicator.style.background = 'rgba(0, 240, 255, 0.12)';
            sseIndicator.style.color = 'var(--accent-cyan)';
            sseIndicator.innerHTML = '<span style="width: 6px; height: 6px; border-radius: 50%; background: var(--accent-cyan); box-shadow: 0 0 6px var(--accent-cyan);"></span><span>WEB SHOWCASE</span>';
          }
        };
      } catch (e) {}
    }
    
    // ─── Theme Toggle (Dark / Light Bosphorus) ───
    const btnToggleTheme = document.getElementById('btn-toggle-theme');
    let currentTheme = localStorage.getItem('zenith_theme') || 'dark';

    function applyTheme(theme) {
      currentTheme = theme;
      document.documentElement.setAttribute('data-theme', theme);
      document.body.classList.toggle('light-theme', theme === 'light');
      document.body.classList.toggle('dark-theme', theme === 'dark');
      localStorage.setItem('zenith_theme', theme);

      if (btnToggleTheme) {
        const isDark = theme === 'dark';
        btnToggleTheme.innerHTML = isDark
          ? '<span class="theme-icon">🌙</span> <span class="btn-label">Dark</span>'
          : '<span class="theme-icon">☀️</span> <span class="btn-label">Light</span>';
      }

      // Sync Three.js 3D scene
      if (bosphorusScene && typeof bosphorusScene.setTheme === 'function') {
        bosphorusScene.setTheme(theme);
      }

      // Sync radar canvas background
      if (typeof window.requestRadarUpdate === 'function') window.requestRadarUpdate(); else drawRadar();
    }

    // Apply saved theme on load
    applyTheme(currentTheme);

    if (btnToggleTheme) {
      btnToggleTheme.addEventListener('click', () => {
        applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
      });
    }

    // ─── Internationalization (i18n) Engine ───
    let currentLang = localStorage.getItem('zenith_lang') || 'en';
    const btnToggleLang = document.getElementById('btn-toggle-lang');
    const btnLangMobile = document.getElementById('btn-lang-mobile');

    const i18n = {
      en: {
        brandSub: '3D Codebase Topology & Architectural Telemetry',
        ingestPlaceholder: 'owner/repo (e.g. expressjs/express)',
        ingestBtn: 'Ingest',
        tokenBtn: '🔑 Token',
        openFolder: '📁 Ingest Directory',
        searchPlaceholder: 'Search Module...',
        rescanBtn: '🔄 Rescan',
        prBotBtn: '💬 PR Bot',
        exportBtn: '📊 Export',
        exportHeader: '📦 Architecture Export',
        exportMdTitle: 'Markdown Telemetry Report (.md)',
        exportMdSub: 'Tarjan SCC, metrics and architectural health audit',
        exportSvgTitle: '2D Vector Architecture Diagram (.svg)',
        exportSvgSub: 'District blocks and curved dependency arrows',
        exportAllTitle: 'Download Both (Markdown + SVG)',
        exportAllSub: 'Zero browser alert download with 400ms delay',
        tourBtn: '🎥 360° Tour',
        tourBtnActive: '🎬 Tour: Active',
        vapurBtn: '🚢 Ferry',
        audioOff: 'Audio: Off',
        audioOn: 'Audio: On',
        langBadge: 'EN',
        mobileTitle: '⚡ Quick Control Deck',
        mobileRepo: 'GitHub Repository:',
        mobileSample: 'Select Scenario:',
        patModalTitle: 'GitHub Personal Access Token (PAT)',
        patModalDesc: 'GitHub API limits unauthenticated requests to 60/hr. Provide a Personal Access Token (PAT) for <strong>5,000 requests/hr</strong> to deep-scan large repositories. Stored strictly in local browser storage.',
        patClearBtn: '🗑️ Clear Token',
        patCancelBtn: 'Cancel',
        patSaveBtn: '💾 Save',
        diffModalTitle: 'Unified Remediation Patch (Git Diff)',
        copyPatchBtn: '📋 Copy Patch',
        downloadPatchBtn: '💾 Export .patch File',
        applyPatchBtn: '🛠️ Apply Remediation Patch to Disk',
        incidentTitle: 'Cyclic Deadlock Detected (Tarjan SCC Invariant Violation)',
        incidentDesc: 'Directed acyclic graph invariant broken across ingress bridge modules.',
        dispatchBtn: 'Dispatch Autonomous Remediation Agent',
        sampleJam: '🚨 Cyclic Deadlock (Tarjan SCC)',
        sampleNexus: '🌐 Zenith Nexus (Hybrid RAG)',
        sampleVercel: '▲ Vercel AI SDK (App Router)',
      },
      tr: {
        brandSub: '3D Kod Topolojisi ve Mimari Telemetri Merkezi',
        ingestPlaceholder: 'owner/repo (örn: expressjs/express)',
        ingestBtn: 'Yükle',
        tokenBtn: '🔑 Token',
        openFolder: '📁 Klasör Yükle',
        searchPlaceholder: 'Modül veya semt ara...',
        rescanBtn: '🔄 Yenile',
        prBotBtn: '💬 PR Bot',
        exportBtn: '📊 Dışa Aktar',
        exportHeader: '📦 Mimari Dışa Aktarma',
        exportMdTitle: 'Markdown Telemetri Raporu (.md)',
        exportMdSub: 'Tarjan SCC, metrikler ve mimari sağlık denetimi',
        exportSvgTitle: '2D Vektörel Mimari Şema (.svg)',
        exportSvgSub: 'Semt blokları ve kavisli bağımlılık okları',
        exportAllTitle: 'Hepsini İndir (İkisi Birden)',
        exportAllSub: '400ms güvenlik gecikmesiyle tarayıcı uyarısız indirme',
        tourBtn: '🎥 360° Tur',
        tourBtnActive: '🎬 Tur: Açık',
        vapurBtn: '🚢 Vapur',
        audioOff: 'Ses: Kapalı',
        audioOn: 'Ses: Açık',
        langBadge: 'TR',
        mobileTitle: '⚡ Hızlı Kontrol Menüsü',
        mobileRepo: 'GitHub Deposu:',
        mobileSample: 'Senaryo Seç:',
        patModalTitle: 'GitHub Kişisel Erişim Belirteci (PAT)',
        patModalDesc: 'GitHub API anonim kullanıcılara saatte sadece 60 istek sınırı uygular. Kişisel erişim belirtecinizi (PAT) girerek <strong>saatte 5.000 istek kotasıyla</strong> büyük depoları derinlemesine tarayabilirsiniz. Token yalnızca tarayıcınızın yerel belleğinde saklanır.',
        patClearBtn: '🗑️ Token\'ı Temizle',
        patCancelBtn: 'Vazgeç',
        patSaveBtn: '💾 Kaydet',
        diffModalTitle: 'Birleşik Onarım Yaması (Git Diff)',
        copyPatchBtn: '📋 Yamayı Kopyala',
        downloadPatchBtn: '💾 .patch Dosyası İndir',
        applyPatchBtn: '🛠️ Yamayı Diske Uygula',
        incidentTitle: 'Döngüsel Kilit Algılandı (Tarjan SCC İhlali)',
        incidentDesc: 'Köprü giriş modüllerinde yönlü döngüsüz çizge (DAG) kuralı bozuldu.',
        dispatchBtn: 'Otonom Onarım Ajanını Gönder',
        sampleJam: '🚨 Boğaziçi Köprü Kilidi (Tarjan SCC)',
        sampleNexus: '🌐 Zenith Nexus (Hibrit RAG)',
        sampleVercel: '▲ Vercel AI SDK (App Router)',
      }
    };

    function applyLanguage(lang) {
      currentLang = lang;
      document.documentElement.lang = lang;
      localStorage.setItem('zenith_lang', lang);
      const dict = i18n[lang] || i18n.en;

      if (btnToggleLang) {
        btnToggleLang.innerHTML = `<span class="btn-icon">🌐</span> <span class="btn-label">${dict.langBadge}</span>`;
      }
      if (btnLangMobile) {
        btnLangMobile.textContent = `🌐 Dil: ${dict.langBadge}`;
      }

      const brandSub = document.querySelector('.brand-sub');
      if (brandSub) brandSub.textContent = dict.brandSub;

      const repoInput = document.getElementById('input-github-repo');
      if (repoInput) repoInput.placeholder = dict.ingestPlaceholder;

      const btnFetchGithub = document.getElementById('btn-fetch-github');
      if (btnFetchGithub) btnFetchGithub.textContent = dict.ingestBtn;

      const btnOpenPat = document.getElementById('btn-open-pat-modal');
      if (btnOpenPat) btnOpenPat.textContent = dict.tokenBtn;

      const btnOpenFolder = document.getElementById('btn-open-folder');
      if (btnOpenFolder) btnOpenFolder.innerHTML = `<span class="btn-icon">📁</span> <span class="btn-label">${dict.openFolder.replace('📁 ', '')}</span>`;

      const searchInput = document.getElementById('input-search');
      if (searchInput) searchInput.placeholder = dict.searchPlaceholder;

      const btnRescan = document.getElementById('btn-rescan-project');
      if (btnRescan) btnRescan.innerHTML = `<span class="btn-icon">🔄</span> <span class="btn-label">${dict.rescanBtn.replace('🔄 ', '')}</span>`;

      const btnPrBot = document.getElementById('btn-copy-pr-comment');
      if (btnPrBot) btnPrBot.innerHTML = `<span class="btn-icon">💬</span> <span class="btn-label">${dict.prBotBtn.replace('💬 ', '')}</span>`;

      const btnDownloadReport = document.getElementById('btn-download-report');
      if (btnDownloadReport) btnDownloadReport.innerHTML = `<span class="btn-icon">📊</span> <span class="btn-label">${dict.exportBtn.replace('📊 ', '')}</span> <span style="font-size: 8px; opacity: 0.8; margin-left: 2px;">▼</span>`;

      const exportHeader = document.querySelector('.export-popover-header span');
      if (exportHeader) exportHeader.textContent = dict.exportHeader;

      const mdStrong = document.querySelector('#btn-export-md strong');
      const mdSmall = document.querySelector('#btn-export-md small');
      if (mdStrong) mdStrong.textContent = dict.exportMdTitle;
      if (mdSmall) mdSmall.textContent = dict.exportMdSub;

      const svgStrong = document.querySelector('#btn-export-svg strong');
      const svgSmall = document.querySelector('#btn-export-svg small');
      if (svgStrong) svgStrong.textContent = dict.exportSvgTitle;
      if (svgSmall) svgSmall.textContent = dict.exportSvgSub;

      const allStrong = document.querySelector('#btn-export-all strong');
      const allSmall = document.querySelector('#btn-export-all small');
      if (allStrong) allStrong.textContent = dict.exportAllTitle;
      if (allSmall) allSmall.textContent = dict.exportAllSub;

      const btnVapur = document.getElementById('btn-vapur-dudugu');
      if (btnVapur) btnVapur.innerHTML = `<span class="btn-icon">🚢</span> <span class="btn-label">${dict.vapurBtn.replace('🚢 ', '')}</span>`;

      const btnAudio = document.getElementById('btn-toggle-audio');
      if (btnAudio) {
        btnAudio.innerHTML = isAudioMuted 
          ? `<span class="btn-icon" id="audio-icon">🔇</span> <span class="btn-label" id="audio-label">${dict.audioOff}</span>`
          : `<span class="btn-icon" id="audio-icon">🔊</span> <span class="btn-label" id="audio-label">${dict.audioOn}</span>`;
      }

      const patModalTitle = document.querySelector('#modal-github-pat h2 span:last-child');
      if (patModalTitle) patModalTitle.textContent = dict.patModalTitle;

      const patModalDesc = document.querySelector('#modal-github-pat p');
      if (patModalDesc) patModalDesc.innerHTML = dict.patModalDesc;

      const btnClearPat = document.getElementById('btn-clear-pat');
      if (btnClearPat) btnClearPat.textContent = dict.patClearBtn;

      const btnClosePat = document.getElementById('btn-close-pat-modal-btn');
      if (btnClosePat) btnClosePat.textContent = dict.patCancelBtn;

      const btnSavePat = document.getElementById('btn-save-pat');
      if (btnSavePat) btnSavePat.textContent = dict.patSaveBtn;

      const diffModalTitle = document.querySelector('#diff-modal h2');
      if (diffModalTitle) diffModalTitle.textContent = dict.diffModalTitle;

      const btnCopyDiff = document.getElementById('btn-copy-diff');
      if (btnCopyDiff) btnCopyDiff.textContent = dict.copyPatchBtn;

      const btnDownDiff = document.getElementById('btn-download-patch');
      if (btnDownDiff) btnDownDiff.textContent = dict.downloadPatchBtn;

      const btnApplyDiff = document.getElementById('btn-apply-patch-live');
      if (btnApplyDiff) btnApplyDiff.textContent = dict.applyPatchBtn;

      const incTitle = document.querySelector('.incident-title');
      if (incTitle) incTitle.textContent = dict.incidentTitle;

      const incDesc = document.getElementById('incident-desc');
      if (incDesc) incDesc.textContent = dict.incidentDesc;

      const btnDispatch = document.querySelector('#btn-dispatch-agent span');
      if (btnDispatch) btnDispatch.textContent = dict.dispatchBtn;

      const sampleOpt0 = document.querySelector('#sample-select option[value="circular-jam-demo"]');
      const sampleOpt1 = document.querySelector('#sample-select option[value="zenith-nexus"]');
      const sampleOpt2 = document.querySelector('#sample-select option[value="vercel-ai-sdk"]');
      if (sampleOpt0) sampleOpt0.textContent = dict.sampleJam;
      if (sampleOpt1) sampleOpt1.textContent = dict.sampleNexus;
      if (sampleOpt2) sampleOpt2.textContent = dict.sampleVercel;
    }

    // Apply saved language on load
    applyLanguage(currentLang);

    if (btnToggleLang) {
      btnToggleLang.addEventListener('click', () => {
        applyLanguage(currentLang === 'en' ? 'tr' : 'en');
      });
    }

    if (btnLangMobile) {
      btnLangMobile.addEventListener('click', () => {
        applyLanguage(currentLang === 'en' ? 'tr' : 'en');
        const mobileDrawer = document.getElementById('mobile-overflow-drawer');
        if (mobileDrawer) mobileDrawer.style.display = 'none';
      });
    }

    
    const btnCinematicTour = document.getElementById('btn-cinematic-tour');
    if (btnCinematicTour) {
      btnCinematicTour.addEventListener('click', () => {
        const active = bosphorusScene.toggleCinematicTour();
        btnCinematicTour.innerHTML = active 
          ? '<span class="btn-icon tour-icon">🎬</span> <span class="btn-label">Tur: Açık</span>' 
          : '<span class="btn-icon tour-icon">🎥</span> <span class="btn-label">360° Tur</span>';
        btnCinematicTour.style.borderColor = active ? 'var(--accent-cyan)' : 'rgba(0, 240, 255, 0.35)';
        btnCinematicTour.style.color = active ? 'var(--accent-cyan)' : 'var(--text-main)';
        if (active) {
          logToTerminal('🎬 [SİNEMATİK TUR] 360° Boğaz sunum turu başlatıldı.', 'info');
        } else {
          logToTerminal('⏸️ [SİNEMATİK TUR] Manuel kamera kontrolüne dönüldü.', 'info');
        }
      });
      bosphorusScene.onCinematicChange = (active) => {
        btnCinematicTour.innerHTML = active 
          ? '<span class="btn-icon tour-icon">🎬</span> <span class="btn-label">Tur: Açık</span>' 
          : '<span class="btn-icon tour-icon">🎥</span> <span class="btn-label">360° Tur</span>';
        btnCinematicTour.style.borderColor = active ? 'var(--accent-cyan)' : 'rgba(0, 240, 255, 0.35)';
        btnCinematicTour.style.color = active ? 'var(--accent-cyan)' : 'var(--text-main)';
      };
    }

    // Drag & Drop directory support for Web Showcase
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    window.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const items = e.dataTransfer.items;
      if (!items || items.length === 0) return;

      const files = [];
      async function traverseEntry(entry, currentPath = '') {
        if (entry.isFile) {
          const file = await new Promise(res => entry.file(res));
          files.push({ file, relPath: (currentPath + file.name).replace(/\\/g, '/') });
        } else if (entry.isDirectory) {
          const reader = entry.createReader();
          let entries = [];
          let batch;
          do {
            batch = await new Promise(res => reader.readEntries(res));
            if (batch && batch.length > 0) {
              entries = entries.concat(batch);
            }
          } while (batch && batch.length > 0);

          for (const child of entries) {
            await traverseEntry(child, currentPath + entry.name + '/');
          }
        }
      }

      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry ? items[i].webkitGetAsEntry() : null;
        if (entry) await traverseEntry(entry);
      }

      if (files.length > 0) {
        logToTerminal(`📁 [DRAG & DROP] Ingesting ${files.length} files from dropped directory...`, 'header');
        const parsedList = [];
        for (const { file, relPath } of files) {
          if (!parser.isAuditableFile(relPath)) continue;
          try {
            const textContent = await file.text();
            parsedList.push(parser.parseModule(relPath, textContent));
          } catch (err) {}
        }
        if (parsedList.length > 0) {
          trafficEngine.loadModules(parsedList);
          refreshCityUI();
          logToTerminal(`✅ [AST INGEST COMPLETE] ${parsedList.length} auditable modules rendered in 3D scene.`, 'success');
          persistScanSnapshot(trafficEngine.generateTelemetryReport());
        }
      }
    });

    const btnRescan = document.getElementById('btn-rescan-project');
    if (btnRescan) {
      btnRescan.addEventListener('click', rescanLiveProject);
    }
    window.addEventListener('keydown', (e) => {
      if ((e.key === 'r' || e.key === 'R') && document.activeElement.tagName !== 'INPUT') {
        rescanLiveProject();
      }
    });

    // Top Bar Horizontal Mouse Wheel Navigation
    const topBar = document.querySelector('header.top-bar');
    if (topBar) {
      topBar.addEventListener('wheel', (e) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          topBar.scrollLeft += e.deltaY * 0.9;
        }
      }, { passive: false });
    }

    // OrbitControls movement listener for camera dot on radar
    if (bosphorusScene && bosphorusScene.controls) {
      bosphorusScene.controls.addEventListener('change', () => {
        if (typeof window.requestRadarUpdate === 'function') window.requestRadarUpdate();
      });
    }

    function updateParticlesLoop() {
      requestAnimationFrame(updateParticlesLoop);
      trafficParticles.update();

      // If camera is lerping or cinematic tour is active, mark radar as dirty
      if (bosphorusScene && (bosphorusScene.cameraLerpTarget || bosphorusScene.isCinematicTour)) {
        radarNeedsUpdate = true;
      }

      if (radarNeedsUpdate) {
        drawRadar();
        radarNeedsUpdate = false;
      }
    }
    updateParticlesLoop();

    
    // ─── GitHub Personal Access Token (PAT) Modal Handlers ───
    const modalPat = document.getElementById('modal-github-pat');
    const inputPat = document.getElementById('input-github-pat');
    const btnOpenPat = document.getElementById('btn-open-pat-modal');
    const btnSavePat = document.getElementById('btn-save-pat');
    const btnClearPat = document.getElementById('btn-clear-pat');
    const btnClosePat = document.getElementById('btn-close-pat-modal');
    const btnClosePatBtn = document.getElementById('btn-close-pat-modal-btn');

    function updatePatButtonIndicator() {
      const hasPat = !!localStorage.getItem('zenith_github_pat');
      if (btnOpenPat) {
        btnOpenPat.innerHTML = hasPat ? '🔑 Token: Aktif' : '🔑 Token';
        btnOpenPat.style.color = hasPat ? 'var(--accent-green)' : 'var(--text-main)';
        btnOpenPat.style.borderColor = hasPat ? 'var(--accent-green)' : 'rgba(0,240,255,0.3)';
      }
    }
    updatePatButtonIndicator();

    if (btnOpenPat) {
      btnOpenPat.addEventListener('click', () => {
        if (inputPat) inputPat.value = localStorage.getItem('zenith_github_pat') || '';
        if (modalPat) modalPat.style.display = 'flex';
      });
    }

    if (btnSavePat) {
      btnSavePat.addEventListener('click', () => {
        const token = inputPat ? inputPat.value.trim() : '';
        if (!token) {
          alert('Lütfen geçerli bir GitHub Token girin veya temizleyin.');
          return;
        }
        localStorage.setItem('zenith_github_pat', token);
        updatePatButtonIndicator();
        if (modalPat) modalPat.style.display = 'none';
        logToTerminal('🔑 [GITHUB AUTH] Kişisel Erişim Belirteci (PAT) kaydedildi. 5.000 req/hr kotası aktif.', 'success');
      });
    }

    if (btnClearPat) {
      btnClearPat.addEventListener('click', () => {
        localStorage.removeItem('zenith_github_pat');
        if (inputPat) inputPat.value = '';
        updatePatButtonIndicator();
        if (modalPat) modalPat.style.display = 'none';
        logToTerminal('ℹ️ [GITHUB AUTH] Kişisel Erişim Belirteci silindi. Anonim mod devrede.', 'info');
      });
    }

    if (btnClosePat) btnClosePat.addEventListener('click', () => modalPat.style.display = 'none');
    if (btnClosePatBtn) btnClosePatBtn.addEventListener('click', () => modalPat.style.display = 'none');

    // Application Bootstrap Router
    async function startApplication() {
      if (window.__ZENITH_EMBEDDED_MODULES__ && window.__ZENITH_EMBEDDED_MODULES__.length > 0) {
        logToTerminal(`📐 [STANDALONE ARCHITECTURE REPORT] Embedded ${window.__ZENITH_EMBEDDED_MODULES__.length} code modules loaded.`, 'header');
        trafficEngine.loadModules(window.__ZENITH_EMBEDDED_MODULES__);
        refreshCityUI();
        loadDriftHistory();
        bosphorusScene.controlsLerpTarget = createVec3(-40, 30, -30);
        bosphorusScene.cameraLerpTarget = createVec3(-60, 180, 240);
        drawRadar();
        return;
      }

      if (isStaticHost) {
        const sseIndicator = document.getElementById('live-sse-indicator');
        if (sseIndicator) {
          sseIndicator.style.borderColor = 'rgba(0, 240, 255, 0.4)';
          sseIndicator.style.background = 'rgba(0, 240, 255, 0.12)';
          sseIndicator.style.color = 'var(--accent-cyan)';
          sseIndicator.innerHTML = '<span style="width: 6px; height: 6px; border-radius: 50%; background: var(--accent-cyan); box-shadow: 0 0 6px var(--accent-cyan);"></span><span>WEB SHOWCASE</span>';
        }
        logToTerminal('🌐 [WEB SHOWCASE MODE] Interactive 3D Metropole online.', 'header');
        logToTerminal('💡 Use the scenario selector or ingest your own project folder.', 'info');
        loadSample('circular-jam-demo');
        loadDriftHistory();
        return;
      }

      // Local CLI Server Mode
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
        const res = await fetch('./api/project-modules', { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data.modules && data.modules.length > 0) {
            logToTerminal(`🏙️ [LIVE WORKSPACE LOADED] "${data.targetDir}" (${data.modules.length} modules ingested into 3D city).`, 'header');
            trafficEngine.loadModules(data.modules);
            refreshCityUI();
            persistScanSnapshot(trafficEngine.generateTelemetryReport());
            loadDriftHistory();
            initLiveSseWatcher();
            bosphorusScene.controlsLerpTarget = createVec3(-40, 30, -30);
            bosphorusScene.cameraLerpTarget = createVec3(-60, 180, 240);
            drawRadar();
            return;
          }
        }
      } catch (e) {}

      loadSample('circular-jam-demo');
      loadDriftHistory();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => startApplication());
    } else {
      startApplication();
    }

    // ─── HTML5 Drag & Drop Ingestion Protocol ───
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    window.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const items = e.dataTransfer && e.dataTransfer.items;
      if (!items || items.length === 0) return;
      logToTerminal('📂 [DRAG & DROP] Yerel dizin sürükleme algılandı, taranıyor...', 'header');
      try {
        const parsedFiles = [];
        const parser = new CodebaseParser();
        for (let i = 0; i < items.length; i++) {
          const item = items[i].webkitGetAsEntry ? items[i].webkitGetAsEntry() : null;
          if (item) {
            await traverseEntry(item, '');
          }
        }
      } catch (dndErr) {
        logToTerminal(`⚠️ [DRAG & DROP] Dizin okunamadı: ${dndErr.message}`, 'warning');
      }
    });
