# Claude Review GitHub Actions jq構文エラー修正ガイド

## 概要

GitHub ActionsのClaude Reviewワークフローで発生しているjq構文エラーの修正方法を記載します。

## エラー内容

```
failed to parse jq expression (line 1, column 58)
    {branch: .headRefName, repo: .headRepository.owner.login + "/" + .headRepository.name}
                                                             ^  unexpected token "+"
Error: Process completed with exit code 1.
```

## 原因

`gh pr view`コマンドの`--jq`オプションで使用されるjq式内で、オブジェクトリテラル内の文字列連結に`+`演算子を使用しているが、括弧で囲まれていないため構文エラーが発生。

## 修正方法

### 現在のコード（エラー）

```yaml
PR_DATA=$(gh pr view $PR_NUMBER --json headRefName,headRepository \
  --jq '{branch: .headRefName, repo: .headRepository.owner.login + "/" + .headRepository.name}')
```

### 修正後のコード

```yaml
# 方法1: 括弧で囲む（推奨）
PR_DATA=$(gh pr view $PR_NUMBER --json headRefName,headRepository \
  --jq '{branch: .headRefName, repo: (.headRepository.owner.login + "/" + .headRepository.name)}')

# 方法2: 文字列補間を使用
PR_DATA=$(gh pr view $PR_NUMBER --json headRefName,headRepository \
  --jq '{branch: .headRefName, repo: "\(.headRepository.owner.login)/\(.headRepository.name)"}')
```

## 完全な修正例

```yaml
- name: Get PR Information
  id: pr-info
  run: |
    if [ "${{ github.event_name }}" = "pull_request" ]; then
      PR_NUMBER=${{ github.event.pull_request.number }}
    else
      PR_NUMBER=${{ github.event.issue.number }}
    fi
    
    # 修正: 文字列連結を括弧で囲む
    PR_DATA=$(gh pr view $PR_NUMBER --json headRefName,headRepository \
      --jq '{branch: .headRefName, repo: (.headRepository.owner.login + "/" + .headRepository.name)}')
    
    echo "branch=$(echo $PR_DATA | jq -r .branch)" >> $GITHUB_OUTPUT
    echo "repo=$(echo $PR_DATA | jq -r .repo)" >> $GITHUB_OUTPUT
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## ローカルでのテスト方法

```bash
# エラーになるコマンド
gh pr view 506 --json headRefName,headRepository \
  --jq '{branch: .headRefName, repo: .headRepository.owner.login + "/" + .headRepository.name}'

# 正常に動作するコマンド
gh pr view 506 --json headRefName,headRepository \
  --jq '{branch: .headRefName, repo: (.headRepository.owner.login + "/" + .headRepository.name)}'
```

## 実装時の注意事項

1. **括弧の重要性**: jqのオブジェクトリテラル内で演算を行う場合は必ず括弧で囲む
2. **エスケープ**: YAMLファイル内でのダブルクォートはエスケープが必要な場合がある
3. **デバッグ**: `gh`コマンドはローカルでテスト可能なので、事前に動作確認を推奨

## 参考資料

- [jq Manual - Basic filters](https://stedolan.github.io/jq/manual/#Basicfilters)
- [GitHub CLI - Formatting output](https://cli.github.com/manual/gh_help_formatting)

## 関連Issue

- PR #506で発生したエラーの修正案として作成