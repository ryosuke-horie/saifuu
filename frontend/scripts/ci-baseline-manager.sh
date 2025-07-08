#!/bin/bash

# CI環境用ビジュアルテストベースライン管理スクリプト
# このスクリプトはGitHub ActionsなどのCI環境で使用することを想定しています

set -e

# 環境変数の設定
CI_MODE=${CI_MODE:-"github-actions"}
BASELINE_DIR=${BASELINE_DIR:-"__vis__"}
ARTIFACT_DIR=${ARTIFACT_DIR:-"visual-test-artifacts"}
REPORT_DIR=${REPORT_DIR:-"visual-test-reports"}
UPDATE_BASELINES=${UPDATE_BASELINES:-"false"}
FAIL_ON_CHANGES=${FAIL_ON_CHANGES:-"true"}
FORCE_COLOR=${FORCE_COLOR:-"1"}

# 色付きの出力定義
if [ "$FORCE_COLOR" = "1" ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    NC=''
fi

# ログ関数
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

# GitHub Actionsの出力関数
github_actions_output() {
    local level="$1"
    local title="$2"
    local message="$3"
    
    case "$level" in
        "error")
            echo "::error title=${title}::${message}"
            ;;
        "warning")
            echo "::warning title=${title}::${message}"
            ;;
        "notice")
            echo "::notice title=${title}::${message}"
            ;;
        "debug")
            echo "::debug::${message}"
            ;;
    esac
}

# CI環境の検出
detect_ci_environment() {
    if [ "$GITHUB_ACTIONS" = "true" ]; then
        CI_MODE="github-actions"
        log_info "GitHub Actions環境を検出しました"
    elif [ "$GITLAB_CI" = "true" ]; then
        CI_MODE="gitlab-ci"
        log_info "GitLab CI環境を検出しました"
    elif [ "$JENKINS_URL" != "" ]; then
        CI_MODE="jenkins"
        log_info "Jenkins環境を検出しました"
    else
        CI_MODE="generic"
        log_info "汎用CI環境として実行します"
    fi
}

# ベースライン画像の状態確認
check_baseline_status() {
    log_info "ベースライン画像の状態を確認しています..."
    
    local baseline_count=0
    local diff_count=0
    local new_count=0
    
    if [ -d "$BASELINE_DIR" ]; then
        baseline_count=$(find "$BASELINE_DIR" -name "*.png" -not -name "*-diff.png" -not -name "*-actual.png" | wc -l)
        diff_count=$(find "$BASELINE_DIR" -name "*-diff.png" 2>/dev/null | wc -l)
        new_count=$(find "$BASELINE_DIR" -name "*-actual.png" 2>/dev/null | wc -l)
    fi
    
    log_info "ベースライン画像: $baseline_count 個"
    log_info "差分画像: $diff_count 個"
    log_info "新規画像: $new_count 個"
    
    # GitHub Actionsの環境変数に出力
    if [ "$CI_MODE" = "github-actions" ]; then
        echo "BASELINE_COUNT=$baseline_count" >> "$GITHUB_ENV"
        echo "DIFF_COUNT=$diff_count" >> "$GITHUB_ENV"
        echo "NEW_COUNT=$new_count" >> "$GITHUB_ENV"
        echo "HAS_CHANGES=$( [ $diff_count -gt 0 ] || [ $new_count -gt 0 ] && echo "true" || echo "false" )" >> "$GITHUB_ENV"
    fi
    
    return 0
}

# ベースライン画像の作成
create_baselines() {
    log_info "ベースライン画像を作成しています..."
    
    # 環境変数でビジュアルテストを有効化
    export ENABLE_VISUAL_TESTS=true
    
    # テストの実行
    if npm run test:visual -- --update-snapshots --reporter=verbose; then
        log_success "ベースライン画像の作成が完了しました"
        check_baseline_status
        return 0
    else
        log_error "ベースライン画像の作成に失敗しました"
        return 1
    fi
}

