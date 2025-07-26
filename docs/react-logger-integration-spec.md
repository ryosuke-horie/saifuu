# React Logger Integration 仕様書

## 1. 概要 (Overview)

React Logger Integrationは、Saifuuアプリケーションの既存ブラウザログシステムをReactアプリケーションに特化して拡張する機能です。Context API、Hooks、Error Boundaryを活用して、React開発者が効率的にログ機能を利用できるようにします。

### 主な機能
- **Context-based Logger Sharing**: アプリケーション全体でのロガーインスタンス共有
- **Component-specific Logging**: コンポーネント固有のメタデータ自動付与
- **Enhanced Error Boundary**: エラーバウンダリとログシステムの統合
- **Performance Tracking**: React 19並行レンダリング対応のパフォーマンス追跡
- **Automatic Lifecycle Logging**: コンポーネントライフサイクルの自動ログ

## 2. 機能要件 (Functional Requirements)

### 2.1 Context System
- [ ] LoggerProviderコンポーネントは、子コンポーネントにロガーインスタンスを提供できる
- [ ] LoggerScopeコンポーネントは、スコープ固有の設定を適用できる
- [ ] DefaultLoggerProviderコンポーネントは、デフォルト設定でクイックセットアップできる
- [ ] withLoggerProviderは、HOCラッパーとして機能する
- [ ] Provider階層では、設定継承が正しく動作する

### 2.2 React Hooks
- [ ] useLoggerは、基本的なログ機能（info, warn, error, debug）を提供する
- [ ] useComponentLoggerは、コンポーネント名とpropsを自動的にメタデータに追加する
- [ ] useLoggedCallbackは、コールバック関数の実行時間を自動的にログに記録する
- [ ] usePerformanceLoggerは、React 19の並行レンダリングパフォーマンスを追跡する
- [ ] useOptionalLoggerは、コンテキストが存在しない場合でも安全に動作する

### 2.3 Error Boundary
- [ ] LoggedErrorBoundaryは、キャッチしたエラーを自動的にログに記録する
- [ ] エラーごとに一意のエラーIDを生成する
- [ ] 設定可能なリトライメカニズムを提供する
- [ ] カスタマイズ可能なフォールバックUIを表示する
- [ ] useErrorHandlerは、手動エラーハンドリングを支援する

### 2.4 Performance & Memory Management
- [ ] すべてのフックは、React 19並行レンダリングに対応する
- [ ] メモ化戦略により、不要な再レンダリングを防ぐ
- [ ] 適切なクリーンアップ処理により、メモリリークを防ぐ
- [ ] パフォーマンスメトリクスを自動的に収集する

### 2.5 Type Safety
- [ ] すべてのAPI、props、戻り値は完全にTypeScript型定義される
- [ ] ジェネリクスを活用した型安全な設定オプション
- [ ] 開発時のIDEサポート（IntelliSense）を提供する

## 3. UI/API設計

### 3.1 Context API

#### LoggerProvider
```typescript
interface LoggerProviderProps {
  config?: Partial<LoggerConfig>;
  children: React.ReactNode;
  inheritParent?: boolean;
}

const LoggerProvider: React.FC<LoggerProviderProps>
```

#### LoggerScope
```typescript
interface LoggerScopeProps {
  name: string;
  config?: Partial<LoggerConfig>;
  children: React.ReactNode;
}

const LoggerScope: React.FC<LoggerScopeProps>
```

### 3.2 Hooks API

#### useLogger
```typescript
interface UseLoggerReturn {
  info: (message: string, extra?: Record<string, any>) => void;
  warn: (message: string, extra?: Record<string, any>) => void;
  error: (message: string, extra?: Record<string, any>) => void;
  debug: (message: string, extra?: Record<string, any>) => void;
  trackEvent: (event: string, properties?: Record<string, any>) => void;
  trackPageView: (url: string) => void;
}

const useLogger: () => UseLoggerReturn
```

#### useComponentLogger
```typescript
interface UseComponentLoggerReturn extends UseLoggerReturn {
  componentName: string;
  logMount: () => void;
  logUnmount: () => void;
  logUpdate: (prevProps?: any, nextProps?: any) => void;
}

const useComponentLogger: (
  componentName?: string,
  props?: Record<string, any>
) => UseComponentLoggerReturn
```

#### useLoggedCallback
```typescript
const useLoggedCallback: <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  options?: {
    name?: string;
    logArgs?: boolean;
    logResult?: boolean;
  }
) => T
```

#### usePerformanceLogger
```typescript
// パフォーマンスメトリクス機能は将来の実装予定です
// 現在の実装では利用できません
// TODO: v2.0でパフォーマンス監視機能を実装予定
//       - レンダリング時間、メモリ使用量、コンポーネント数の計測
//       - PerformanceMetricsインターフェースの再定義
const usePerformanceLogger: () => {
  startMeasure: (name: string) => void;
  endMeasure: (name: string) => void;
  getMetrics: () => Record<string, unknown>; // 型安全性を保つためRecord型を使用
}
```

### 3.3 Error Boundary API

#### LoggedErrorBoundary
```typescript
interface LoggedErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onRetry?: () => void;
  maxRetries?: number;
  retryDelay?: number;
}

const LoggedErrorBoundary: React.FC<LoggedErrorBoundaryProps>
```

#### useErrorHandler
```typescript
const useErrorHandler: () => (error: Error, errorInfo?: string) => void
```

### 3.4 HOC API

#### withLoggerProvider
```typescript
const withLoggerProvider: <P extends object>(
  Component: React.ComponentType<P>,
  config?: Partial<LoggerConfig>
) => React.ComponentType<P>
```

