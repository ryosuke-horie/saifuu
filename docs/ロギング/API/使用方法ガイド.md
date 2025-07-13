# APIロガー使用方法ガイド

## 概要

Saifuu APIロガーは、Cloudflare Workers環境に最適化された包括的なログシステムです。全APIリクエストの自動追跡、構造化ログ、エラー診断機能を提供し、開発・運用の両方をサポートします。

## 🚀 クイックスタート

### 基本的な使用方法

APIロガーはHonoミドルウェアとして自動適用されるため、特別な設定なしで全APIリクエストがログされます。

```typescript
// 自動的にログされる内容：
// - リクエスト開始・完了
// - レスポンス時間
// - エラー（スタックトレース付き）
// - 操作タイプ（read/write/delete）
```

### カスタムログの追加

APIルート内でカスタムログを追加する場合：

```typescript
import { logWithContext } from '../middleware/logging';

app.post('/api/example', async (c) => {
  // 推奨：コンテキスト付きログ
  logWithContext(c, 'info', 'カスタム処理を開始', {
    userId: 'user123',
    operation: 'create_example'
  });

  try {
    // 処理...
    const result = await someOperation();

    logWithContext(c, 'info', 'カスタム処理が完了', {
      resultId: result.id,
      itemCount: result.items?.length
    });

    return c.json(result);
  } catch (error) {
    logWithContext(c, 'error', 'カスタム処理でエラーが発生', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
});
```

## 📚 API リファレンス

### ヘルパー関数

#### `logWithContext(c, level, message, meta?)` ⭐ **推奨**

最も便利で安全なログ関数。自動的にリクエストIDとロガーを取得してログを出力します。

```typescript
import { logWithContext } from '../middleware/logging';

// 基本的な使用法
logWithContext(c, 'info', 'ユーザー作成を開始');

// メタデータ付き
logWithContext(c, 'info', 'ユーザー作成が完了', {
  userId: newUser.id,
  email: newUser.email,
  role: newUser.role
});

// エラーログ
logWithContext(c, 'error', 'ユーザー作成に失敗', {
  error: error.message,
  stack: error.stack,
  requestData: body
});
```

#### `getLogger(c)` & `getRequestId(c)`

個別にロガーやリクエストIDが必要な場合：

```typescript
import { getLogger, getRequestId } from '../middleware/logging';

app.get('/api/example', async (c) => {
  const logger = getLogger(c);
  const requestId = getRequestId(c);

  logger.info('カスタムログメッセージ', {
    requestId,
    customData: 'value'
  });
});
```

#### `getLoggerContext(c)`

ロガーとリクエストIDを同時に取得：

```typescript
import { getLoggerContext } from '../middleware/logging';

app.get('/api/example', async (c) => {
  const { logger, requestId } = getLoggerContext(c);
  
  logger.info('ログメッセージ', { requestId, data: 'value' });
});
```

### ログレベル

| レベル | 用途 | 例 |
|--------|------|-----|
| `debug` | 詳細なデバッグ情報（開発環境のみ） | 変数の値、内部状態 |
| `info` | 正常な操作の記録 | API呼び出し成功、データ作成完了 |
| `warn` | 回復可能なエラー・警告 | バリデーションエラー、404エラー |
| `error` | システムエラー・失敗 | データベースエラー、予期しない例外 |

## 🎯 ベストプラクティス

### 1. 適切なログレベルの選択

```typescript
// ✅ Good: 適切なレベル分け
logWithContext(c, 'info', 'ユーザー認証を開始', { email });
logWithContext(c, 'warn', 'ユーザー認証: 無効なパスワード', { email });
logWithContext(c, 'error', 'データベース接続エラー', { error: error.message });

// ❌ Bad: 全てをinfoレベルで記録
logWithContext(c, 'info', 'エラーが発生しました');  // errorレベルを使うべき
```

### 2. 有用なメタデータの追加

