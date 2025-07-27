/**
 * エラーセクションコンポーネント
 *
 * 複数のエラーを統合して表示する
 */

import { ErrorAlert } from "../ui/ErrorAlert";

interface ErrorSectionProps {
	/** エラーメッセージの配列 */
	errors: Array<{
		key: string;
		message: string | null | undefined;
	}>;
	/** 追加のCSSクラス */
	className?: string;
}

export const ErrorSection = ({ errors, className = "" }: ErrorSectionProps) => {
	// エラーがあるもののみフィルタリング
	const activeErrors = errors.filter((error) => error.message);

	if (activeErrors.length === 0) {
		return null;
	}

	return (
		<div className={className}>
			{activeErrors.map((error) => (
				<ErrorAlert key={error.key} message={error.message!} className="mb-4" />
			))}
		</div>
	);
};
