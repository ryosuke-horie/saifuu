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
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${dbPath}.backup.${timestamp}`;
    console.log(`💾 既存DBをバックアップ: ${backupPath}`);
    execSync(`cp "${dbPath}" "${backupPath}"`);
    console.log(`🗑️ 古いDBファイルを削除: ${dbPath}`);
    execSync(`rm "${dbPath}"`);
  }

  // マイグレーション実行
  console.log('🏃 マイグレーション実行中...');
  execSync('npx drizzle-kit migrate', { 
    stdio: 'inherit',
    cwd: projectRoot,
    env: { ...process.env, LOCAL_DB_PATH: dbPath }
  });

  console.log('✅ マイグレーション完了');

  // シードデータの投入
  const seedFile = resolve(projectRoot, 'drizzle', 'seed.sql');
  if (existsSync(seedFile)) {
    console.log('🌱 シードデータ投入中...');
    // シードファイルの内容を読み取って適用
    // ここでは簡単化のため、wranglerコマンドでなくSQLiteに直接適用
    console.log('💡 シードデータの投入は手動で行ってください:');
    console.log(`   sqlite3 "${dbPath}" < "${seedFile}"`);
  }

  // 接続テスト
  console.log('🔍 データベース接続テスト...');
  execSync(`sqlite3 "${dbPath}" "SELECT name FROM sqlite_master WHERE type='table';"`, {
    stdio: 'inherit'
  });

  console.log('🎉 開発環境データベースのセットアップが完了しました！');
  console.log(`📂 データベースファイル: ${dbPath}`);
  
} catch (error) {
  console.error('❌ マイグレーション中にエラーが発生しました:', error.message);
  process.exit(1);
}