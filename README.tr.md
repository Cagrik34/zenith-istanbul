# Zenith Istanbul

> **Sıfır bulut bağımlılığıyla %100 istemci tarafında çalışan yüksek performanslı 3D kod tabanı topolojisi metropolü, Tarjan SCC döngü dedektörü ve otonom ajan orkestrasyon kokpiti.**

[![CI Gatekeeper](https://img.shields.io/github/actions/workflow/status/Cagrik34/zenith-istanbul/zenith-gatekeeper.yml?branch=main&style=flat-square&label=CI%20Gatekeeper)](https://github.com/Cagrik34/zenith-istanbul/actions)
[![Deploy Showcase](https://img.shields.io/github/actions/workflow/status/Cagrik34/zenith-istanbul/deploy-pages.yml?branch=main&style=flat-square&label=GitHub%20Pages)](https://cagrik34.github.io/zenith-istanbul/)
[![Canlı Kokpit](https://img.shields.io/badge/Canl%C4%B1%20Vitrin-GitHub%20Pages-00f0ff.svg?style=flat-square)](https://cagrik34.github.io/zenith-istanbul/)
[![Lisans: MIT](https://img.shields.io/badge/Lisans-MIT-blue.svg?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg?style=flat-square)](https://nodejs.org)
[![Sıfır CDN](https://img.shields.io/badge/Hava%20Bo%C5%9Flu%C4%9Fu-%25100%20%C3%87evrimd%C4%B1%C5%9F%C4%B1-orange.svg?style=flat-square)](public/)

[Canlı Vitrin](https://cagrik34.github.io/zenith-istanbul/) • [Mimari](#mimari--veri-akışı) • [Motor Kıyaslamaları](#-motor-kıyaslamaları--doğrulama) • [Temel Yetenekler](#-temel-yetenekler--alt-sistemler) • [Başlarken](#-başlarken) • [English Documentation](README.md)

---

## Yönetici Özeti (Executive Overview)

**Zenith Istanbul**, karmaşık mikroservisleri, full-stack monorepolarını ve dağıtık kod tabanlarını yöneten yazılım mühendisleri, sistem mimarları ve SRE ekipleri için tasarlanmış açık kaynaklı, yüksek performanslı bir 3D yazılım mimarisi görselleştirme stüdyosu, çizge topolojisi motoru ve otomatik CI kapı denetçisidir (gatekeeper).

Katı bir **Sıfır Bulut İstemci Bellek Mimarisi (Zero-Cloud Client-Side Memory Architecture)** altında çalışır; harici sunuculara tek bir satır özel kod, dosya jetonu veya telemetri metriği iletilmez. Soyut Sözdizimi Ağacı (AST) modül ayrıştırması, Tarjan Kuvvetli Bağlantılı Bileşenler (SCC) döngüsel bağımlılık çözümü, MITRE CWE güvenlik sınırı analizi, deterministik Fruchterman–Reingold kuvvet yönelimli fizik yerleşimi ve 60 FPS WebGL çizimi tamamen yerel tarayıcı belleğinde yürütülür.

Zenith Istanbul, kod bağımlılıklarını prosedürel olarak **İstanbul Boğazı Metropolü**'nün otantik bir jeouzamsal dijital ikizine yansıtır:
- **Avrupa Yakası**: Galata, Beşiktaş ve Levent/Maslak hattında konuşlanan istemci arayüz bileşenleri, React/Vue ön yüzleri ve görselleştirme katmanları.
- **Tarihi Yarımada**: Sultanahmet ve Eminönü'nde temellenen derleyiciler, AST ayrıştırıcılar, Tarjan çizge çözücüler ve çekirdek giriş noktaları.
- **Anadolu Yakası**: Üsküdar, Kadıköy ve Ataşehir İstanbul Finans Merkezi (İFM) genelinde dağıtılan yüksek verimli veri tabanları, önbellek katmanları, model kayıtları ve otonom ajan sürüleri.
- **İstanbul Boğazı & Kız Kulesi**: Merkezi HTTP güvenlik ara yazılımları, CSRF güvenlik duvarları ve API ağ geçitleri.
- **Asma Köprüler**: Bağlantı yoğunluğunu gerçek zamanlı parçacık trafiğiyle gösteren sınırlar arası API giriş rotaları.
- **Nakkaştepe Millet Bahçesi**: Otantik botanik topoğrafyası, *"Uçan Yol"* konsol seyir balkonu ve mimari berraklığı koruyan çakışmasız park alanı.

---

## ⚡ Motor Kıyaslamaları & Doğrulama

Tüm hesaplama modülleri, bellek sınırları ve iş parçacığı hatları otomatik birim, entegrasyon ve CI denetim testleriyle (48/48 geçti) doğrulanmıştır:

| Alt Sistem / Modül | Algoritma & Metodoloji | Doğrulama Durumu | Yürütme Gecikmesi / Metrik |
|---|---|:---:|:---:|
| **AST Statik Analiz Motoru** | Tahribatsız Regex & Modül İçe Aktarım Sözcük Ayrıştırıcısı | **%100 GEÇTİ** | `< 1.2ms` (modül başına) |
| **Tarjan SCC Döngü Dedektörü** | Yığın Tabanlı İteratif DFS Kuvvetli Bağlantılı Bileşenler ($O(V+E)$) | **%100 GEÇTİ** | `< 0.25ms` (DAG Onaylandı) |
| **MITRE CWE Güvenlik Nöbetçisi** | İstemci/Sunucu Sınır Denetimi (CWE-668, CWE-200, CWE-798) | **%100 GEÇTİ** | `0 Sızıntı` / Tam Uyum |
| **3D Boğaziçi Metropol Motoru** | WebGL Three.js Donanım Tuvali & PBR Gölgelendiriciler | **%100 GEÇTİ** | `60 FPS` Sabit |
| **AKOM Otonom Sürü** | Dosya Sistemi Posta Kutusu Protokolü & Kalp Atışı Refleks Döngüsü | **%100 GEÇTİ** | Deterministik / `0 Yarış Koşulu` |
| **Etkileşimli Bellek Çizgesi** | Deterministik Fruchterman–Reingold Kuvvet Simülasyonu ($O(I \cdot (V^2+E))$) | **%100 GEÇTİ** | `< 5.5ms` yakınsama |
| **Ortak Konu Çıkarımı** | Bellek İçi Anlamsal Anahtar Kelime & N-Gram Sentezleyici | **%100 GEÇTİ** | `< 0.15ms` |
| **Yerel Telemetri Deposu** | Yalnızca Eklenebilir Mimari Sapma Defteri (`.zenith/`) | **%100 GEÇTİ** | `< 0.8ms` / anlık görüntü |
| **Headless CI Kapı Denetçisi** | POSIX Uyumlu CLI & Otomatik Port Çakışması Kaydırma | **%100 GEÇTİ** | Doğrulandı |
| **Sıfır Bulut Hava Boşluğu** | Yerel Öncelikli İzole Çevrimdışı Çalışma & Sıfır CDN | **%100 GEÇTİ** | `%100 Çevrimdışı Hazır` |

---

## 🏛️ Mimari & Veri Akışı

```mermaid
flowchart TD
    subgraph INGEST ["1. Statik Alma Katmanı"]
        A[Yerel Depo / Sürükle-Bırak / GitHub API] --> B[CodebaseParser - AST Statik Ayrıştırıcı]
    end

    subgraph ENGINE ["2. Çizge Teorisi & Güvenlik Çözücüler"]
        B --> C[Tarjan SCC Çözücü\nDöngü Tespiti O(V+E)]
        B --> D[Güvenlik Nöbetçisi\nMITRE CWE Sınır Denetimi]
        B --> E[Jeouzamsal Bölge Eşleyici\nAvrupa / Asya / Boğaz]
        C --> F[Trafik Eşleşme Motoru\nTrafik Endeksi Yoğunluk Sezgisi]
    end

    subgraph PRESENTATION ["3. Uzamsal & Telemetri Sunumu"]
        E --> G[Three.js 3D Metropol\nPBR Cam Gökdelenler & Nakkaştepe]
        F --> H[Parçacık Giriş Fiziği\nBoğaziçi Asma Köprüsü]
        C --> I[DiffEngine Sözleşme Sentezleyici\nStandart Birleşik Git Diff]
        D --> J[Telemetri HUD & Güvenlik Çekmecesi\nGerçek Zamanlı Trend Çizgileri]
    end

    subgraph CI ["4. Headless Kapı Denetçisi & Sürüler"]
        F --> K[CLI Headless Gatekeeper\n--fail-on-cycle --fail-on-leak]
        K --> L[Otomatik PR Markdown Yorumu\nGitHub Step Summary]
        K --> M[AKOM Çoklu Ajan Sürüsü\nBaşkomutan & Mühendis Refleksleri]
    end
```

### Jeouzamsal Sektör Eşleme Spesifikasyonu

Zenith Istanbul, yazılım mimarisini şehir topoğrafyasına sezgisel biçimde haritalandırır:

| Uzamsal Varlık | Mimari Katman | Açıklama |
|---|---|---|
| **Avrupa Yakası** | Ön Yüz & Arayüz Sistemleri | Galata, Beşiktaş ve Levent/Maslak hattında yer alan istemci modülleri, React/Vue bileşenleri, DOM kancaları. |
| **Tarihi Yarımada** | Temel Çizge Çekirdeği | Sultanahmet ve Eminönü'nde konumlanan AST ayrıştırıcılar, Tarjan SCC çözücüler, derleyiciler ve giriş noktaları. |
| **Anadolu Yakası** | Arka Yüz, Veri & Sürüler | Üsküdar, Kadıköy ve Ataşehir İFM'de konuşlanan veri tabanları, tarihçe defterleri, model katalogları ve otonom ajan sürüleri. |
| **Boğaz Hattı & Kız Kulesi** | HTTP Güvenlik & Ara Yazılım | Merkezi API ağ geçitleri, CSRF güvenlik duvarları, CORS denetçileri ve yük sınırı nöbetçileri. |
| **Asma Köprüler** | Sınırlar Arası API Girişi | İstemci bileşenleri ile sunucu kontrolcülerini Boğaz üzerinden bağlayan giriş hatları. |
| **Köprü Trafik Sıkışıklığı** | Döngüsel Eşleşme (Tarjan SCC) | Döngüsel bağımlılık kilitlerini görselleştiren yüksek görünürlüklü kırmızı parçacık yoğunluğu. |
| **Nakkaştepe Millet Bahçesi** | Botanik Park Alanı | Asya köprü ayağında *"Uçan Yol"* konsol seyir terası, biyolojik gölet ve çakışmasız park sınırları. |
| **PBR Gökdelenler** | Yazılım Modülleri | Yükseklik kod satırını (LOC), genişlik karmaşıklığı temsil eder; aydınlatılmış ofis ızgaraları aktif mantığı gösterir. |
| **Açık Deniz Adacıkları** | İzole Alt Çizgeler | Ağaç sallama (tree-shaking) veya refaktör gerektiren sıfır dereceli ölü kod modülleri. |

---

## 🚀 Temel Yetenekler & Alt Sistemler

### 1. 3D Boğaziçi Metropolü & Otantik Nakkaştepe
- **Fotogerçekçi Prosedürel Gölgelendirme**: Derin lacivert/siyan yansıma gradyanlı cam giydirme cepheler (curtain-wall), iç kısımda yansıyan sıcak ofis aydınlatma ızgaraları, dikey yapısal köşe pylonları, neon tel kafes hatları ve çatı penthouse taç haleleri.
- **Nakkaştepe Millet Bahçesi**: Boğaz Köprüsü'nün Anadolu ayağında 8.5 metre yükseltilmiş tepe topoğrafyası, boğaza doğru 24 metre uzanan ahşap konsol *"Uçan Yol"* seyir terası, biyolojik gölet, kemerli ahşap köprü, fıstık çamları ve erguvan ağaçları.
- **Uzamsal Çakışma Koruması**: `isInPark` sınır koruma motoru sayesinde park sınırları içerisine tek bir ambient bina dahi çakışmaz.

### 2. Tarjan SCC Döngü Tespiti & Sözleşme Çıkarımı
- Yığın tabanlı iteratif Tarjan algoritması sıfır harici npm bağımlılığıyla $O(V + E)$ sürede çalışır.
- Paket boyutunu şişiren ve bellek sızıntısına yol açan karmaşık döngüsel bağımlılık halkalarını (`A → B → C → A`) anında teşhis eder.
- Ayrıştırılmış TypeScript sözleşme arayüzlerini (`types/*.contract.ts`) otomatik olarak sentezleyerek standart Birleşik Git Diff çıktıları üretir.

$$\text{Trafik Endeksi} = \min\left(100, \text{round}\left(\frac{|\text{SCC Kenarları}| \times 3 + |\text{Sınır İthalatları}|}{|\text{Toplam Kenarlar}|} \times 100\right)\right)$$

### 3. İstemci Tarafı Güvenlik Nöbetçisi (MITRE CWE)
- **CWE-668 / CWE-1061**: İstemci paketlerine kazara dahil edilen arka yüz bağımlılıklarını (`fs`, `net`, `child_process`, ORM'ler) yakalar.
- **CWE-200 / CWE-798**: Kod içerisine gömülmüş sabit API anahtarlarını, özel anahtarları, AWS kimlik bilgilerini ve sızan `.env` değişkenlerini tespit eder.
- Otomatik onarım için 1-indeksli `dosya:satır:sütun` koordinatları sunar.

### 4. AKOM Otonom Çoklu Ajan SRE Sürüsü
- 5 uzman yerel otonom ajanı koordine eder:
  - 🛡️ **Başkomutan (agent.commander)**: Sistem gözetimi, olay triyajı ve görev dağıtımı.
  - 🌉 **Boğaz Köprüsü Mühendisi (agent.bridge_engineer)**: Tarjan döngü çözümü ve sözleşme çıkarımı.
  - 🔒 **Güvenlik Nöbetçisi (agent.security_sentinel)**: MITRE CWE denetimi ve sır maskeleme.
  - ⚡ **Kod İyileştirme Uzmanı (agent.refactorer)**: AST optimizasyonu ve karmaşıklık azaltımı.
  - 🧪 **Kalite Güvence Müfettişi (agent.qa_inspector)**: Doğrulama, test icrası ve CI sağlık kontrolleri.
- Güçlü JSON dize kurtarma (`repairLiteralLineBreaksInJsonStrings`), atomik dosya sistemi posta kutusu protokolü, yayın hedef filtreleme ve 5 kademeli kriptografik sır maskeleme sunar.

### 5. Etkileşimli Bellek & Bilgi Çizgesi
- Deterministik Fruchterman–Reingold yay-kuvveti yerleşim algoritması ($O(I \cdot (V^2 + E))$) kullanarak düğüm denge koordinatlarını hesaplar.
- Ajanların uzun vadeli bellek akışlarından ortak mimari kavramları kodları dışarı göndermeksizin yüzeye çıkarır.
- Tam spesifikasyon: [docs/MEMORY_GRAPH_SPEC.md](docs/MEMORY_GRAPH_SPEC.md).

### 6. Headless CI Kapı Denetçisi & Tek Dosya HTML Raporlama
- GitHub Actions iş akışlarında mimari kapıları doğrudan denetler:
  ```bash
  node bin/cli.js --ci --fail-on-cycle --fail-on-leak .
  ```
- Ağdan yalıtılmış ortamlar için bağımsız, tek dosya 3D HTML mimari raporları üretir:
  ```bash
  node bin/cli.js --export-html mimari-rapor.html .
  ```

---

## ⌨️ Klavye Kısayolları & Kontroller

| Kısayol | Eylem |
|---|---|
| **Sol Tık + Sürükle** | İstanbul Boğazı etrafında kamerayı döndür |
| **Sağ Tık + Sürükle** | Avrupa ve Asya yakaları arasında kamerayı kaydır (pan) |
| **Fare Tekerleği** | Akıcı Yakınlaşma / Uzaklaşma |
| **`1`** | Kamera Önayarı: **Avrupa Yakası** (Galata, Beşiktaş & Levent) |
| **`2`** | Kamera Önayarı: **Anadolu Yakası** (Üsküdar & Ataşehir İFM) |
| **`3`** | Kamera Önayarı: **Boğaziçi Köprüsü & Boğaz Genel Bakış** |
| **`4`** | Kamera Önayarı: **Nakkaştepe Millet Bahçesi Seyir Noktası** |
| **`Boşluk (Space)`** | Gece / Gündüz aydınlatmasını ve neon metropol ışıltısını aç/kapat |
| **`H`** | Mimari Telemetri HUD'ını ve Teşhis Çekmecesini aç/kapat |
| **`Esc`** | Seçili modülü sıfırla / açık çekmeceleri kapat |

---

## 🛠️ Başlarken

### Canlı Vitrin (Kurulum Gerektirmez)

Doğrudan tarayıcınızdan sıfır kurulumla erişin:  
👉 **[https://cagrik34.github.io/zenith-istanbul/](https://cagrik34.github.io/zenith-istanbul/)**

- **GitHub Depo Alma**: Herhangi bir genel depoyu (`kullanıcı/depo`, örn. `expressjs/express`) girerek topolojisini anında görselleştirin.
- **Hazır Senaryolar**: Önceden yapılandırılmış mimari modelleri (Döngüsel Kilit, Zenith Nexus, Vercel AI SDK) inceleyin.
- **Klasör Sürükle-Bırak**: Yerel proje klasörünüzü doğrudan WebGL penceresine bırakarak çevrimdışı analiz başlatın.

---

### Yerel Geliştirme

#### Ön Koşullar
- **Node.js**: `v18.0.0+` (`v20+` veya `v22+ LTS` önerilir)
- **npm**: `v9.0.0+`

```bash
# 1. Depoyu klonlayın
git clone https://github.com/Cagrik34/zenith-istanbul.git
cd zenith-istanbul

# 2. Yerel kod tabanında 3D görselleştiriciyi başlatın (harici npm install gerektirmez)
npm start

# 3. Tam otomatik test paketini & CI denetimini çalıştırın (48/48 test)
npm test

# 4. Yalnızca birim testleri çalıştırın
npm run test:unit

# 5. Yalnızca headless CI kapı denetimini çalıştırın
npm run test:gatekeeper
```

---

### CLI Arayüzü & Argümanlar

```bash
node bin/cli.js [seçenekler] [dizin]
```

| Seçenek | Bayrak | Açıklama |
|---|---|---|
| **Yardım Kılavuzu** | `-h, --help` | Kullanım kılavuzunu ve CLI bayraklarını gösterir. |
| **Sürüm** | `-v, --version` | Mevcut anlamsal sürüm numarasını yazdırır. |
| **Headless CI** | `-c, --ci` | WebGL başlatmadan statik analiz yapar ve telemetri raporu üretir. |
| **Döngüde Başarısız Ol** | `--fail-on-cycle` | Tarjan SCC döngüsel bağımlılığı bulunursa çıkış kodu 1 ile sonlanır. |
| **Sızıntıda Başarısız Ol** | `--fail-on-leak` | MITRE CWE güvenlik sızıntısı bulunursa çıkış kodu 1 ile sonlanır. |
| **JSON Çıktısı** | `--json` | Makine tarafından okunabilir JSON telemetri raporu çıktılar. |
| **HTML Dışa Aktar** | `--export-html <dosya>` | Bağımsız, tek dosya 3D HTML mimari raporu sentezler. |
| **Özel Port** | `--port <sayı>` | Yerel telemetri sunucusu için özel HTTP portu (varsayılan: `4173`). |

---

## 📂 Dizin Yapısı

```
zenith-istanbul/
├── .github/
│   └── workflows/
│       ├── deploy-pages.yml       # Otomatik GitHub Pages vitrin yayını
│       └── zenith-gatekeeper.yml  # Headless mimari & güvenlik CI denetimi
├── assets/
│   └── og-preview.jpg             # OpenGraph 3D metropol ön izlemesi
├── bin/
│   └── cli.js                     # Zenith Istanbul birleşik CLI, sunucu & CI denetçisi
├── docs/
│   ├── MEMORY_GRAPH_SPEC.md       # Kuvvet yönelimli bellek çizgesi spesifikasyonu
│   └── SWARM_ARCHITECTURE.md      # AKOM çoklu ajan sürü mimarisi
├── public/                        # Sıfır CDN çevrimdışı istemci varlıkları
│   ├── css/                       # Modüler tasarım belirteçleri, HUD ve yerleşim stilleri
│   ├── fonts/                     # Yerel WOFF2 fontlar (Inter & JetBrains Mono)
│   ├── js/                        # İstemci tarafı 3D Boğaziçi motoru & telemetri HUD
│   │   ├── app.js                 # Arayüz denetleyicisi & GitHub depo alımı
│   │   ├── bosphorus-scene.js     # Three.js 3D İstanbul Metropolü & Nakkaştepe
│   │   ├── samples.js             # Seçilmiş mimari kıyaslama modelleri
│   │   ├── traffic-hud.js         # Gerçek zamanlı telemetri HUD & glassmorphism
│   │   └── traffic-particles.js   # 60 FPS Boğaziçi trafik parçacık fiziği
│   ├── vendor/three/              # Yerel Three.js r128 & OrbitControls (%100 çevrimdışı)
│   ├── 404.html                   # GitHub Pages SPA yönlendirme yedeği
│   └── index.html                 # Üretim WebGL uygulama giriş noktası
├── src/
│   ├── agent/                     # AKOM Otonom Çoklu Ajan Sürüsü
│   │   ├── agent-dispatcher.js    # Görev yaşam döngüsü & olay triyaj dağıtımı
│   │   ├── diff-engine.js         # Birleşik git diff sentezleyici & hunk üreticisi
│   │   ├── memory-graph.js        # Deterministik Fruchterman-Reingold fiziği
│   │   ├── model-catalog.js       # Giriş temizlemeli dinamik sağlayıcı kataloğu
│   │   ├── swarm-coordinator.js   # Atomik dosya sistemi posta kutusu & ajan listeleri
│   │   ├── swarm-messaging.js     # Mesaj yönlendirme, sekme sınırı & JSON dize onarımı
│   │   └── swarm-reflex.js        # Otonom kalp atışı döngüsü & ajan refleksleri
│   └── core/                      # Statik Analiz & SRE Telemetri İlkelleri
│       ├── ast-parser.js          # AST ayrıştırıcı, karmaşıklık sezgisi & bölge eşleyici
│       ├── history-store.js       # Yalnızca eklenebilir mimari sapma defteri (.zenith/)
│       ├── http-middleware.js     # CSRF güvenlik duvarı, CORS & yük sınırı nöbetçisi
│       ├── report-generator.js    # Otomatik PR markdown & JSON rapor oluşturucu
│       ├── tarjan-scc.js          # Yığın tabanlı Tarjan SCC döngü dedektörü (O(V+E))
│       └── traffic-engine.js      # Çizge teorisi eşleşme & ölü kod çözücüsü
├── test/                          # Kapsamlı Node.js yerel test paketi (48/48 geçti)
├── CHANGELOG.md                   # Anlamsal sürümleme & değişiklik geçmişi
├── CONTRIBUTING.md                # Geliştirme ilkeleri & katkı protokolü
├── LICENSE                        # MIT Açık Kaynak Lisansı
├── package.json                   # Sıfır çalışma zamanı bağımlılıklı manifesto & betikler
├── README.md                      # Kapsamlı İngilizce mimari dokümantasyon
├── README.tr.md                   # Kapsamlı Türkçe mimari dokümantasyon
└── tsconfig.json                  # Tip kontrolü tanımları & şema doğrulamaları
```

---

## 🔒 Güvenlik & İstemci Tarafı Gizlilik

- **İstemci Tarafında Çalışma**: Tüm kaynak kod ayrıştırma, çizge hesaplamaları ve telemetri kesinlikle tarayıcı belleğinde kalır. Bilgisayarınızdan hariciye tek bir bayt veri sızmaz.
- **Sıfır CDN & Hava Boşluğu Uyumluluğu**: Yerel Three.js r128 modülleri ve yerel WOFF2 değişken fontları (`Inter`, `JetBrains Mono`) içerir. İnternet erişimi olmayan tam hava boşluklu (air-gapped) ortamlarda çalışabilir.
- **Katı CSRF & Localhost Güvenlik Duvarı**: Durum değiştiren HTTP uç noktalarını yalnızca doğrulanmış yerel ana bilgisayar kaynaklarıyla (`127.0.0.1`, `[::1]`) sınırlar ve siteler arası harici istekleri (`Sec-Fetch-Site: cross-site`) engeller.
- **Dizin Aşımı & DoS Koruması**: POSIX ve Windows sınır kontrolleri ile dizin kaçışlarına karşı sertleştirilmiştir; katı bir 2 MiB yük tavanı uygular.
- **ReDoS Koruması**: Sınırlandırılmış düzenli ifadeler ve filtrelenmiş AST sözcük çıkarımı, felaket boyutundaki geri izlemeleri (catastrophic backtracking) önler.
- **En Az Ayrıcalıklı CI/CD**: GitHub Actions iş akışları minimum yetki kapsamıyla (`contents: read`, `pages: write`) çalışır.

---

## 📄 Lisans & Telif Hakkı

**MIT Lisansı** altında dağıtılmaktadır. Ayrıntılar için [LICENSE](LICENSE) dosyasına bakın.

- **Yazar**: [Çağrı Giray KEŞAN](https://github.com/Cagrik34) (`cagrigiraykesan@gmail.com`)
- **Telif Hakkı**: © 2026 Çağrı Giray Keşan. Tüm Hakları Saklıdır.
