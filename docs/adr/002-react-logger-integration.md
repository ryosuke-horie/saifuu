# ADR-001: React Logger Integration Architecture

- **ステータス**: 承認済
- **日付**: 2025-07-09
- **関連Issue**: #127

## コンテキスト (Context)

Saifuuアプリケーションでは、これまでブラウザベースのログ機能（BrowserLogger）を使用していましたが、React特有のニーズに対応するため、React統合レイヤーの実装が必要となりました。

### 既存の課題
- React Context integrationの欠如によるロガーインスタンス共有の困難
- コンポーネント固有のメタデータを自動付与する仕組みの不在
- エラーバウンダリとログシステムの統合不足
- React 19の並行レンダリングに対応したパフォーマンス最適化の必要性
- コンポーネントライフサイクルイベントの自動ログ機能の不在

### 技術的制約
- 既存のBrowserLoggerとの後方互換性を維持する必要がある
- React 19の新機能（並行レンダリング）に対応する必要がある
- TypeScriptの型安全性を完全に保持する必要がある
- メモリリークを防ぐための適切なリソース管理が必要

## 意思決定 (Decision)

以下のReact統合アーキテクチャを採用することを決定しました：

### 1. Context-Based Architecture
- **LoggerProvider/LoggerContext**: アプリケーション全体でロガーインスタンスを共有
- **Provider階層サポート**: ネストされたProviderでの設定継承を可能にする
- **自動クリーンアップ**: useEffectによる適切なリソース管理

### 2. Hook-Based API Design
- **useLogger**: 基本的なログ機能用フック
- **useComponentLogger**: コンポーネント固有の自動メタデータ付きログ
- **useLoggedCallback**: コールバック関数の自動ログ機能
- **usePerformanceLogger**: React 19パフォーマンス追跡統合
- **useOptionalLogger**: ライブラリコンポーネント用の安全なログ機能

### 3. Enhanced Error Boundary
- **LoggedErrorBoundary**: エラーバウンダリとログシステムの統合
- **リトライメカニズム**: 指数バックオフによる設定可能なリトライ機能
- **カスタマイズ可能なフォールバックUI**: プラガブルなエラー表示コンポーネント
- **エラーID追跡**: デバッグ用の一意なエラー識別

### 4. Performance & Memory Optimization
- **React 19並行レンダリング対応**: 並行機能に最適化されたフック
- **メモ化戦略**: useCallbackとuseMemoの積極的活用
- **メモリリーク防止**: 適切なクリーンアップとリソース管理

## 検討した選択肢 (Considered Options)

### 選択肢1: Higher-Order Component (HOC) アプローチ
**メリット:**
- シンプルな実装
- 既存コンポーネントへの影響最小

**デメリット:**
- React 19の並行レンダリングで非効率
- ネストが深くなりがち
- TypeScript型推論の困難

### 選択肢2: Render Props パターン
**メリット:**
- 柔軟な実装
- 型安全性の確保

**デメリット:**
- コンポーネントの可読性低下
- パフォーマンスの懸念
- 現代的なReactパターンではない

### 選択肢3: Context + Hooks（採用）
**メリット:**
- React 19並行レンダリングに最適
- 型安全性とパフォーマンスの両立
- 現代的なReactパターン
- 拡張性の高い設計

**デメリット:**
- 初期実装コストが高い
- Context APIの理解が必要

## 結果 (Consequences)

### 正の結果
- **開発体験の向上**: 自動ログ機能により開発者の負担軽減
- **型安全性**: 完全なTypeScriptサポート
- **パフォーマンス**: React 19並行レンダリング対応
- **保守性**: 一貫したAPIとテストカバレッジ
- **拡張性**: プラグインアーキテクチャによる将来拡張

### 負の結果
- **学習コスト**: 新しいAPIの習得が必要
- **実装複雑性**: Context管理の複雑さ
- **バンドルサイズ**: 機能拡張によるサイズ増加（軽微）

### 軽減策
- **包括的なドキュメント**: 仕様書とサンプルコード提供
- **段階的移行**: 既存コードは段階的に移行可能
- **テスト戦略**: 157テストによる品質保証

## 参考資料

- [React Context API 公式ドキュメント](https://react.dev/reference/react/useContext)
- [React 19 並行レンダリング](https://react.dev/blog/2024/04/25/react-19)
- [フロントエンドロガー基本設計](../フロントエンドロガー設計.md)
- [React Logger Integration 仕様書](../react-logger-integration-spec.md)