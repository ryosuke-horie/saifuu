#!/bin/bash

# ビジュアルテストベースライン管理スクリプト
# このスクリプトはビジュアルテストのベースライン画像を管理するためのツールです

set -e

# 色付きの出力定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 設定変数
BASELINES_DIR="__vis__"
BACKUP_DIR="__vis_backup__"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/backup_${TIMESTAMP}"

# ヘルパー関数
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
🎨 ビジュアルテストベースライン管理ツール

使用方法:
  $0 [コマンド] [オプション]

コマンド:
  create      - 新しいベースライン画像を作成
  update      - 既存のベースライン画像を更新
  clean       - 古いベースライン画像を削除
  backup      - ベースライン画像をバックアップ
  restore     - バックアップからベースライン画像を復元
  status      - ベースライン画像の状態を確認
  validate    - ベースライン画像の整合性を検証
  diff        - ベースライン画像の差分を確認
  migrate     - ベースライン画像を新しい構造に移行
  help        - このヘルプメッセージを表示

オプション:
  --force         - 確認なしで実行
  --backup        - 更新前にバックアップを作成
  --dry-run       - 実際の変更を行わず、実行内容のみ表示
  --component     - 特定のコンポーネントのみ対象
  --story         - 特定のストーリーのみ対象
  --viewport      - 特定のビューポートのみ対象

例:
  $0 create                           # 新しいベースライン画像を作成
  $0 update --backup                  # バックアップを作成してから更新
  $0 clean --component Dialog         # Dialogコンポーネントの古いベースラインを削除
  $0 status                          # ベースライン画像の状態を確認
  $0 validate                        # ベースライン画像の整合性を検証
  $0 diff                            # 差分画像を確認
  $0 backup                          # ベースライン画像をバックアップ
  $0 restore backup_20231201_120000   # 特定のバックアップから復元

詳細なドキュメント:
  docs/ビジュアルテストベースライン管理ガイド.md
EOF
}

# 環境チェック
check_environment() {
    log_info "環境をチェックしています..."
    
    # Node.jsの確認
    if ! command -v node &> /dev/null; then
        log_error "Node.js が見つかりません"
        return 1
    fi
    
    # npmの確認
    if ! command -v npm &> /dev/null; then
        log_error "npm が見つかりません"
        return 1
    fi
    
    # パッケージの確認
    if ! npm list storybook-addon-vis &> /dev/null; then
        log_error "storybook-addon-vis がインストールされていません"
        return 1
    fi
    
    # ディレクトリの確認
    if [ ! -d "src" ]; then
        log_error "src ディレクトリが見つかりません。正しいディレクトリで実行してください"
        return 1
    fi
    
    log_success "環境チェック完了"
    return 0
}

# ベースライン画像の統計情報を取得
get_baseline_stats() {
    local stats_file="baseline_stats.json"
    
    if [ -d "${BASELINES_DIR}" ]; then
        local total_files=$(find "${BASELINES_DIR}" -name "*.png" | wc -l)
        local total_size=$(du -sh "${BASELINES_DIR}" | cut -f1)
        local components=$(find "${BASELINES_DIR}" -name "*.png" | sed 's|.*/||' | cut -d'-' -f1 | sort | uniq | wc -l)
        
        cat > "${stats_file}" << EOF
{
  "total_files": ${total_files},
  "total_size": "${total_size}",
  "components": ${components},
  "last_updated": "$(date -Iseconds)",
  "directory": "${BASELINES_DIR}"
}
EOF
        
        echo "${stats_file}"
    else
        log_warning "ベースライン画像ディレクトリが見つかりません"
        return 1
    fi
}

