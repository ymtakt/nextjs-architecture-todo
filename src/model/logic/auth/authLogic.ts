"use server";

import { err, ok, type Result } from "neverthrow";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { firebaseAdminAuth } from "@/external/firebase/admin";
import { logger } from "@/external/logger";
import type { User } from "@/model/data/user/type";
import { getUserByFirebaseUid } from "@/model/logic/user/userLogic";

/** 認証エラー. */
export type AuthError = {
  type: "INVALID_TOKEN" | "SESSION_EXPIRED" | "USER_NOT_FOUND" | "INTERNAL_ERROR";
  message: string;
};

type AuthResult<T> = Result<T, AuthError>;

/** セッション Cookie 名. */
const SESSION_COOKIE_NAME = "session";

/** セッション Cookie の有効期限（5日間）. */
const SESSION_EXPIRATION_MS = 60 * 60 * 24 * 5 * 1000;

/** セッション Cookie を作成する. */
export async function createSessionCookie(idToken: string): Promise<AuthResult<string>> {
  try {
    const sessionCookie = await firebaseAdminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRATION_MS,
    });
    return ok(sessionCookie);
  } catch (e) {
    logger.error({ error: e }, "Failed to create session cookie");
    return err({
      type: "INVALID_TOKEN",
      message: e instanceof Error ? e.message : "Failed to create session cookie",
    });
  }
}

/** セッション Cookie を設定する. */
export async function setSessionCookie(sessionCookie: string): Promise<AuthResult<void>> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_EXPIRATION_MS / 1000,
      path: "/",
    });
    return ok(undefined);
  } catch (e) {
    logger.error({ error: e }, "Failed to set session cookie");
    return err({
      type: "INTERNAL_ERROR",
      message: e instanceof Error ? e.message : "Failed to set session cookie",
    });
  }
}

/** セッション Cookie を削除する. */
export async function clearSessionCookie(): Promise<AuthResult<void>> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    return ok(undefined);
  } catch (e) {
    logger.error({ error: e }, "Failed to clear session cookie");
    return err({
      type: "INTERNAL_ERROR",
      message: e instanceof Error ? e.message : "Failed to clear session cookie",
    });
  }
}

/**
 * 現在のセッションからユーザーを取得する.
 * - Ok(User): 認証済み
 * - Ok(null): 未認証（セッションなし）
 * - Err: 検証エラー
 */
export async function getCurrentUser(): Promise<AuthResult<User | null>> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return ok(null);
    }

    // Firebase Admin で検証
    const decodedClaims = await firebaseAdminAuth.verifySessionCookie(sessionCookie, true);

    // DB からユーザー取得
    const result = await getUserByFirebaseUid(decodedClaims.uid);
    if (result.isErr()) {
      logger.warn({ firebaseUid: decodedClaims.uid }, "User not found in database");
      return err({
        type: "USER_NOT_FOUND",
        message: "User not found in database",
      });
    }

    return ok(result.value);
  } catch (e) {
    logger.error({ error: e }, "Failed to verify session");
    return err({
      type: "SESSION_EXPIRED",
      message: e instanceof Error ? e.message : "Failed to verify session",
    });
  }
}

/** 認証を要求する（未認証ならリダイレクト）. */
export async function requireAuth(): Promise<User> {
  const result = await getCurrentUser();
  if (result.isErr() || !result.value) {
    redirect("/sign-in");
  }
  return result.value;
}

/** セッション Cookie の存在チェック（Middleware 用）. */
export async function hasSessionCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  return !!cookieStore.get(SESSION_COOKIE_NAME)?.value;
}
