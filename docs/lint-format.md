# Lint & Format 設定

このプロジェクトでは **Biome** を使用してコードの Lint と Format を行います。
コミット時に自動チェックを行うため **Husky** と **lint-staged** を設定しています。

## ツール構成

| ツール | バージョン | 用途 |
|--------|-----------|------|
| Biome | 2.1.3 | Lint / Format |
| Husky | 9.x | Git hooks |
| lint-staged | 16.x | ステージングファイルのチェック |

## 利用可能なコマンド

```bash
# フォーマット
npm run format          # 自動修正
npm run format:check    # チェックのみ

# Lint
npm run lint            # チェックのみ
npm run lint:fix        # 自動修正

# フォーマット + Lint
npm run check           # 自動修正
npm run check:ci        # CI 用（修正なし、エラー時終了）
```

## Biome 設定

設定ファイル: `biome.json`

### フォーマットルール

- インデント: スペース 2
- 行幅: 100 文字
- クォート: ダブルクォート
- セミコロン: あり
- 末尾カンマ: あり

### Lint ルール

- `recommended` ルールを有効化
- `noUnusedVariables`: 未使用変数をエラー
- `noUnusedImports`: 未使用インポートをエラー
- `noExplicitAny`: `any` 型の使用をエラー
- `useImportType`: `import type` の使用を強制
- `useSemanticElements`: 無効（a11y の過度な制約を避けるため）

## コミット時の自動チェック

Husky の pre-commit フックで lint-staged が実行されます。
ステージングされた `.ts`, `.tsx`, `.js`, `.jsx`, `.json` ファイルに対して:

1. `biome format --write` - フォーマット
2. `biome lint --write` - Lint（自動修正可能なものは修正）

チェックに失敗するとコミットがブロックされます。

## IDE 統合

### VS Code

Biome 拡張機能をインストール:

```
biomejs.biome
```

設定例 (`.vscode/settings.json`):

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  }
}
```

## suppression コメント

特定のルールを無効化する場合:

```typescript
// biome-ignore lint/suspicious/noExplicitAny: 理由を記載
const data: any = {};
```

## トラブルシューティング

### コミットがブロックされる

```bash
# 手動でチェック・修正を実行
npm run check
```

### Husky が動作しない

```bash
# Husky を再インストール
npm run prepare
```
