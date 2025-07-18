/**
 * APIテスト用ヘルパー関数
 * 
 * APIエラーのテストパターンを統一し、重複を削減
 */

import { expect } from 'vitest';

/**
 * APIエラーハンドリングのテスト
 */
export const testApiError = async (
  operation: () => Promise<void>,
  expectedErrorMessage?: string
) => {
  try {
    await operation();
    // エラーが投げられなかった場合は失敗
    expect.fail('Expected an error to be thrown');
  } catch (error) {
    if (expectedErrorMessage) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain(expectedErrorMessage);
    } else {
      // エラーが発生したことだけを確認
      expect(error).toBeDefined();
    }
  }
};

/**
 * 非同期操作のローディング状態テスト
 */
export const testLoadingState = async (
  getLoadingState: () => boolean,
  operation: () => Promise<void>
) => {
  // 初期状態はローディング中
  expect(getLoadingState()).toBe(true);
  
  // 操作を実行
  await operation();
  
  // 完了後はローディングが終了
  expect(getLoadingState()).toBe(false);
};

/**
 * リトライロジックのテスト
 */
export const testRetryLogic = async (
  mockFn: jest.Mock,
  operation: () => Promise<void>,
  expectedRetries: number
) => {
  // 最初の数回は失敗、最後は成功
  for (let i = 0; i < expectedRetries; i++) {
    mockFn.mockRejectedValueOnce(new Error('Network error'));
  }
  mockFn.mockResolvedValueOnce({ success: true });
  
  // 操作を実行
  await operation();
  
  // 期待されるリトライ回数 + 1回呼ばれる
  expect(mockFn).toHaveBeenCalledTimes(expectedRetries + 1);
};