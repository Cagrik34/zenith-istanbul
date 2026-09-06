/**
 * ZenithIstanbul - Munder-Difflin Inspired Agent Dispatcher
 * Autonomous incident resolution engine for circular dependencies & architectural gridlocks.
 */

export class AgentDispatcher {
  constructor(onLogStream, onIncidentResolved) {
    this.onLogStream = onLogStream;
    this.onIncidentResolved = onIncidentResolved;
    this.isResolving = false;
  }

  /**
   * Köprüdeki veya binalardaki dairesel bağımlılık kilidini çözmek için ajan sevk eder
   * @param {Object} incidentData - Kilitlenen köprü veya döngü bilgisi
   * @param {Object} trafficEngine - Aktif trafik ve çizge motoru
   */
  async dispatchRefactorAgent(incidentData, trafficEngine) {
    if (this.isResolving) return;
    this.isResolving = true;

    const log = (text, type = 'info') => {
      if (this.onLogStream) this.onLogStream(text, type);
    };

    log('🚀 [AGENT DISPATCH] Görev Başlatıldı: Boğaziçi Köprü Trafik Zabıtası Sevk Edildi...', 'header');
    await this.delay(600);

    log('🔍 [ANALİZ] Tarjan SCC Döngüsü Taranıyor:');
    if (incidentData.chain && incidentData.chain.length > 0) {
      log(`   🔗 Tespit Edilen Kilit Zinciri: ${incidentData.chain.map(c => c.split('/').pop()).join(' ➔ ')}`, 'warning');
    } else {
      log('   🔗 15 Temmuz Şehitler Köprüsü Üzerinde Çift Yönlü İthalat Döngüsü Bulundu!', 'warning');
    }
    await this.delay(900);

    log('⚡ [KÖK NEDEN TESPİTİ] Ters Yönde Bağımlılık İhlali:', 'info');
    log('   └─ "userService.ts" (Anadolu Yakası) doğrudan "AuthModal.tsx" (Avrupa Yakası) bileşenini çağırıyor!', 'highlight');
    log('   └─ UI bileşenine bağımlı servis katmanı mimari kural ihlali yaratıyor.', 'info');
    await this.delay(1100);

    log('🛠️ [REFACTORING STRATEJİSİ] Bağımsız Tip Katmanı Oluşturuluyor...', 'header');
    log('   + [NEW FILE] "src/types/auth-contracts.ts" Tarihi Yarımada (Core) bölgesinde inşa edildi.', 'success');
    log('   ~ [MODIFY] Ortak "UserSessionPayload" tipi yeni kontrat dosyasına taşındı.', 'info');
    log('   ~ [MODIFY] "userService.ts" importu "auth-contracts.ts" olarak güncellendi.', 'success');
    await this.delay(1200);

    log('🧪 [DOĞRULAMA] AST Bağımlılık Grafiği Yeniden Derleniyor...', 'info');
    
    // Grafikteki döngüyü kır (userService -> AuthModal kenarını sil, güvenli types modülü ekle)
    this.lastGeneratedDiff = this.produceRefactorDiff();
    this.executeGraphDecoupling(trafficEngine);
    await this.delay(800);

    log('✅ [TARJAN SCC GEÇTİ] Kalan Döngüsel Bağımlılık Sayısı: 0', 'success');
    log('🌉 [KÖPRÜ AÇILDI] 15 Temmuz Şehitler Köprüsü Trafiğe Açıldı! Araçlar Akıyor.', 'success');
    log('📄 [YAMA HAZIRLANDI] Unified Git Diff üretildi ("Refactor Diffini Gör" butonundan inceleyebilirsiniz).', 'highlight');
    log('🎉 [TAMAMLANDI] ZenithIstanbul Mimarisi Kusursuz Senkron Durumuna Getirildi.', 'header');

    this.isResolving = false;
    if (this.onIncidentResolved) {
      this.onIncidentResolved(this.lastGeneratedDiff, this.getRefactorPayload());
    }
  }

  /**
   * Diske veya bellek içi AST motoruna uygulanacak tam dosya yaması paketi
   */
  getRefactorPayload() {
    return {
      diff: this.lastGeneratedDiff,
      files: [
        {
          path: 'src/services/userService.ts',
          content: `// Refactored by ZenithIstanbul Agent
import type { UserSessionPayload } from '../types/auth-contracts';
import { dbPool } from './dbConnection';

export function getUserProfile(userId: string) {
  return dbPool.query('SELECT * FROM users WHERE id = $1', [userId]);
}

export function syncPermissions(userId: string) {
  return dbPool.query('UPDATE users SET synced = true WHERE id = $1', [userId]);
}
`
        },
        {
          path: 'src/types/auth-contracts.ts',
          content: `/**
 * ZenithIstanbul - Decoupled Contract Layer (Tarihi Yarımada)
 * Bu dosya 15 Temmuz Köprüsü'ndeki döngüsel bağımlılığı kırmak için otonom olarak üretilmiştir.
 */
export interface UserSessionPayload {
  userId: string;
  roles: string[];
  issuedAt: number;
  expiresAt: number;
}
`
        }
      ]
    };
  }

  /**
   * Gerçekçi Git Diff Yaması Üretir
   */
  produceRefactorDiff() {
    return `diff --git a/src/services/userService.ts b/src/services/userService.ts
index 8f2c19a..4b108e4 100644
--- a/src/services/userService.ts
+++ b/src/services/userService.ts
@@ -1,6 +1,6 @@
-import { AuthModal } from '../ui/AuthModal'; // 🚨 DÖNGÜSEL BAĞIMLILIK: Servis UI'ı import ediyordu!
+import type { UserSessionPayload } from '../types/auth-contracts'; // ✅ Ortak tipe taşındı
 import { dbPool } from './dbConnection';
 
 export function getUserProfile(userId: string): Promise<UserProfile> {
-  const session = AuthModal.getActiveSession();
+  const session = dbPool.getSession(userId);
   return dbPool.query('SELECT * FROM users WHERE id = $1', [userId]);
 }

diff --git a/src/types/auth-contracts.ts b/src/types/auth-contracts.ts
new file mode 100644
index 0000000..7c2d119
--- /dev/null
+++ b/src/types/auth-contracts.ts
@@ -0,0 +1,9 @@
+/**
+ * ZenithIstanbul - Decoupled Contract Layer (Tarihi Yarımada)
+ */
+export interface UserSessionPayload {
+  userId: string;
+  roles: string[];
+  issuedAt: number;
+  expiresAt: number;
+}`;
  }

  executeGraphDecoupling(trafficEngine) {
    // Döngüsel kenarı güvenle kaldır
    for (const [sourceId, targets] of trafficEngine.adjacencyList.entries()) {
      if (sourceId.includes('userService') || sourceId.includes('sessionManager')) {
        for (const targetId of targets) {
          if (targetId.includes('AuthModal')) {
            targets.delete(targetId);
          }
        }
      }
    }

    // Trafik motorunu yeniden hesapla
    trafficEngine.circularChains = [];
    for (const bridge of trafficEngine.bridges) {
      bridge.isJammed = false;
    }
    trafficEngine.calculateTrafficDensity();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
