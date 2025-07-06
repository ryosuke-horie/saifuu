# APIロガー設計

## 概要

Saifuu家計管理アプリケーションのAPIロギングシステムの設計仕様書です。Cloudflare Workers環境での高性能な構造化ログ機能を提供し、財務データのプライバシーを保護しながら、包括的な監査証跡を実現します。

## 設計目標

### 1. パフォーマンス最適化
- Cloudflare Workers のCPU時間制限（50ms-30s）内での効率的な動作
- コールドスタート時間の最小化
- 非同期処理によるレスポンス時間への影響軽減

### 2. 財務データプライバシー
- 金額データの自動マスキング
- 個人情報の適切な保護
- PCI DSS・GDPR準拠

### 3. 開発・運用効率化
- 構造化ログによる分析・検索の容易性
- 開発環境と本番環境の適切な分離
- 既存コードベースとの最小限の統合

## アーキテクチャ設計

### 1. コアインターフェース

```typescript
// src/logger/types.ts
export interface Logger {
  debug(message: string, meta?: LogMeta): void;
  info(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  error(message: string, meta?: LogMeta): void;
}

export interface LogMeta {
  requestId?: string;
  userId?: string;
  operationType?: 'read' | 'write' | 'delete';
  duration?: number;
  path?: string;
  method?: string;
  statusCode?: number;
  maskedData?: Record<string, any>;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  requestId: string;
  environment: 'development' | 'production';
  service: 'saifuu-api';
  version: string;
  meta: LogMeta;
}
```

### 2. Cloudflare Workers最適化ロガー

```typescript
// src/logger/cloudflare-logger.ts
class CloudflareLogger implements Logger {
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private readonly MAX_BUFFER_SIZE = 50;
  private readonly FLUSH_INTERVAL = 5000;

  constructor(config: LoggerConfig) {
    this.config = config;
    this.setupPeriodicFlush();
  }

  private async log(level: LogLevel, message: string, meta: LogMeta = {}): Promise<void> {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId: meta.requestId || crypto.randomUUID(),
      environment: this.config.environment,
      service: 'saifuu-api',
      version: this.config.version,
      meta: this.sanitizeMeta(meta)
    };

    if (this.config.environment === 'development') {
      console.log(JSON.stringify(entry, null, 2));
    } else {
      this.buffer.push(entry);
      if (this.buffer.length >= this.MAX_BUFFER_SIZE) {
        this.flushBuffer();
      }
    }
  }
}
```

### 3. Honoミドルウェア統合

```typescript
// src/middleware/logging.ts
export const loggingMiddleware = async (c: Context, next: Next) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId });
  
  logger.info('Request received', {
    requestId,
    method: c.req.method,
    path: c.req.path,
    userAgent: c.req.header('User-Agent'),
    ip: c.req.header('CF-Connecting-IP'),
  });

  c.set('logger', logger);
  c.set('requestId', requestId);

  try {
    await next();
    
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      requestId,
      statusCode: c.res.status,
      duration,
      method: c.req.method,
      path: c.req.path,
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Request failed', {
      requestId,
      duration,
      error: error instanceof Error ? error.message : String(error),
      method: c.req.method,
      path: c.req.path,
    });
    throw error;
  }
};
```

## 財務データプライバシー戦略

### 1. データマスキング

```typescript
// src/logger/privacy-masker.ts
export class FinancialDataMasker {
  private static readonly SENSITIVE_FIELDS = [
    'amount', 'balance', 'salary', 'income', 'expense'
  ];
  
  private static readonly PERSONAL_PATTERNS = [
    /\b\d{4}-\d{4}-\d{4}-\d{4}\b/g,  // カード番号
    /\b\d{3}-\d{4}-\d{4}\b/g,        // 電話番号
    /\b[\w\.-]+@[\w\.-]+\.\w+\b/g    // メールアドレス
  ];

  static maskObject(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    const masked = Array.isArray(obj) ? [] : {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (this.SENSITIVE_FIELDS.includes(key.toLowerCase())) {
        masked[key] = this.maskAmount(value);
      } else if (typeof value === 'string') {
        masked[key] = this.maskPersonalInfo(value);
      } else if (typeof value === 'object' && value !== null) {
        masked[key] = this.maskObject(value);
      } else {
        masked[key] = value;
      }
    }
    
    return masked;
  }

  private static maskAmount(value: any): string {
    if (typeof value === 'number') {
      return `***${value.toString().slice(-2)}`;
    }
    return '***';
  }

  private static maskPersonalInfo(text: string): string {
    let masked = text;
    this.PERSONAL_PATTERNS.forEach(pattern => {
      masked = masked.replace(pattern, '***');
    });
    return masked;
  }
}
```

