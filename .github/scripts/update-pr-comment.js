#!/usr/bin/env node

/**
 * GitHub PRのコメントを更新または作成するスクリプト
 * 
 * 使用方法:
 * node update-pr-comment.js <identifier> <comment-body>
 * 
 * 環境変数:
 * - GITHUB_TOKEN: GitHub API用の認証トークン
 * - GITHUB_REPOSITORY: オーナー/リポジトリ名（例: owner/repo）
 * - GITHUB_EVENT_PATH: GitHub Actionsのイベントペイロードパス
 * 
 * このスクリプトは特定の識別子を持つコメントを検索し、
 * 存在する場合は更新、存在しない場合は新規作成します。
 */

const fs = require('fs');
const https = require('https');

// コマンドライン引数の検証
if (process.argv.length < 4) {
  console.error('Usage: node update-pr-comment.js <identifier> <comment-body>');
  process.exit(1);
}

const identifier = process.argv[2];
const commentBody = process.argv[3];

// 環境変数の検証
const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
const eventPath = process.env.GITHUB_EVENT_PATH;

if (!token || !repository || !eventPath) {
  console.error('Required environment variables are missing');
  process.exit(1);
}

// GitHub Actionsのイベントペイロードを読み込み
const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
const prNumber = event.pull_request?.number;

if (!prNumber) {
  console.error('Pull request number not found in event payload');
  process.exit(1);
}

const [owner, repo] = repository.split('/');

/**
 * GitHub APIリクエストを送信する汎用関数
 * @param {string} method - HTTPメソッド
 * @param {string} path - APIパス
 * @param {Object} [data] - リクエストボディ
 * @returns {Promise<Object>} - レスポンスデータ
 */
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'node.js',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(responseData ? JSON.parse(responseData) : {});
        } else {
          reject(new Error(`API request failed: ${res.statusCode} ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * 既存のコメントを検索
 * @returns {Promise<Object|null>} - 見つかったコメントまたはnull
 */
async function findExistingComment() {
  try {
    const comments = await makeRequest(
      'GET',
      `/repos/${owner}/${repo}/issues/${prNumber}/comments`
    );

    // 識別子を含むコメントを検索
    const existingComment = comments.find(comment => 
      comment.body.includes(`<!-- ${identifier} -->`)
    );

    return existingComment || null;
  } catch (error) {
    console.error('Error fetching comments:', error);
    return null;
  }
}

/**
 * コメントを作成または更新
 */
async function updateOrCreateComment() {
  try {
    // コメント本文に識別子を追加
    const fullCommentBody = `${commentBody}\n\n<!-- ${identifier} -->`;

    const existingComment = await findExistingComment();

    if (existingComment) {
      // 既存コメントを更新
      console.log(`Updating existing comment with ID: ${existingComment.id}`);
      await makeRequest(
        'PATCH',
        `/repos/${owner}/${repo}/issues/comments/${existingComment.id}`,
        { body: fullCommentBody }
      );
      console.log('Comment updated successfully');
    } else {
      // 新規コメントを作成
      console.log('Creating new comment');
      await makeRequest(
        'POST',
        `/repos/${owner}/${repo}/issues/${prNumber}/comments`,
        { body: fullCommentBody }
      );
      console.log('Comment created successfully');
    }
  } catch (error) {
    console.error('Error updating/creating comment:', error);
    // フォールバック: エラーが発生した場合は従来の方法（新規作成）を試みる
    console.log('Attempting fallback: creating new comment');
    try {
      await makeRequest(
        'POST',
        `/repos/${owner}/${repo}/issues/${prNumber}/comments`,
        { body: `${commentBody}\n\n<!-- ${identifier} -->` }
      );
      console.log('Fallback comment created successfully');
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      process.exit(1);
    }
  }
}

// メイン実行
updateOrCreateComment();