import { expect, test } from "@playwright/test";

test.describe("ローディング状態の統一性", () => {
  test("支出一覧のローディング状態が統一されたUIを使用している", async ({ page }) => {
    // APIレスポンスを遅延させてローディング状態を確認
    await page.route("**/api/transactions", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/expenses");

    // 統一されたローディングコンポーネントが表示される
    const loadingState = page.getByTestId("loading-state");
    await expect(loadingState).toBeVisible();
    
    // スピナーが表示される
    const spinner = loadingState.locator('[role="status"]');
    await expect(spinner).toBeVisible();
    await expect(spinner).toHaveAttribute("aria-live", "polite");
    await expect(spinner).toHaveAttribute("aria-label", "読み込み中");
    
    // 統一されたメッセージが表示される
    await expect(loadingState).toContainText("読み込み中...");
  });

  test("サブスクリプション一覧のローディング状態が統一されたUIを使用している", async ({ page }) => {
    await page.route("**/api/subscriptions", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/subscriptions");

    const loadingState = page.getByTestId("loading-state");
    await expect(loadingState).toBeVisible();
    
    // 支出一覧と同じローディングUIが使用される
    const spinner = loadingState.locator('[role="status"]');
    await expect(spinner).toBeVisible();
    await expect(loadingState).toContainText("読み込み中...");
  });

  test("統計情報のスケルトンローディングが統一されたUIを使用している", async ({ page }) => {
    await page.route("**/api/transactions/stats**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          totalExpenses: 50000,
          monthlyAverage: 25000,
          categoryBreakdown: [],
        }),
      });
    });

    await page.goto("/expenses");

    // スケルトンローディングが表示される
    const skeleton = page.locator('[aria-busy="true"]').first();
    await expect(skeleton).toBeVisible();
    await expect(skeleton).toHaveAttribute("aria-label", "読み込み中");
    
    // アニメーションクラスが適用される
    await expect(skeleton).toHaveClass(/animate-pulse/);
  });

  test("ボタンのローディング状態が統一されたUIを使用している", async ({ page }) => {
    await page.goto("/expenses/new");

    // フォーム送信時のローディング
    await page.fill('input[name="amount"]', "1000");
    await page.fill('textarea[name="description"]', "テスト支出");

    // APIレスポンスを遅延させる
    await page.route("**/api/transactions", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ id: "1", amount: 1000 }),
      });
    });

    // 送信ボタンをクリック
    const submitButton = page.getByRole("button", { name: /登録/ });
    await submitButton.click();

    // ボタン内にローディングスピナーが表示される
    const buttonSpinner = submitButton.locator('[role="status"]');
    await expect(buttonSpinner).toBeVisible();
    await expect(submitButton).toBeDisabled();
  });

  test("異なるページ間でローディングUIの一貫性が保たれる", async ({ page }) => {
    // 複数のAPIエンドポイントを遅延させる
    await page.route("**/api/**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });

    // 支出ページでのローディング
    await page.goto("/expenses");
    const expenseLoading = page.getByTestId("loading-state").first();
    const expenseSpinnerClasses = await expenseLoading.locator('[role="status"]').getAttribute("class");

    // サブスクリプションページでのローディング
    await page.goto("/subscriptions");
    const subLoading = page.getByTestId("loading-state").first();
    const subSpinnerClasses = await subLoading.locator('[role="status"]').getAttribute("class");

    // 両ページで同じクラスが使用されている
    expect(expenseSpinnerClasses).toBe(subSpinnerClasses);
  });
});