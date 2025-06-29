import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config'

export default defineWorkersConfig({
  test: {
    // Cloudflare Workers専用の設定
    pool: '@cloudflare/vitest-pool-workers',
    poolOptions: {
      workers: {
        // wrangler.joncからの設定を読み込む
        wrangler: {
          configPath: './wrangler.jsonc'
        },
        // 分離されたテスト環境でのテスト実行
        isolatedStorage: true,
        // 各テストファイルごとに独立した実行コンテキスト
        singleWorker: true
      }
    },
    // テストファイルのパターン設定
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'drizzle/**'
    ],
    // TypeScript設定
    globals: false,
    environment: 'node',
    // 型チェック有効化
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json'
    },
    // テストタイムアウト設定（Cloudflare Workers環境に最適化）
    testTimeout: 10000,
    hookTimeout: 10000
  },
  // TypeScript解決設定
  resolve: {
    alias: {
      '~': './src'
    }
  },
  // Cloudflare Workers環境でのビルド設定
  define: {
    'process.env.NODE_ENV': '"test"'
  },
  // 環境変数設定
  envPrefix: 'TEST_',
  esbuild: {
    target: 'esnext',
    format: 'esm',
    platform: 'neutral'
  }
})