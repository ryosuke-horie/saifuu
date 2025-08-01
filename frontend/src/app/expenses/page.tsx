import dynamic from "next/dynamic";
import { PageLoader } from "../../components/common/PageLoader";

/**
 * 支出管理ページのdynamic import実装
 *
 * パフォーマンス最適化のため、メインの支出管理コンポーネントを
 * 遅延読み込みし、初期バンドルサイズを削減する
 *
 * 実装方針:
 * - Next.js dynamic()を使用してコード分割を実現
 * - SSRは有効のまま（ssr: falseは使用しない）
 * - PageLoaderコンポーネントでローディング状態を表示
 * - 支出管理に特化したローディングメッセージを表示
 */

const ExpensesPageClient = dynamic(() => import("./page.client"), {
	loading: () => <PageLoader message="支出管理画面を読み込み中..." />,
});

export default function ExpensesPage() {
	return <ExpensesPageClient />;
}
