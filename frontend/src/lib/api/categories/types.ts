/**
 * カテゴリAPI専用の型定義
 * バックエンドAPIとの通信に使用する型を定義
 */

/**
 * バックエンドAPIのカテゴリレスポンス型
 * バックエンドはnumber型のIDを使用
 */
export interface ApiCategoryResponse {
	id: number;
	name: string;
	createdAt: string;
	updatedAt: string;
}

/**
 * カテゴリ一覧レスポンス型
 */
export interface ApiCategoryListResponse {
	categories: ApiCategoryResponse[];
	total: number;
}

/**
 * カテゴリエラーレスポンス型
 */
export interface ApiCategoryErrorResponse {
	error: string;
	message: string;
	statusCode: number;
}