# ベースライン画像の作成
create_baselines() {
    log_info "新しいベースライン画像を作成しています..."
    
    local force_flag=""
    if [ "$FORCE" = true ]; then
        force_flag="--force"
    fi
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] 実行コマンド: npm run test:visual -- --update-snapshots ${force_flag}"
        return 0
    fi
    
    # 既存のベースラインがある場合の警告
    if [ -d "${BASELINES_DIR}" ] && [ "$(find "${BASELINES_DIR}" -name "*.png" | wc -l)" -gt 0 ]; then
        if [ "$FORCE" != true ]; then
            log_warning "既存のベースライン画像が見つかりました"
            read -p "上書きしますか? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_info "処理を中止しました"
                return 0
            fi
        fi
    fi
    
    # ベースライン画像の作成
    npm run test:visual -- --update-snapshots ${force_flag}
    
    if [ $? -eq 0 ]; then
        log_success "ベースライン画像の作成が完了しました"
        get_baseline_stats
        show_baseline_status
    else
        log_error "ベースライン画像の作成に失敗しました"
        return 1
    fi
}

# ベースライン画像の更新
update_baselines() {
    log_info "ベースライン画像を更新しています..."
    
    # バックアップの作成
    if [ "$BACKUP" = true ]; then
        backup_baselines
    fi
    
    # 更新の実行
    create_baselines
}

# ベースライン画像のクリーンアップ
clean_baselines() {
    log_info "不要なベースライン画像を削除しています..."
    
    if [ ! -d "${BASELINES_DIR}" ]; then
        log_info "ベースライン画像ディレクトリが見つかりません"
        return 0
    fi
    
    local files_to_delete=()
    
    # 孤立したファイルを検索
    while IFS= read -r -d '' file; do
        local basename=$(basename "$file" .png)
        local story_file=$(find src -name "*.stories.tsx" -exec grep -l "${basename}" {} \; | head -1)
        
        if [ -z "$story_file" ]; then
            files_to_delete+=("$file")
        fi
    done < <(find "${BASELINES_DIR}" -name "*.png" -print0)
    
    if [ ${#files_to_delete[@]} -eq 0 ]; then
        log_info "削除対象のファイルはありません"
        return 0
    fi
    
    log_info "削除対象のファイル: ${#files_to_delete[@]} 個"
    for file in "${files_to_delete[@]}"; do
        echo "  - $file"
    done
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] 上記のファイルが削除されます"
        return 0
    fi
    
    if [ "$FORCE" != true ]; then
        read -p "削除しますか? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "処理を中止しました"
            return 0
        fi
    fi
    
    # ファイルの削除
    for file in "${files_to_delete[@]}"; do
        rm -f "$file"
        log_info "削除しました: $file"
    done
    
    log_success "クリーンアップが完了しました"
}

# ベースライン画像のバックアップ
backup_baselines() {
    log_info "ベースライン画像をバックアップしています..."
    
    if [ ! -d "${BASELINES_DIR}" ]; then
        log_warning "ベースライン画像ディレクトリが見つかりません"
        return 1
    fi
    
    # バックアップディレクトリの作成
    mkdir -p "${BACKUP_PATH}"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] バックアップ先: ${BACKUP_PATH}"
        return 0
    fi
    
    # ベースライン画像をコピー
    cp -r "${BASELINES_DIR}"/* "${BACKUP_PATH}/"
    
    # 統計情報の保存
    get_baseline_stats > "${BACKUP_PATH}/baseline_stats.json"
    
    log_success "バックアップが完了しました: ${BACKUP_PATH}"
}

# ベースライン画像の復元
restore_baselines() {
    local backup_name="$1"
    
    if [ -z "$backup_name" ]; then
        log_error "バックアップ名を指定してください"
        list_backups
        return 1
    fi
    
    local restore_path="${BACKUP_DIR}/${backup_name}"
    
    if [ ! -d "$restore_path" ]; then
        log_error "バックアップが見つかりません: $restore_path"
        list_backups
        return 1
    fi
    
    log_info "ベースライン画像を復元しています: $backup_name"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] 復元元: ${restore_path}"
        return 0
    fi
    
    # 現在のベースラインをバックアップ
    if [ -d "${BASELINES_DIR}" ] && [ "$FORCE" != true ]; then
        log_info "現在のベースラインをバックアップしています..."
        backup_baselines
    fi
    
    # 復元の実行
    rm -rf "${BASELINES_DIR}"
    cp -r "$restore_path" "${BASELINES_DIR}"
    
    log_success "復元が完了しました"
    show_baseline_status
}

# バックアップ一覧の表示
list_backups() {
    log_info "利用可能なバックアップ:"
    
    if [ ! -d "${BACKUP_DIR}" ]; then
        log_info "バックアップディレクトリが見つかりません"
        return 0
    fi
    
    local backups=($(ls -1 "${BACKUP_DIR}" | grep "backup_" | sort -r))
    
    if [ ${#backups[@]} -eq 0 ]; then
        log_info "バックアップがありません"
        return 0
    fi
    
    for backup in "${backups[@]}"; do
        local backup_path="${BACKUP_DIR}/${backup}"
        local file_count=$(find "$backup_path" -name "*.png" | wc -l)
        local size=$(du -sh "$backup_path" | cut -f1)
        local date=$(echo "$backup" | sed 's/backup_//' | sed 's/_/ /')
        
        echo "  - $backup ($file_count files, $size, $date)"
    done
}

# ベースライン画像の状態確認
show_baseline_status() {
    log_info "ベースライン画像の状態:"
    
    if [ ! -d "${BASELINES_DIR}" ]; then
        log_warning "ベースライン画像ディレクトリが見つかりません"
        return 1
    fi
    
    local stats=$(get_baseline_stats)
    if [ -f "$stats" ]; then
        local total_files=$(jq -r '.total_files' "$stats")
        local total_size=$(jq -r '.total_size' "$stats")
        local components=$(jq -r '.components' "$stats")
        local last_updated=$(jq -r '.last_updated' "$stats")
        
        echo "  - 総ファイル数: $total_files"
        echo "  - 総サイズ: $total_size"
        echo "  - コンポーネント数: $components"
        echo "  - 最終更新: $last_updated"
        
        # コンポーネント別の統計
        echo "  - コンポーネント別統計:"
        find "${BASELINES_DIR}" -name "*.png" | \
            sed 's|.*/||' | \
            cut -d'-' -f1 | \
            sort | \
            uniq -c | \
            sort -nr | \
            head -10 | \
            while read count component; do
                echo "    - $component: $count files"
            done
    fi
}