# ビジュアルテストの実行
run_visual_tests() {
    log_info "ビジュアルテストを実行しています..."
    
    # 環境変数でビジュアルテストを有効化
    export ENABLE_VISUAL_TESTS=true
    
    # テストの実行
    local test_exit_code=0
    if ! npm run test:visual -- --run --reporter=verbose; then
        test_exit_code=$?
        log_warning "ビジュアルテストで差分が検出されました（終了コード: $test_exit_code）"
    else
        log_success "ビジュアルテストが成功しました"
    fi
    
    # 結果の確認
    check_baseline_status
    
    return $test_exit_code
}

# アーティファクトの準備
prepare_artifacts() {
    log_info "アーティファクトを準備しています..."
    
    # アーティファクトディレクトリの作成
    mkdir -p "$ARTIFACT_DIR"
    
    # ベースライン画像のコピー
    if [ -d "$BASELINE_DIR" ]; then
        cp -r "$BASELINE_DIR" "$ARTIFACT_DIR/baselines"
        log_info "ベースライン画像をコピーしました"
    fi
    
    # 差分画像の確認とコピー
    if [ -d "$BASELINE_DIR" ]; then
        local diff_files=($(find "$BASELINE_DIR" -name "*-diff.png" 2>/dev/null))
        local actual_files=($(find "$BASELINE_DIR" -name "*-actual.png" 2>/dev/null))
        
        if [ ${#diff_files[@]} -gt 0 ] || [ ${#actual_files[@]} -gt 0 ]; then
            mkdir -p "$ARTIFACT_DIR/diffs"
            
            for file in "${diff_files[@]}"; do
                cp "$file" "$ARTIFACT_DIR/diffs/"
            done
            
            for file in "${actual_files[@]}"; do
                cp "$file" "$ARTIFACT_DIR/diffs/"
            done
            
            log_info "差分画像をコピーしました"
        fi
    fi
    
    # テストレポートの準備
    if [ -f "visual-test.config.json" ]; then
        cp "visual-test.config.json" "$ARTIFACT_DIR/config.json"
    fi
    
    # サマリーレポートの作成
    create_summary_report
    
    log_success "アーティファクトの準備が完了しました"
}

# サマリーレポートの作成
create_summary_report() {
    local report_file="$ARTIFACT_DIR/summary.json"
    local baseline_count=${BASELINE_COUNT:-0}
    local diff_count=${DIFF_COUNT:-0}
    local new_count=${NEW_COUNT:-0}
    
    cat > "$report_file" << EOF
{
  "version": "1.0.0",
  "timestamp": "$(date -Iseconds)",
  "ci_environment": "$CI_MODE",
  "git_info": {
    "branch": "${GITHUB_REF_NAME:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")}",
    "commit": "${GITHUB_SHA:-$(git rev-parse HEAD 2>/dev/null || echo "unknown")}",
    "pr_number": "${GITHUB_PR_NUMBER:-}"
  },
  "test_results": {
    "baseline_count": $baseline_count,
    "diff_count": $diff_count,
    "new_count": $new_count,
    "has_changes": $( [ $diff_count -gt 0 ] || [ $new_count -gt 0 ] && echo "true" || echo "false" ),
    "test_passed": $( [ $diff_count -eq 0 ] && [ $new_count -eq 0 ] && echo "true" || echo "false" )
  },
  "artifacts": {
    "baselines_dir": "$BASELINE_DIR",
    "artifacts_dir": "$ARTIFACT_DIR",
    "report_dir": "$REPORT_DIR"
  }
}
EOF
    
    log_info "サマリーレポートを作成しました: $report_file"
}

