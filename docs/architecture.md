# Next.js フルスタックアーキテクチャ

## 概要

このプロジェクトは、クリーンアーキテクチャの考え方を基にし、Next.js の特有の要件（Server/Client 分離）を考慮したレイヤー設計を採用している。
コードの依存関係を明確にし、テスタビリティと保守性を高めることを目的としている。

## 基本方針

このプロジェクトでは、名前空間の概念として捉えているため、フォルダ名は単数形で統一している。

## 命名規則

### ファイル名

| ケース | 対象 | 例 |
|--------|------|-----|
| ケバブケース | Next.js 規約ファイル | `page.tsx`, `layout.tsx`, `loading.tsx`, `not-found.tsx` |
| アッパーキャメル | コンポーネント（.tsx） | `TodoItem.tsx`, `TodoCreateForm.tsx` |
| ローワーキャメル | その他（hooks, utils, services, types） | `todoLogic.ts`, `todoRepository.ts`, `formatDate.ts` |

### ディレクトリ名

ケバブケースで統一する。

```
src/
├── app/
│   └── (todo)/
│       └── todo/
│           └── [id]/
├── component/
│   └── domain/
│       └── todo/
│           ├── client/
│           │   ├── todo-create-form/
│           │   ├── todo-edit/
│           │   └── todo-item/
│           └── server/
│               ├── todo-page-template/
│               └── todo-detail-page-template/
├── model/
│   ├── data/
│   │   └── todo/
│   ├── logic/
│   │   └── todo/
│   └── repository/
│       └── todo/
└── external/
```

## 型定義方針

### type vs interface

`type` で統一する。`interface` はライブラリの型を拡張する場合のみ使用する。

### 命名規則

ファイルスコープの型はシンプルな名前を使用する。ドメイン名のプレフィックスは不要。

```typescript
// Good: シンプルな命名（ファイルスコープ）
type RepositoryError = { type: "NOT_FOUND" | "DATABASE_ERROR"; message: string };
type RepositoryResult<T> = Result<T, RepositoryError>;
type ServiceError = { type: "NOT_FOUND" | "INTERNAL_ERROR"; message: string };
type ServiceResult<T> = Result<T, ServiceError>;

// Bad: 冗長なプレフィックス
type TodoRepositoryError = { ... };
type TodoServiceErrorType = "NOT_FOUND" | "INTERNAL_ERROR";
```

### export 方針

必要な場合のみ `export` する。ファイル内で完結する型は非公開にする。

```typescript
// Good: 外部から参照される型のみ export
export type Todo = z.infer<typeof todoSchema>;
export type RepositoryError = { ... };  // Logic 層で使用

// Good: ファイル内でのみ使用する型は非公開
type RepositoryResult<T> = Result<T, RepositoryError>;
type ServiceError = { ... };
type ServiceResult<T> = Result<T, ServiceError>;
```

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
│           │   ├── {component}/           # ケバブケース
│           │   │   ├── {Component}.tsx    # アッパーキャメル
│           │   │   └── action/
│           │   │       ├── {action}.ts    # Server Action
│           │   │       └── schema.ts      # 入力バリデーションスキーマ
│           │   └── type.ts                # 共通型定義
│           ├── server/        # サーバーコンポーネント（テンプレート）
│           │   └── {page-template}/       # ケバブケース
│           └── hook/          # ドメイン固有フック
│
├── model/
│   ├── data/                  # 型定義
│   │   └── {domain}/
│   │       └── type.ts        # ドメインモデル型定義
│   ├── repository/            # データアクセス層
│   │   └── {domain}/
│   │       └── {domain}Repository.ts  # ローワーキャメル
│   └── logic/                 # ビジネスロジック層
│       └── {domain}/
│           └── {domain}Logic.ts       # ローワーキャメル
│
├── external/                  # 外部サービス定義
│   ├── prisma.ts              # Prisma クライアント
│   └── logger.ts              # pino ロガー
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
// component/domain/todo/server/todo-page-template/TodoPageTemplate.tsx
import { getAllTodos } from "@/model/logic/todo/todoLogic";