# ベースライン画像の整合性検証
validate_baselines() {
    log_info "ベースライン画像の整合性を検証しています..."
    
    local error_count=0
    local warning_count=0
    
    # ディレクトリの存在確認
    if [ ! -d "${BASELINES_DIR}" ]; then
        log_error "ベースライン画像ディレクトリが見つかりません"
        return 1
    fi
    
    # 画像ファイルの検証
    while IFS= read -r -d '' file; do
        # ファイルサイズの確認
        local size=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null)
        if [ "$size" -lt 1000 ]; then
            log_warning "ファイルサイズが小さすぎます: $file ($size bytes)"
            ((warning_count++))
        fi
        
        # 画像の形式確認
        if ! file "$file" | grep -q "PNG image data"; then
            log_error "PNG形式ではありません: $file"
            ((error_count++))
        fi
        
        # 対応するストーリーファイルの確認
        local basename=$(basename "$file" .png)
        local story_file=$(find src -name "*.stories.tsx" -exec grep -l "$(echo "$basename" | cut -d'-' -f1)" {} \; | head -1)
        
        if [ -z "$story_file" ]; then
            log_warning "対応するストーリーファイルが見つかりません: $file"
            ((warning_count++))
        fi
        
    done < <(find "${BASELINES_DIR}" -name "*.png" -print0)
    
    # 結果の表示
    if [ $error_count -eq 0 ] && [ $warning_count -eq 0 ]; then
        log_success "すべてのベースライン画像が正常です"
        return 0
    else
        log_info "検証結果: エラー $error_count 個, 警告 $warning_count 個"
        return $error_count
    fi
}

