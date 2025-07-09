/**
 * Request ID 生成ユーティリティのテスト
 *
 * TDD Red Phase: テストを先に作成
 *
 * テスト対象:
 * - UUID v4 形式の生成
 * - crypto.randomUUID が利用可能な場合の使用
 * - フォールバック実装の動作
 * - 生成されるIDの一意性
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateRequestId } from "../request-id";

describe("generateRequestId", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	describe("UUID v4 形式", () => {
		it("36文字のUUID v4形式の文字列を生成する", () => {
			const requestId = generateRequestId();

			expect(requestId).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
			);
			expect(requestId).toHaveLength(36);
		});

		it("バージョン4のUUIDであることを確認", () => {
			const requestId = generateRequestId();

			// UUID v4 の場合、14番目の文字は '4' である必要がある
			expect(requestId.charAt(14)).toBe("4");
		});

		it("バリアント2のUUIDであることを確認", () => {
			const requestId = generateRequestId();

			// UUID v4 の場合、19番目の文字は '8', '9', 'a', 'b' のいずれかである必要がある
			expect(["8", "9", "a", "b"]).toContain(requestId.charAt(19));
		});
	});

	describe("crypto.randomUUID が利用可能な場合", () => {
		it("crypto.randomUUID を使用する", () => {
			const mockRandomUUID = vi.fn().mockReturnValue("test-uuid-from-crypto");
			vi.stubGlobal("crypto", { randomUUID: mockRandomUUID });

			const requestId = generateRequestId();

			expect(mockRandomUUID).toHaveBeenCalledTimes(1);
			expect(requestId).toBe("test-uuid-from-crypto");
		});
	});

	describe("crypto.randomUUID が利用できない場合", () => {
		it("フォールバック実装を使用する", () => {
			vi.stubGlobal("crypto", undefined);

			const requestId = generateRequestId();

			expect(requestId).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
			);
		});

		it("crypto が存在するが randomUUID がない場合もフォールバック実装を使用", () => {
			vi.stubGlobal("crypto", {});

			const requestId = generateRequestId();

			expect(requestId).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
			);
		});
	});

	describe("一意性", () => {
		it("連続して生成されるIDは異なる", () => {
			const id1 = generateRequestId();
			const id2 = generateRequestId();
			const id3 = generateRequestId();

			expect(id1).not.toBe(id2);
			expect(id2).not.toBe(id3);
			expect(id1).not.toBe(id3);
		});

		it("大量生成しても一意性が保たれる", () => {
			const ids = new Set<string>();
			const count = 100;

			for (let i = 0; i < count; i++) {
				ids.add(generateRequestId());
			}

			expect(ids.size).toBe(count);
		});
	});

	describe("エッジケース", () => {
		it("Math.random が 0 を返す場合でも正常に動作する", () => {
			vi.stubGlobal("crypto", undefined);
			vi.spyOn(Math, "random").mockReturnValue(0);

			const requestId = generateRequestId();

			expect(requestId).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
			);
		});

		it("Math.random が最大値に近い値を返す場合でも正常に動作する", () => {
			vi.stubGlobal("crypto", undefined);
			vi.spyOn(Math, "random").mockReturnValue(0.999999999);

			const requestId = generateRequestId();

			expect(requestId).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
			);
		});
	});

	describe("型安全性", () => {
		it("常に string 型を返す", () => {
			const requestId = generateRequestId();

			expect(typeof requestId).toBe("string");
		});

		it("空文字列を返さない", () => {
			const requestId = generateRequestId();

			expect(requestId).not.toBe("");
			expect(requestId.length).toBeGreaterThan(0);
		});
	});
});