export async function TodoPageTemplate() {
  const result = await getAllTodos();
  if (result.isErr()) throw new Error(result.error.message);
  return <TodoList todos={result.value} />;
}
```

#### client/

- クライアントコンポーネント（`"use client"`）を配置する。
- `useActionState` などの React hooks を使用する。
- Server Actions を `action/` ディレクトリに分割配置する。

### 3. model/data（データ定義層）

**責務**: ドメインモデルの型定義。

- エンティティ型と入力型を定義する。
- バリデーションスキーマは action/ に配置（コロケーション）。

```typescript
// model/data/todo/type.ts
export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateTodoInput = {
  title: string;
};
```

### 4. model/repository（リポジトリ層）

**責務**: データの永続化・取得。

- external の Prisma クライアントを使用する。
- neverthrow の `Result` でエラーをラップする。
- 個別関数としてエクスポートする。

```typescript
// model/repository/todo/todoRepository.ts
import { err, ok, type Result } from "neverthrow";

export async function findAllTodos(): Promise<Result<Todo[], TodoRepositoryError>> {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: { createdAt: "desc" },
    });
    return ok(todos);
  } catch (error) {
    return err(toDbError(error));
  }
}
```

### 5. model/logic（サービス層）

**責務**: ビジネスロジックの実行。

- repository を使用してデータを取得・操作する。
- ts-pattern でエラーマッピングを行う。
- ログ出力などの横断的関心事を処理する。
- 個別関数としてエクスポートする。

```typescript
// model/logic/todo/todoLogic.ts
import { findAllTodos } from "@/model/repository/todo/todoRepository";

export async function getAllTodos(): Promise<Result<Todo[], TodoServiceError>> {
  logger.info("Fetching all todos");
  const result = await findAllTodos();
  if (result.isErr()) {
    return err(mapRepositoryError(result.error));
  }
  return ok(result.value);
}
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
// Repository層のエラー
type RepositoryError = {
  type: "NOT_FOUND" | "DATABASE_ERROR";
  message: string;
};

// Service層のエラー
type ServiceError = {
  type: "NOT_FOUND" | "INTERNAL_ERROR";
  message: string;
};

// シンプルな変換
function toServiceError(e: RepositoryError): ServiceError {
  return {
    type: e.type === "NOT_FOUND" ? "NOT_FOUND" : "INTERNAL_ERROR",
    message: e.message,
  };
}
```

**ページレンダリング時:**
- NOT_FOUND → `notFound()` で 404 ページ
- その他 → `throw` で error.tsx

**Server Actions:**
- ActionState で結果を返す（success/message）

## Server Actions の配置

Server Actions は対応するクライアントコンポーネントと同じディレクトリの `action/` に配置する。
入力バリデーションスキーマも `action/` に配置する（コロケーション）。

```
component/domain/todo/client/
├── todo-create-form/
│   ├── TodoCreateForm.tsx
│   └── action/
│       ├── createTodoAction.ts
│       └── schema.ts          # 入力バリデーション
├── todo-edit/
│   ├── TodoEdit.tsx
│   └── action/
│       ├── updateTodoAction.ts
│       └── schema.ts          # 入力バリデーション
└── todo-item/
    ├── TodoItem.tsx
    └── action/
        ├── toggleTodoAction.ts  # スキーマ不要（id のみ）
        └── deleteTodoAction.ts  # スキーマ不要（id のみ）
```

## インポート方針

バレルファイル（index.ts）は使用せず、直接ファイルパスでインポートする。

```typescript
// Good: 直接インポート
import { TodoItem } from "@/component/domain/todo/client/todo-item/TodoItem";
import { getAllTodos } from "@/model/logic/todo/todoLogic";

// Bad: バレルファイル経由
import { TodoItem } from "@/component/domain/todo/client/todo-item";
import { todoService } from "@/model/logic/todo";
```

**理由:**
- tree-shaking が効きやすい。
- インポート元が明確になる。
- Server/Client コンポーネントの境界が分かりやすい。