# 差分画像の確認
show_diff_images() {
    log_info "差分画像を確認しています..."
    
    local diff_files=($(find "${BASELINES_DIR}" -name "*-diff.png" 2>/dev/null))
    local actual_files=($(find "${BASELINES_DIR}" -name "*-actual.png" 2>/dev/null))
    
    if [ ${#diff_files[@]} -eq 0 ] && [ ${#actual_files[@]} -eq 0 ]; then
        log_info "差分画像は見つかりませんでした"
        return 0
    fi
    
    if [ ${#diff_files[@]} -gt 0 ]; then
        log_info "差分画像 (${#diff_files[@]} 個):"
        for file in "${diff_files[@]}"; do
            echo "  - $file"
        done
    fi
    
    if [ ${#actual_files[@]} -gt 0 ]; then
        log_info "実際の画像 (${#actual_files[@]} 個):"
        for file in "${actual_files[@]}"; do
            echo "  - $file"
        done
    fi
    
    # 推奨アクション
    if [ ${#diff_files[@]} -gt 0 ]; then
        log_info "推奨アクション:"
        echo "  1. 差分画像を確認してください"
        echo "  2. 意図した変更の場合: npm run test:visual -- --update-snapshots"
        echo "  3. 意図しない変更の場合: コードを修正してください"
    fi
}

# ベースライン画像の移行
migrate_baselines() {
    log_info "ベースライン画像を新しい構造に移行しています..."
    
    # 旧形式のディレクトリを確認
    local old_dirs=("__screenshots__" "__vis_old__" "visual-tests")
    local found_old=false
    
    for old_dir in "${old_dirs[@]}"; do
        if [ -d "$old_dir" ]; then
            log_info "旧形式のディレクトリを発見: $old_dir"
            found_old=true
            
            if [ "$DRY_RUN" = true ]; then
                log_info "[DRY RUN] 移行対象: $old_dir -> ${BASELINES_DIR}"
                continue
            fi
            
            # 移行の実行
            mkdir -p "${BASELINES_DIR}"
            cp -r "$old_dir"/* "${BASELINES_DIR}/"
            
            # 旧ディレクトリのバックアップ
            if [ "$BACKUP" = true ]; then
                mv "$old_dir" "${old_dir}_backup_${TIMESTAMP}"
                log_info "旧ディレクトリをバックアップしました: ${old_dir}_backup_${TIMESTAMP}"
            fi
            
            log_success "移行完了: $old_dir -> ${BASELINES_DIR}"
        fi
    done
    
    if [ "$found_old" = false ]; then
        log_info "移行対象のディレクトリは見つかりませんでした"
    fi
}

# コマンドライン引数の解析
COMMAND=""
FORCE=false
BACKUP=false
DRY_RUN=false
COMPONENT=""
STORY=""
VIEWPORT=""

while [[ $# -gt 0 ]]; do
    case $1 in
        create|update|clean|backup|restore|status|validate|diff|migrate|help)
            COMMAND=$1
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --backup)
            BACKUP=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --component)
            COMPONENT="$2"
            shift 2
            ;;
        --story)
            STORY="$2"
            shift 2
            ;;
        --viewport)
            VIEWPORT="$2"
            shift 2
            ;;
        *)
            if [ -z "$COMMAND" ]; then
                COMMAND="$1"
            else
                RESTORE_BACKUP="$1"
            fi
            shift
            ;;
    esac
done

# メイン処理
case "${COMMAND:-help}" in
    "create")
        check_environment && create_baselines
        ;;
    "update")
        check_environment && update_baselines
        ;;
    "clean")
        check_environment && clean_baselines
        ;;
    "backup")
        check_environment && backup_baselines
        ;;
    "restore")
        check_environment && restore_baselines "$RESTORE_BACKUP"
        ;;
    "status")
        check_environment && show_baseline_status
        ;;
    "validate")
        check_environment && validate_baselines
        ;;
    "diff")
        check_environment && show_diff_images
        ;;
    "migrate")
        check_environment && migrate_baselines
        ;;
    "help"|*)
        show_usage
        ;;
esac