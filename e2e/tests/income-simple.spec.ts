import { test, expect } from '@playwright/test';

test.describe('収入管理機能（簡易版）', () => {
  test('収入管理画面にアクセスできること', async ({ page }) => {
    // 収入管理画面へ直接遷移（CI環境でのナビゲーション問題を回避）
    await page.goto('/income');
    
    // ページが完全に読み込まれるのを待つ
    await page.waitForLoadState('networkidle');
    
    // 収入管理画面が表示されることを確認
    await expect(page).toHaveURL(/\/income/);
    await expect(page.getByRole('heading', { name: '収入管理' })).toBeVisible();
  });
  
  test('ホーム画面からナビゲーションできること', async ({ page }) => {
    // ホーム画面から収入管理画面へ遷移
    await page.goto('/');
    
    // ページが完全に読み込まれるのを待つ
    await page.waitForLoadState('networkidle');
    
    // body要素が表示されるまで待つ（ハイドレーション完了の確認）
    await expect(page.locator('body')).toBeVisible();
    
    // ナビゲーションカードが表示されるのを待つ
    await page.getByTestId('navigation-income').waitFor({ state: 'visible' });
    
    // ナビゲーションカードをクリック
    await page.getByTestId('navigation-income').click();
    
    // 収入管理画面が表示されることを確認
    await expect(page).toHaveURL(/\/income/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: '収入管理' })).toBeVisible();
  });
});