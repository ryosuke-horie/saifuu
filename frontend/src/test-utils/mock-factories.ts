// テスト用モックデータファクトリー
// fakerを使用してリアルなテストデータを生成
// 一貫性のあるテストデータを提供し、エッジケースのテストを容易にする

import { faker } from "@faker-js/faker/locale/ja";
import type { Category } from "@/types/category";
import type { Subscription } from "@/types/subscription";

// 日本語ロケールの設定
faker.seed([123]); // 再現可能なランダムデータのためのシード設定

// カテゴリーのモックデータ生成
export const createMockCategory = (
	overrides?: Partial<Category>,
): Category => ({
	id: faker.string.uuid(),
	name: faker.helpers.arrayElement([
		"食費",
		"交通費",
		"エンターテインメント",
		"公共料金",
		"その他",
	]),
	type: faker.helpers.arrayElement(["income", "expense"] as const),
	color: faker.helpers.arrayElement([null, faker.color.human()]),
	createdAt: faker.date.past().toISOString(),
	updatedAt: faker.date.recent().toISOString(),
	...overrides,
});

// サブスクリプションのモックデータ生成
export const createMockSubscription = (
	overrides?: Partial<Subscription>,
): Subscription => {
	return {
		id: faker.string.uuid(),
		name: faker.helpers.arrayElement([
			"Netflix",
			"Spotify",
			"Amazon Prime",
			"YouTube Premium",
			"Apple Music",
			"Hulu",
			"Disney+",
		]),
		amount: faker.number.int({ min: 100, max: 5000 }),
		category: createMockCategory(),
		billingCycle: faker.helpers.arrayElement(["monthly", "yearly"] as const),
		nextBillingDate: faker.date.future().toISOString(),
		isActive: true,
		description: faker.datatype.boolean() ? faker.lorem.sentence() : undefined,
		...overrides,
	};
};

// 複数のモックデータを生成するヘルパー関数
export const createMockCategories = (
	count = 5,
	overrides?: Partial<Category>,
): Category[] => {
	return Array.from({ length: count }, () => createMockCategory(overrides));
};

export const createMockSubscriptions = (
	count = 10,
	overrides?: Partial<Subscription>,
): Subscription[] => {
	return Array.from({ length: count }, () => createMockSubscription(overrides));
};

// エッジケース用の特殊なモックデータ
export const edgeCaseData = {
	// 長い文字列
	longString: faker.string.alpha(255),
	// 特殊文字を含む文字列
	specialCharsString: "テスト🎉<script>alert('XSS')</script>",
	// 空白のみの文字列
	whitespaceString: "   ",
	// 極大値
	maxAmount: 999999999,
	// 極小値
	minAmount: 1,
	// 未来の日付
	futureDate: faker.date.future({ years: 10 }).toISOString(),
	// 過去の日付
	pastDate: faker.date.past({ years: 10 }).toISOString(),
};
