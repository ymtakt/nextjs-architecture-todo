# Next.js Architecture Todo

Next.js のアーキテクチャを学習・整理するためのシンプルな CRUD Todo アプリケーションです。

## 技術スタック

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod
- **Error Handling**: neverthrow
- **Pattern Matching**: ts-pattern
- **Logging**: pino
- **Linting**: ESLint

## セットアップ

```bash
npm install
cp .env.example .env
```

## データベース

PostgreSQL を Docker で起動します（ポート 5433 を使用）。

```bash
docker compose up -d
```

マイグレーションを実行します。

```bash
npx prisma migrate dev
```

## 開発

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアプリケーションを確認できます。

## スクリプト

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバーを起動 |
| `npm run build` | プロダクションビルド |
| `npm run start` | プロダクションサーバーを起動 |
| `npm run lint` | ESLint を実行 |
| `npx prisma studio` | Prisma Studio を起動 |

## ディレクトリ構成

```
src/
  app/           # App Router のページとレイアウト
  lib/           # ユーティリティ（Prisma クライアント等）
prisma/
  schema.prisma  # データベーススキーマ
```
