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
│           │   └── {component}/           # ケバブケース
│           │       ├── {Component}.tsx    # アッパーキャメル
│           │       └── action/
│           │           ├── {action}.ts    # Server Action
│           │           └── schema.ts      # 入力バリデーション + 型定義
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
- React Hook Form + Zod でフォーム管理・バリデーションを行う。
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

export async function findAllTodos(): Promise<RepositoryResult<Todo[]>> {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: { createdAt: "desc" },
    });
    return ok(todos);
  } catch (e) {
    return err({ type: "DATABASE_ERROR", message: e instanceof Error ? e.message : "Unknown error" });
  }
}
```

### 5. model/logic（サービス層）

**責務**: ビジネスロジックの実行。

- repository を使用してデータを取得・操作する。
- エラーをサービス層のエラーに変換する。
- ログ出力などの横断的関心事を処理する。
- 個別関数としてエクスポートする。

```typescript
// model/logic/todo/todoLogic.ts
import { findAllTodos } from "@/model/repository/todo/todoRepository";

export async function getAllTodos(): Promise<ServiceResult<Todo[]>> {
  logger.info("Fetching all todos");
  const result = await findAllTodos();
  if (result.isErr()) {
    return err(toServiceError(result.error));
  }
  return ok(result.value);
}
```

## モデル変換方針

Repository から Logic へのデータ受け渡し時のモデル変換について。

### 基本方針

| Prisma 返却値 | 変換場所 | 説明 |
|--------------|---------|------|
| ドメインモデルと一致 | Repository | そのままドメインモデルとして返却 |
| ドメインモデルと不一致 | Logic | Factory 関数で変換してから返却 |

### ケース 1: Prisma 返却値 = ドメインモデル（現在の Todo）

Repository でそのままドメインモデルを返す。

```typescript
// model/repository/todo/todoRepository.ts
export async function findAllTodos(): Promise<RepositoryResult<Todo[]>> {
  const todos = await prisma.todo.findMany({ ... });
  return ok(todos);  // Prisma の型がそのまま Todo 型として返却可能
}
```

### ケース 2: Prisma 返却値 ≠ ドメインモデル

Logic 層で Factory を使って変換する。

```
model/logic/{domain}/
├── {domain}Logic.ts
└── {domain}Factory.ts   # 変換が必要な場合のみ作成
```

```typescript
// model/repository/todo/todoRepository.ts
import type { Todo as PrismaTodo } from "@prisma/generated";

// Prisma の型をそのまま返す
export async function findTodoWithUser(id: string): Promise<RepositoryResult<PrismaTodoWithUser>> {
  const todo = await prisma.todo.findUnique({
    where: { id },
    include: { user: true },
  });
  return ok(todo);
}
```

```typescript
// model/logic/todo/todoFactory.ts
import type { Todo as PrismaTodo } from "@prisma/generated";
import type { Todo } from "@/model/data/todo/type";

type PrismaTodoWithUser = PrismaTodo & {
  user: { id: string; name: string };
};

/** Prisma 型からドメインモデルに変換する. */
export function toTodo(prisma: PrismaTodoWithUser): Todo {
  return {
    id: prisma.id,
    title: prisma.title,
    completed: prisma.completed,
    createdAt: prisma.createdAt,
    updatedAt: prisma.updatedAt,
    authorName: prisma.user.name,  // リレーションをフラット化
  };
}
```

```typescript
// model/logic/todo/todoLogic.ts
import { toTodo } from "./todoFactory";