```typescript
// ✅ Good: コンテキスト情報が豊富
logWithContext(c, 'info', 'サブスクリプション作成が完了', {
  subscriptionId: result.id,
  subscriptionName: result.name,
  amount: result.amount,
  userId: body.userId,
  categoryId: body.categoryId,
  resource: 'subscriptions',
  operationType: 'write'
});

// ❌ Bad: 情報が不十分
logWithContext(c, 'info', '作成完了');
```

### 3. エラーハンドリング

```typescript
// ✅ Good: 包括的なエラー情報
logWithContext(c, 'error', 'カテゴリ作成でエラーが発生', {
  error: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined,
  resource: 'categories',
  operationType: 'write',
  requestData: body,
  databaseOperation: 'insert'
});

// ❌ Bad: エラー詳細が不十分  
logWithContext(c, 'error', 'エラー');
```

### 4. 個人情報の保護

```typescript
// ✅ Good: 個人情報をマスク
logWithContext(c, 'info', 'ユーザーログイン成功', {
  userId: user.id,
  email: maskEmail(user.email),  // example@***.com
  role: user.role
});

// ❌ Bad: 機密情報をそのままログ
logWithContext(c, 'info', 'ログイン', {
  password: user.password,  // 絶対にダメ
  creditCard: user.creditCard
});
```

## 🔍 ログ出力例

### 正常なAPIリクエスト

```json
{
  "timestamp": "2025-07-08T13:04:52.006Z",
  "level": "info",
  "message": "Request started: GET /api/categories",
  "requestId": "d0ef7b89-fcfb-431f-bebd-de19e6ac710f",
  "environment": "production",
  "service": "saifuu-api",
  "version": "1.0.0",
  "meta": {
    "requestId": "d0ef7b89-fcfb-431f-bebd-de19e6ac710f",
    "method": "GET",
    "path": "/api/categories",
    "operationType": "read",
    "userAgent": "unknown",
    "contentType": "application/json"
  }
}
```

### カスタムログ（ビジネスロジック）

```json
{
  "timestamp": "2025-07-08T13:04:52.011Z",
  "level": "info", 
  "message": "サブスクリプション作成が完了",
  "requestId": "0bb155fb-d0d5-4e9b-bb83-df55e76df1df",
  "environment": "production",
  "service": "saifuu-api",
  "version": "1.0.0",
  "meta": {
    "requestId": "0bb155fb-d0d5-4e9b-bb83-df55e76df1df",
    "subscriptionId": 1,
    "subscriptionName": "Netflix",
    "amount": 1980,
    "billingCycle": "monthly",
    "categoryId": 1,
    "resource": "subscriptions",
    "operationType": "write"
  }
}
```

### エラーログ

```json
{
  "timestamp": "2025-07-08T13:04:52.012Z",
  "level": "warn",
  "message": "サブスクリプション作成: バリデーションエラー - 名前が無効",
  "requestId": "fa3d213e-ed17-4090-b5d0-3c2488b70312",
  "environment": "production", 
  "service": "saifuu-api",
  "version": "1.0.0",
  "meta": {
    "requestId": "fa3d213e-ed17-4090-b5d0-3c2488b70312",
    "validationError": "name_required",
    "providedData": {
      "amount": 1000,
      "billingCycle": "monthly",
      "categoryId": 1
    }
  }
}
```

## 🛠️ トラブルシューティング

### よくある問題と解決法

#### 1. "Logger not found in context" エラー

**原因**: ログミドルウェアが適用されていない、または適用順序が間違っている

**解決法**:
```typescript
// ✅ 正しい順序: ログミドルウェアを最初に適用
app.use('*', loggingMiddleware);
app.use('*', databaseMiddleware);
app.use('*', yourRoutes);

// ❌ 間違い: ログミドルウェアより前に他のミドルウェア
app.use('*', databaseMiddleware);
app.use('*', loggingMiddleware);  // 遅すぎる
```

#### 2. ログが出力されない

**原因**: ログレベル設定が高すぎる、または環境変数設定の問題

**解決法**:
```typescript
// 環境変数を確認
LOG_LEVEL=debug  // 開発環境
LOG_LEVEL=info   // 本番環境
```

#### 3. パフォーマンス問題

