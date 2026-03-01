# テスト設定

このプロジェクトでは **Vitest** を使用して Server Actions（logic 層と action 層）のテストを行います。
テスト用データベースを使用し、外部依存はモックで置き換えます。

## ツール構成

| ツール | バージョン | 用途 |
|--------|-----------|------|
| Vitest | 4.x | テストフレームワーク |
| @vitest/coverage-v8 | 4.x | カバレッジ計測 |
| dotenv-cli | 8.x | 環境変数ロード |

## 利用可能なコマンド

```bash
# テスト実行
npm run test              # 全テスト実行
npm run test:watch        # ウォッチモード
npm run test:coverage     # カバレッジ付き実行

# テスト用データベース
npm run db:test:up        # テスト用 DB を起動
```

## テスト用データベース

テスト専用の PostgreSQL コンテナを使用します。

### 起動方法

```bash
# Docker Compose でテスト用 DB を起動
npm run db:test:up
```

### 接続情報

| 項目 | 値 |
|------|-----|
| Host | localhost |
| Port | 5434 |
| Database | todo_test |
| User | postgres |
| Password | postgres |

環境変数は `.env.test` で設定されています。

## テスト方針

### テスト対象

- **Logic 層** (`src/model/logic/**/*.ts`)
  - ビジネスロジックの実装
  - Repository との連携
  - エラーハンドリング

- **Action 層** (`src/component/**/action/*.ts`)
  - Server Actions の実装
  - 認証チェック
  - キャッシュ再検証

### カバレッジ要件

全ての対象コードに対して **100% カバレッジ** を要求します:

- Statements: 100%
- Branches: 100%
- Functions: 100%
- Lines: 100%

### モック戦略

**外部依存（モック対象）:**

- Firebase Admin SDK (`@/external/firebase/admin`)
- Next.js cookies (`next/headers`)
- Next.js redirect (`next/navigation`)
- Next.js revalidatePath (`next/cache`)
- Logger (`@/external/logger`)

**内部依存（実 DB 使用）:**

- Prisma Client（テスト用 DB に接続）
- Repository 層（実装をテスト）

### テストパターン

#### 1. 実 DB を使用するテスト

```typescript
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { prisma } from "@/external/prisma";

describe("someLogic", () => {
  beforeEach(async () => {
    // テストデータを作成
    await prisma.user.create({ data: { ... } });
  });

  afterEach(async () => {
    // テストデータをクリーンアップ
    await prisma.todo.deleteMany();
    await prisma.user.deleteMany();
  });

  it("正常系テスト", async () => {
    const result = await someFunction();
    expect(result.isOk()).toBe(true);
  });
});
```

#### 2. Repository をモックするテスト

Repository のエラー分岐をテストする場合:

```typescript
import { describe, expect, it, vi } from "vitest";
import { err } from "neverthrow";

const mockRepository = vi.fn();

vi.mock("@/model/repository/xxx", () => ({
  someFunction: (...args: unknown[]) => mockRepository(...args),
}));

const { targetLogic } = await import("@/model/logic/xxx");

describe("targetLogic (error scenarios)", () => {
  it("Repository がエラーを返した場合", async () => {
    mockRepository.mockResolvedValue(
      err({ type: "DATABASE_ERROR", message: "Error" })
    );

    const result = await targetLogic();
    expect(result.isErr()).toBe(true);
  });
});
```

#### 3. vi.hoisted を使用するモック

`vi.mock` 内で変数を参照する場合は `vi.hoisted` を使用:

```typescript
const mockUser = vi.hoisted(() => ({
  id: "test-user-id",
  firebaseUid: "test-uid",
  email: "test@example.com",
}));

vi.mock("@/model/logic/auth/authLogic", () => ({
  requireAuth: vi.fn().mockResolvedValue(mockUser),
}));
```

## ファイル構成

```
src/
├── test-util/
│   ├── globalSetup.ts    # DB マイグレーション実行
│   ├── setup.ts          # グローバルモック設定
│   └── helpers.ts        # テストヘルパー関数
├── model/
│   └── logic/
│       ├── auth/
│       │   └── authLogic.test.ts
│       ├── todo/
│       │   ├── todoLogic.test.ts       # 実 DB テスト
│       │   └── todoLogic.mock.test.ts  # モックテスト
│       └── user/
│           ├── userLogic.test.ts
│           └── userLogic.mock.test.ts
└── component/
    └── domain/
        ├── auth/
        │   └── client/
        │       ├── sign-in-form/action/signInAction.test.ts
        │       ├── sign-out-button/action/signOutAction.test.ts
        │       └── sign-up-form/action/signUpAction.test.ts
        └── todo/
            └── client/
                ├── todo-create-form/action/
                │   ├── createTodoAction.test.ts
                │   └── createTodoAction.mock.test.ts
                ├── todo-edit/action/updateTodoAction.test.ts
                └── todo-item/action/
                    ├── deleteTodoAction.test.ts
                    └── toggleTodoAction.test.ts
```

## コミット時のテスト実行

Husky の pre-commit フックでテストが実行されます。
テストに失敗するとコミットがブロックされます。

**前提条件:**
- テスト用 DB が起動していること (`npm run db:test:up`)

## Vitest 設定

設定ファイル: `vitest.config.ts`

主要な設定:

```typescript
{
  test: {
    globals: true,
    environment: "node",
    pool: "forks",
    fileParallelism: false,  // テストファイルを順次実行
    isolate: true,
    coverage: {
      provider: "v8",
      include: [
        "src/model/logic/**/*.ts",
        "src/component/**/action/*.ts"
      ],
      exclude: [
        "src/**/*.test.ts",
        "src/**/schema.ts",
        "src/external/**/*"
      ],
      thresholds: {
        global: {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100
        }
      }
    }
  }
}
```

## トラブルシューティング

### テスト用 DB に接続できない

```bash
# コンテナが起動しているか確認
docker compose ps

# テスト用 DB を再起動
docker compose down db-test
npm run db:test:up
```

### カバレッジが 100% に達しない

1. カバレッジレポートで未カバー行を確認
2. エラー分岐のテストを追加（モックテストファイルを作成）
3. `npm run test:coverage` で再確認

### モックが適用されない

- `vi.mock` はファイル先頭でホイスティングされる
- 変数参照には `vi.hoisted()` を使用
- 動的インポート (`await import()`) でモック適用後にモジュールをロード
