/**
 * ZenithIstanbul - Curated Codebase Samples
 * Real-world architectures for instant 1-click inspection & visual demonstration.
 */

export const SAMPLE_REPOSITORIES = {
  'circular-jam-demo': {
    name: '🚨 18:00 Boğaziçi Köprü Kilidi (Circular Jam Demo)',
    description: 'Boğaz Köprüsünü kilitleyen gerçekçi 3 yönlü döngüsel bağımlılık demosu: Auth, Session ve User modülleri birbirini çağırıyor!',
    modules: [
      {
        id: 'src/ui/AuthModal.tsx',
        name: 'AuthModal.tsx',
        path: 'src/ui/AuthModal.tsx',
        loc: 280,
        sloc: 240,
        complexity: 18,
        imports: ['src/services/sessionManager.ts', 'src/components/Button.tsx'],
        exports: ['AuthModal'],
        district: { side: 'europe', district: 'Beşiktaş', color: '#00f0ff' },
        isCore: false,
        healthScore: 85
      },
      {
        id: 'src/components/Button.tsx',
        name: 'Button.tsx',
        path: 'src/components/Button.tsx',
        loc: 85,
        sloc: 70,
        complexity: 5,
        imports: [],
        exports: ['Button', 'ButtonProps'],
        district: { side: 'europe', district: 'Beşiktaş', color: '#00f0ff' },
        isCore: false,
        healthScore: 98
      },
      {
        id: 'src/pages/Dashboard.tsx',
        name: 'Dashboard.tsx',
        path: 'src/pages/Dashboard.tsx',
        loc: 540,
        sloc: 480,
        complexity: 32,
        imports: ['src/ui/AuthModal.tsx', 'src/services/userService.ts'],
        exports: ['DashboardPage'],
        district: { side: 'europe', district: 'Levent', color: '#00a8ff' },
        isCore: false,
        healthScore: 75
      },
      {
        id: 'src/pages/AnalyticsView.tsx',
        name: 'AnalyticsView.tsx',
        path: 'src/pages/AnalyticsView.tsx',
        loc: 890,
        sloc: 760,
        complexity: 55,
        imports: ['src/services/userService.ts', 'src/services/dbConnection.ts'],
        exports: ['AnalyticsView'],
        district: { side: 'europe', district: 'Maslak', color: '#7000ff' },
        isCore: false,
        healthScore: 50
      },
      {
        id: 'src/services/sessionManager.ts',
        name: 'sessionManager.ts',
        path: 'src/services/sessionManager.ts',
        loc: 320,
        sloc: 290,
        complexity: 24,
        imports: ['src/services/userService.ts'], // KİLİT HALKASI 1
        exports: ['createSession', 'validateToken'],
        district: { side: 'asia', district: 'Üsküdar', color: '#ff5500' },
        isCore: false,
        healthScore: 80
      },
      {
        id: 'src/services/userService.ts',
        name: 'userService.ts',
        path: 'src/services/userService.ts',
        loc: 620,
        sloc: 540,
        complexity: 42,
        imports: ['src/ui/AuthModal.tsx', 'src/services/dbConnection.ts'], // KİLİT HALKASI 2: Backend frontend'i import ediyor!
        exports: ['getUserProfile', 'syncPermissions'],
        district: { side: 'asia', district: 'Kadıköy', color: '#ff007f' },
        isCore: false,
        healthScore: 60
      },
      {
        id: 'src/services/dbConnection.ts',
        name: 'dbConnection.ts',
        path: 'src/services/dbConnection.ts',
        loc: 180,
        sloc: 150,
        complexity: 12,
        imports: ['src/config/env.ts'],
        exports: ['dbPool', 'queryExecutor'],
        district: { side: 'asia', district: 'Ataşehir', color: '#ffaa00' },
        isCore: false,
        healthScore: 92
      },
      {
        id: 'src/config/env.ts',
        name: 'env.ts',
        path: 'src/config/env.ts',
        loc: 60,
        sloc: 45,
        complexity: 4,
        imports: [],
        exports: ['ENV', 'PORT'],
        district: { side: 'historic', district: 'Tarihi Yarımada', color: '#e5c07b' },
        isCore: true,
        healthScore: 100
      },
      {
        id: 'src/legacy/oldChartRenderer.js',
        name: 'oldChartRenderer.js',
        path: 'src/legacy/oldChartRenderer.js',
        loc: 410,
        sloc: 350,
        complexity: 28,
        imports: [],
        exports: ['renderOldCanvas'],
        district: { side: 'islands', district: 'Prens Adaları', color: '#64748b' },
        isCore: false,
        healthScore: 70
      }
    ]
  },

  'zenith-nexus': {
    name: '🌐 Zenith Nexus (Hybrid RAG Engine)',
    description: 'Çağrı Giray KEŞAN imzalı hibrit RAG, SQLite FTS5 token matcher ve telemetri motorunun mimari şehir haritası.',
    modules: [
      {
        id: 'src/ui/TelemetryDashboard.tsx',
        name: 'TelemetryDashboard.tsx',
        path: 'src/ui/TelemetryDashboard.tsx',
        loc: 380,
        sloc: 320,
        complexity: 22,
        imports: ['src/core/fts5Matcher.ts', 'src/ui/QueryInput.tsx'],
        exports: ['TelemetryDashboard'],
        district: { side: 'europe', district: 'Levent', color: '#00a8ff' },
        isCore: false,
        healthScore: 88
      },
      {
        id: 'src/ui/QueryInput.tsx',
        name: 'QueryInput.tsx',
        path: 'src/ui/QueryInput.tsx',
        loc: 160,
        sloc: 130,
        complexity: 14,
        imports: ['src/ui/Badge.tsx'],
        exports: ['QueryInput'],
        district: { side: 'europe', district: 'Beşiktaş', color: '#00f0ff' },
        isCore: false,
        healthScore: 95
      },
      {
        id: 'src/ui/Badge.tsx',
        name: 'Badge.tsx',
        path: 'src/ui/Badge.tsx',
        loc: 45,
        sloc: 35,
        complexity: 3,
        imports: [],
        exports: ['Badge'],
        district: { side: 'europe', district: 'Beşiktaş', color: '#00f0ff' },
        isCore: false,
        healthScore: 100
      },
      {
        id: 'src/core/fts5Matcher.ts',
        name: 'fts5Matcher.ts',
        path: 'src/core/fts5Matcher.ts',
        loc: 720,
        sloc: 610,
        complexity: 38,
        imports: ['src/db/sqliteStorage.ts', 'src/core/reciprocalRankFusion.ts'],
        exports: ['FTS5TokenMatcher', 'tokenizeQuery'],
        district: { side: 'asia', district: 'Kadıköy', color: '#ff007f' },
        isCore: false,
        healthScore: 78
      },
      {
        id: 'src/core/reciprocalRankFusion.ts',
        name: 'reciprocalRankFusion.ts',
        path: 'src/core/reciprocalRankFusion.ts',
        loc: 240,
        sloc: 210,
        complexity: 16,
        imports: [],
        exports: ['computeRRFScore'],
        district: { side: 'asia', district: 'Kadıköy', color: '#ff007f' },
        isCore: false,
        healthScore: 92
      },
      {
        id: 'src/db/sqliteStorage.ts',
        name: 'sqliteStorage.ts',
        path: 'src/db/sqliteStorage.ts',
        loc: 510,
        sloc: 440,
        complexity: 29,
        imports: ['src/config/nexusConfig.ts'],
        exports: ['initSQLite', 'executeFTSQuery'],
        district: { side: 'asia', district: 'Ataşehir', color: '#ffaa00' },
        isCore: false,
        healthScore: 84
      },
      {
        id: 'src/config/nexusConfig.ts',
        name: 'nexusConfig.ts',
        path: 'src/config/nexusConfig.ts',
        loc: 95,
        sloc: 80,
        complexity: 6,
        imports: [],
        exports: ['NEXUS_CONFIG'],
        district: { side: 'historic', district: 'Tarihi Yarımada', color: '#e5c07b' },
        isCore: true,
        healthScore: 98
      }
    ]
  },
  'vercel-ai-sdk': {
    name: '▲ Vercel AI SDK (App Router Core)',
    description: 'Vercel AI SDK Core mimarisi: Streaming UI, LLM provider routing, Tool calling ve AI telemetry grafı.',
    modules: [
      {
        id: 'packages/core/src/index.ts',
        name: 'index.ts',
        path: 'packages/core/src/index.ts',
        loc: 140,
        sloc: 110,
        complexity: 8,
        imports: ['packages/core/src/stream-text.ts', 'packages/core/src/generate-text.ts'],
        exports: ['streamText', 'generateText'],
        district: { side: 'europe', district: 'Maslak', color: '#00f0ff' },
        isCore: true,
        healthScore: 96
      },
      {
        id: 'packages/core/src/stream-text.ts',
        name: 'streamText.ts',
        path: 'packages/core/src/stream-text.ts',
        loc: 480,
        sloc: 410,
        complexity: 28,
        imports: ['packages/core/src/telemetry.ts', 'packages/provider/src/language-model.ts'],
        exports: ['streamText', 'StreamTextResult'],
        district: { side: 'europe', district: 'Maslak', color: '#00f0ff' },
        isCore: false,
        healthScore: 89
      },
      {
        id: 'packages/core/src/generate-text.ts',
        name: 'generateText.ts',
        path: 'packages/core/src/generate-text.ts',
        loc: 320,
        sloc: 270,
        complexity: 19,
        imports: ['packages/core/src/telemetry.ts', 'packages/provider/src/language-model.ts'],
        exports: ['generateText'],
        district: { side: 'europe', district: 'Maslak', color: '#00f0ff' },
        isCore: false,
        healthScore: 92
      },
      {
        id: 'packages/core/src/telemetry.ts',
        name: 'telemetry.ts',
        path: 'packages/core/src/telemetry.ts',
        loc: 210,
        sloc: 180,
        complexity: 12,
        imports: [],
        exports: ['recordSpan', 'assembleTrace'],
        district: { side: 'europe', district: 'Beşiktaş', color: '#00f0ff' },
        isCore: false,
        healthScore: 95
      },
      {
        id: 'packages/provider/src/language-model.ts',
        name: 'languageModel.ts',
        path: 'packages/provider/src/language-model.ts',
        loc: 390,
        sloc: 340,
        complexity: 24,
        imports: ['packages/provider/src/types.ts'],
        exports: ['LanguageModelV1', 'LanguageModelV1CallWarning'],
        district: { side: 'asia', district: 'Kadıköy', color: '#ff007f' },
        isCore: false,
        healthScore: 91
      },
      {
        id: 'packages/provider/src/types.ts',
        name: 'types.ts',
        path: 'packages/provider/src/types.ts',
        loc: 180,
        sloc: 160,
        complexity: 7,
        imports: [],
        exports: ['ModelMessage', 'ToolDefinition'],
        district: { side: 'historic', district: 'Tarihi Yarımada', color: '#e5c07b' },
        isCore: true,
        healthScore: 98
      }
    ]
  }
};