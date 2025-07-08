# APIロガー実装計画

## 実装概要

このドキュメントは、[APIロガー設計](./APIロガー設計.md)に基づいた具体的な実装手順を定義します。段階的な実装により、既存システムへの影響を最小限に抑えながら、包括的なログ機能を実現します。

## 実装フェーズ

### フェーズ1: 基盤構築（優先度: 高）

#### 1.1 プロジェクト構造の準備

```bash
# 新規ディレクトリの作成
mkdir -p api/src/logger
mkdir -p api/src/middleware
mkdir -p api/src/types
mkdir -p api/src/utils
```

#### 1.2 型定義の実装

**ファイル: `api/src/logger/types.ts`**

```typescript
/**
 * ログレベルの定義
 * debug: 詳細なデバッグ情報（開発環境のみ）
 * info: 正常な操作の記録
 * warn: 回復可能なエラー・警告
 * error: システムエラー・失敗
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * ログメタデータの型定義
 * APIリクエストに関連する追加情報を格納
 */
export interface LogMeta {
  requestId?: string;
  userId?: string;
  operationType?: 'read' | 'write' | 'delete';
  duration?: number;
  path?: string;
  method?: string;
  statusCode?: number;
  data?: Record<string, any>;
  error?: string;
  stack?: string;
  [key: string]: any;
}

/**
 * ログエントリの構造定義
 * 全てのログが従う統一フォーマット
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId: string;
  environment: 'development' | 'production';
  service: 'saifuu-api';
  version: string;
  meta: LogMeta;
}

/**
 * ログ設定の型定義
 */
export interface LoggerConfig {
  environment: 'development' | 'production';
  level: LogLevel;
  bufferSize: number;
  flushInterval: number;
  version: string;
}

/**
 * ロガーインターフェース
 * 全てのロガー実装が従う共通インターフェース
 */
export interface Logger {
  debug(message: string, meta?: LogMeta): void;
  info(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  error(message: string, meta?: LogMeta): void;
}
```

#### 1.3 設定システムの実装

**ファイル: `api/src/logger/config.ts`**

```typescript
import { LoggerConfig, LogLevel } from './types';

/**
 * 環境変数からロガー設定を生成
 * @param env 環境変数オブジェクト
 * @returns ロガー設定
 */
export const createLoggerConfig = (env: any): LoggerConfig => {
  const isDevelopment = env.NODE_ENV === 'development';
  
  return {
    environment: isDevelopment ? 'development' : 'production',
    level: (env.LOG_LEVEL as LogLevel) || (isDevelopment ? 'debug' : 'info'),
    bufferSize: Number(env.LOG_BUFFER_SIZE) || (isDevelopment ? 10 : 50),
    flushInterval: Number(env.LOG_FLUSH_INTERVAL) || (isDevelopment ? 1000 : 5000),
    version: env.VERSION || '1.0.0',
  };
};

/**
 * ログレベルの数値変換
 * レベル比較に使用
 */
export const getLogLevelValue = (level: LogLevel): number => {
  switch (level) {
    case 'debug': return 0;
    case 'info': return 1;
    case 'warn': return 2;
    case 'error': return 3;
    default: return 1;
  }
};

/**
 * 現在のログレベルで出力すべきかを判定
 * @param currentLevel 現在のログレベル
 * @param targetLevel 出力対象のレベル
 * @returns 出力すべきかどうか
 */
export const shouldLog = (currentLevel: LogLevel, targetLevel: LogLevel): boolean => {
  return getLogLevelValue(targetLevel) >= getLogLevelValue(currentLevel);
};
```


### フェーズ2: コアロガーの実装（優先度: 高）

#### 2.1 Cloudflare Workers最適化ロガー

**ファイル: `api/src/logger/cloudflare-logger.ts`**

