import { build } from 'esbuild';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ESモジュールで__dirnameを取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ビルド対象のエントリーポイント
const entryPoints = [
  'parse-ci-comment.ts',
  'workflow-trigger.ts'
];

// ビルド設定
async function buildScripts() {
  try {
    await build({
      entryPoints: entryPoints.map(file => resolve(__dirname, file)),
      bundle: true,
      outdir: resolve(__dirname, 'dist'),
      platform: 'node',
      target: 'node18',
      format: 'esm',
      sourcemap: true,
      external: ['@actions/core', '@actions/github'],
      logLevel: 'info'
    });
    
    console.log('✅ ビルドが完了しました');
  } catch (error) {
    console.error('❌ ビルドエラー:', error);
    process.exit(1);
  }
}

buildScripts();