/**
 * サブスクリプションAPI専用の型定義
 * バックエンドAPIとの通信に使用する型を定義
 */

/**
 * バックエンドAPIのサブスクリプションレスポンス型
 * バックエンドはnumber型のIDと ISO形式の日付を使用
 */
export interface ApiSubscriptionResponse {
	id: number;
	name: string;
	amount: number;
	categoryId: number;
	billingCycle: "monthly" | "yearly" | "weekly";
	nextBillingDate: string; // ISO 8601形式
	isActive: boolean;
	description: string | null;
	createdAt: string;
	updatedAt: string;
}

/**
 * サブスクリプション作成リクエスト型
 * IDは自動生成されるため含まない
 */
export interface ApiCreateSubscriptionRequest {
	name: string;
	amount: number;
	categoryId: number;
	billingCycle: "monthly" | "yearly" | "weekly";
	nextBillingDate: string; // ISO 8601形式
	isActive: boolean;
	description?: string | null;
}

/**
 * サブスクリプション更新リクエスト型
 * 部分更新をサポート
 */
export interface ApiUpdateSubscriptionRequest {
	name?: string;
	amount?: number;
	categoryId?: number;
	billingCycle?: "monthly" | "yearly" | "weekly";
	nextBillingDate?: string; // ISO 8601形式
	isActive?: boolean;
	description?: string | null;
}

/**
 * サブスクリプション一覧レスポンス型
 * APIは配列を直接返すため、ApiSubscriptionResponse[]を使用
 */
// export interface ApiSubscriptionListResponse {
// 	subscriptions: ApiSubscriptionResponse[];
// 	total: number;
// }

/**
 * サブスクリプションエラーレスポンス型
 */
export interface ApiSubscriptionErrorResponse {
	error: string;
	message: string;
	statusCode: number;
}
