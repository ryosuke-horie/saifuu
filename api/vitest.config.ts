import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config'

export default defineWorkersConfig({
	test: {
		// Cloudflare Workers専用の設定
		pool: '@cloudflare/vitest-pool-workers',
		poolOptions: {
			workers: {
				// wrangler.jsonc設定の読み込み
				wrangler: {
					configPath: './wrangler.jsonc',
					// テスト環境での設定（本番環境と分離）
					environment: undefined,
				},
				// Miniflareの最適化設定
				miniflare: {
					// D1データベースの分離ストレージ設定
					d1Persist: false, // テスト環境ではメモリ内DB使用
					// デバッグログ無効化（パフォーマンス向上）
					verbose: false,
					// テスト用のライブリロード無効化
					liveReload: false,
					// キャッシュ無効化（テスト環境の一貫性確保）
					cache: false,
					// 各テスト実行時にクリーンな環境を保証
					cacheWarnUsage: false,
				},
				// 分離されたテスト環境での実行（重要：各テストが独立したD1インスタンスを取得）
				isolatedStorage: true,
				// シングルワーカーモード（テスト間の干渉を防止）
				singleWorker: true,
			},
		},
		// 依存関係の最適化設定（D1関連の依存関係解決を改善）
		deps: {
			optimizer: {
				ssr: {
					enabled: true,
					// D1とDrizzle関連のパッケージを事前バンドル化
					// 実際にインストールされているパッケージのみを含める
					include: ['drizzle-orm'],
				},
			},
		},
		// テストファイルのパターン設定
		include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
		exclude: ['node_modules/**', 'dist/**', 'drizzle/**'],
		// グローバル変数の無効化（Cloudflare Workers環境との一貫性）
		globals: false,
		environment: 'node',
		// 型チェック設定（D1とDrizzleの型安全性確保）
		typecheck: {
			enabled: false, // 型チェックを無効化してテスト実行を優先
			tsconfig: './tsconfig.json',
		},
		// テストタイムアウト設定（データベース操作を考慮して延長）
		testTimeout: 15000, // D1操作のタイムアウトを15秒に延長
		hookTimeout: 15000, // setupフックのタイムアウトも延長
		// テスト並列実行設定（D1の安定性確保）
		fileParallelism: true, // ファイル単位での並列実行を有効化
		maxConcurrency: 5, // 同時実行テスト数を制限（D1への負荷軽減）
		// テスト失敗時の詳細出力
		reporters: ['verbose'],
	},
	// TypeScript解決設定
	resolve: {
		alias: {
			'~': './src',
		},
	},
	// ビルド設定の最適化
	define: {
		'process.env.NODE_ENV': '"test"',
		// D1テスト環境の識別
		'process.env.CF_PAGES': 'undefined',
		'process.env.CF_PAGES_BRANCH': 'undefined',
	},
	// 環境変数設定
	envPrefix: ['TEST_', 'VITE_', 'CF_'],
	// ESBuild設定の最適化
	esbuild: {
		target: 'esnext',
		format: 'esm' as const,
		platform: 'neutral',
		// D1関連のコード最適化
		keepNames: true, // 関数名を保持（デバッグに有用）
		sourcemap: true, // ソースマップを生成（デバッグ支援）
	},
})