```typescript
import { Logger, LogLevel, LogEntry, LogMeta, LoggerConfig } from './types';
import { shouldLog } from './config';

/**
 * Cloudflare Workers環境向けに最適化されたロガー
 * バッファリングと非同期処理によりパフォーマンスを最適化
 */
export class CloudflareLogger implements Logger {
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: LoggerConfig) {
    this.config = config;
    this.setupPeriodicFlush();
  }

  /**
   * DEBUGレベルのログを出力
   */
  debug(message: string, meta: LogMeta = {}): void {
    this.log('debug', message, meta);
  }

  /**
   * INFOレベルのログを出力
   */
  info(message: string, meta: LogMeta = {}): void {
    this.log('info', message, meta);
  }

  /**
   * WARNレベルのログを出力
   */
  warn(message: string, meta: LogMeta = {}): void {
    this.log('warn', message, meta);
  }

  /**
   * ERRORレベルのログを出力
   */
  error(message: string, meta: LogMeta = {}): void {
    this.log('error', message, meta);
  }

  /**
   * 内部ログ処理メソッド
   */
  private log(level: LogLevel, message: string, meta: LogMeta): void {
    // ログレベルチェック
    if (!shouldLog(this.config.level, level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId: meta.requestId || crypto.randomUUID(),
      environment: this.config.environment,
      service: 'saifuu-api',
      version: this.config.version,
      meta
    };

    if (this.config.environment === 'development') {
      // 開発環境では即座にコンソール出力
      console.log(JSON.stringify(entry, null, 2));
    } else {
      // 本番環境ではバッファリング
      this.buffer.push(entry);
      
      // バッファサイズが上限に達したら即座にフラッシュ
      if (this.buffer.length >= this.config.bufferSize) {
        this.flushBuffer();
      }
    }
  }


  /**
   * 定期的なフラッシュの設定
   */
  private setupPeriodicFlush(): void {
    if (this.config.environment === 'production') {
      this.flushTimer = setInterval(() => {
        this.flushBuffer();
      }, this.config.flushInterval);
    }
  }

  /**
   * バッファの内容を出力
   */
  private async flushBuffer(): Promise<void> {
    if (this.buffer.length === 0) return;
    
    const entries = [...this.buffer];
    this.buffer = [];
    
    try {
      // 本番環境では適切なログ出力先へ送信
      // 現在はコンソール出力（将来的に外部ログサービスへ拡張可能）
      entries.forEach(entry => {
        console.log(JSON.stringify(entry));
      });
    } catch (error) {
      console.error('Failed to flush logs:', error);
      // エラー時は標準出力にフォールバック
      entries.forEach(entry => console.log(JSON.stringify(entry)));
    }
  }

  /**
   * リソースのクリーンアップ
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flushBuffer();
  }
}
```

#### 2.2 ロガーファクトリー

**ファイル: `api/src/logger/factory.ts`**

```typescript
import { CloudflareLogger } from './cloudflare-logger';
import { Logger, LoggerConfig } from './types';
import { createLoggerConfig } from './config';

/**
 * ロガーインスタンスの作成・管理
 */
export class LoggerFactory {
  private static instance: Logger | null = null;
  private static config: LoggerConfig | null = null;

  /**
   * ロガーインスタンスを取得
   * @param env 環境変数（初回作成時のみ必要）
   * @returns ロガーインスタンス
   */
  static getInstance(env?: any): Logger {
    if (!this.instance) {
      if (!env) {
        throw new Error('Environment variables required for logger initialization');
      }
      
      this.config = createLoggerConfig(env);
      this.instance = new CloudflareLogger(this.config);
    }
    
    return this.instance;
  }

  /**
   * ロガーインスタンスをリセット
   * テスト時に使用
   */
  static reset(): void {
    if (this.instance && 'destroy' in this.instance) {
      (this.instance as CloudflareLogger).destroy();
    }
    this.instance = null;
    this.config = null;
  }

  /**
   * 現在の設定を取得
   */
  static getConfig(): LoggerConfig | null {
    return this.config;
  }
}

/**
 * ロガーインスタンスを取得するヘルパー関数
 */
export const createLogger = (env?: any): Logger => {
  return LoggerFactory.getInstance(env);
};
```

### ✅ フェーズ3: Honoミドルウェアの実装（完了 - 2025年7月8日）

#### 3.1 ログミドルウェア

**ファイル: `api/src/middleware/logging.ts`** ✅ **実装完了**

