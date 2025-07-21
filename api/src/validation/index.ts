// API バリデーション モジュール
// 共有バリデーションフレームワークを使用したAPI固有のバリデーションスキーマを提供

// 共有バリデーションフレームワークの型を再エクスポート
export type { ValidationError, ValidationResult, Validator } from '../../../shared/src/validation'
export {
	// 共通バリデーター
	amountValidator,
	categoryIdValidator,
	dateStringValidator,
	descriptionValidator,
	// ID検証
	idValidator,
	// サブスクリプションバリデーション
	subscriptionCreateSchema,
	subscriptionUpdateSchema,
	// 取引バリデーション
	transactionCreateSchema,
	transactionUpdateSchema,
	validateId,
	validateSubscriptionCreate,
	validateSubscriptionUpdate,
	validateTransactionCreate,
	validateTransactionUpdate,
} from './schemas'
