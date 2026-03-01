# Next.js フルスタックアーキテクチャ

## 概要

このプロジェクトは、クリーンアーキテクチャの考え方を基にし、Next.js の特有の要件（Server/Client 分離）を考慮したレイヤー設計を採用している。
コードの依存関係を明確にし、テスタビリティと保守性を高めることを目的としている。

## 基本方針

このプロジェクトでは、名前空間の概念として捉えているため、フォルダ名は単数形で統一している。

## ディレクトリ構造

```
prisma/
├── schema.prisma              # データベーススキーマ
└── migrations/                # マイグレーションファイル

src/
├── generated/                 # 自動生成ファイル（gitignore）
│   └── prisma/                # Prisma Client
│
├── app/                       # Next.js App Router（ルーティングのみ）
│   └── (todo)/
│       └── todo/
│           ├── page.tsx       # テンプレートを呼び出すだけ
│           ├── loading.tsx    # ローディング UI
│           ├── error.tsx      # エラー UI
│           └── [id]/
│               ├── page.tsx
│               ├── loading.tsx
│               ├── error.tsx
│               └── not-found.tsx
│
├── component/
│   ├── shared/                # 汎用コンポーネント
│   │   ├── client/
│   │   └── server/
│   └── domain/                # ドメイン固有コンポーネント
│       └── {domain}/
│           ├── client/        # クライアントコンポーネント
│           │   ├── {Component}/
│           │   │   ├── {Component}.tsx
│           │   │   ├── index.ts
│           │   │   └── action/  # Server Actions
│           │   └── type.ts      # 共通型定義
│           ├── server/        # サーバーコンポーネント（テンプレート）
│           │   └── {PageTemplate}/
│           └── hook/          # ドメイン固有フック
│
├── model/
│   ├── data/                  # 型定義・スキーマ
│   │   └── {domain}/
│   │       ├── schema.ts      # Zod スキーマ
│   │       ├── type.ts        # TypeScript 型定義
│   │       └── index.ts
│   ├── repository/            # データアクセス層
│   │   └── {domain}/
│   │       └── {Domain}Repository.ts
│   └── logic/                 # ビジネスロジック層
│       └── {domain}/
│           └── {Domain}Logic.ts
│
├── external/                  # 外部サービス定義
│   ├── prisma.ts              # Prisma クライアント
│   ├── logger.ts              # pino ロガー
│   └── index.ts
│
├── constant/                  # 定数定義
└── util/                      # ユーティリティ
    └── hook/                  # 汎用カスタムフック
```

## レイヤー構成

### 1. app（ルーティング層）

**責務**: ルーティングの管理のみ。

- テンプレートコンポーネントを呼び出すだけのシンプルな構成。
- データ取得やビジネスロジックは含まない。
- `loading.tsx` / `error.tsx` で非同期処理の UI を分離する。

```tsx
// app/(todo)/todo/page.tsx
export default function TodoPage() {
  return <TodoPageTemplate />;
}

// app/(todo)/todo/[id]/page.tsx
export default async function TodoDetailPage({ params }) {
  const { id } = await params;
  return <TodoDetailPageTemplate id={id} />;
}
```

### 2. component/domain（ドメインコンポーネント層）

**責務**: ドメインに関連する UI コンポーネントとデータ取得。

#### server/（テンプレート）

- サーバーコンポーネントとしてデータ取得を行う。
- service を呼び出し、取得したデータをクライアントコンポーネントに渡す。
- エラーハンドリング（throw / notFound）を行う。

```tsx
// component/domain/todo/server/TodoPageTemplate/TodoPageTemplate.tsx
export async function TodoPageTemplate() {
  const result = await todoService.getAll();
  if (result.isErr()) throw new Error(result.error.message);
  return <TodoList todos={result.value} />;
}
```

#### client/

- クライアントコンポーネント（`"use client"`）を配置する。
- `useActionState` などの React hooks を使用する。
- Server Actions を `action/` ディレクトリに分割配置する。

### 3. model/data（データ定義層）

**責務**: 型定義とバリデーションスキーマ。

- Zod スキーマでバリデーションルールを定義する。
- スキーマから TypeScript 型を導出する。

```typescript
// model/data/todo/schema.ts
export const todoSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).max(100),
  completed: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

### 4. model/repository（リポジトリ層）

**責務**: データの永続化・取得。

- external の Prisma クライアントを使用する。
- neverthrow の `ResultAsync` でエラーをラップする。
- ドメインモデルを返す。

```typescript
// model/repository/todo/TodoRepository.ts
export const todoRepository = {
  findAll(): ResultAsync<Todo[], TodoRepositoryError> {
    return ResultAsync.fromPromise(
      prisma.todo.findMany({ orderBy: { createdAt: "desc" } }),
      mapError
    );
  },
};
```

### 5. model/logic（サービス層）

**責務**: ビジネスロジックの実行。

- repository を使用してデータを取得・操作する。
- ts-pattern でエラーマッピングを行う。
- ログ出力などの横断的関心事を処理する。

```typescript
// model/logic/todo/TodoLogic.ts
export const todoService = {
  getAll(): ResultAsync<Todo[], TodoServiceError> {
    logger.info("Fetching all todos");
    return todoRepository.findAll().mapErr(mapRepositoryError);
  },
};
```

### 6. external（外部サービス層）

**責務**: 外部ライブラリ・サービスへのアクセス。

- Prisma クライアント、ロガーなどのインスタンスを管理する。
- repository や logic から使用される。

## データフロー

### 取得系（SSR）

```
[Browser]
    ↓ リクエスト
[app/page.tsx]
    ↓ テンプレート呼び出し
[component/domain/server/Template] ← データ取得
    ↓ service 呼び出し
[model/logic] ← ビジネスロジック
    ↓ repository 呼び出し
[model/repository] ← データアクセス
    ↓ Prisma
[external/prisma] → [PostgreSQL]
```

### 更新系（Server Actions）

```
[Browser]
    ↓ フォーム送信
[component/domain/client/action] ← Server Action
    ↓ バリデーション (Zod)
[model/logic] ← ビジネスロジック
    ↓ repository 呼び出し
[model/repository] ← データアクセス
    ↓ Prisma
[external/prisma] → [PostgreSQL]
    ↓ revalidatePath
[Browser] ← 再レンダリング
```

## エラーハンドリング

neverthrow の Result 型を使用し、例外を投げずにエラーを値として扱う。

```typescript
// Repository → Service のエラー変換
const mapRepositoryError = (error: TodoRepositoryError): TodoServiceError => {
  return match(error.type)
    .with("NOT_FOUND", () => ({ type: "NOT_FOUND", message: error.message }))
    .with("DATABASE_ERROR", () => ({ type: "INTERNAL_ERROR", message: "データベースエラーが発生した." }))
    .exhaustive();
};
```

## Server Actions の配置

Server Actions は対応するクライアントコンポーネントと同じディレクトリの `action/` に配置する。
これにより、コンポーネントとアクションの関連性が明確になる。

```
component/domain/todo/client/
├── TodoCreateForm/
│   ├── TodoCreateForm.tsx
│   ├── index.ts
│   └── action/
│       └── createTodoAction.ts
├── TodoEdit/
│   ├── TodoEdit.tsx
│   ├── index.ts
│   └── action/
│       └── updateTodoAction.ts
└── TodoItem/
    ├── TodoItem.tsx
    ├── index.ts
    └── action/
        ├── toggleTodoAction.ts
        └── deleteTodoAction.ts
```
