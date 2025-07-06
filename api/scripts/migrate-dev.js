#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const dbPath = resolve(projectRoot, 'dev.db');

console.log('🔄 開発環境用データベースマイグレーション開始...');

try {
  // 環境変数でローカルDBパスを設定
  process.env.LOCAL_DB_PATH = dbPath;
  
  console.log(`📍 データベースファイル: ${dbPath}`);
  
  // 既存のdev.dbがある場合、バックアップを作成してから削除
  if (existsSync(dbPath)) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${dbPath}.backup.${timestamp}`;
      console.log(`💾 既存DBをバックアップ: ${backupPath}`);
      execSync(`cp "${dbPath}" "${backupPath}"`);
      console.log(`🗑️ 古いDBファイルを削除: ${dbPath}`);
      execSync(`rm "${dbPath}"`);
    } catch (backupError) {
      console.error('❌ バックアップ処理中にエラーが発生しました:', backupError.message);
      console.log('⚠️  バックアップをスキップして続行します...');
    }
  }

  // マイグレーション実行
  console.log('🏃 マイグレーション実行中...');
  try {
    execSync('npx drizzle-kit migrate', { 
      stdio: 'inherit',
      cwd: projectRoot,
      env: { ...process.env, LOCAL_DB_PATH: dbPath }
    });
    console.log('✅ マイグレーション完了');
  } catch (migrationError) {
    console.error('❌ マイグレーション実行中にエラーが発生しました:', migrationError.message);
    throw migrationError;
  }

  // シードデータの投入
  const seedFile = resolve(projectRoot, 'drizzle', 'seed.sql');
  const skipSeed = process.env.SKIP_SEED === 'true';
  
  if (skipSeed) {
    console.log('⏭️  シードデータ投入をスキップしました（SKIP_SEED=true）');
  } else if (existsSync(seedFile)) {
    console.log('🌱 シードデータ投入中...');
    try {
      // シードファイルの内容を読み取って適用
      const seedContent = readFileSync(seedFile, 'utf8');
      console.log(`📄 シードファイル: ${seedFile}`);
      
      // SQLiteに直接適用
      execSync(`sqlite3 "${dbPath}" < "${seedFile}"`, {
        stdio: 'inherit',
        cwd: projectRoot
      });
      
      console.log('✅ シードデータの投入完了');
    } catch (seedError) {
      console.error('❌ シードデータ投入中にエラーが発生しました:', seedError.message);
      console.log('💡 手動でシードデータを投入してください:');
      console.log(`   sqlite3 "${dbPath}" < "${seedFile}"`);
    }
  } else {
    console.log('⚠️  シードファイルが見つかりません:', seedFile);
  }

  // 接続テスト
  console.log('🔍 データベース接続テスト...');
  try {
    execSync(`sqlite3 "${dbPath}" "SELECT name FROM sqlite_master WHERE type='table';"`, {
      stdio: 'inherit'
    });
    console.log('✅ データベース接続テスト完了');
  } catch (testError) {
    console.error('❌ データベース接続テスト中にエラーが発生しました:', testError.message);
    console.log('⚠️  データベースファイルが正しく作成されていない可能性があります');
  }

  console.log('🎉 開発環境データベースのセットアップが完了しました！');
  console.log(`📂 データベースファイル: ${dbPath}`);
  
  // 使用方法の案内
  console.log('\n📚 使用方法:');
  console.log('  - スキップオプション: SKIP_SEED=true npm run db:migrate:dev');
  console.log('  - DBスタジオ: npm run db:studio:dev');
  console.log('  - 完全リセット: npm run db:reset:dev');
  
} catch (error) {
  console.error('❌ セットアップ中にエラーが発生しました:', error.message);
  console.log('\n🔧 トラブルシューティング:');
  console.log('  1. Node.jsのバージョンを確認してください (Node.js 22推奨)');
  console.log('  2. sqlite3コマンドがインストールされているか確認してください');
  console.log('  3. 権限問題の場合は、プロジェクトディレクトリの書き込み権限を確認してください');
  process.exit(1);
}