import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	// CI環境でのビルド最適化
	...(process.env.CI && {
		// 実験的な機能でメモリ使用量を削減
		experimental: {
			// ビルド時のメモリ使用量を最適化
			webpackMemoryOptimizations: true,
		},
		// Webpackの設定を調整してメモリ使用量を削減
		webpack: (config) => {
			// CI環境でのメモリ使用量を削減
			config.optimization = {
				...config.optimization,
				// メモリ効率を優先
				nodeEnv: 'production',
				concatenateModules: true,
				providedExports: true,
				usedExports: true,
				sideEffects: false,
			};
			// ソースマップを無効化してメモリ使用量を削減
			config.devtool = false;
			// キャッシュを有効化してビルド時間短縮
			config.cache = true;
			return config;
		},
	}),
	rewrites: async () => {
		// E2Eテスト時は3004ポート、通常開発時は5173ポートにプロキシ
		const apiPort = process.env.E2E_MODE === "true" ? 3004 : 5173;
		return [
			{
				source: "/api/:path*",
				destination: `http://localhost:${apiPort}/api/:path*`,
			},
		];
	},
};

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();