### 2. プライバシー保護方針

#### 金額データ
- 完全な金額ではなく、最後の数桁のみを表示
- 集計値は範囲として記録（例：1000-5000円）

#### 個人情報
- カード番号、電話番号、メールアドレスの自動マスキング
- 取引明細の個人特定情報の除去

#### 監査証跡
- 誰が、いつ、何を操作したかの記録
- データアクセスパターンの追跡
- 異常なアクセスの検出

## パフォーマンス最適化

### 1. Cloudflare Workers制約対応

```typescript
// src/logger/performance-optimizer.ts
export class PerformanceOptimizer {
  private static readonly BUFFER_SIZE = 100;
  private static readonly FLUSH_INTERVAL = 10000;
  
  static async initializeLogger(env: any): Promise<Logger> {
    const config = {
      environment: env.NODE_ENV || 'production',
      version: env.VERSION || '1.0.0',
      bufferSize: this.BUFFER_SIZE,
      flushInterval: this.FLUSH_INTERVAL,
    };
    
    return new CloudflareLogger(config);
  }
  
  static async logAsync(logger: Logger, level: string, message: string, meta: LogMeta): Promise<void> {
    return new Promise((resolve) => {
      setImmediate(() => {
        logger[level](message, meta);
        resolve();
      });
    });
  }
}
```

### 2. 最適化戦略

#### バッファリング
- 複数のログエントリをバッファに蓄積
- 一定サイズまたは時間間隔でバッチ処理

#### 非同期処理
- ログ処理をメインスレッドから分離
- Workers の `ctx.waitUntil()` を活用

#### コールドスタート対応
- 軽量な初期化処理
- 必要最小限のメモリ使用量

## 設定システム

### 1. 環境別設定

```typescript
// src/logger/config.ts
export interface LoggerConfig {
  environment: 'development' | 'production';
  level: 'debug' | 'info' | 'warn' | 'error';
  bufferSize: number;
  flushInterval: number;
  enableMasking: boolean;
  version: string;
}

export const createLoggerConfig = (env: any): LoggerConfig => ({
  environment: env.NODE_ENV === 'development' ? 'development' : 'production',
  level: env.LOG_LEVEL || (env.NODE_ENV === 'development' ? 'debug' : 'info'),
  bufferSize: Number(env.LOG_BUFFER_SIZE) || 50,
  flushInterval: Number(env.LOG_FLUSH_INTERVAL) || 5000,
  enableMasking: env.NODE_ENV === 'production',
  version: env.VERSION || '1.0.0',
});
```

### 2. 環境変数

```bash
# 開発環境
NODE_ENV=development
LOG_LEVEL=debug
LOG_BUFFER_SIZE=10
LOG_FLUSH_INTERVAL=1000

# 本番環境
NODE_ENV=production
LOG_LEVEL=info
LOG_BUFFER_SIZE=100
LOG_FLUSH_INTERVAL=10000
```

## ログレベル戦略

### 1. レベル定義

#### DEBUG
- 詳細なデバッグ情報
- リクエスト/レスポンスの詳細
- 開発環境のみ

#### INFO
- 正常な操作の記録
- CRUD操作の完了
- ヘルスチェック結果

#### WARN
- 回復可能なエラー
- リトライ処理
- パフォーマンス劣化

#### ERROR
- システムエラー
- データベース接続失敗
- 認証・認可エラー

### 2. ログ対象操作

#### 高優先度
- 財務データの作成・更新・削除
- 認証・認可の試行
- データベース接続エラー
- API呼び出し失敗

#### 中優先度
- 定期的なヘルスチェック
- バッチ処理の実行
- 外部API連携

#### 低優先度
- 静的コンテンツの配信
- 正常な読み取り操作

## 既存コードとの統合