実装済みミドルウェアの主要機能：

- **自動リクエスト追跡**: 全APIリクエストにユニークなリクエストID生成
- **レスポンス時間測定**: ミリ秒精度での処理時間追跡  
- **構造化ログ**: JSON形式で日本語メッセージとメタデータ
- **エラーハンドリング**: 例外とHTTPエラーレスポンスを区別
- **操作タイプ判定**: HTTP method（GET/POST/PUT/DELETE）から自動判定
- **型安全なヘルパー**: `getLogger()`, `getRequestId()`, `logWithContext()`

#### 3.2 実装されたヘルパー関数

```typescript
// Honoコンテキストから型安全にロガーを取得
export const getLogger = (c: Context): Logger

// リクエストIDを取得
export const getRequestId = (c: Context): string

// ロガーコンテキストを取得（ロガー + リクエストID）
export const getLoggerContext = (c: Context): LoggerContext

// コンテキスト付きログ出力（推奨）
export const logWithContext = (
  c: Context,
  level: LogLevel,
  message: string,
  meta?: LogMeta
): void
```

#### 3.3 型安全性の向上

```typescript
// Hono Variables型を拡張
export interface LoggingVariables {
  logger: Logger;
  requestId: string;
}

// 型安全なコンテキスト
export type LoggingContext = Context<Env, string, LoggingVariables>
```

### ✅ フェーズ4: 既存コードとの統合（完了 - 2025年7月8日）

#### 4.1 メインアプリケーションの更新 ✅ **統合完了**

**ファイル: `api/src/index.tsx`**

```typescript
import { Hono } from 'hono';
import { loggingMiddleware } from './middleware/logging';
import { createLogger } from './logger/factory';

const app = new Hono();

// ログミドルウェアを全APIルートに適用
app.use('/api/*', loggingMiddleware);

// 既存のミドルウェア（データベース接続など）
app.use('/api/*', async (c, next) => {
  const logger = c.get('logger');
  const requestId = c.get('requestId');
  
  try {
    logger.debug('Database middleware started', { requestId });
    
    // 既存のデータベース接続処理
    const db = drizzle(c.env.DB, { schema });
    c.set('db', db);
    
    logger.debug('Database connection established', { requestId });
    
    await next();
  } catch (error) {
    logger.error('Database middleware failed', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
});

// グローバルエラーハンドラーの強化
app.onError((error, c) => {
  const logger = c.get('logger');
  const requestId = c.get('requestId');
  
  logger.error('Unhandled error', {
    requestId,
    error: error.message,
    stack: error.stack,
    path: c.req.path,
    method: c.req.method,
  });
  
  return c.json({ 
    error: 'Internal server error',
    requestId 
  }, 500);
});

// 既存のルートをインポート
// ...
```

#### 4.2 既存APIルートの更新

**ファイル: `api/src/routes/subscriptions.ts`**

```typescript
import { Hono } from 'hono';
import { getLogger, getRequestId } from '../middleware/logging';

const app = new Hono();

// サブスクリプション一覧取得
app.get('/subscriptions', async (c) => {
  const logger = getLogger(c);
  const requestId = getRequestId(c);
  const db = c.get('db');
  
  try {
    logger.info('Fetching subscriptions', { 
      requestId,
      operationType: 'read'
    });
    
    const subscriptions = await db.query.subscriptions.findMany();
    
    logger.info('Subscriptions fetched successfully', {
      requestId,
      count: subscriptions.length,
      operationType: 'read'
    });
    
    return c.json(subscriptions);
  } catch (error) {
    logger.error('Failed to fetch subscriptions', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      operationType: 'read'
    });
    
    return c.json({ 
      error: 'Failed to fetch subscriptions',
      requestId 
    }, 500);
  }
});

// サブスクリプション作成
app.post('/subscriptions', async (c) => {
  const logger = getLogger(c);
  const requestId = getRequestId(c);
  const db = c.get('db');
  
  try {
    const body = await c.req.json();
    
    logger.info('Creating subscription', {
      requestId,
      operationType: 'write',
      data: body
    });
    
    const result = await db.insert(subscriptions).values(body).returning();
    
    logger.info('Subscription created successfully', {
      requestId,
      operationType: 'write',
      subscriptionId: result[0]?.id
    });
    
    return c.json(result[0], 201);
  } catch (error) {
    logger.error('Failed to create subscription', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      operationType: 'write'
    });
    
    return c.json({ 
      error: 'Failed to create subscription',
      requestId 
    }, 500);
  }
});

export default app;
```

