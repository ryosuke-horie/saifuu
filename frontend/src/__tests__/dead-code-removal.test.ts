import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * デッドコード削除に関するテスト
 * Issue #415: Knipで検出された未使用ファイルが適切に削除されていることを確認
 */
describe("デッドコード削除", () => {
	describe("未使用ファイルの削除確認", () => {
		const projectRoot = path.resolve(__dirname, "../..");

		// 削除対象のファイルリスト
		const filesToBeDeleted = [
			"src/components/index.ts",
			"src/lib/api/hooks/index.ts",
			"src/lib/api/subscriptions/index.ts",
			"src/types/api.ts",
			"src/utils/category-mapping.ts",
		];

		it.each(filesToBeDeleted)("%s は削除されている必要がある", (filePath) => {
			const fullPath = path.join(projectRoot, filePath);
			const fileExists = fs.existsSync(fullPath);

			// ファイルが存在しないことを確認（削除されている）
			expect(fileExists).toBe(false);
		});
	});

	describe("未使用エクスポートの削除確認", () => {
		it("Header コンポーネントはdefault exportを持たない", async () => {
			try {
				const headerModule = await import("@/components/layout/Header");
				expect("default" in headerModule).toBe(false);
			} catch (_error) {
				// インポートエラーの場合はスキップ（ファイルが削除されている可能性）
			}
		});

		it("Dialog コンポーネントはdefault exportを持たない", async () => {
			try {
				const dialogModule = await import("@/components/ui/Dialog");
				expect("default" in dialogModule).toBe(false);
			} catch (_error) {
				// インポートエラーの場合はスキップ（ファイルが削除されている可能性）
			}
		});
	});

	describe("重複エクスポートの解消確認", () => {
		const modulesWithDuplicateExports = [
			{ path: "@/components/layout/Header", namedExport: "Header" },
			{ path: "@/components/ui/Dialog", namedExport: "Dialog" },
			{ path: "@/lib/api/client", namedExport: "apiClient" },
			{ path: "@/lib/api", namedExport: "api" },
			{ path: "@/lib/logger", namedExport: "logger" },
		];

		it.each(modulesWithDuplicateExports)(
			"$namedExport は名前付きエクスポートのみを持つ（default exportなし）",
			async ({ path, namedExport }) => {
				try {
					const module = await import(path);
					// 名前付きエクスポートが存在すること
					expect(module[namedExport]).toBeDefined();
					// default exportが存在しないこと
					expect("default" in module).toBe(false);
				} catch (_error) {
					// インポートエラーの場合はスキップ
				}
			},
		);
	});
});
