# Zenith Istanbul

> **Sıfır harici çalışma zamanı bağımlılığıyla tamamen yerel ortamda çalışan etkileşimli 3D kod tabanı topolojisi görselleştiricisi, Tarjan SCC döngü dedektörü ve mimari CI kapı denetçisi.**

[![CI Gatekeeper](https://img.shields.io/github/actions/workflow/status/Cagrik34/zenith-istanbul/zenith-gatekeeper.yml?branch=main&style=flat-square&label=CI%20Gatekeeper)](https://github.com/Cagrik34/zenith-istanbul/actions)
[![Deploy Showcase](https://img.shields.io/github/actions/workflow/status/Cagrik34/zenith-istanbul/deploy-pages.yml?branch=main&style=flat-square&label=GitHub%20Pages)](https://cagrik34.github.io/zenith-istanbul/)
[![Canlı Demo](https://img.shields.io/badge/Canl%C4%B1%20Demo-GitHub%20Pages-00f0ff.svg?style=flat-square)](https://cagrik34.github.io/zenith-istanbul/)
[![Lisans: MIT](https://img.shields.io/badge/Lisans-MIT-blue.svg?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg?style=flat-square)](https://nodejs.org)
[![Hava Boşluğu](https://img.shields.io/badge/Hava%20Bo%C5%9Flu%C4%9Fu-%25100%20%C3%87evrimd%C4%B1%C5%9F%C4%B1-orange.svg?style=flat-square)](public/)

[Canlı Demo](https://cagrik34.github.io/zenith-istanbul/) • [Mimari](#mimari--veri-akışı) • [Motor Kıyaslamaları](#-motor-kıyaslamaları--doğrulama) • [Temel Yetenekler](#-temel-yetenekler--alt-sistemler) • [Başlarken](#-başlarken) • [English Documentation](README.md)

---

## Genel Bakış (Executive Overview)

**Zenith Istanbul**, açık kaynaklı bir 3D yazılım mimarisi görselleştirme aracı ve otomatik CI kapı denetçisidir (gatekeeper). JavaScript ve TypeScript kod tabanlarını statik olarak analiz eder, bağımlılık topolojilerini değerlendirir, Tarjan'ın Kuvvetli Bağlantılı Bileşenler (SCC) algoritması ile döngüsel bağımlılıkları tespit eder, MITRE CWE standartlarına göre mimari sınır ihlallerini denetler ve modülleri İstanbul Boğazı modeline dayalı etkileşimli bir 3D çevrede görselleştirir.

Tüm analiz **yerel ve çevrimdışı** çalışır: AST ayrıştırma, döngü tespiti, güvenlik denetimi, kuvvet yönelimli çizge hesaplamaları ve WebGL çizimleri tamamen yerel Node.js çalışma zamanında ve tarayıcı belleğinde yürütülür. Ağ üzerinden hiçbir kaynak kod, belirteç veya telemetri verisi iletilmez.

Kod tabanı topolojisi jeouzamsal bir metafora haritalanır:
- **Avrupa Yakası**: İstemci tarafı arayüz bileşenleri, React/Vue görünümleri ve sunum katmanları (Galata, Beşiktaş, Levent/Maslak).
- **Tarihi Yarımada**: Çekirdek derleyiciler, AST ayrıştırıcılar ve çizge analiz motorları (Sultanahmet, Eminönü).
- **Anadolu Yakası**: Arka yüz servisleri, veri tabanı kontrolcüleri, model katalogları ve yerel çoklu ajan defterleri (Üsküdar, Kadıköy, Ataşehir).
- **Boğaz Hattı & Kız Kulesi**: Merkezi HTTP güvenlik ara yazılımı, CSRF güvenlik duvarı ve API ağ geçidi.
- **Asma Köprüler**: İstemci ve arka yüz modüllerini birbirine bağlayan sınırlar arası API iletişim hatları. Gerçek zamanlı parçacık akışı bağlantı yoğunluğunu yansıtır.
- **Nakkaştepe Park Alanı**: Anadolu yakası köprü ayağında yer alan, bina çakışmalarını engelleyen sınır korumalı yükseltilmiş yeşil alan.

---

## ⚡ Motor Kıyaslamaları & Doğrulama

Tüm çekirdek modüller ve sınır durumları otomatik birim, entegrasyon ve CI kapı denetim testleriyle doğrulanmıştır (48/48 test geçti):

| Alt Sistem / Modül | Algoritma & Metodoloji | Doğrulama Durumu | Gecikme / Metrik |
|---|---|:---:|:---:|
| **AST Statik Analiz Motoru** | Düzenli ifade tabanlı modül sözcük ayrıştırıcısı | **%100 GEÇTİ** | `< 1.2ms` (modül başına) |
| **Tarjan SCC Döngü Dedektörü** | Yığın tabanlı iteratif DFS ($O(V + E)$) | **%100 GEÇTİ** | `< 0.25ms` (DAG Onaylandı) |
| **MITRE CWE Güvenlik Nöbetçisi** | Mimari sınır kuralı denetçisi (CWE-668, CWE-200, CWE-798) | **%100 GEÇTİ** | `0 İhlal` |
| **3D Boğaziçi Motoru** | Prosedürel Three.js WebGL tuvali | **%100 GEÇTİ** | `60 FPS` sabit |
| **AKOM Çoklu Ajan Koordinatörü** | Yerel dosya sistemi posta kutusu protokolü ve kalp atışı yöneticisi | **%100 GEÇTİ** | Deterministik dağıtım |
| **Bellek Çizgesi Yerleşimi** | Deterministik Fruchterman–Reingold yay-kuvveti yerleşimi ($O(I \cdot (V^2 + E))$) | **%100 GEÇTİ** | `< 5.5ms` yakınsama |
| **Ortak Konu Çıkarımı** | Bellek içi sözcüksel n-gram ve anahtar kelime toplayıcısı | **%100 GEÇTİ** | `< 0.15ms` |
| **Yerel Telemetri Deposu** | Yerel diskte yalnızca eklenebilir JSON defteri (`.zenith/`) | **%100 GEÇTİ** | `< 0.8ms` / kayıt |
| **Headless CI Kapı Denetçisi** | Otomatik port çakışması kaydırmalı POSIX uyumlu CLI | **%100 GEÇTİ** | Doğrulandı |
| **Sıfır CDN Çevrimdışı Yapı** | Yerel Three.js r128 paketi ve yerel WOFF2 fontlar | **%100 GEÇTİ** | `%100 Çevrimdışı Hazır` |

---

## 🏛️ Mimari & Veri Akışı

```mermaid
flowchart TD
    subgraph INGEST ["1. Statik Alma Katmanı"]
        A[Yerel Depo / Sürükle-Bırak / GitHub API] --> B[CodebaseParser - AST Statik Ayrıştırıcı]
    end

    subgraph SOLVERS ["2. Çizge Teorisi & Güvenlik Çözücüler"]
        B --> C[Tarjan SCC Çözücü\nDöngü Tespiti O(V+E)]
        B --> D[Güvenlik Nöbetçisi\nMITRE CWE Sınır Denetimi]
        B --> E[Bölge Eşleyici\nAvrupa / Tarihi / Asya / Boğaz]
        C --> F[Trafik Eşleşme Motoru\nTrafik Endeksi Hesaplaması]
    end

    subgraph PRESENTATION ["3. Uzamsal & Telemetri Sunumu"]
        E --> G[Three.js 3D Görünüm\nProsedürel Binalar & Nakkaştepe]
        F --> H[Köprü Parçacık Girişi\nSınırlar Arası Eşleşme]
        C --> I[DiffEngine Sözleşme Sentezleyici\nStandart Birleşik Git Diff]
        D --> J[Telemetri HUD & Güvenlik Çekmecesi\nGerçek Zamanlı Trend Çizgileri]
    end

    subgraph CI ["4. CI Kapı Denetçisi & Yerel Ajanlar"]
        F --> K[CLI Headless Gatekeeper\n--fail-on-cycle --fail-on-leak]
        K --> L[Otomatik PR Markdown Raporu\nGitHub Step Summary]
        K --> M[AKOM Yerel Ajan Yöneticisi\nPosta Kutusu Koordinasyonu]
    end
```

### Jeouzamsal Eşleme Referansı

| Varlık | Mimari Rolü | Açıklama |
|---|---|---|
| **Avrupa Yakası** | Ön Yüz & Arayüz Katmanları | Galata, Beşiktaş ve Levent/Maslak hattında yer alan istemci modülleri, React/Vue bileşenleri ve DOM yardımcıları. |
| **Tarihi Yarımada** | Çizge Analiz Çekirdeği | Sultanahmet ve Eminönü'nde konumlanan AST ayrıştırıcılar, Tarjan SCC çözücüler ve derleyiciler. |
| **Anadolu Yakası** | Arka Yüz & Yerel Depolama | Üsküdar, Kadıköy ve Ataşehir'de bulunan veri tabanı modelleri, tarihçe defterleri ve yerel çoklu ajan kayıtları. |
| **Boğaz Hattı & Kız Kulesi** | HTTP Güvenlik Ara Yazılımı | Merkezi API ağ geçidi, CSRF kaynak doğrulaması, CORS başlıkları ve yük boyutu denetleyicileri. |
| **Asma Köprüler** | API Giriş Rotaları | Ön yüz çağıranlarını arka yüz yönlendiricilerine bağlayan iletişim kanalları. |
| **Köprü Sıkışıklığı** | Döngüsel İhlaller (Tarjan SCC) | DAG topolojisini ihlal eden döngüsel bağımlılık zincirlerini gösteren kırmızı parçacık birikimi. |
| **Nakkaştepe Parkı** | Korunan Yeşil Alan | Anadolu yakası köprü ayağında ahşap seyir terası, biyolojik gölet ve bina çakışmasını engelleyen sınır izolasyonu. |
| **Gökdelenler** | Yazılım Modülleri | Yükseklik kod satırını (LOC), taban genişliği karmaşıklığı temsil eder; pencere desenleri iç mantık yoğunluğunu yansıtır. |
| **Açık Deniz Bastiyonları** | İzole Modüller | İnceleme veya ölü kod temizliği için işaretlenen sıfır giriş dereceli modüller. |

---

## 🚀 Temel Yetenekler & Alt Sistemler

### 1. 3D Kod Tabanı Görselleştirmesi & Nakkaştepe Parkı
- **Prosedürel 3D Binalar**: Modüller yansımalı cam gradyanları, aydınlatılmış pencere ızgaraları ve köşe yapısal hatlarıyla 3 boyutlu yapılar olarak temsil edilir.
- **Nakkaştepe Park Alanı**: Anadolu kıyısında yükseltilmiş tepe topoğrafyası, konsol ahşap seyir balkonu (*"Uçan Yol"*), biyolojik gölet üzerindeki kemerli köprü ve yerel bitki örtüsü (erguvanlar ve fıstık çamları) içerir.
- **Çakışma Sınırları**: `isInPark` sınır kontrolü katı bir uzamsal ayrım uygulayarak prosedürel yapıların park koordinatlarıyla çakışmasını engeller.

### 2. Tarjan SCC Döngü Tespiti & Sözleşme Ayrıştırması
- Üçüncü taraf bağımlılığı olmaksızın iteratif, yığın tabanlı Tarjan algoritması ile kuvvetli bağlantılı bileşenleri $O(V + E)$ sürede analiz eder.
- Döngüsel bağımlılık zincirlerini (`A → B → C → A`) ayrıştırılmış TypeScript sözleşme arayüzleri (`types/*.contract.ts`) sentezleyerek çözer.
- İnceleme ve doğrudan yama uygulaması için standart Birleşik Git Diff çıktıları üretir.

$$\text{Trafik Endeksi} = \min\left(100, \text{round}\left(\frac{|\text{SCC Kenarları}| \times 3 + |\text{Sınır İthalatları}|}{|\text{Toplam Kenarlar}|} \times 100\right)\right)$$

### 3. İstemci Tarafı Güvenlik Nöbetçisi (MITRE CWE)
- **CWE-668 / CWE-1061**: İstemci paketlerine dahil edilen arka yüz Node.js paketlerini (`fs`, `net`, `child_process`, veri tabanı sürücüleri) tespit eder.
- **CWE-200 / CWE-798**: Sabit kodlanmış kimlik bilgilerini, bulut API anahtarlarını, özel anahtarları ve sızan `.env` değişkenlerini yakalar.
- Hedefe yönelik onarım için 1-indeksli `dosya:satır:sütun` kaynak koordinatları sunar.

### 4. Yerel Çoklu Ajan Koordinasyonu (AKOM)
- Atomik dosya sistemi posta kutusu protokolü kullanarak 5 yerel ajanı koordine eder:
  - `agent.commander`: Görev yönlendirme, durum takibi ve dağıtım.
  - `agent.bridge_engineer`: Tarjan döngü çözümü ve sözleşme çıkarımı.
  - `agent.security_sentinel`: MITRE CWE denetimleri ve sır maskeleme.
  - `agent.refactorer`: AST dönüşümleri ve karmaşıklık azaltımı.
  - `agent.qa_inspector`: Otomatik test yürütme ve doğrulama.
- Bozuk çok satırlı dizeler için JSON sözdizimi kurtarma, sonsuz döngüleri önleyen sekme sınırı ve 5 kademeli sır maskeleme içerir.

### 5. Etkileşimli Bellek & Bilgi Çizgesi
- Deterministik Fruchterman–Reingold yay-kuvveti yerleşim algoritması ($O(I \cdot (V^2 + E))$) ile düğüm denge koordinatlarını hesaplar.
- Dış ağ çağrısı yapmaksızın yerel ajan bellek dosyalarından ortak mimari kavramları analiz eder.
- Tam spesifikasyon: [docs/MEMORY_GRAPH_SPEC.md](docs/MEMORY_GRAPH_SPEC.md).

### 6. Headless CI Kapı Denetçisi & Bağımsız HTML Raporları
- CI iş akışlarında mimari kuralları doğrudan uygular:
  ```bash
  node bin/cli.js --ci --fail-on-cycle --fail-on-leak .
  ```
- Çevrimdışı paylaşım için bağımsız, tek dosya 3D HTML raporları oluşturur:
  ```bash
  node bin/cli.js --export-html mimari-rapor.html .
  ```

---

## ⌨️ Klavye Kısayolları & Kontroller

| Kısayol | Eylem |
|---|---|
| **Sol Tık + Sürükle** | 3D sahne etrafında kamerayı döndür |
| **Sağ Tık + Sürükle** | Sektörler arasında görünümü kaydır (pan) |
| **Fare Tekerleği** | Yakınlaş / Uzaklaş |
| **`1`** | Odak: **Avrupa Yakası** (Galata, Beşiktaş & Levent) |
| **`2`** | Odak: **Anadolu Yakası** (Üsküdar & Ataşehir) |
| **`3`** | Odak: **Boğaziçi Köprüsü & Boğaz Genel Bakış** |
| **`4`** | Odak: **Nakkaştepe Parkı Seyir Noktası** |
| **`Boşluk (Space)`** | Gece / Gündüz aydınlatma modunu değiştir |
| **`H`** | Telemetri HUD'ını ve Teşhis Çekmecesini aç/kapat |
| **`Esc`** | Seçili modülü bırak / açık çekmeceleri kapat |

---

## 🛠️ Başlarken

### Canlı Demo (Kurulum Gerektirmez)

WebGL uygulamasına doğrudan tarayıcınızdan erişin:  
👉 **[https://cagrik34.github.io/zenith-istanbul/](https://cagrik34.github.io/zenith-istanbul/)**

- **GitHub İçe Aktarımı**: Herhangi bir genel depoyu (`kullanıcı/depo`) analiz etmek ve topolojisini görmek için adını girin.
- **Önceden Yapılandırılmış Modeller**: Örnek mimarileri inceleyin (Döngüsel Bağımlılık Kilidi, Zenith Nexus, Vercel AI SDK).
- **Yerel Klasör Sürükle-Bırak**: Yerel-öncelikli analiz için kaynak klasörü doğrudan tarayıcıya sürükleyin.

---

### Yerel Geliştirme

#### Ön Koşullar
- **Node.js**: `v18.0.0+` (`v20+` veya `v22+ LTS` önerilir)
- **npm**: `v9.0.0+`

```bash
# 1. Depoyu klonlayın
git clone https://github.com/Cagrik34/zenith-istanbul.git
cd zenith-istanbul

# 2. Mevcut kod tabanında yerel görselleştiriciyi başlatın (harici npm bağımlılığı gerektirmez)
npm start

# 3. Tam otomatik test paketini & CI denetimini çalıştırın (48 test)
npm test

# 4. Yalnızca birim testleri çalıştırın
npm run test:unit

# 5. Yalnızca headless CI kapı denetimini çalıştırın
npm run test:gatekeeper
```

---

### CLI Referansı

```bash
node bin/cli.js [seçenekler] [dizin]
```

| Seçenek | Bayrak | Açıklama |
|---|---|---|
| **Yardım** | `-h, --help` | Kullanım kılavuzunu ve CLI bayraklarını gösterir. |
| **Sürüm** | `-v, --version` | Mevcut anlamsal sürüm numarasını yazdırır. |
| **Headless CI** | `-c, --ci` | WebGL başlatmadan statik analiz yapar ve telemetri çıktılar. |
| **Döngüde Başarısız Ol** | `--fail-on-cycle` | Döngüsel bağımlılık tespit edilirse çıkış kodu 1 ile sonlanır. |
| **Sızıntıda Başarısız Ol** | `--fail-on-leak` | MITRE CWE istemci güvenlik sızıntısı bulunursa çıkış kodu 1 ile sonlanır. |
| **JSON Çıktısı** | `--json` | Telemetri raporunu makine tarafından okunabilir JSON formatında yazdırır. |
| **HTML Dışa Aktar** | `--export-html <dosya>` | Bağımsız, tek dosya 3D HTML mimari raporu sentezler. |
| **Port** | `--port <sayı>` | Yerel telemetri sunucusu için özel HTTP portu (varsayılan: `4173`). |

---

## 📂 Dizin Yapısı

```
zenith-istanbul/
├── .github/
│   └── workflows/
│       ├── deploy-pages.yml       # Otomatik GitHub Pages yayını
│       └── zenith-gatekeeper.yml  # Headless mimari & güvenlik CI denetimi
├── assets/
│   └── og-preview.jpg             # OpenGraph ön izleme varlığı
├── bin/
│   └── cli.js                     # Birleşik CLI, yerel sunucu & CI kapı denetçisi
├── docs/
│   ├── MEMORY_GRAPH_SPEC.md       # Bellek çizgesi spesifikasyonu
│   └── SWARM_ARCHITECTURE.md      # Yerel çoklu ajan mimarisi
├── public/                        # Sıfır CDN çevrimdışı istemci varlıkları
│   ├── css/                       # Modüler tasarım belirteçleri, HUD ve yerleşim stilleri
│   ├── fonts/                     # Yerel WOFF2 fontlar (Inter & JetBrains Mono)
│   ├── js/                        # İstemci tarafı 3D Boğaziçi motoru & telemetri HUD
│   │   ├── app.js                 # Arayüz denetleyicisi & GitHub depo alımı
│   │   ├── bosphorus-scene.js     # Three.js 3D İstanbul Metropolü & Nakkaştepe
│   │   ├── samples.js             # Önceden yapılandırılmış kıyaslama modelleri
│   │   ├── traffic-hud.js         # Gerçek zamanlı telemetri HUD
│   │   └── traffic-particles.js   # Boğaziçi parçacık trafiği fiziği
│   ├── vendor/three/              # Yerel Three.js r128 & OrbitControls (çevrimdışı)
│   ├── 404.html                   # GitHub Pages SPA yönlendirme yedeği
│   └── index.html                 # WebGL uygulama giriş noktası
├── src/
│   ├── agent/                     # AKOM Yerel Çoklu Ajan Yöneticisi
│   │   ├── agent-dispatcher.js    # Görev dağıtımı & durum yaşam döngüsü
│   │   ├── diff-engine.js         # Birleşik git diff sentezleyici & hunk oluşturucu
│   │   ├── memory-graph.js        # Deterministik Fruchterman-Reingold fiziği
│   │   ├── model-catalog.js       # Giriş temizlemeli model sağlayıcı kataloğu
│   │   ├── swarm-coordinator.js   # Dosya sistemi posta kutusu protokolü & listeler
│   │   ├── swarm-messaging.js     # Mesaj yönlendirme, sekme sınırı & JSON onarımı
│   │   └── swarm-reflex.js        # Kalp atışı döngüsü & refleks yöneticileri
│   └── core/                      # Statik Analiz & Telemetri İlkelleri
│       ├── ast-parser.js          # AST ayrıştırıcı, karmaşıklık sezgisi & bölge eşleyici
│       ├── history-store.js       # Yalnızca eklenebilir mimari sapma defteri (.zenith/)
│       ├── http-middleware.js     # CSRF güvenlik duvarı, CORS & yük sınırı nöbetçisi
│       ├── report-generator.js    # Otomatik PR markdown & JSON rapor oluşturucu
│       ├── tarjan-scc.js          # Yığın tabanlı Tarjan SCC döngü dedektörü (O(V+E))
│       └── traffic-engine.js      # Çizge eşleşmesi & ölü kod tespiti
├── test/                          # Node.js yerel test paketi (48/48 geçti)
├── CHANGELOG.md                   # Sürümleme & değişiklik geçmişi
├── CONTRIBUTING.md                # Geliştirme ilkeleri & katkı protokolü
├── LICENSE                        # MIT Açık Kaynak Lisansı
├── package.json                   # Sıfır çalışma zamanı bağımlılıklı paket manifestosu
├── README.md                      # İngilizce dokümantasyon
├── README.tr.md                   # Türkçe dokümantasyon
└── tsconfig.json                  # Tip kontrolü tanımları & şema doğrulamaları
```

---

## 🔒 Güvenlik & Gizlilik

- **Yerel Çalışma**: Kod analizi, çizge hesaplamaları ve telemetri metrikleri kesinlikle yerel bellekte kalır. Makineden dışarıya kaynak kod sızmaz.
- **Sıfır CDN Çalışması**: Yerel Three.js r128 modülleri ve yerel WOFF2 fontları (`Inter`, `JetBrains Mono`) içerir. Tam hava boşluklu ortamlarda sorunsuz çalışır.
- **Localhost CSRF Güvenlik Duvarı**: Durum değiştiren HTTP uç noktalarını doğrulanmış yerel kaynaklarla (`127.0.0.1`, `[::1]`) sınırlar ve siteler arası istekleri (`Sec-Fetch-Site: cross-site`) reddeder.
- **Dizin Aşımı & Yük Sınırları**: POSIX ve Windows ortamlarında katı yol kapsama kontrolleri uygular ve 2 MiB gövde yük tavanı uygular.
- **ReDoS Önleme**: Sınırlandırılmış düzenli ifadeler ve giriş doğrulaması, AST ayrıştırması sırasında geri izleme (backtracking) kilitlenmelerini önler.
- **En Az Ayrıcalıklı İş Akışları**: GitHub Actions iş akışları minimum yetki kapsamıyla (`contents: read`, `pages: write`) çalışır.

---

## 📄 Lisans & Telif Hakkı

**MIT Lisansı** altında dağıtılmaktadır. Ayrıntılar için [LICENSE](LICENSE) dosyasına bakın.

- **Yazar**: [Çağrı Giray KEŞAN](https://github.com/Cagrik34) (`cagrigiraykesan@gmail.com`)
- **Telif Hakkı**: © 2026 Çağrı Giray Keşan. Tüm Hakları Saklıdır.
