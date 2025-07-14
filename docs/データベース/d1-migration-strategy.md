# Drizzle ORM + Cloudflare D1 移行戦略書

## 🔍 現在の問題

### 根本原因
- **better-sqlite3**がVite + Cloudflare Workers環境で動作しない
- `__filename is not defined`エラーが発生（Cloudflare Workers環境ではNode.jsグローバルが使用不可）
- 開発環境でAPIサーバーが500エラーを返す

### 影響範囲
- フロントエンド（localhost:3000/subscriptions）でAPIデータ取得不可
- useSubscriptions・useCategories フックがエラー
- サブスクリプション管理画面が機能停止

## 📋 技術スタックの現状分析

### 現在の構成
```
┌─────────────────┬──────────────────┬─────────────────┐
│ レイヤー        │ 現在の技術       │ 問題点          │
├─────────────────┼──────────────────┼─────────────────┤
│ フレームワーク  │ Hono + Vite      │ ✅ 問題なし     │
│ ORM             │ Drizzle ORM      │ ✅ 問題なし     │
│ 開発DB          │ better-sqlite3   │ ❌ Workers不対応│
│ 本番DB          │ Cloudflare D1    │ ✅ 問題なし     │
│ バンドラー      │ @cloudflare/vite │ ✅ 問題なし     │
└─────────────────┴──────────────────┴─────────────────┘
```

### DrizzleのDBアダプター概念
DrizzleはDBアダプターのコア設計を採用：
- `drizzle-orm/better-sqlite3` - Node.js環境用
- `drizzle-orm/d1` - Cloudflare Workers用
- `drizzle-orm/sqlite-proxy` - HTTP API用

## 🎯 解決戦略

### アプローチ1: 環境別アダプター分岐（推奨）
```typescript
// 開発環境: wranglerのローカルD1を使用
// 本番環境: Cloudflare D1を使用
function createDatabase(env?: any) {
  if (process.env.NODE_ENV === 'development') {
    // wranglerが作成するローカルD1インスタンスを使用
    return drizzle(env.DB, { schema });
  } else {
    // 本番のCloudflare D1を使用
    return drizzle(env.DB, { schema });
  }
}
```

### アプローチ2: Wrangler devの完全活用
- `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite` を利用
- drizzle-kit studioでの可視化対応
- 環境分岐なしで統一的なD1アクセス

## 🔧 実装計画

### Phase 1: 基盤設定
1. **wrangler.jsonc の D1設定確認/修正**
   ```json
   {
     "d1_databases": [{
       "binding": "DB",
       "database_name": "saifuu-dev",
       "database_id": "your-database-id",
       "migrations_dir": "drizzle/migrations"
     }]
   }
   ```

2. **drizzle.config.ts の環境分岐設定**
   ```typescript
   export default process.env.LOCAL_DB_PATH ? {
     schema: './src/db/schema.ts',
     dialect: 'sqlite',
     dbCredentials: { url: process.env.LOCAL_DB_PATH }
   } : defineConfig({
     schema: './src/db/schema.ts',
     dialect: 'sqlite',
     driver: 'd1-http',
     // ...
   });
   ```

3. **package.json スクリプト追加**
   ```json
   {
     "scripts": {
       "db:studio": "LOCAL_DB_PATH=$(find .wrangler/state/v3/d1 -name '*.sqlite' -type f | head -n 1) drizzle-kit studio",
       "db:migrate:local": "wrangler d1 migrations apply saifuu-dev --local",
       "db:migrate:remote": "wrangler d1 migrations apply saifuu-dev --remote"
     }
   }
   ```

### Phase 2: データベース接続修正
1. **src/db/index.ts のリファクタリング**
   - better-sqlite3依存を除去
   - drizzle/d1 アダプターのみ使用
   - 環境変数ベースの分岐ロジック

2. **src/index.tsx のミドルウェア修正**
   - 環境判定ロジックの更新
   - エラーハンドリングの改善

### Phase 3: 検証とテスト
1. **ローカル開発環境での動作確認**
   - wrangler dev での起動
   - API エンドポイントのテスト
   - フロントエンド連携確認

2. **データベースマイグレーション**
   - 既存スキーマの移行
   - テストデータの投入

3. **統合テストの更新**
   - D1環境でのテスト実行
   - CI/CDパイプラインの調整

## 📊 期待される効果

### ✅ 解決される問題
- better-sqlite3のCloudflare Workers非対応問題
- 開発環境でのAPI 500エラー
- フロントエンドのデータ取得エラー

### ⚡ 追加の利点
- **統一された開発体験**: 本番と同じD1環境での開発
- **Drizzle Studio対応**: GUIでのデータベース管理
- **型安全性の向上**: Drizzle ORMの全機能活用
- **デプロイの簡素化**: 環境差異の最小化

## 🚨 注意点とリスク

### リスク評価
- **低リスク**: Drizzle ORMのアダプター変更のみ
- **中リスク**: 既存データの移行作業
- **対策**: 段階的な移行とロールバック計画

### 移行時の考慮事項
1. **データ互換性**: 現在のSQLiteデータの移行
2. **テスト環境**: E2E テストでのD1対応
3. **CI/CD**: GitHub Actions でのwrangler設定

## 📅 実装タイムライン

```
Week 1: Phase 1 (基盤設定)
├── Day 1-2: wrangler.jsonc + drizzle.config.ts
├── Day 3-4: package.json scripts
└── Day 5: 初期動作確認

Week 2: Phase 2 (コア修正)
├── Day 1-3: db/index.ts リファクタリング
├── Day 4-5: ミドルウェア修正
└── Weekend: テスト実行

Week 3: Phase 3 (検証・最適化)
├── Day 1-2: フロントエンド連携テスト
├── Day 3-4: パフォーマンス最適化
└── Day 5: ドキュメント更新
```

## 🔄 ロールバック計画

緊急時の復旧手順：
1. `vite.config.ts` を元に戻す
2. `src/db/index.ts` のbetter-sqlite3版を復元
3. `.env` 設定でフォールバック先を指定

---

この戦略により、Cloudflare D1を活用した安定した開発環境を構築し、本番環境との一貫性を保ちながら開発効率を向上させることができます。