#!/usr/bin/env npx tsx

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// アイコンサイズの定義（manifest.jsonに対応）
const ICON_SIZES = [
	{ size: 16, name: "icon-16x16.png" },
	{ size: 32, name: "icon-32x32.png" },
	{ size: 48, name: "icon-48x48.png" },
	{ size: 72, name: "icon-72x72.png" },
	{ size: 96, name: "icon-96x96.png" },
	{ size: 144, name: "icon-144x144.png" },
	{ size: 192, name: "icon-192x192.png" },
	{ size: 512, name: "icon-512x512.png" },
] as const;

// マスク可能アイコン（Adaptive Icons用）
const MASKABLE_SIZES = [
	{ size: 192, name: "icon-maskable-192x192.png" },
	{ size: 512, name: "icon-maskable-512x512.png" },
] as const;

// 追加のApple Touch Icon
const APPLE_TOUCH_ICON = { size: 180, name: "apple-touch-icon.png" };

async function generateIcons() {
	const inputSvgPath = path.join(process.cwd(), "public", "favicon.svg");
	const outputDir = path.join(process.cwd(), "public");

	console.log("🎨 アイコン生成を開始します...");
	console.log(`📁 入力ファイル: ${inputSvgPath}`);
	console.log(`📁 出力ディレクトリ: ${outputDir}`);

	try {
		// SVGファイルの存在確認
		await fs.access(inputSvgPath);

		// 標準アイコンの生成
		console.log("\n🔧 標準アイコンを生成中...");
		for (const { size, name } of ICON_SIZES) {
			const outputPath = path.join(outputDir, name);

			await sharp(inputSvgPath)
				.resize(size, size, {
					fit: "contain",
					background: { r: 255, g: 255, b: 255, alpha: 0 }, // 透明背景
				})
				.png({
					quality: 100,
					compressionLevel: 9,
				})
				.toFile(outputPath);

			console.log(`✅ ${name} (${size}x${size})`);
		}

		// マスク可能アイコンの生成（余白を追加）
		console.log("\n🎭 マスク可能アイコンを生成中...");
		for (const { size, name } of MASKABLE_SIZES) {
			const outputPath = path.join(outputDir, name);

			// マスク可能アイコンは20%の余白を追加（Safe Zone対応）
			const iconSize = Math.round(size * 0.8);
			const padding = Math.round((size - iconSize) / 2);

			await sharp(inputSvgPath)
				.resize(iconSize, iconSize, {
					fit: "contain",
					background: { r: 255, g: 255, b: 255, alpha: 0 },
				})
				.extend({
					top: padding,
					bottom: padding,
					left: padding,
					right: padding,
					background: { r: 255, g: 255, b: 255, alpha: 0 },
				})
				.png({
					quality: 100,
					compressionLevel: 9,
				})
				.toFile(outputPath);

			console.log(`✅ ${name} (${size}x${size}, セーフゾーン対応)`);
		}

		// Apple Touch Iconの生成（角丸なし、システムが自動適用）
		console.log("\n🍎 Apple Touch Iconを生成中...");
		const appleOutputPath = path.join(outputDir, APPLE_TOUCH_ICON.name);

		await sharp(inputSvgPath)
			.resize(APPLE_TOUCH_ICON.size, APPLE_TOUCH_ICON.size, {
				fit: "contain",
				background: { r: 255, g: 255, b: 255, alpha: 1 }, // 白背景（iOSの要件）
			})
			.png({
				quality: 100,
				compressionLevel: 9,
			})
			.toFile(appleOutputPath);

		console.log(
			`✅ ${APPLE_TOUCH_ICON.name} (${APPLE_TOUCH_ICON.size}x${APPLE_TOUCH_ICON.size})`,
		);

		// ファビコンPNGの生成（16x16、32x32）
		console.log("\n📎 ファビコンPNGを生成中...");
		const faviconPath = path.join(outputDir, "favicon.png");

		await sharp(inputSvgPath)
			.resize(32, 32, {
				fit: "contain",
				background: { r: 255, g: 255, b: 255, alpha: 0 },
			})
			.png({
				quality: 100,
				compressionLevel: 9,
			})
			.toFile(faviconPath);

		console.log("✅ favicon.png (32x32)");

		console.log("\n🎉 すべてのアイコンの生成が完了しました！");
		console.log(
			`📊 生成されたファイル: ${ICON_SIZES.length + MASKABLE_SIZES.length + 2}個`,
		);

		// 生成されたファイルのサイズ確認
		console.log("\n📁 生成されたファイル一覧:");
		const allFiles = [
			...ICON_SIZES.map((i) => i.name),
			...MASKABLE_SIZES.map((i) => i.name),
			APPLE_TOUCH_ICON.name,
			"favicon.png",
		];

		for (const fileName of allFiles) {
			const filePath = path.join(outputDir, fileName);
			try {
				const stats = await fs.stat(filePath);
				const sizeKB = Math.round(stats.size / 1024);
				console.log(`   ${fileName} (${sizeKB}KB)`);
			} catch (_error) {
				console.log(`   ${fileName} (エラー: ファイルが見つかりません)`);
			}
		}
	} catch (error) {
		console.error("❌ アイコン生成でエラーが発生しました:", error);
		process.exit(1);
	}
}

// スクリプトの実行
if (require.main === module) {
	generateIcons().catch(console.error);
}

export { generateIcons };
