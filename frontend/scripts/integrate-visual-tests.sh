#!/bin/bash

# ビジュアルテスト統合スクリプト
# 既存のGitHub Actionsワークフローと新しいベースライン管理システムを統合

set -e

# 色付きの出力定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 使用方法の表示
show_usage() {
    cat << EOF
🔧 ビジュアルテスト統合スクリプト

GitHub Actionsワークフローで使用するための統合スクリプトです。
既存の visual-tests.yml ワークフローと新しいベースライン管理システムを連携させます。

使用方法:
  $0 [アクション] [オプション]

アクション:
  pre-test     - テスト実行前の準備
  run-test     - ビジュアルテストの実行
  post-test    - テスト実行後の処理
  artifacts    - アーティファクトの準備
  comment      - PRコメントの生成
  all          - 全工程の実行（デフォルト）

オプション:
  --update-baselines  - ベースライン画像を更新
  --fail-fast        - 最初のエラーで停止
  --verbose          - 詳細ログを出力

環境変数:
  CI_MODE                - CI環境の種類（github-actions|local）
  ENABLE_VISUAL_TESTS    - ビジュアルテスト有効化フラグ
  UPDATE_BASELINES       - ベースライン更新フラグ
  GITHUB_PR_NUMBER      - プルリクエスト番号

例:
  $0 all                          # 全工程を実行
  $0 run-test --verbose           # 詳細ログ付きでテスト実行
  $0 artifacts                    # アーティファクトのみ準備
  $0 comment                     # PRコメントのみ生成

統合対象:
  - GitHub Actions (.github/workflows/visual-tests.yml)
  - Baseline Manager (scripts/baseline-manager.sh)
  - CI Manager (scripts/ci-baseline-manager.sh)
  - Visual Test Config (visual-test.config.json)
EOF
}

# 環境変数の設定
setup_environment() {
    log_info "環境を設定しています..."
    
    # デフォルト値の設定
    export CI_MODE=${CI_MODE:-$([ "$GITHUB_ACTIONS" = "true" ] && echo "github-actions" || echo "local")}
    export ENABLE_VISUAL_TESTS=${ENABLE_VISUAL_TESTS:-"true"}
    export UPDATE_BASELINES=${UPDATE_BASELINES:-"false"}
    export FAIL_FAST=${FAIL_FAST:-"false"}
    export VERBOSE=${VERBOSE:-"false"}
    
    # 作業ディレクトリの確認
    if [ ! -f "package.json" ] || [ ! -d "scripts" ]; then
        log_error "正しいディレクトリで実行してください（frontend/ディレクトリ）"
        exit 1
    fi
    
    # 必要なスクリプトの確認
    for script in "scripts/baseline-manager.sh" "scripts/ci-baseline-manager.sh"; do
        if [ ! -x "$script" ]; then
            log_error "実行可能なスクリプトが見つかりません: $script"
            exit 1
        fi
    done
    
    log_success "環境設定完了"
}

# テスト実行前の準備
pre_test() {
    log_info "テスト実行前の準備を開始します..."
    
    # ベースライン画像の状態確認
    ./scripts/ci-baseline-manager.sh check
    
    # 設定ファイルの検証
    if [ -f "visual-test.config.json" ]; then
        log_info "設定ファイルを検証しています..."
        if node -e "JSON.parse(require('fs').readFileSync('visual-test.config.json', 'utf8'))" >/dev/null 2>&1; then
            log_success "設定ファイルが有効です"
        else
            log_error "設定ファイルが無効です"
            exit 1
        fi
    else
        log_warning "設定ファイルが見つかりません"
    fi
    
    # Storybookのビルド確認
    if [ ! -d "storybook-static" ]; then
        log_info "Storybookをビルドしています..."
        npm run build-storybook
    else
        log_info "Storybookビルドをスキップしました（既存のビルドを使用）"
    fi
    
    log_success "テスト実行前の準備が完了しました"
}

# ビジュアルテストの実行
run_test() {
    log_info "ビジュアルテストを実行しています..."
    
    local test_action="test"
    if [ "$UPDATE_BASELINES" = "true" ]; then
        test_action="update"
        log_info "ベースライン更新モードで実行します"
    fi
    
    # CI用スクリプトでテスト実行
    local test_result=0
    if [ "$VERBOSE" = "true" ]; then
        ./scripts/ci-baseline-manager.sh "$test_action" || test_result=$?
    else
        ./scripts/ci-baseline-manager.sh "$test_action" 2>&1 | grep -E "(INFO|SUCCESS|WARNING|ERROR)" || test_result=$?
    fi
    
    # 結果の判定
    if [ $test_result -eq 0 ]; then
        log_success "ビジュアルテストが成功しました"
    else
        log_warning "ビジュアルテストで差分が検出されました（終了コード: $test_result）"
        
        if [ "$FAIL_FAST" = "true" ]; then
            log_error "fail-fastモードのため実行を停止します"
            exit $test_result
        fi
    fi
    
    return $test_result
}

