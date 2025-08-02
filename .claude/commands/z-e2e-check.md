# E2E Test Check

E2Eテストの実行、分析、修正を体系的に行うコマンドです。

## 概要

`e2e-test-runner`エージェントがテストを実行・分析し、必要に応じて専門エージェントに修正を依頼します。
エージェント間で構造化されたコンテキストを共有することで、効率的な問題解決を実現します。

## エージェント間のコンテキスト仕様

### e2e-test-runner → 修正エージェント

```typescript
interface E2ETestContext {
  // テスト結果サマリー
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  
  // 失敗したテストの詳細
  failures: Array<{
    testName: string;
    testFile: string;
    errorType: 'frontend' | 'backend' | 'integration';
    errorMessage: string;
    stackTrace?: string;
    screenshot?: string;
    
    // 修正に必要な情報
    affectedFiles: string[];
    suggestedFix?: string;
    relatedCode?: {
      file: string;
      line: number;
      snippet: string;
    };
  }>;
  
  // 環境情報
  environment: {
    frontendUrl: string;
    apiUrl: string;
    serverStatus: 'running' | 'stopped' | 'unknown';
    ghostProcesses: string[];
  };
}
```

### 修正エージェント → e2e-test-runner

```typescript
interface FixContext {
  // 修正内容
  fixes: Array<{
    file: string;
    changes: string;
    reason: string;
  }>;
  
  // サーバー再起動の必要性
  requiresRestart: {
    frontend: boolean;
    backend: boolean;
  };
  
  // 追加の確認事項
  verificationSteps: string[];
}
```

## 実行フロー

### Step 1: E2Eテスト実行と分析

```
Task(
  description="E2Eテスト実行と分析",
  subagent_type="e2e-test-runner",
  prompt="""
  E2Eテストを実行し、以下の形式で結果を報告してください：
  
  1. 環境準備（Ghost使用でサーバー起動・管理）
  2. テスト実行（pnpm run test:e2e）
  3. 結果分析（失敗の分類、原因特定）
  4. 修正必要箇所の特定（ファイル、行番号、修正案）
  
  【返却データ】
  - テスト結果サマリー（成功/失敗/スキップ数）
  - 失敗詳細（エラータイプ、影響ファイル、修正提案）
  - 環境状態（サーバー、Ghostプロセス）
  """
)
```

### Step 2: エラー修正（必要な場合）

#### フロントエンドエラーの修正

```
Task(
  description="フロントエンドエラー修正",
  subagent_type="frontend-developer",
  prompt="""
  E2Eテストで検出された以下のフロントエンドエラーを修正してください：
  
  【受け取るコンテキスト】
  ${E2ETestContext.failures.filter(f => f.errorType === 'frontend')}
  
  【実施事項】
  1. エラー箇所の特定と修正
  2. 型定義の確認と修正
  3. セレクタ（data-testid）の追加・修正
  
  【返却データ】
  - 修正したファイルと変更内容
  - サーバー再起動の必要性
  - 追加確認事項
  """
)
```

#### バックエンドエラーの修正

```
Task(
  description="バックエンドエラー修正",
  subagent_type="backend-developer",
  prompt="""
  E2Eテストで検出された以下のAPIエラーを修正してください：
  
  【受け取るコンテキスト】
  ${E2ETestContext.failures.filter(f => f.errorType === 'backend')}
  
  【実施事項】
  1. APIエンドポイントの修正
  2. データベース関連の修正
  3. バリデーション・エラーハンドリングの改善
  
  【返却データ】
  - 修正したファイルと変更内容
  - サーバー再起動の必要性
  - 追加確認事項
  """
)
```

### Step 3: 再テスト

```
Task(
  description="修正後の再テスト",
  subagent_type="e2e-test-runner",
  prompt="""
  修正完了後の確認を行ってください：
  
  【受け取るコンテキスト】
  ${FixContext}
  
  【実施事項】
  1. サーバー再起動（Ghostで管理）
  2. E2Eテスト再実行
  3. 最終報告（全テストの成功確認）
  """
)
```

## エラータイプの分類基準

| エラータイプ | 判定基準 | 担当エージェント |
|------------|---------|---------------|
| frontend | セレクタエラー、レンダリングエラー、UIの不整合 | frontend-developer |
| backend | APIエラー、404/500、データ不整合 | backend-developer |
| integration | 両方に関わる問題、型の不一致 | 両エージェントで協調 |

## 注意事項

- **エージェント責務**: Ghost管理・サーバー再起動はe2e-test-runnerが担当
- **コンテキスト継承**: エージェント間で構造化データを確実に引き継ぐ
- **ユーザー確認**: テストシナリオ変更時は必ず確認を取る