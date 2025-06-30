/**
 * テストグループ化とバッチ実行の最適化
 * データベース操作を最小限に抑え、CI実行時間を短縮する
 */

/**
 * テストの実行優先度とグループ分け
 */
export const TEST_GROUPS = {
	// 最優先：データベースに依存しない基本テスト
	INFRASTRUCTURE: ['src/__tests__/vitest-infrastructure.test.ts', 'src/__tests__/utils.test.ts'],

	// 高優先度：軽量な統合テスト
	BASIC_INTEGRATION: ['src/__tests__/basic-integration.test.ts', 'src/__tests__/health.test.ts'],

	// 中優先度：データベース統合テスト
	DATABASE_INTEGRATION: ['src/__tests__/database-integration.test.ts'],

	// 低優先度：重いAPI機能テスト
	API_FEATURES: ['src/__tests__/categories.test.ts', 'src/__tests__/workers-runtime.test.ts'],
} as const

/**
 * テスト実行戦略の設定
 */
export const TEST_EXECUTION_CONFIG = {
	// 基本設定
	TIMEOUT: {
		INFRASTRUCTURE: 5000, // 5秒：軽量テスト
		INTEGRATION: 10000, // 10秒：統合テスト
		DATABASE: 15000, // 15秒：データベーステスト
		API: 20000, // 20秒：API機能テスト
	},

	// 並列実行設定
	CONCURRENT: {
		INFRASTRUCTURE: true, // インフラテストは並列実行可能
		INTEGRATION: false, // 統合テストは逐次実行
		DATABASE: false, // データベーステストは逐次実行
		API: false, // APIテストは逐次実行（DBリソース競合回避）
	},

	// リトライ設定
	RETRY: {
		INFRASTRUCTURE: 0, // インフラテストはリトライしない
		INTEGRATION: 1, // 統合テストは1回リトライ
		DATABASE: 2, // データベーステストは2回リトライ
		API: 1, // APIテストは1回リトライ
	},
} as const

/**
 * テスト実行順序の最適化
 * 失敗の可能性が低いテストから実行し、早期にフィードバックを得る
 */
export const OPTIMAL_TEST_ORDER = [
	...TEST_GROUPS.INFRASTRUCTURE,
	...TEST_GROUPS.BASIC_INTEGRATION,
	...TEST_GROUPS.DATABASE_INTEGRATION,
	...TEST_GROUPS.API_FEATURES,
] as const

/**
 * CI環境でのテスト実行設定
 */
export const CI_OPTIMIZATION = {
	// 最小限のテストセット（CI高速化用）
	MINIMAL_TESTS: [...TEST_GROUPS.INFRASTRUCTURE, ...TEST_GROUPS.BASIC_INTEGRATION],

	// 完全なテストセット（PR前の品質確認用）
	FULL_TESTS: OPTIMAL_TEST_ORDER,

	// パフォーマンス制限
	MAX_CONCURRENT_TESTS: 2, // 同時実行テスト数の制限
	MEMORY_LIMIT_MB: 512, // メモリ使用量制限
	EXECUTION_TIME_LIMIT_SEC: 300, // 実行時間制限（5分）
} as const

/**
 * テストパフォーマンス監視用のメタデータ
 */
export interface TestPerformanceMetrics {
	groupName: string
	testFiles: readonly string[]
	startTime: number
	endTime?: number
	duration?: number
	success: boolean
	failureCount: number
	passCount: number
	errors?: string[]
}

/**
 * テストグループごとの実行メトリクス収集
 */
export class TestPerformanceCollector {
	private metrics: TestPerformanceMetrics[] = []

	startGroup(groupName: string, testFiles: readonly string[]): TestPerformanceMetrics {
		const metric: TestPerformanceMetrics = {
			groupName,
			testFiles,
			startTime: performance.now(),
			success: false,
			failureCount: 0,
			passCount: 0,
		}
		this.metrics.push(metric)
		return metric
	}

	endGroup(
		metric: TestPerformanceMetrics,
		success: boolean,
		passCount: number,
		failureCount: number,
		errors?: string[]
	): void {
		metric.endTime = performance.now()
		metric.duration = metric.endTime - metric.startTime
		metric.success = success
		metric.passCount = passCount
		metric.failureCount = failureCount
		metric.errors = errors
	}

	getMetrics(): readonly TestPerformanceMetrics[] {
		return [...this.metrics]
	}

	getTotalDuration(): number {
		return this.metrics.reduce((total, metric) => total + (metric.duration || 0), 0)
	}

	getSuccessRate(): number {
		if (this.metrics.length === 0) return 0
		const successCount = this.metrics.filter((m) => m.success).length
		return (successCount / this.metrics.length) * 100
	}

	generateReport(): string {
		const totalDuration = this.getTotalDuration()
		const successRate = this.getSuccessRate()

		let report = '\n📊 Test Performance Report\n'
		report += '════════════════════════════\n'
		report += `Total Duration: ${(totalDuration / 1000).toFixed(2)}s\n`
		report += `Success Rate: ${successRate.toFixed(1)}%\n`
		report += `Groups Executed: ${this.metrics.length}\n\n`

		for (const metric of this.metrics) {
			const status = metric.success ? '✅' : '❌'
			const duration = metric.duration ? `${(metric.duration / 1000).toFixed(2)}s` : 'N/A'

			report += `${status} ${metric.groupName}: ${duration}\n`
			report += `   Pass: ${metric.passCount}, Fail: ${metric.failureCount}\n`

			if (metric.errors && metric.errors.length > 0) {
				report += `   Errors: ${metric.errors.slice(0, 2).join(', ')}\n`
			}
			report += '\n'
		}

		return report
	}
}

/**
 * 最適化されたテスト実行ユーティリティ
 */
export class OptimizedTestRunner {
	private collector = new TestPerformanceCollector()

	/**
	 * テストグループを順次実行
	 */
	async runTestGroups(groups: Record<string, readonly string[]>): Promise<boolean> {
		let allSuccess = true

		for (const [groupName, testFiles] of Object.entries(groups)) {
			const metric = this.collector.startGroup(groupName, testFiles)

			try {
				console.log(`🚀 Starting test group: ${groupName}`)

				// TODO: ここで実際のテスト実行ロジックを実装
				// 現在はモックとして成功を返す
				const success = true
				const passCount = testFiles.length
				const failureCount = 0

				this.collector.endGroup(metric, success, passCount, failureCount)

				if (!success) {
					allSuccess = false
				}

				console.log(`✅ Completed test group: ${groupName}`)
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error)
				this.collector.endGroup(metric, false, 0, testFiles.length, [errorMessage])
				allSuccess = false
				console.error(`❌ Failed test group: ${groupName}`, error)
			}
		}

		// 実行結果のレポート生成
		console.log(this.collector.generateReport())

		return allSuccess
	}

	getPerformanceMetrics(): readonly TestPerformanceMetrics[] {
		return this.collector.getMetrics()
	}
}
