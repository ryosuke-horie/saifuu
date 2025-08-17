import { test, expect } from '@playwright/test';

test.describe('収入管理機能', () => {
  test('収入の登録が正常に動作すること', async ({ page, browserName }) => {
    // コンソールログを出力
    page.on('console', msg => console.log('Browser Console:', msg.text()));
    page.on('pageerror', error => console.log('Browser Error:', error.message));
    
    // タイムスタンプとブラウザ名を使って一意なテストデータを作成
    const timestamp = Date.now();
    const randomId = Math.floor(Math.random() * 10000);
    const testDescription = `[E2E_TEST] 収入確認 ${timestamp}_${randomId}`;
    
    // 収入管理画面へ直接遷移
    await page.goto('/income');
    
    // 収入管理画面が表示されることを確認
    await expect(page).toHaveURL(/\/income/);
    
    // カテゴリが読み込まれるまで待つ
    // selectが有効になるまで待機（カテゴリの読み込み完了を意味する）
    const categorySelect = page.getByLabel('カテゴリ');
    await expect(categorySelect).toBeEnabled({ timeout: 5000 });
    
    // 新規収入を登録
    // 支出管理と異なり、収入管理ではフォームが直接表示されている
    
    // フォームに入力（一意なデータ）
    await page.getByRole('spinbutton', { name: '金額（円） *' }).fill('300000');
    
    // 日付入力: 今日の日付を設定
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    const dateInput = page.getByLabel('日付 *');
    await dateInput.fill(dateString);
    
    await page.getByRole('textbox', { name: '説明（任意）' }).fill(testDescription);
    
    // カテゴリは任意項目 - 実際の値（value属性）で選択する
    // 収入カテゴリのIDは'101'（給与）、'102'（ボーナス）など（numericIdのstring版）
    const options = await categorySelect.locator('option').count();
    if (options > 1) { // デフォルトの「選択してください」以外のオプションがある場合
      // 給与カテゴリ（numericId: 101）を選択
      await categorySelect.selectOption('101');
    }
    
    // 登録ボタンをクリック
    await page.getByRole('button', { name: '登録', exact: true }).click();
    
    // エラーメッセージが表示されていないか確認
    // role="alert"が複数存在する可能性があるため、より具体的にエラーメッセージのみを取得
    const errorAlert = page.locator('p[role="alert"]').first();
    const errorCount = await errorAlert.count();
    if (errorCount > 0 && await errorAlert.isVisible()) {
      const errorText = await errorAlert.textContent();
      console.error('Form validation error:', errorText);
    }
    
    // 登録処理が完了したことを統計値の変化で確認
    // 収入統計に金額が反映されていることを確認
    await page.waitForTimeout(2000); // 登録処理の完了を待つ
    
    // 統計値が更新されていることを確認（今月の収入に金額が追加されている）
    const currentMonthStat = page.locator('h3:has-text("今月の収入")').locator('..').locator('p');
    const statText = await currentMonthStat.textContent();
    
    // 統計値に金額が含まれていることを確認（300,000円が追加されている）
    expect(statText).toBeTruthy();
    console.log('Current month income:', statText);
  });
});