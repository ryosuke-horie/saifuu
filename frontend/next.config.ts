import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
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
