import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

/**
 * テストヘルパーファイルがテスト対象から除外されていることを確認
 *
 * fixtures.tsなどのテストヘルパーファイルは、テストデータを提供するためのファイルであり、
 * それ自体がテストファイルではないため、テスト実行対象およびカバレッジ計測対象から
 * 除外する必要がある。
 */
describe('テストヘルパーファイルの除外設定', () => {
	let configContent: string
	const configPath = join(process.cwd(), 'vitest.config.ts')
	const helperPattern = '**/__tests__/helpers/**'

	beforeAll(() => {
		// 設定ファイルを一度だけ読み込む
		configContent = readFileSync(configPath, 'utf-8')
	})

	it('テスト実行の除外設定にヘルパーディレクトリが含まれているべき', () => {
		// excludeセクションを探す（testオブジェクトの直下）
		const excludeMatch = configContent.match(/exclude:\s*\[([^\]]+)\]/s)

		expect(excludeMatch).not.toBeNull()
		expect(excludeMatch![1]).toContain(helperPattern)
	})

	it('カバレッジ計測の除外設定にヘルパーディレクトリが含まれているべき', () => {
		// coverage.excludeセクションを探す
		const coverageExcludeMatch = configContent.match(/coverage:\s*{[^}]*exclude:\s*\[([^\]]+)\]/s)

		expect(coverageExcludeMatch).not.toBeNull()
		expect(coverageExcludeMatch![1]).toContain(helperPattern)
	})
})
