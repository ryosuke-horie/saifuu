"use client";

/**
 * オフライン用フォールバックページ
 * サービスワーカーからリダイレクトされた際に表示される
 */
export default function OfflinePage() {
	return (
		<div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
			<div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
				{/* アイコン */}
				<div className="text-6xl mb-6">📱</div>

				{/* タイトル */}
				<h1 className="text-2xl font-bold text-gray-900 mb-4">Saifuu</h1>

				{/* メッセージ */}
				<p className="text-gray-600 mb-6">現在オフライン状態です。</p>

				<p className="text-gray-600 mb-8">
					インターネット接続を確認してから、もう一度お試しください。
				</p>

				{/* 操作ボタン */}
				<div className="space-y-4">
					<button
						type="button"
						onClick={() => window.location.reload()}
						className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
					>
						再読み込み
					</button>

					<button
						type="button"
						onClick={() => window.history.back()}
						className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
					>
						前のページに戻る
					</button>
				</div>

				{/* 説明文 */}
				<p className="text-sm text-gray-500 mt-8">
					キャッシュされたデータは引き続き利用可能です。
				</p>
			</div>

			{/* 機能説明 */}
			<div className="max-w-md w-full mt-8">
				<div className="bg-white rounded-lg shadow-lg p-6">
					<h2 className="text-lg font-semibold text-gray-900 mb-4">
						オフライン時の機能
					</h2>

					<ul className="space-y-2 text-sm text-gray-600">
						<li className="flex items-start">
							<span className="text-green-500 mr-2">✓</span>
							キャッシュされたページの閲覧
						</li>
						<li className="flex items-start">
							<span className="text-green-500 mr-2">✓</span>
							過去のサブスクリプション情報の確認
						</li>
						<li className="flex items-start">
							<span className="text-yellow-500 mr-2">⚠</span>
							新しいデータの同期は接続時に行われます
						</li>
						<li className="flex items-start">
							<span className="text-red-500 mr-2">✗</span>
							新しいデータの保存や編集
						</li>
					</ul>
				</div>
			</div>
		</div>
	);
}