### フェーズ5: テストの実装（優先度: 中）

#### 5.1 ユニットテストの作成

**ファイル: `api/src/logger/__tests__/cloudflare-logger.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CloudflareLogger } from '../cloudflare-logger';
import { LoggerConfig } from '../types';

describe('CloudflareLogger', () => {
  let logger: CloudflareLogger;
  let mockConfig: LoggerConfig;

  beforeEach(() => {
    mockConfig = {
      environment: 'development',
      level: 'debug',
      bufferSize: 10,
      flushInterval: 1000,
      version: '1.0.0',
    };
    
    logger = new CloudflareLogger(mockConfig);
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log debug messages in development environment', () => {
    logger.debug('Test debug message', { requestId: 'test-123' });
    
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Test debug message')
    );
  });


  it('should respect log level filtering', () => {
    const infoLogger = new CloudflareLogger({ ...mockConfig, level: 'info' });
    
    infoLogger.debug('This should not be logged');
    expect(console.log).not.toHaveBeenCalled();
    
    infoLogger.info('This should be logged');
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('This should be logged')
    );
  });
});
```

#### 5.2 統合テストの作成

**ファイル: `api/src/middleware/__tests__/logging.test.ts`**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import { loggingMiddleware } from '../logging';

describe('Logging Middleware', () => {
  it('should add logger and requestId to context', async () => {
    const app = new Hono();
    app.use('*', loggingMiddleware);
    
    app.get('/test', (c) => {
      const logger = c.get('logger');
      const requestId = c.get('requestId');
      
      expect(logger).toBeDefined();
      expect(requestId).toBeDefined();
      expect(typeof requestId).toBe('string');
      
      return c.json({ success: true });
    });
    
    const res = await app.request('/test');
    expect(res.status).toBe(200);
  });

  it('should log request start and completion', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    const app = new Hono();
    app.use('*', loggingMiddleware);
    app.get('/test', (c) => c.json({ success: true }));
    
    await app.request('/test');
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Request received')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Request completed')
    );
    
    consoleSpy.mockRestore();
  });
});
```

### フェーズ6: 環境設定と最適化（優先度: 低）

#### 6.1 環境変数の設定

**ファイル: `.env.example`**

```bash
# ログ設定
LOG_LEVEL=info
LOG_BUFFER_SIZE=50
LOG_FLUSH_INTERVAL=5000
VERSION=1.0.0

