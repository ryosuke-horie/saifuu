/**
 * 型定義とバリデーションテスト（最適化版）
 *
 * 型システムと設定検証の基本動作を確認
 */

import { describe, expect, it } from "vitest";
import { getDefaultConfig, getLogLevelValue, shouldLog } from "../config";
import type {
	DeviceInfo,
	FrontendLogEntry,
	LogLevel,
	SessionInfo,
} from "../types";

describe("Logger Types and Validation", () => {
	describe("ログレベル", () => {
		it("有効なログレベルの優先順位", () => {
			expect(getLogLevelValue("debug")).toBe(0);
			expect(getLogLevelValue("info")).toBe(1);
			expect(getLogLevelValue("warn")).toBe(2);
			expect(getLogLevelValue("error")).toBe(3);
		});

		it("shouldLogが正しく判定する", () => {
			// debug設定では全て出力
			expect(shouldLog("debug", "debug")).toBe(true);
			expect(shouldLog("info", "debug")).toBe(true);
			expect(shouldLog("warn", "debug")).toBe(true);
			expect(shouldLog("error", "debug")).toBe(true);

			// info設定ではdebugはスキップ
			expect(shouldLog("debug", "info")).toBe(false);
			expect(shouldLog("info", "info")).toBe(true);
			expect(shouldLog("warn", "info")).toBe(true);
			expect(shouldLog("error", "info")).toBe(true);

			// error設定では他は全てスキップ
			expect(shouldLog("debug", "error")).toBe(false);
			expect(shouldLog("info", "error")).toBe(false);
			expect(shouldLog("warn", "error")).toBe(false);
			expect(shouldLog("error", "error")).toBe(true);
		});
	});

	describe("型構造の検証", () => {
		it("BrowserLoggerConfig型が必須フィールドを含む", () => {
			const config = getDefaultConfig("development");

			expect(config.level).toMatch(/^(debug|info|warn|error)$/);
			expect(config.bufferSize).toBeTypeOf("number");
			expect(config.bufferSize).toBeGreaterThan(0);
			expect(config.flushInterval).toBeTypeOf("number");
			expect(config.maxRetries).toBeTypeOf("number");
		});

		it("FrontendLogEntry型が適切な構造を持つ", () => {
			const entry: FrontendLogEntry = {
				timestamp: new Date().toISOString(),
				level: "info",
				message: "Test message",
				requestId: "req_123",
				sessionId: "session_456",
				environment: "development",
				service: "saifuu-frontend",
				version: "1.0.0",
				url: "http://localhost:3000",
				deviceInfo: {
					userAgent: "Mozilla/5.0",
					viewport: { width: 1920, height: 1080 },
					language: "ja",
					timezone: "Asia/Tokyo",
				},
				meta: { action: "click" },
			};

			expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
			expect(["debug", "info", "warn", "error"]).toContain(entry.level);
			expect(entry.message).toBeTypeOf("string");
			expect(entry.meta).toBeTypeOf("object");
		});

		it("SessionInfo型が適切な構造を持つ", () => {
			const session: SessionInfo = {
				id: "session_123",
				startTime: Date.now(),
				lastActivity: Date.now(),
				pageViews: 5,
				events: 10,
				errors: 0,
			};

			expect(session.id).toBeTypeOf("string");
			expect(session.startTime).toBeTypeOf("number");
			expect(session.lastActivity).toBeTypeOf("number");
			expect(session.pageViews).toBeTypeOf("number");
			expect(session.pageViews).toBeGreaterThanOrEqual(0);
			expect(session.errors).toBeGreaterThanOrEqual(0);
		});

		it("DeviceInfo型が適切な構造を持つ", () => {
			const device: DeviceInfo = {
				userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
				platform: "MacIntel",
				language: "ja",
				languages: ["ja", "en"],
				timezone: "Asia/Tokyo",
				viewport: {
					width: 1920,
					height: 900,
				},
				screen: {
					width: 1920,
					height: 1080,
				},
				pixelRatio: 2,
				touchSupport: false,
				cookieEnabled: true,
			};

			expect(device.userAgent).toBeTypeOf("string");
			expect(device.screen.width).toBeTypeOf("number");
			expect(device.screen.width).toBeGreaterThan(0);
			expect(device.pixelRatio).toBeGreaterThan(0);
		});
	});

	describe("型ガード（型安全性の確認）", () => {
		it("LogLevel型が限定された文字列リテラル", () => {
			const validLevels: LogLevel[] = ["debug", "info", "warn", "error"];

			validLevels.forEach((level) => {
				expect(["debug", "info", "warn", "error"]).toContain(level);
			});

			// TypeScriptの型チェックがこれらを防ぐ
			// const invalidLevel: LogLevel = "trace"; // コンパイルエラー
		});

		it("オプショナルフィールドの扱い", () => {
			const minimalEntry: Partial<FrontendLogEntry> = {
				timestamp: new Date().toISOString(),
				level: "info",
				message: "Minimal entry",
			};

			expect(minimalEntry.timestamp).toBeDefined();
			expect(minimalEntry.level).toBeDefined();
			expect(minimalEntry.message).toBeDefined();
			expect(minimalEntry.meta).toBeUndefined();
		});
	});
});