# テスト実行後の処理
post_test() {
    log_info "テスト実行後の処理を開始します..."
    
    # ベースライン状態の最終確認
    ./scripts/baseline-manager.sh status
    
    # 整合性の検証
    if ./scripts/baseline-manager.sh validate; then
        log_success "ベースライン画像の整合性が確認されました"
    else
        log_warning "ベースライン画像に問題がある可能性があります"
    fi
    
    log_success "テスト実行後の処理が完了しました"
}

# アーティファクトの準備
prepare_artifacts() {
    log_info "アーティファクトを準備しています..."
    
    # CI用スクリプトでアーティファクト準備
    ./scripts/ci-baseline-manager.sh artifacts
    
    # 追加のメタデータファイル作成
    create_metadata
    
    log_success "アーティファクトの準備が完了しました"
}

# メタデータファイルの作成
create_metadata() {
    local metadata_file="visual-test-artifacts/metadata.json"
    
    cat > "$metadata_file" << EOF
{
  "version": "1.0.0",
  "generated_at": "$(date -Iseconds)",
  "environment": {
    "ci_mode": "$CI_MODE",
    "node_version": "$(node --version)",
    "npm_version": "$(npm --version)",
    "os": "$(uname -s)",
    "arch": "$(uname -m)"
  },
  "git_info": {
    "branch": "${GITHUB_REF_NAME:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")}",
    "commit": "${GITHUB_SHA:-$(git rev-parse HEAD 2>/dev/null || echo "unknown")}",
    "commit_message": "$(git log -1 --pretty=%B 2>/dev/null || echo "unknown")",
    "author": "$(git log -1 --pretty=%an 2>/dev/null || echo "unknown")",
    "pr_number": "${GITHUB_PR_NUMBER:-}"
  },
  "test_config": {
    "enable_visual_tests": "$ENABLE_VISUAL_TESTS",
    "update_baselines": "$UPDATE_BASELINES",
    "fail_fast": "$FAIL_FAST",
    "verbose": "$VERBOSE"
  },
  "package_info": {
    "name": "$(node -p "require('./package.json').name" 2>/dev/null || echo "unknown")",
    "version": "$(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")"
  }
}
EOF
    
    log_info "メタデータファイルを作成しました: $metadata_file"
}

# PRコメントの生成
generate_pr_comment() {
    log_info "PRコメントを生成しています..."
    
    if [ "$CI_MODE" = "github-actions" ] && [ -n "$GITHUB_PR_NUMBER" ]; then
        ./scripts/ci-baseline-manager.sh comment
        log_success "PRコメントが生成されました"
    else
        log_info "PR環境ではないため、コメント生成をスキップしました"
    fi
}

# 全工程の実行
run_all() {
    log_info "ビジュアルテストの全工程を実行します..."
    
    local overall_result=0
    
    # 実行工程
    pre_test || overall_result=$?
    
    if [ $overall_result -eq 0 ] || [ "$FAIL_FAST" != "true" ]; then
        run_test || overall_result=$?
    fi
    
    if [ $overall_result -eq 0 ] || [ "$FAIL_FAST" != "true" ]; then
        post_test || overall_result=$?
    fi
    
    prepare_artifacts || overall_result=$?
    generate_pr_comment || overall_result=$?
    
    # 最終結果の表示
    if [ $overall_result -eq 0 ]; then
        log_success "全工程が正常に完了しました"
    else
        log_error "一部の工程でエラーが発生しました（終了コード: $overall_result）"
    fi
    
    return $overall_result
}

# コマンドライン引数の解析
ACTION="all"
UPDATE_BASELINES="false"
FAIL_FAST="false"
VERBOSE="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        pre-test|run-test|post-test|artifacts|comment|all)
            ACTION=$1
            shift
            ;;
        --update-baselines)
            UPDATE_BASELINES="true"
            shift
            ;;
        --fail-fast)
            FAIL_FAST="true"
            shift
            ;;
        --verbose)
            VERBOSE="true"
            shift
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
        *)
            log_error "不明なオプション: $1"
            show_usage
            exit 1
            ;;
    esac
done

# 環境変数のエクスポート
export UPDATE_BASELINES FAIL_FAST VERBOSE

# メイン処理
setup_environment

case "$ACTION" in
    "pre-test")
        pre_test
        ;;
    "run-test")
        run_test
        ;;
    "post-test")
        post_test
        ;;
    "artifacts")
        prepare_artifacts
        ;;
    "comment")
        generate_pr_comment
        ;;
    "all")
        run_all
        ;;
    *)
        log_error "不正なアクション: $ACTION"
        show_usage
        exit 1
        ;;
esac