# 開発環境用
NODE_ENV=development
```

**ファイル: `wrangler.toml`**

```toml
# Cloudflare Workers設定にログ関連の環境変数を追加
[vars]
LOG_LEVEL = "info"
LOG_BUFFER_SIZE = "100"
LOG_FLUSH_INTERVAL = "10000"
VERSION = "1.0.0"
```

#### 6.2 package.jsonスクリプトの追加

```json
{
  "scripts": {
    "test:logger": "vitest run src/logger",
    "test:logger:watch": "vitest src/logger",
    "logs:tail": "wrangler tail",
    "logs:clear": "echo 'Clearing log buffers...' && npm run deploy"
  }
}
```

## 実装ステータス

### ✅ フェーズ1: 基盤構築（完了）
- [x] プロジェクト構造の準備
- [x] 型定義の実装（`api/src/logger/types.ts`）
- [x] 設定システムの実装（`api/src/logger/config.ts`）

### ✅ フェーズ2: コアロガーの実装（完了）
- [x] CloudflareLoggerの実装（`api/src/logger/cloudflare-logger.ts`）
- [x] ロガーファクトリーの実装（`api/src/logger/factory.ts`）
- [x] ユニットテストの作成（19+16テストケース、100%カバレッジ）

### ✅ フェーズ3: ミドルウェアの実装（完了 - 2025年7月8日）
- [x] Honoログミドルウェアの実装（`api/src/middleware/logging.ts`）
- [x] 既存コードとの統合
  - [x] メインアプリケーション（`api/src/index.tsx`）
  - [x] カテゴリールート（`api/src/routes/categories.ts`）
  - [x] サブスクリプションルート（`api/src/routes/subscriptions.ts`）
- [x] 統合テストの作成（15テストケース）
- [x] E2Eテストでの動作確認（12/12テスト通過）

### 🔄 フェーズ4: 最適化と文書化（進行中）
- [x] パフォーマンスの最適化
- [x] 環境設定の調整
- [ ] 使用方法ドキュメントの作成

## 品質チェックリスト

### ✅ 実装品質（完了）
- [x] 型安全性の確保（TypeScript 100%、型エラーなし）
- [x] エラーハンドリングの網羅（構造化エラーログ、スタックトレース対応）
- [x] パフォーマンスの最適化（リクエスト追跡、レスポンス時間測定）

### ✅ テスト品質（完了）
- [x] ユニットテストカバレッジ 80%以上（50テストケース：ロガー35+ミドルウェア15）
- [x] 統合テストの実装（APIルートとミドルウェア連携テスト）
- [x] エラーケースのテスト（バリデーション、DB、アプリケーションエラー）
- [x] E2Eテスト（12テストケース、実運用シナリオ）

### 🔄 運用品質（進行中）
- [x] ログの可読性（JSON構造化ログ、日本語メッセージ）
- [ ] 監視・アラートの設定（将来的にCloudflare Analytics連携）
- [x] ドキュメントの整備（実装計画、ミドルウェアREADME）
- [ ] 運用手順の明確化（使用方法ガイド作成予定）

## 注意事項

### 1. 既存コードへの影響
- 既存のAPI動作を変更しない
- 段階的な導入でリスクを最小化
- ロールバック計画の準備

### 2. パフォーマンス
- Cloudflare Workers の制限を考慮
- CPU使用量の監視
- メモリ使用量の最適化


### 3. 保守性
- 明確なコードコメント
- 適切なエラーメッセージ
- 変更しやすい設計

## 🎉 実装完了サマリー（2025年7月8日）

### ✅ 完了した実装

**APIロガー フェーズ3が正常完了し、包括的なログシステムが稼働中です。**

#### 実装済み機能
- **🏗️ フェーズ1-2**: 基盤・コアロガー（CloudflareLogger, LoggerFactory）
- **🔧 フェーズ3**: Honoミドルウェア統合（自動リクエスト追跡・エラーハンドリング）
- **🔗 フェーズ4**: 既存コード統合（categories, subscriptions API）

#### 品質保証結果
- **✅ テスト**: 76/76 ユニットテスト + 12/12 E2Eテスト通過
- **✅ 型安全性**: TypeScript エラーなし
- **✅ コード品質**: Biome リント通過
- **✅ パフォーマンス**: レスポンス時間測定（平均 0-2ms オーバーヘッド）

#### ログ出力例
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
    "subscriptionId": 1,
    "subscriptionName": "Netflix",
    "amount": 1980,
    "resource": "subscriptions",
    "operationType": "write"
  }
}
```

### 🚀 運用開始

**2025年7月8日より本番環境での運用準備完了**

- **全APIエンドポイント**: 自動ログ記録開始
- **エラー追跡**: 構造化エラーログとスタックトレース
- **パフォーマンス監視**: リクエスト処理時間の自動測定
- **デバッグ支援**: 一意のリクエストIDによるトレーサビリティ

### 📚 関連ドキュメント

- **GitHub PR**: [#161](https://github.com/ryosuke-horie/saifuu/pull/161) 
- **ミドルウェア詳細**: `api/src/middleware/README.md`
- **Issue**: [#111](https://github.com/ryosuke-horie/saifuu/issues/111)

---

この実装により、Saifuuアプリケーションの監視・デバッグ機能が大幅に向上し、本格的な運用体制が整いました。