**原因**: 大量のメタデータまたは頻繁すぎるログ

**解決法**:
```typescript
// ✅ 適切: 必要最小限の情報
logWithContext(c, 'info', 'データ処理完了', {
  recordCount: results.length,
  processingTime: duration
});

// ❌ 問題: 巨大なオブジェクトをそのままログ  
logWithContext(c, 'info', 'データ処理完了', {
  allData: massiveDataObject  // 避ける
});
```

## 📊 監視とアラート

### Cloudflare Analytics連携（将来予定）

```typescript
// 将来的に実装予定の機能
// - ログデータのCloudflare Analytics送信
// - カスタムメトリクス（エラー率、レスポンス時間など）
// - リアルタイムアラート
```

### 開発環境での監視

```bash
# リアルタイムログ監視
wrangler tail

# 特定のリクエストIDでフィルタ
wrangler tail | grep "d0ef7b89-fcfb-431f-bebd-de19e6ac710f"

# エラーログのみ表示
wrangler tail | grep '"level":"error"'
```

## 🔧 設定オプション

### 環境変数

| 変数名 | 説明 | デフォルト | 例 |
|--------|------|-----------|-----|
| `LOG_LEVEL` | ログレベル | development: `debug`<br>production: `info` | `debug`, `info`, `warn`, `error` |
| `LOG_BUFFER_SIZE` | バッファサイズ | development: 10<br>production: 50 | `100` |
| `LOG_FLUSH_INTERVAL` | フラッシュ間隔(ms) | development: 1000<br>production: 5000 | `10000` |
| `VERSION` | アプリバージョン | `1.0.0` | `1.2.3` |

### wrangler.toml設定例

```toml
[vars]
LOG_LEVEL = "info"
LOG_BUFFER_SIZE = "100"  
LOG_FLUSH_INTERVAL = "10000"
VERSION = "1.0.0"
```

## 🚀 高度な使用方法

### カスタムロガーの作成

```typescript
import { LoggerFactory } from '../logger/factory';

// 特定の設定でロガーを作成
const customLogger = LoggerFactory.getInstance({
  NODE_ENV: 'development',
  LOG_LEVEL: 'debug',
  VERSION: '1.0.0'
});

// 使用
customLogger.debug('カスタムデバッグメッセージ', {
  module: 'custom-processor',
  data: processedData
});
```

### バッチ処理でのログ

```typescript
app.post('/api/batch-process', async (c) => {
  const items = await c.req.json();
  
  logWithContext(c, 'info', 'バッチ処理を開始', {
    itemCount: items.length,
    batchId: crypto.randomUUID()
  });

  const results = [];
  for (const [index, item] of items.entries()) {
    try {
      const result = await processItem(item);
      results.push(result);
      
      // 進捗ログ（適度な頻度で）
      if ((index + 1) % 10 === 0) {
        logWithContext(c, 'info', 'バッチ処理進捗', {
          processed: index + 1,
          total: items.length,
          progress: Math.round(((index + 1) / items.length) * 100)
        });
      }
    } catch (error) {
      logWithContext(c, 'error', 'バッチ処理項目エラー', {
        itemIndex: index,
        itemId: item.id,
        error: error.message
      });
      // エラーでも処理継続
    }
  }

  logWithContext(c, 'info', 'バッチ処理完了', {
    totalItems: items.length,
    successCount: results.length,
    errorCount: items.length - results.length
  });

  return c.json({ results, summary: { total: items.length, success: results.length }});
});
```

---

## 📚 関連ドキュメント

- **[APIロガー設計](./APIロガー設計.md)** - システムアーキテクチャと設計思想
- **[APIロガー実装計画](./APIロガー実装計画.md)** - 詳細な実装計画とコード例
- **[ミドルウェア詳細](../api/src/middleware/README.md)** - ミドルウェアの技術詳細

## 🤝 コントリビューション

ログ機能の改善提案や問題報告は、GitHubのIssueまたはPRでお知らせください。

**APIロガーにより、Saifuuアプリケーションの品質と開発効率が大幅に向上します！** 🚀