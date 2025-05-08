# GitHub Actions ワークフロー

## テストワークフロー

### 1. unit-test.yaml (高速テスト)
- **実行タイミング**: プッシュ・プルリクエスト毎
- **目的**: 高速な構文チェック、型チェック、lint、ビルド検証
- **実行時間**: 約1-2分
- **外部依存なし**: データベース不要

### 2. integration-test.yaml (データベーステスト)
- **実行タイミング**: プッシュ・プルリクエスト毎（packagesフォルダの変更時）
- **目的**: 実際のデータベースを使った統合テスト
- **実行時間**: 約5-10分
- **必要な設定**: 
  - GitHubリポジトリ設定の`TEST_DATABASE_URL`シークレット
  - テスト用データベース（本番環境とは別）

### 3. test-all.yaml (完全テストスイート)
- **実行タイミング**: 日次スケジュール、手動実行、mainブランチ変更時
- **目的**: すべてのテストタイプを包括的に実行
- **実行時間**: 約10-15分

## Composite Actions

### .GitHub/actions/setup-monorepo
Node.js環境のセットアップ、依存関係のインストール、Turboキャッシュの設定を行います。

**入力パラメータ:**
- `node-version`: Node.jsバージョン（デフォルト: 20）
- `cache-dependency-path`: キャッシュキー用のpackage-lock.jsonパス

### .GitHub/actions/detect-changes
モノレポ内の変更を検出し、適切なジョブを実行するかを判定します。

**出力:**
- `packages`: packages/配下の変更有無
- `workers`: workers/配下の変更有無
- `db`: packages/DB/配下の変更有無
- `markdown`: Markdownファイルの変更有無
- `workflows`: GitHub Actionsワークフローの変更有無

### .GitHub/actions/test-package
パッケージ固有のテスト実行、環境セットアップ、カバレッジアップロードを行います。

**入力パラメータ:**
- `package-name`: テスト対象パッケージ名
- `test-type`: テストタイプ（unit/integration）
- `working-directory`: 作業ディレクトリ（オプション）
- `test-database-url`: テスト用データベースURL（統合テスト用）

## セットアップ要件

### GitHub シークレット
リポジトリの設定 > Secrets and variables > Actions で以下のシークレットを追加：

```
TEST_DATABASE_URL=mysql://username:password@host:port/test_database?sslaccept=strict
```

### 新しいパッケージ・テストの追加方法

1. **新しいパッケージにテストを追加**:
   ```yaml
   # integration-test.yaml の matrix に追加
   strategy:
     matrix:
       package: [db, new-package]  # new-package を追加
   ```

2. **新しいComposite Actionの作成**:
   ```bash
   mkdir -p .github/actions/new-action
   # action.yaml を作成
   ```

3. **既存ワークフローでComposite Actionを使用**:
   ```yaml
   - name: Custom action
     uses: ./.github/actions/new-action
     with:
       parameter: value
   ```

## 環境管理

- **テスト環境**: `NODE_ENV=test` → `.env.test`を読み込み
- **本番環境**: `NODE_ENV=production` → `.env`を読み込み
- **ローカル開発**: デフォルト → `.env`を読み込み

各パッケージには以下のファイルが必要：
- `.env.example` - 設定テンプレート
- `.env` - ローカル/本番設定（gitignore対象）
- `.env.test` - テスト設定（gitignore対象、CI内で生成）