### 1. API統合例

```typescript
// src/index.tsx
import { loggingMiddleware } from './middleware/logging';

// ミドルウェアの追加
app.use('/api/*', loggingMiddleware);

// エラーハンドリングの強化
app.onError((error, c) => {
  const logger = c.get('logger');
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    requestId: c.get('requestId'),
    path: c.req.path,
    method: c.req.method,
  });
  
  return c.json({ error: 'Internal server error' }, 500);
});
```

### 2. 個別ルートでの使用

```typescript
// src/routes/subscriptions.ts
app.get('/subscriptions', async (c) => {
  const logger = c.get('logger');
  const requestId = c.get('requestId');
  
  try {
    logger.info('Fetching subscriptions', { requestId });
    
    const subscriptions = await db.query.subscriptions.findMany();
    
    logger.info('Subscriptions fetched successfully', {
      requestId,
      count: subscriptions.length
    });
    
    return c.json(subscriptions);
  } catch (error) {
    logger.error('Failed to fetch subscriptions', {
      requestId,
      error: error.message,
      stack: error.stack
    });
    
    return c.json({ error: 'Failed to fetch subscriptions' }, 500);
  }
});
```

## セキュリティ・コンプライアンス

### 1. PCI DSS要件

#### ログ保持期間
- 最低1年間の保持
- 90日間の即座アクセス可能性

#### アクセス制御
- 認可されたスタッフのみがログにアクセス
- アクセス履歴の記録

#### 改ざん防止
- ログの暗号化
- 不変性の保証

### 2. GDPR準拠

#### データ保護
- 転送時・保存時の暗号化
- 個人データの適切な匿名化

#### データ主体の権利
- アクセス要求への対応
- 消去要求への対応

#### 処理の透明性
- ログ処理の目的明示
- 保持期間の明確化

## 監視・アラート

### 1. 監視対象メトリクス

#### システムメトリクス
- レスポンス時間
- エラー率
- スループット
- CPU使用率

#### ビジネスメトリクス
- 取引量
- 失敗取引率
- ユーザー活動パターン

### 2. アラート設定

#### 緊急レベル
- システムダウン
- データベース接続失敗
- セキュリティインシデント

#### 警告レベル
- パフォーマンス劣化
- 異常なアクセスパターン
- 高エラー率

## 実装フェーズ

### フェーズ1: 基盤構築
1. コアロガーインターフェースの実装
2. Cloudflare Workers最適化ロガーの作成
3. 設定システムの構築

### フェーズ2: 統合
1. Honoミドルウェアの実装
2. 既存API routes への統合
3. エラーハンドリングの強化

### フェーズ3: セキュリティ
1. データマスキング機能の実装
2. プライバシー保護機能の追加
3. コンプライアンス対応

### フェーズ4: 監視・運用
1. 監視ダッシュボードの構築
2. アラート設定
3. 運用手順の確立

## テスト戦略

### 1. ユニットテスト
- ロガーコンポーネントの単体テスト
- データマスキング機能のテスト
- パフォーマンス最適化機能のテスト

### 2. 統合テスト
- Honoミドルウェアとの統合テスト
- データベース操作とのログ連携テスト
- 外部API連携ログのテスト

### 3. E2Eテスト
- 実際のAPI呼び出しでのログ動作確認
- エラーシナリオでのログ生成確認

## 保守・運用

### 1. ログ管理
- 定期的なログローテーション
- 古いログの自動削除
- バックアップ戦略

### 2. パフォーマンス監視
- ログ処理時間の監視
- メモリ使用量の追跡
- バッファサイズの最適化

### 3. セキュリティ監査
- ログアクセスの監査
- データマスキングの有効性確認
- コンプライアンス要件の継続的確認

## 今後の拡張

### 1. 高度な分析
- 機械学習による異常検知
- 使用パターンの分析
- 予測アラート

### 2. 外部連携
- 監視サービスとの連携
- SIEM システムとの統合
- ビジネスインテリジェンスツール連携

### 3. 自動化
- インシデント対応の自動化
- パフォーマンス調整の自動化
- レポート生成の自動化

---

この設計により、Saifuuアプリケーションは堅牢で効率的なログ機能を獲得し、財務データの適切な管理と監査証跡の確保を実現します。