#### withErrorBoundary
```typescript
const withErrorBoundary: <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<LoggedErrorBoundaryProps>
) => React.ComponentType<P>
```

## 4. 利用例 (Usage Examples)

### 4.1 基本的なセットアップ
```typescript
// app/layout.tsx
import { LoggerProvider } from '@/lib/logger';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <LoggerProvider
          config={{
            environment: process.env.NODE_ENV,
            bufferSize: 50,
          }}
        >
          {children}
        </LoggerProvider>
      </body>
    </html>
  );
}
```

### 4.2 コンポーネントでのログ使用
```typescript
// components/SubscriptionForm.tsx
import { useComponentLogger } from '@/lib/logger';

export const SubscriptionForm: React.FC<Props> = ({ subscription }) => {
  const logger = useComponentLogger('SubscriptionForm', { subscription });

  const handleSubmit = useLoggedCallback(
    async (data: FormData) => {
      logger.info('サブスクリプションフォーム送信開始', { data });
      try {
        await submitSubscription(data);
        logger.info('サブスクリプション送信成功');
      } catch (error) {
        logger.error('サブスクリプション送信失敗', { error });
        throw error;
      }
    },
    [subscription],
    { name: 'handleSubmit', logArgs: true }
  );

  return (
    <form onSubmit={handleSubmit}>
      {/* フォーム内容 */}
    </form>
  );
};
```

### 4.3 エラーバウンダリの使用
```typescript
// app/subscriptions/layout.tsx
import { LoggedErrorBoundary } from '@/lib/logger';

export default function SubscriptionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LoggedErrorBoundary
      fallback={({ error, retry, errorId }) => (
        <div className="error-container">
          <h2>エラーが発生しました</h2>
          <p>エラーID: {errorId}</p>
          <button onClick={retry}>再試行</button>
        </div>
      )}
      maxRetries={3}
      retryDelay={1000}
    >
      {children}
    </LoggedErrorBoundary>
  );
}
```

### 4.4 スコープ固有設定
```typescript
// components/AdminPanel.tsx
import { LoggerScope } from '@/lib/logger';

export const AdminPanel: React.FC = () => {
  return (
    <LoggerScope
      name="admin"
      config={{
        bufferSize: 100,
        logLevel: 'debug',
      }}
    >
      <AdminDashboard />
      <AdminSettings />
    </LoggerScope>
  );
};
```

### 4.5 パフォーマンス追跡
```typescript
// hooks/useExpensiveCalculation.ts
import { usePerformanceLogger } from '@/lib/logger';

export const useExpensiveCalculation = (data: any[]) => {
  const perf = usePerformanceLogger();
  
  return useMemo(() => {
    perf.startMeasure('expensiveCalculation');
    const result = performExpensiveCalculation(data);
    perf.endMeasure('expensiveCalculation');
    return result;
  }, [data, perf]);
};
```

## 5. 環境別設定

### 5.1 開発環境
```typescript
const developmentConfig: LoggerConfig = {
  environment: 'development',
  logLevel: 'debug',
  bufferSize: 10,
  enableConsoleOutput: true,
  enablePerformanceTracking: true,
};
```

### 5.2 本番環境
```typescript
const productionConfig: LoggerConfig = {
  environment: 'production',
  logLevel: 'info',
  bufferSize: 50,
  enableConsoleOutput: false,
  enablePerformanceTracking: false,
  enableBeaconTransport: true,
};
```

### 5.3 テスト環境
```typescript
const testConfig: LoggerConfig = {
  environment: 'test',
  logLevel: 'warn',
  bufferSize: 5,
  enableConsoleOutput: false,
  enablePerformanceTracking: false,
};
```

## 6. テスト戦略

### 6.1 単体テスト
- すべてのHooksの動作確認
- Context系コンポーネントの機能確認
- エラーバウンダリの動作確認
- パフォーマンステストの実行

### 6.2 統合テスト
- Provider階層での設定継承確認
- 異なるスコープでの独立性確認
- エラーバウンダリとロガーの統合確認

### 6.3 E2Eテスト
- 実際のアプリケーションでの動作確認
- ログデータの正確性確認
- パフォーマンス影響の確認

## 7. パフォーマンス考慮事項

### 7.1 メモリ使用量
- Context参照の適切な管理
- ログバッファの効率的な使用
- 不要なリスナーの自動クリーンアップ

### 7.2 レンダリング最適化
- useCallback/useMemoの積極的活用
- 依存配列の最適化
- React 19並行レンダリング対応

### 7.3 非同期処理
- ログ送信の非同期実行
- バックグラウンドでのメトリクス収集
- UI応答性の維持

## 8. 制限事項

### 8.1 技術的制限
- React 19以降での使用を推奨
- TypeScript必須（型安全性のため）
- Context APIの制限に準拠

### 8.2 機能制限
- 1つのアプリケーションで複数のLoggerProviderを使用する場合は設定の競合に注意
- エラーバウンダリはJavaScriptエラーのみキャッチ（非同期エラーは除く）
- パフォーマンス追跡は開発環境でのみ有効

## 9. 関連ADR

- [ADR-001: React Logger Integration Architecture](./adr/001-react-logger-integration.md)

## 10. 参考資料

- [フロントエンドロガー基本設計](./フロントエンドロガー設計.md)
- [フロントエンドロガー実装計画](./フロントエンドロガー実装計画.md)
- [React Context API 公式ドキュメント](https://react.dev/reference/react/useContext)
- [React Error Boundary 公式ドキュメント](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)