/**
 * サブスクリプション削除を管理するカスタムフック
 *
 * 削除操作のローディング状態、エラーハンドリング、成功通知を管理
 * useCreateSubscriptionと同じパターンに従って実装
 */

import { useCallback, useState } from "react";
import { useToast } from "../contexts/ToastContext";
import { handleApiError } from "../lib/api/errors";
import { subscriptionService } from "../lib/api/index";
import type { DeleteResponse } from "../lib/api/types";

/**
 * ローディング状態とエラー状態を管理する基本型
 */
interface BaseState {
	isLoading: boolean;
	error: string | null;
}

/**
 * サブスクリプション削除を管理するフック
 *
 * 削除の実行とその後の状態管理を提供する
 * 削除成功時にはトースト通知を表示し、必要に応じて一覧の再取得を促す
 */
export function useDeleteSubscription() {
	const [state, setState] = useState<BaseState>({
		isLoading: false,
		error: null,
	});

	const { showToast } = useToast();

	const deleteSubscription = useCallback(
		async (id: string): Promise<DeleteResponse | null> => {
			setState({ isLoading: true, error: null });

			try {
				const result = await subscriptionService.deleteSubscription(id);
				setState({ isLoading: false, error: null });

				// 成功時のトースト通知
				showToast("サブスクリプションを削除しました", "success");

				return result;
			} catch (error) {
				// 統一されたエラーハンドリングを使用
				const apiError = handleApiError(error, "deleteSubscription");
				const errorMessage = apiError.message;

				setState({ isLoading: false, error: errorMessage });

				// エラー時のトースト通知
				showToast(errorMessage, "error");

				return null;
			}
		},
		[showToast],
	);

	return {
		...state,
		deleteSubscription,
	};
}
