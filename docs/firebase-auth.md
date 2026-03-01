# Firebase Authentication セットアップガイド

## 概要

このプロジェクトでは Firebase Authentication（メール/パスワード）を使用してユーザー認証を行う。

## Firebase Console でのセットアップ

### 1. プロジェクト作成

1. [Firebase Console](https://console.firebase.google.com) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: `nextjs-todo-app`）
4. Google Analytics は任意（不要なら無効化）
5. 「プロジェクトを作成」

### 2. Authentication 有効化

1. 左メニュー「Authentication」をクリック
2. 「始める」をクリック
3. 「Sign-in method」タブを開く
4. 「メール/パスワード」を選択
5. 「有効にする」をオンにして「保存」

### 3. Web アプリの登録

1. プロジェクト設定（歯車アイコン）→「全般」
2. 「マイアプリ」セクションで「</>」（Web）をクリック
3. アプリのニックネームを入力（例: `nextjs-todo-web`）
4. 「アプリを登録」
5. 表示される設定値を控える

### 4. サービスアカウントキーの取得

1. プロジェクト設定（歯車アイコン）→「サービスアカウント」
2. 「新しい秘密鍵を生成」をクリック
3. JSON ファイルがダウンロードされる
4. ファイルの中身から必要な値を取得

## 環境変数の設定

`.env.local` ファイルを作成し、以下の環境変数を設定する。

```bash
# Firebase Client SDK（公開可）
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project

# Firebase Admin SDK（非公開）
FIREBASE_ADMIN_PROJECT_ID=your-project
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**注意:**
- `FIREBASE_ADMIN_PRIVATE_KEY` は改行を `\n` に置換して1行にする
- ダブルクォートで囲む

## データベースマイグレーション

User モデルと Todo の userId カラムを追加するため、マイグレーションを実行する。

```bash
npx prisma migrate dev --name add_user_model
```

## 認証フロー

### サインアップ

```
1. ユーザーがメール/パスワードを入力
2. Firebase Auth でユーザー作成（クライアント）
3. ID トークンを取得
4. Server Action で:
   - Firebase Admin でトークン検証
   - Prisma で User レコード作成
   - セッション Cookie 設定
5. /todo へリダイレクト
```

### サインイン

```
1. ユーザーがメール/パスワードを入力
2. Firebase Auth でログイン（クライアント）
3. ID トークンを取得
4. Server Action で:
   - セッション Cookie 作成・設定
5. /todo へリダイレクト
```

### 認証チェック（多層防御）

```
[Middleware] ─── Cookie 有無でリダイレクト（UX 向上）
     │
     ▼
[Server Component / Server Action]
     │
     ▼
[requireAuth()] ─── Firebase Admin でセッション検証（セキュリティ）
     │
     ▼
[User 取得] ─── DB からユーザー情報取得
```

## ファイル構成

```
src/
├── external/firebase/
│   ├── client.ts          # Firebase Client SDK 初期化
│   └── admin.ts           # Firebase Admin SDK 初期化
├── model/
│   ├── data/user/
│   │   └── type.ts        # User 型定義
│   ├── repository/user/
│   │   └── userRepository.ts
│   └── logic/
│       ├── user/
│       │   └── userLogic.ts
│       └── auth/
│           └── authLogic.ts   # requireAuth, getCurrentUser
├── component/domain/auth/
│   └── client/
│       ├── sign-up-form/
│       ├── sign-in-form/
│       └── sign-out-button/
├── app/(auth)/
│   ├── layout.tsx
│   ├── sign-up/page.tsx
│   └── sign-in/page.tsx
└── middleware.ts          # ルート保護
```

## 主要な関数

### requireAuth()

認証を要求する。未認証の場合は `/sign-in` へリダイレクト。

```typescript
// Server Component / Server Action で使用
const user = await requireAuth();
console.log(user.id, user.email);
```

### getCurrentUser()

現在のユーザーを取得する。未認証の場合は `null` を返す。

```typescript
const user = await getCurrentUser();
if (user) {
  // ログイン済み
}
```

## セキュリティ考慮事項

1. **セッション Cookie**
   - HttpOnly: JavaScript からアクセス不可
   - Secure: 本番環境では HTTPS のみ
   - SameSite: CSRF 対策

2. **多層防御**
   - Middleware は UX 向上のためのリダイレクト
   - 各 Server Component / Action で `requireAuth()` を呼び出し
   - Firebase Admin でセッションを厳密に検証

3. **Todo のアクセス制御**
   - すべての Repository 関数で `userId` をチェック
   - 他ユーザーの Todo にはアクセス不可