# PRコメントの作成
create_pr_comment() {
    local baseline_count=${BASELINE_COUNT:-0}
    local diff_count=${DIFF_COUNT:-0}
    local new_count=${NEW_COUNT:-0}
    local has_changes=${HAS_CHANGES:-false}
    
    local comment_file="$ARTIFACT_DIR/pr_comment.md"
    
    cat > "$comment_file" << EOF
## 🎨 ビジュアルテスト結果

### 📊 テスト概要

| 項目 | 数量 |
|------|------|
| **ベースライン画像** | $baseline_count |
| **差分画像** | $diff_count |
| **新規画像** | $new_count |
| **実行時刻** | $(date '+%Y-%m-%d %H:%M:%S') |
| **ワークフロー** | [\#${GITHUB_RUN_NUMBER:-}](${GITHUB_SERVER_URL:-}/${GITHUB_REPOSITORY:-}/actions/runs/${GITHUB_RUN_ID:-}) |

EOF
    
    if [ "$has_changes" = "true" ]; then
        if [ $diff_count -gt 0 ]; then
            cat >> "$comment_file" << EOF

### ⚠️ 差分が検出されました

$diff_count 個の差分画像が検出されました。以下の手順で確認してください：

1. [\`visual-test-results-${GITHUB_RUN_NUMBER:-}\`](${GITHUB_SERVER_URL:-}/${GITHUB_REPOSITORY:-}/actions/runs/${GITHUB_RUN_ID:-}) アーティファクトをダウンロード
2. \`diffs/\` フォルダ内の差分画像を確認
3. 意図した変更の場合、以下のコマンドでベースラインを更新：
   \`\`\`bash
   cd frontend
   npm run test:visual -- --update-snapshots
   \`\`\`
4. 更新されたベースライン画像をコミット

EOF
        fi
        
        if [ $new_count -gt 0 ]; then
            cat >> "$comment_file" << EOF

### 🆕 新規ベースライン画像

$new_count 個の新規ベースライン画像が作成されました。

1. アーティファクトをダウンロードして新規画像を確認
2. 問題がなければそのままコミット

EOF
        fi
    else
        cat >> "$comment_file" << EOF

### ✅ テスト成功

すべてのビジュアルテストが成功しました。UI の変更が視覚的整合性を保っています。

EOF
    fi
    
    cat >> "$comment_file" << EOF

### 🔍 トラブルシューティング

問題が発生した場合：
- [ビジュアルテストガイド](../docs/Storybookビジュアルテスト設定ガイド.md)を確認
- \`visual-test-logs-${GITHUB_RUN_NUMBER:-}\` アーティファクトの詳細ログを確認
- ストーリーに \`visual-test\` タグが設定されているか確認

---
*🤖 CI環境で自動生成されました*
EOF
    
    log_info "PRコメントを作成しました: $comment_file"
}

# メイン処理
main() {
    log_info "CI環境用ビジュアルテストベースライン管理を開始します"
    
    # CI環境の検出
    detect_ci_environment
    
    # 引数の解析
    local action="${1:-test}"
    
    case "$action" in
        "create")
            create_baselines
            ;;
        "test")
            run_visual_tests
            local test_result=$?
            
            # 結果の確認
            check_baseline_status
            
            # アーティファクトの準備
            prepare_artifacts
            
            # PRコメントの作成（GitHub Actionsの場合）
            if [ "$CI_MODE" = "github-actions" ] && [ "$GITHUB_EVENT_NAME" = "pull_request" ]; then
                create_pr_comment
            fi
            
            # テスト結果の判定
            if [ "$FAIL_ON_CHANGES" = "true" ] && [ "${HAS_CHANGES:-false}" = "true" ]; then
                log_error "ビジュアルテストで差分が検出されました"
                github_actions_output "error" "Visual Test Failed" "Visual differences detected. Please review the artifacts."
                exit 1
            elif [ $test_result -ne 0 ]; then
                log_error "ビジュアルテストが失敗しました"
                github_actions_output "error" "Visual Test Failed" "Visual tests failed with exit code $test_result."
                exit $test_result
            else
                log_success "ビジュアルテストが成功しました"
                github_actions_output "notice" "Visual Test Passed" "All visual tests passed successfully."
            fi
            ;;
        "update")
            UPDATE_BASELINES="true"
            create_baselines
            ;;
        "check")
            check_baseline_status
            ;;
        "artifacts")
            prepare_artifacts
            ;;
        *)
            log_error "不正なアクション: $action"
            echo "使用方法: $0 [create|test|update|check|artifacts]"
            exit 1
            ;;
    esac
}

# スクリプトの実行
main "$@"