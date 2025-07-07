"use client";

import { useEffect, useState } from "react";

export default function TestPage() {
	const [status, setStatus] = useState<any>({
		loading: true,
		apiUrl: "",
		categories: null,
		error: null,
		fetchDetails: null,
	});

	useEffect(() => {
		const testApi = async () => {
			const apiUrl = process.env.NEXT_PUBLIC_API_URL || "API URL not set";
			setStatus((prev: any) => ({ ...prev, apiUrl }));

			try {
				console.log("Testing API:", apiUrl);
				const startTime = Date.now();
				
				const response = await fetch(`${apiUrl}/categories`, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						"Accept": "application/json",
					},
				});
				
				const endTime = Date.now();
				const responseData = await response.json();
				
				setStatus({
					loading: false,
					apiUrl,
					categories: responseData,
					error: null,
					fetchDetails: {
						status: response.status,
						statusText: response.statusText,
						duration: endTime - startTime,
						headers: Object.fromEntries(response.headers.entries()),
					},
				});
			} catch (err) {
				console.error("API Test Error:", err);
				setStatus({
					loading: false,
					apiUrl,
					categories: null,
					error: {
						message: err instanceof Error ? err.message : String(err),
						type: err instanceof Error ? err.name : typeof err,
						stack: err instanceof Error ? err.stack : undefined,
					},
					fetchDetails: null,
				});
			}
		};

		testApi();
	}, []);

	return (
		<div className="p-8">
			<h1 className="text-2xl font-bold mb-4">API Connection Test</h1>
			
			<div className="space-y-4">
				<div className="bg-gray-100 p-4 rounded">
					<h2 className="font-bold">Environment</h2>
					<p>NODE_ENV: {process.env.NODE_ENV}</p>
					<p>API URL: {status.apiUrl}</p>
				</div>
				
				{status.loading && (
					<div className="bg-blue-100 p-4 rounded">
						<p>Testing API connection...</p>
					</div>
				)}
				
				{status.error && (
					<div className="bg-red-100 p-4 rounded">
						<h2 className="font-bold text-red-700">Error</h2>
						<pre className="text-xs overflow-auto">
							{JSON.stringify(status.error, null, 2)}
						</pre>
					</div>
				)}
				
				{status.fetchDetails && (
					<div className="bg-green-100 p-4 rounded">
						<h2 className="font-bold text-green-700">Fetch Details</h2>
						<pre className="text-xs overflow-auto">
							{JSON.stringify(status.fetchDetails, null, 2)}
						</pre>
					</div>
				)}
				
				{status.categories && (
					<div className="bg-green-100 p-4 rounded">
						<h2 className="font-bold text-green-700">Categories Response</h2>
						<pre className="text-xs overflow-auto">
							{JSON.stringify(status.categories, null, 2)}
						</pre>
					</div>
				)}
			</div>
		</div>
	);
}