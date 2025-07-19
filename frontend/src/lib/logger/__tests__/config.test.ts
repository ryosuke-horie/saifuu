/**
 * 設定管理テスト（最適化版）
 *
 * 重要な設定検証のみに焦点を絞り、実装詳細への依存を削減
 */

import { describe, expect, it } from "vitest";
import {
	getDefaultConfig,
	mergeConfigs,
	shouldLog,
	validateConfig,
} from "../config";
import type { BrowserLoggerConfig, LogLevel } from "../types";

describe("Logger Config", () => {
	describe("getDefaultConfig", () => {
		it("各環境で適切なデフォルト設定を返す", () => {
			const devConfig = getDefaultConfig("development");
			expect(devConfig.level).toBe("debug");
			expect(devConfig.enableConsole).toBe(true);
			expect(devConfig.bufferSize).toBe(10);

			const prodConfig = getDefaultConfig("production");
			expect(prodConfig.level).toBe("info");
			expect(prodConfig.enableConsole).toBe(false);
			expect(prodConfig.bufferSize).toBe(50);

			const storybookConfig = getDefaultConfig("storybook");
			expect(storybookConfig.level).toBe("debug");
			expect(storybookConfig.enableConsole).toBe(true);
		});

		it("必須フィールドが全て含まれる", () => {
			const config = getDefaultConfig("development");
			const requiredFields = [
				"level",
				"bufferSize",
				"flushInterval",
				"maxRetries",
				"enableConsole",
			];

			requiredFields.forEach((field) => {
				expect(config).toHaveProperty(field);
			});
		});
	});

	describe("validateConfig", () => {
		it("有効な設定を受け入れる", () => {
			const validConfig = getDefaultConfig("production");
			expect(() => validateConfig(validConfig)).not.toThrow();
		});

		it("必須フィールドが欠けているとエラー", () => {
			const invalidConfigs = [
				{}, // 全て欠如
				{ endpoint: "http://api.test" }, // 他が欠如
				{ ...getDefaultConfig("development"), level: "" as LogLevel }, // 空のlevel
			];

			invalidConfigs.forEach((config) => {
				expect(() => validateConfig(config as BrowserLoggerConfig)).toThrow();
			});
		});

		it("無効な値でエラー", () => {
			const baseConfig = getDefaultConfig("development");

			// 無効なログレベル
			expect(() =>
				validateConfig({
					...baseConfig,
					level: "invalid" as LogLevel,
				}),
			).toThrow();

			// 負の値
			expect(() =>
				validateConfig({
					...baseConfig,
					bufferSize: -1,
				}),
			).toThrow();

			// 無効なフラッシュインターバル
			expect(() =>
				validateConfig({
					...baseConfig,
					flushInterval: -1,
				}),
			).toThrow();
		});
	});

	describe("shouldLog", () => {
		const testCases: Array<[LogLevel, LogLevel, boolean]> = [
			// [設定レベル, ログレベル, 期待値]
			["debug", "debug", true],
			["debug", "info", true],
			["info", "debug", false],
			["info", "info", true],
			["warn", "info", false],
			["warn", "warn", true],
			["error", "warn", false],
			["error", "error", true],
		];

		testCases.forEach(([configLevel, logLevel, expected]) => {
			it(`設定${configLevel}でログ${logLevel}は${expected ? "出力" : "スキップ"}`, () => {
				expect(shouldLog(logLevel, configLevel)).toBe(expected);
			});
		});
	});

	describe("mergeConfigs", () => {
		it("デフォルト設定と部分的な設定をマージ", () => {
			const base = getDefaultConfig("development");
			const partial = {
				level: "warn" as LogLevel,
				bufferSize: 20,
			};

			const merged = mergeConfigs(base, partial);
			expect(merged.level).toBe("warn");
			expect(merged.bufferSize).toBe(20);
			expect(merged.enableConsole).toBe(base.enableConsole); // 変更されていない
		});

		it("複数の設定を順番にマージ", () => {
			const base = getDefaultConfig("development");
			const override1 = {
				level: "info" as LogLevel,
				bufferSize: 20,
			};
			const override2 = {
				level: "warn" as LogLevel,
				enableConsole: false,
			};

			const merged = mergeConfigs(base, override1) as BrowserLoggerConfig;
			const final = mergeConfigs(merged, override2) as BrowserLoggerConfig;
			expect(final.level).toBe("warn"); // 最後の値が優先
			expect(final.bufferSize).toBe(20); // override1から
			expect(final.enableConsole).toBe(false); // override2から
		});

		it("深いオブジェクトのマージ", () => {
			const base = getDefaultConfig("development");
			const override = {
				level: "error" as LogLevel,
				bufferSize: 100,
			};

			const merged = mergeConfigs(base, override) as BrowserLoggerConfig;
			expect(merged.level).toBe("error");
			expect(merged.bufferSize).toBe(100);
			expect(merged.flushInterval).toBe(base.flushInterval);
		});
	});
});
