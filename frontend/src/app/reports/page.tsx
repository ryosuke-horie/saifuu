import dynamic from "next/dynamic";
import { PageLoader } from "../../components/common/PageLoader";

/**
 * レポートページのdynamic import実装
 *
 * パフォーマンス最適化のため、メインのレポートコンポーネントを
 * 遅延読み込みし、初期バンドルサイズを削減する
 *
 * 実装方針:
 * - Next.js dynamic()を使用してコード分割を実現
 * - SSRは有効のまま（ssr: falseは使用しない）
 * - PageLoaderコンポーネントでローディング状態を表示
 * - レポート生成に特化したローディングメッセージを表示
 */

const ReportsPageClient = dynamic(() => import("./page.client"), {
	loading: () => <PageLoader message="レポート画面を読み込み中..." />,
});

export default function ReportsPage() {
	return <ReportsPageClient />;
}