export async function getTodoWithUser(id: string): Promise<ServiceResult<Todo>> {
  const result = await findTodoWithUser(id);
  if (result.isErr()) {
    return err(toServiceError(result.error));
  }
  return ok(toTodo(result.value));  // Factory で変換
}
```

### この方針のメリット

- **シンプルなケースは簡潔に**: 1:1 対応の場合は余計な変換コードが不要
- **複雑なケースは明示的に**: Factory で変換ロジックを分離し可読性を確保
- **Prisma 依存の局所化**: Repository 層に Prisma 型を閉じ込められる
- **API 分離が容易**: Logic 層以上はドメインモデルのみを扱うため、将来の API 化に対応しやすい

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
[React Hook Form] ← クライアントバリデーション (Zod)
    ↓ バリデーション成功
[component/domain/client/action] ← Server Action
    ↓
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
│       └── schema.ts          # 入力バリデーション + 型定義
├── todo-edit/
│   ├── TodoEdit.tsx
│   └── action/
│       ├── updateTodoAction.ts
│       └── schema.ts          # 入力バリデーション + 型定義
└── todo-item/
    ├── TodoItem.tsx
    └── action/
        ├── toggleTodoAction.ts  # スキーマ不要（id のみ）
        └── deleteTodoAction.ts  # スキーマ不要（id のみ）
```

## フォーム管理

React Hook Form + Zod を使用してフォームの状態管理とバリデーションを行う。

### 基本構成

```typescript
// action/schema.ts
import { z } from "zod";

export const createTodoInputSchema = z.object({
  title: z.string().min(1, "タイトルは必須である."),
});

export type CreateTodoFormInput = z.infer<typeof createTodoInputSchema>;
```

```typescript
// action/createTodoAction.ts
"use server";

export async function createTodoAction(data: CreateTodoFormInput): Promise<ActionState> {
  // バリデーション済みのデータを受け取る
  const result = await createNewTodo(data);
  // ...
}
```

```tsx
// TodoCreateForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export function TodoCreateForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTodoFormInput>({
    resolver: zodResolver(createTodoInputSchema),
  });

  const onSubmit = async (data: CreateTodoFormInput) => {
    const result = await createTodoAction(data);
    if (result.success) reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("title")} />
      {errors.title && <span>{errors.title.message}</span>}
      <button disabled={isSubmitting}>追加</button>
    </form>
  );
}
```

### React Hook Form を使用する理由

- **クライアントバリデーション**: 送信前にエラーを表示できる
- **再レンダリング最適化**: フィールドごとの更新で全体の再描画を防ぐ
- **外部コンポーネント連携**: Controller で DatePicker 等と簡単に連携
- **フォーム状態管理**: isSubmitting, isDirty, isValid 等を自動管理

### カスタムフックの分離基準

フォームの複雑さに応じて、ロジックをカスタムフックに分離する。

**シンプルなフォーム（フック分離不要）**

```
todo-create-form/
├── TodoCreateForm.tsx      # useForm をコンポーネント内で直接使用
└── action/
    ├── createTodoAction.ts
    └── schema.ts
```

**複雑なフォーム（フック分離推奨）**

```
meeting-create-form/
├── MeetingCreateForm.tsx   # UI のみ
├── action/
│   ├── createMeetingAction.ts
│   └── schema.ts
└── hook/
    └── useMeetingForm.ts   # フォームロジックを分離
```

**フックを分離する基準:**

| 条件 | 例 |
|-----|-----|
| フィールドが多い（5個以上） | 会員登録、会議作成 |
| 条件分岐ロジックがある | watch で表示切替、依存フィールド |
| 複数コンポーネントで共有 | 作成と編集で同じロジック |
| 複雑なバリデーション | 非同期バリデーション、相関チェック |

**分離したフックの例:**

```typescript
// hook/useMeetingForm.ts
export function useMeetingForm(defaultValues?: MeetingFormInput) {
  const form = useForm<MeetingFormInput>({
    resolver: zodResolver(meetingSchema),
    defaultValues,
  });

  const isRecurring = form.watch("isRecurring");
  const showEndDate = isRecurring && form.watch("frequency") !== "none";

  const onSubmit = async (data: MeetingFormInput) => {
    const result = await createMeetingAction(data);
    if (result.success) form.reset();
    return result;
  };

  return {
    form,
    isRecurring,
    showEndDate,
    onSubmit: form.handleSubmit(onSubmit),
  };
}
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
