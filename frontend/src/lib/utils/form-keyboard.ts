/**
 * フォーム用キーボードショートカットユーティリティ
 *
 * 設計方針:
 * - フォーム間での共通のキーボード操作を集約
 * - 一貫したショートカット体験の提供
 * - Matt Pocock型定義パターンの採用
 * - 単一責任原則に基づく関数設計
 */

import { isModifierPressed } from "./keyboard";

/**
 * フォーム用キーボードハンドラーのオプション
 */
export interface FormKeyboardHandlerOptions {
	/** フォーム送信のコールバック */
	onSubmit?: () => void;
	/** エスケープキーのコールバック */
	onEscape?: () => void;
	/** 送信中かどうか（送信中はショートカットを無効化） */
	isSubmitting?: boolean;
}

/**
 * フォーム用キーボードショートカットハンドラー
 *
 * Cmd+Enter (Mac) または Ctrl+Enter (Windows/Linux) でフォーム送信
 * Escapeキーでキャンセル処理
 *
 * @param event - キーボードイベント
 * @param options - ハンドラーオプション
 * @returns キーイベントが処理されたかどうか
 */
export const handleFormKeyboardShortcuts = (
	event: React.KeyboardEvent,
	options: FormKeyboardHandlerOptions,
): boolean => {
	const { onSubmit, onEscape, isSubmitting = false } = options;

	// 送信中はショートカットを無効化
	if (isSubmitting) {
		return false;
	}

	// Cmd+Enter (Mac) または Ctrl+Enter (Windows/Linux) でフォーム送信
	if (isModifierPressed(event) && event.key === "Enter" && onSubmit) {
		event.preventDefault();
		onSubmit();
		return true;
	}

	// Escapeキーでキャンセル（onEscapeが提供されている場合のみ）
	if (event.key === "Escape" && onEscape) {
		event.preventDefault();
		onEscape();
		return true;
	}

	return false;
};

/**
 * フィールドのタッチ状態を管理するユーティリティ
 * Matt Pocockパターン: 型推論を活用し、satisfiesで型安全性を確保
 *
 * @param keys - フィールドキーの配列（型推論により自動的に制約される）
 * @returns 全フィールドをタッチ済みに設定する関数
 */
export const createTouchAllFields = <T extends Record<string, any>>(
	keys: ReadonlyArray<keyof T>,
) => {
	return (): Record<keyof T, boolean> => {
		return keys.reduce(
			(acc, key) => {
				acc[key] = true;
				return acc;
			},
			{} as Record<keyof T, boolean>,
		);
	};
};
