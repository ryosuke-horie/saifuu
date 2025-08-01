/**
 * 収支バランスAPI サービス
 *
 * 収支サマリー情報の取得を管理する
 * 月間の収入・支出・残高・貯蓄率・トレンドを提供
 */

import { apiClient } from "../client";
import type { BalanceSummary } from "../types";

/**
 * 収支サマリーを取得する
 * 現在の月の収入・支出・残高と貯蓄率、トレンドを返す
 */
export async function getBalanceSummary(): Promise<BalanceSummary> {
	const endpoint = "/balance/summary";
	return apiClient.get<BalanceSummary>(endpoint);
}

/**
 * 収支サービスのデフォルトエクスポート
 */
export const balanceService = {
	getBalanceSummary,
} as const;
