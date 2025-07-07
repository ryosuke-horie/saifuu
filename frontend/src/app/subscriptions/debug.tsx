"use client";

import { useEffect, useState } from "react";
import { getDebugInfo } from "../../lib/api/config";

/**
 * デバッグ情報表示コンポーネント
 * 本番環境での問題調査用
 */
export function DebugInfo() {
	const [debugData, setDebugData] = useState<any>(null);
	const [apiResponse, setApiResponse] = useState<any>(null);
	const [error, setError] = useState<any>(null);

	useEffect(() => {
		// API設定情報を取得
		const info = getDebugInfo();
		setDebugData(info);

		// APIを直接呼び出してテスト
		const testApi = async () => {
			try {
				console.log("Testing API call to:", info.baseUrl);
				const response = await fetch(`${info.baseUrl}/categories`);
				const data = await response.json();
				setApiResponse({
					status: response.status,
					headers: Object.fromEntries(response.headers.entries()),
					data: data,
				});
			} catch (err) {
				console.error("API test error:", err);
				setError({
					message: err instanceof Error ? err.message : String(err),
					type: err instanceof Error ? err.name : typeof err,
				});
			}
		};

		testApi();
	}, []);

	if (!debugData && !apiResponse && !error) {
		return null;
	}

	return (
		<div className="bg-yellow-50 p-4 rounded-lg text-xs font-mono">
			<h3 className="font-bold mb-2">Debug Information</h3>
			<details>
				<summary className="cursor-pointer">API Config</summary>
				<pre className="mt-2 text-xs overflow-auto">
					{JSON.stringify(debugData, null, 2)}
				</pre>
			</details>
			{apiResponse && (
				<details className="mt-2">
					<summary className="cursor-pointer">API Response</summary>
					<pre className="mt-2 text-xs overflow-auto">
						{JSON.stringify(apiResponse, null, 2)}
					</pre>
				</details>
			)}
			{error && (
				<details className="mt-2">
					<summary className="cursor-pointer text-red-600">Error</summary>
					<pre className="mt-2 text-xs overflow-auto text-red-600">
						{JSON.stringify(error, null, 2)}
					</pre>
				</details>
			)}
		</div>
	);
}