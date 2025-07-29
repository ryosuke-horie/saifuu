import { test, expect } from '@playwright/test';

test.describe('サブスクリプション管理機能', () => {
  test('サブスクリプションの登録が正常に動作すること', async ({ page }) => {
    // タイムスタンプを使って一意なテストデータを作成
    const timestamp = Date.now();
    const testServiceName = `[E2E_TEST] テストサブスク ${timestamp}`;
    
    // ホーム画面からサブスクリプション管理画面へ遷移
    await page.goto('/');
    // ダッシュボードのナビゲーションカードをクリック（data-testidを使用）
    await page.getByTestId('navigation-subscriptions').click();
    
    // サブスクリプション管理画面が表示されることを確認
    await expect(page).toHaveURL(/\/subscriptions/);
    
    // 新規サブスクリプションを登録
    await page.getByRole('button', { name: '新しいサブスクリプションを登録' }).click();
    
    // フォームに入力（一意なデータ）
    await page.getByRole('textbox', { name: 'サービス名 *' }).fill(testServiceName);
    await page.getByRole('spinbutton', { name: '料金（円） *' }).fill('1500');
    await page.getByRole('textbox', { name: '次回請求日 *' }).fill('2025-08-01');
    await page.getByLabel('カテゴリ *').selectOption('6'); // system_feeのnumericId
    await page.getByRole('textbox', { name: '説明（任意）' }).fill('E2Eテスト用のサブスクリプション');
    
    // 登録ボタンをクリック
    await page.getByRole('button', { name: '登録', exact: true }).click();
    
    // フォームが閉じることを確認（モーダルやフォームが消えるのを待つ）
    await expect(page.getByRole('button', { name: '登録', exact: true })).not.toBeVisible();
    
    // 登録したサブスクリプションが一覧に表示されることを確認
    // 一意なテストデータを使って確実に特定
    const newRow = page.locator('tr', { hasText: testServiceName }).first();
    await expect(newRow).toBeVisible();
    await expect(newRow.locator('text=/1[,，]500/')).toBeVisible();
  });
});