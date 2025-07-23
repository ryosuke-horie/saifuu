# Ghost - バックグラウンドプロセスマネージャー使用ガイド

## 概要

Ghostは、Unix系システム（Linux、macOS、BSD）向けのシンプルなバックグラウンドプロセスマネージャーです。デーモンを必要とせず、コマンドをバックグラウンドで実行・管理できます。

このドキュメントでは、Saifuuプロジェクトにおける開発サーバーやその他の長時間実行プロセスの管理方法について説明します。

## インストール方法

### 前提条件

- Unix系システム（Linux、macOS、BSD）
- Rust 1.80以上（2024 edition）

### ソースからビルド

```bash
# リポジトリのクローン
git clone https://github.com/skanehira/ghost.git
cd ghost

# リリースビルド
cargo build --release
```

バイナリは `target/release/ghost` に生成されます。

### システムへのインストール

```bash
# ローカルのbinディレクトリにコピー
cp target/release/ghost ~/.local/bin/

# またはシステムのbinディレクトリにコピー（sudoが必要）
sudo cp target/release/ghost /usr/local/bin/
```

## Saifuuプロジェクトでの使い方

### 開発サーバーの起動

```bash
# フロントエンドの開発サーバーをバックグラウンドで起動
ghost run pnpm run dev

# タスクIDとログファイルの場所が表示される
Started background process:
  Task ID: 83efed6c-ae7d-4c26-8993-5d2d1a83b64f
  PID: 11203
  Log file: /Users/user/Library/Application Support/ghost/logs/83efed6c-ae7d-4c26-8993-5d2d1a83b64f.log
```

### 実行中のプロセス確認

```bash
# すべてのタスクを一覧表示
ghost list

# 実行中のタスクのみ表示
ghost list --status running
```

出力例：
```
Task ID                              PID      Status     Started              Command                        Directory
--------------------------------------------------------------------------------------------------------------------------------------
e56ed5f8-44c8-4905-97aa-651164afd37e 8969     running    2025-07-01 15:36     pnpm run dev                    /home/user/saifuu
```

### ログの確認

```bash
# タスクのログを表示
ghost log e56ed5f8-44c8-4905-97aa-651164afd37e

# リアルタイムでログを追跡（tail -f と同様）
ghost log -f e56ed5f8-44c8-4905-97aa-651164afd37e
```

### タスクの詳細情報

```bash
# タスクの詳細情報を表示
ghost status e56ed5f8-44c8-4905-97aa-651164afd37e
```

出力例：
```
Task: e56ed5f8-44c8-4905-97aa-651164afd37e
PID: 8969
Status: running
Command: pnpm run dev
Working directory: /home/user/saifuu
Started: 2025-07-01 15:36:23
Log file: /Users/user/Library/Application Support/ghost/logs/e56ed5f8-44c8-4905-97aa-651164afd37e.log
```

### プロセスの停止

```bash
# 正常終了（SIGTERM）
ghost stop e56ed5f8-44c8-4905-97aa-651164afd37e

# 強制終了（SIGKILL）
ghost stop e56ed5f8-44c8-4905-97aa-651164afd37e --force
```

### 古いタスクのクリーンアップ

```bash
# 30日以上前のタスクを削除（デフォルト）
ghost cleanup

# 7日以上前のタスクを削除
ghost cleanup --days 7

# すべての終了済みタスクを削除（注意）
ghost cleanup --all

# 削除される内容をプレビュー（実際には削除しない）
ghost cleanup --dry-run
```

## TUIモード

GhostはインタラクティブなTerminal User Interface（TUI）も提供しています：

```bash
# TUIモードの起動
ghost
```

### TUIのキーバインディング

**タスクリスト：**
- `j`/`k`: 選択を上下に移動
- `g`/`G`: リストの先頭/末尾にジャンプ
- `l`: 選択したタスクのログを表示
- `s`: 選択したタスクにSIGTERMを送信
- `Ctrl+K`: 選択したタスクにSIGKILLを送信
- `q`: 終了
- `Tab`: タスクフィルターの切り替え（All/Running/Exited/Killed）

**ログビューア：**
- `j`/`k`: 上下にスクロール
- `h`/`l`: 左右にスクロール（長い行の場合）
- `g`/`G`: 先頭/末尾にジャンプ
- `Esc`: タスクリストに戻る

## 主な機能

- **デーモン不要**: 各コマンドが自己完結型
- **プロセス分離**: タスクは独立したプロセスとして実行
- **ログの永続化**: すべての出力がキャプチャされ保存される
- **ステータス監視**: プロセスチェックによるリアルタイムの状態更新
- **クロスプラットフォーム**: Unix系システムで動作

## 設定

### 環境変数

- `GHOST_DATA_DIR`: デフォルトのデータディレクトリの場所を上書き

### デフォルトの保存場所

**Linux:**
- データ: `$XDG_DATA_HOME/ghost` または `$HOME/.local/share/ghost`
- ログ: `$XDG_DATA_HOME/ghost/logs` または `$HOME/.local/share/ghost/logs`

**macOS:**
- データ: `~/Library/Application Support/ghost/`
- ログ: `~/Library/Application Support/ghost/logs/`

## 実用的な使用例

### 開発時の典型的なワークフロー

```bash
# 1. 開発サーバーをバックグラウンドで起動
ghost run pnpm run dev

# 2. タスクIDを確認
ghost list --status running

# 3. ログをリアルタイムで確認
ghost log -f <task-id>

# 4. 開発終了時にサーバーを停止
ghost stop <task-id>

# 5. 定期的に古いタスクをクリーンアップ
ghost cleanup --days 7
```

### 複数のサービスを管理

```bash
# フロントエンドサーバーを起動
ghost run --cwd /path/to/frontend pnpm run dev

# APIサーバーを起動
ghost run --cwd /path/to/api pnpm run dev

# Storybookを起動
ghost run pnpm run storybook

# すべてのサービスを確認
ghost list --status running
```

## 注意事項

- `pnpm run dev &` のような形式でのバックグラウンド実行は使用しないこと
- ghostを使用することで、プロセスの管理が一元化され、ログの確認や停止が容易になる
- 開発セッションが終了してもプロセスは継続して実行されるため、必要に応じて手動で停止すること