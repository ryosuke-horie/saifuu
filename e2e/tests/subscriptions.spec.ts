import { test, expect } from '@playwright/test';

test.describe('サブスクリプション管理機能', () => {
  test('サブスクリプションの登録が正常に動作すること', async ({ page, browserName }) => {
    // コンソールログを出力
    page.on('console', msg => console.log('Browser Console:', msg.text()));
    page.on('pageerror', error => console.log('Browser Error:', error.message));
    
    // タイムスタンプとブラウザ名を使って一意なテストデータを作成
    const timestamp = Date.now();
    const randomId = Math.floor(Math.random() * 10000);
    const testName = `[E2E_TEST] テストサービス ${timestamp}_${randomId}`;
    
    // サブスクリプション管理画面へ直接遷移
    await page.goto('/subscriptions');
    
    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('domcontentloaded');
    
    // サブスクリプション管理画面が表示されることを確認
    await expect(page).toHaveURL(/\/subscriptions/);
    
    // ページが正しく読み込まれたことを確認（h1要素で確認）
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // 新規登録ボタンをクリック
    await page.click('button:has-text("新規登録")');
    
    // ダイアログが開くまで待機
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // フォームに入力（一意なデータ）
    await page.getByRole('textbox', { name: 'サービス名 *' }).fill(testName);
    await page.getByRole('spinbutton', { name: '料金（円） *' }).fill('4980');
    
    // 今日から30日後の日付を生成
    const nextBillingDate = new Date();
    nextBillingDate.setDate(nextBillingDate.getDate() + 30);
    const dateString = nextBillingDate.toISOString().split('T')[0];
    
    await page.getByRole('textbox', { name: '次回請求日 *' }).fill(dateString);
    await page.getByLabel('カテゴリ *').selectOption('1'); // 食費カテゴリ
    
    // 登録ボタンをクリック（フォームが有効になるまで待機）
    const submitButton = page.getByRole('button', { name: '登録', exact: true });
    await expect(submitButton).toBeEnabled({ timeout: 10000 });
    
    // 登録ボタンをクリック
    await submitButton.click();
    
    // フォームが閉じることを確認（ダイアログが消えるのを待つ）
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 10000 });
    
    // 登録したサブスクリプションが一覧に表示されることを確認
    // 一意なテストデータを使って確実に特定
    const newRow = page.locator('tr', { hasText: testName });
    await expect(newRow).toBeVisible({ timeout: 10000 });
    await expect(newRow.locator('text=/4[,，]980/')).toBeVisible();
  });
});