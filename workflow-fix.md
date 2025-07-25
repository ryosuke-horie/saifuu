# GitHub Actions ワークフロー修正案

## 修正が必要なファイル

### 1. `.github/workflows/test-health-monitoring.yml`

**修正内容**:
1. トリガーをプルリクエストのみに制限
2. セルフホストランナーのクリーンアップステップを追加

```yaml
name: Test Health Metrics

on:
  pull_request:
    branches: [main]
  # pushトリガーを削除

jobs:
  monitor:
    runs-on: self-hosted
    steps:
      # 事前クリーンアップ
      - name: Pre-cleanup for self-hosted runner
        run: |
          rm -rf /home/runner-user/setup-pnpm || true
          rm -rf ~/.pnpm-store || true
          rm -rf node_modules || true
        continue-on-error: true

      # 既存のステップ...

      # 最終クリーンアップ
      - name: Final cleanup
        if: always()
        run: |
          rm -rf /home/runner-user/setup-pnpm || true
          rm -rf ~/.pnpm-store || true
          rm -rf node_modules || true
        continue-on-error: true
```

### 2. `.github/workflows/api-ci.yml`

**修正内容**: トリガーをプルリクエストのみに制限

```yaml
name: API Quality Checks & Tests

on:
  pull_request:
    branches: [main]
  # pushトリガーを削除
```

## 修正理由

1. **重複実行の解消**: プッシュとプルリクエストの両方でトリガーされることで、同じテストが2回実行されていました
2. **セルフホストランナーの安定性向上**: 適切なクリーンアップにより、ディレクトリ競合エラーを防ぎます
3. **GitHub Actions使用量の削減**: 無駄な実行を避けることで、無料枠を効率的に使用できます

## 補足

- mainブランチへの直接プッシュは通常行わないため、プルリクエスト時のみのチェックで十分です
- 必要に応じて、`workflow_dispatch`を追加して手動実行も可能にできます