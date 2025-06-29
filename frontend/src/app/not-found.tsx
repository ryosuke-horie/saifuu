import Link from "next/link";
import type { FC } from "react";

/**
 * 404 Not Found ページ
 *
 * Next.js App Routerで必要とされる404エラーページコンポーネント
 * ユーザーが存在しないページにアクセスした際に表示される
 *
 * 設計方針:
 * - シンプルで分かりやすいエラーメッセージ
 * - ホームページへの誘導
 * - 統一されたデザイン
 * - Server Componentとして実装（インタラクティブ要素は最小限）
 */

const NotFound: FC = () => {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
				<div className="mb-6">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
						<span className="text-2xl text-red-600">404</span>
					</div>
					<h1 className="text-2xl font-bold text-gray-900 mb-2">
						ページが見つかりません
					</h1>
					<p className="text-gray-600 mb-6">
						お探しのページは存在しないか、移動された可能性があります。
					</p>
				</div>

				<div className="space-y-4">
					<Link
						href="/"
						className="inline-block w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
					>
						ホームに戻る
					</Link>
				</div>
			</div>
		</div>
	);
};

export default NotFound;
