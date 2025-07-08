# Logging Middleware

このディレクトリには、Hono アプリケーション用のログ記録ミドルウェアが含まれています。

## 概要

`logging.ts` は、すべての API リクエストの自動ログ記録、リクエスト ID の生成、レスポンス時間の測定、エラーハンドリングを提供します。

## 主な機能

- **リクエスト ID の自動生成**: 各リクエストに一意の ID を割り当て
- **レスポンス時間測定**: リクエストの処理時間を自動計測
- **操作タイプ検出**: HTTP メソッドから読み取り/書き込み/削除操作を判定
- **エラーハンドリング**: 例外とエラーレスポンスの包括的ログ記録
- **コンテキスト拡張**: Hono コンテキストにロガーとリクエスト ID を追加

## 使用方法

### 基本的な統合

```typescript
import { Hono } from 'hono'
import { loggingMiddleware } from './middleware/logging'
import { type Env } from './db'

const app = new Hono<{
  Bindings: Env
  Variables: LoggingVariables
}>()

// ログ記録ミドルウェアを適用
app.use('*', loggingMiddleware({
  NODE_ENV: process.env.NODE_ENV,
  LOG_LEVEL: process.env.LOG_LEVEL,
  VERSION: process.env.VERSION,
}))

// 他のミドルウェアやルート
app.use('/api/*', cors({/* CORS設定 */}))
app.route('/api/categories', categoriesRouter)
```

### ヘルパー関数の使用

#### getLogger(c) - ロガーインスタンスの取得

```typescript
import { getLogger } from '../middleware/logging'

app.get('/api/example', (c) => {
  const logger = getLogger(c)
  logger.info('カスタムログメッセージ', { 
    userId: 'user123',
    action: 'データ取得' 
  })
  
  return c.json({ data: 'example' })
})
```

#### getRequestId(c) - リクエスト ID の取得

```typescript
import { getRequestId } from '../middleware/logging'

app.post('/api/example', async (c) => {
  const requestId = getRequestId(c)
  
  // 外部サービス呼び出しでリクエスト ID を渡す
  const result = await externalService.call({
    requestId,
    data: await c.req.json()
  })
  
  return c.json(result)
})
```

#### logWithContext(c, level, message, meta) - コンテキスト付きログ

```typescript
import { logWithContext } from '../middleware/logging'

app.put('/api/example/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    const data = await c.req.json()
    const result = await updateExample(id, data)
    
    logWithContext(c, 'info', 'データ更新成功', {
      operationType: 'write',
      recordId: id,
      data: { updatedFields: Object.keys(data) }
    })
    
    return c.json(result)
  } catch (error) {
    logWithContext(c, 'error', 'データ更新失敗', {
      recordId: id,
      error: error.message
    })
    throw error
  }
})
```

## 自動ログ記録される情報

### リクエスト開始時

```json
{
  "timestamp": "2025-07-08T12:30:45.123Z",
  "level": "info",
  "message": "Request started: POST /api/subscriptions",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "environment": "development",
  "service": "saifuu-api",
  "version": "1.0.0",
  "meta": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "method": "POST",
    "path": "/api/subscriptions",
    "operationType": "write",
    "userAgent": "Mozilla/5.0...",
    "contentType": "application/json"
  }
}
```

### リクエスト完了時

```json
{
  "timestamp": "2025-07-08T12:30:45.456Z",
  "level": "info",
  "message": "Request completed: POST /api/subscriptions - 201 (333ms)",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "environment": "development",
  "service": "saifuu-api",
  "version": "1.0.0",
  "meta": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "method": "POST",
    "path": "/api/subscriptions",
    "operationType": "write",
    "duration": 333,
    "statusCode": 201,
    "responseSize": "156"
  }
}
```

### エラー発生時

```json
{
  "timestamp": "2025-07-08T12:30:45.789Z",
  "level": "error",
  "message": "Request failed: POST /api/subscriptions - 500 (123ms)",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "environment": "development",
  "service": "saifuu-api",
  "version": "1.0.0",
  "meta": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "method": "POST",
    "path": "/api/subscriptions",
    "operationType": "write",
    "duration": 123,
    "statusCode": 500,
    "error": "Database connection failed",
    "stack": "Error: Database connection failed\n    at ..."
  }
}
```

## 操作タイプの判定

ミドルウェアは HTTP メソッドに基づいて操作タイプを自動判定します：

- **read**: GET, HEAD, OPTIONS
- **write**: POST, PUT, PATCH
- **delete**: DELETE

将来的にはパスベースの判定も実装予定です。

## ログレベルの自動判定

レスポンスステータスコードに基づいてログレベルが決定されます：

- **info**: 200-399 (正常・リダイレクト)
- **warn**: 400-499 (クライアントエラー)
- **error**: 500-599 (サーバーエラー)

## TypeScript 型定義

### LoggingVariables

```typescript
export interface LoggingVariables {
  logger: Logger
  requestId: string
}
```

### LoggingContext

```typescript
export type LoggingContext = Context<{
  Bindings: Env
  Variables: LoggingVariables
}>
```

## テスト

ミドルウェアは包括的なユニットテストでカバーされています：

```bash
npm run test:unit -- src/middleware/__tests__/logging.test.ts
```

## パフォーマンス

- リクエスト ID は `crypto.randomUUID()` で効率的に生成
- ログバッファリングにより本番環境でのパフォーマンスを最適化
- 開発環境では即座にコンソール出力、本番環境では設定可能なバッファリング

## 設定

環境変数で動作をカスタマイズできます：

- `NODE_ENV`: 'development' | 'production'
- `LOG_LEVEL`: 'debug' | 'info' | 'warn' | 'error'
- `LOG_BUFFER_SIZE`: バッファサイズ（数値）
- `LOG_FLUSH_INTERVAL`: フラッシュ間隔（ミリ秒）
- `VERSION`: アプリケーションバージョン