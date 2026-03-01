import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/external/prisma";
import {
  clearSessionCookie,
  createSessionCookie,
  getCurrentUser,
  hasSessionCookie,
  requireAuth,
  setSessionCookie,
} from "@/model/logic/auth/authLogic";

// モックを vi.hoisted で定義
const mockFirebaseAdminAuth = vi.hoisted(() => ({
  createSessionCookie: vi.fn(),
  verifySessionCookie: vi.fn(),
}));

const mockCookieStore = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/external/firebase/admin", () => ({
  firebaseAdminAuth: mockFirebaseAdminAuth,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => mockCookieStore),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

describe("authLogic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // 各テスト後にクリーンアップ
    await prisma.todo.deleteMany();
    await prisma.user.deleteMany();
  });

  describe("createSessionCookie", () => {
    // 前提：有効な ID トークンを渡す。
    // 期待値：セッション Cookie が作成される。
    it("セッション Cookie を正常に作成できる", async () => {
      // Arrange
      mockFirebaseAdminAuth.createSessionCookie.mockResolvedValue("session-cookie-value");

      // Act
      const result = await createSessionCookie("valid-id-token");

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("session-cookie-value");
      }
      expect(mockFirebaseAdminAuth.createSessionCookie).toHaveBeenCalledWith("valid-id-token", {
        expiresIn: expect.any(Number),
      });
    });

    // 前提：Firebase がエラーを返す。
    // 期待値：INVALID_TOKEN エラーが返される。
    it("Firebase がエラーを返した場合は INVALID_TOKEN エラーを返す", async () => {
      // Arrange
      mockFirebaseAdminAuth.createSessionCookie.mockRejectedValue(new Error("Invalid token"));

      // Act
      const result = await createSessionCookie("invalid-token");

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("INVALID_TOKEN");
        expect(result.error.message).toContain("Invalid token");
      }
    });

    // 前提：Firebase が Error 以外の例外を投げる。
    // 期待値：INVALID_TOKEN エラーが返される。
    it("Error 以外の例外でもエラーを返す", async () => {
      // Arrange
      mockFirebaseAdminAuth.createSessionCookie.mockRejectedValue("string error");

      // Act
      const result = await createSessionCookie("token");

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("INVALID_TOKEN");
      }
    });
  });

  describe("setSessionCookie", () => {
    // 前提：有効なセッション Cookie を渡す。
    // 期待値：Cookie が正常に設定される。
    it("Cookie を正常に設定できる", async () => {
      // Act
      const result = await setSessionCookie("session-cookie-value");

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "session",
        "session-cookie-value",
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        }),
      );
    });

    // 前提：Cookie 設定時に Error が発生する。
    // 期待値：INTERNAL_ERROR が返される。
    it("Cookie 設定でエラーが発生した場合は INTERNAL_ERROR を返す", async () => {
      // Arrange
      mockCookieStore.set.mockImplementation(() => {
        throw new Error("Cookie error");
      });

      // Act
      const result = await setSessionCookie("value");

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("INTERNAL_ERROR");
        expect(result.error.message).toBe("Cookie error");
      }
    });

    // 前提：Cookie 設定時に Error 以外の例外が発生する。
    // 期待値：INTERNAL_ERROR が返される。
    it("Error 以外の例外でも INTERNAL_ERROR を返す", async () => {
      // Arrange
      mockCookieStore.set.mockImplementation(() => {
        throw "string error";
      });

      // Act
      const result = await setSessionCookie("value");

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("INTERNAL_ERROR");
        expect(result.error.message).toBe("Failed to set session cookie");
      }
    });
  });

  describe("clearSessionCookie", () => {
    // 前提：Cookie が存在する。
    // 期待値：Cookie が正常に削除される。
    it("Cookie を正常に削除できる", async () => {
      // Act
      const result = await clearSessionCookie();

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockCookieStore.delete).toHaveBeenCalledWith("session");
    });

    // 前提：Cookie 削除時に Error が発生する。
    // 期待値：INTERNAL_ERROR が返される。
    it("Cookie 削除でエラーが発生した場合は INTERNAL_ERROR を返す", async () => {
      // Arrange
      mockCookieStore.delete.mockImplementation(() => {
        throw new Error("Delete error");
      });

      // Act
      const result = await clearSessionCookie();

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("INTERNAL_ERROR");
        expect(result.error.message).toBe("Delete error");
      }
    });

    // 前提：Cookie 削除時に Error 以外の例外が発生する。
    // 期待値：INTERNAL_ERROR が返される。
    it("Error 以外の例外でも INTERNAL_ERROR を返す", async () => {
      // Arrange
      mockCookieStore.delete.mockImplementation(() => {
        throw "string error";
      });

      // Act
      const result = await clearSessionCookie();

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("INTERNAL_ERROR");
        expect(result.error.message).toBe("Failed to clear session cookie");
      }
    });
  });

  describe("getCurrentUser", () => {
    // 前提：セッション Cookie が存在しない。
    // 期待値：null が返される。
    it("セッション Cookie がない場合は null を返す", async () => {
      // Arrange
      mockCookieStore.get.mockReturnValue(undefined);

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeNull();
      }
    });

    // 前提：有効なセッション Cookie があり、DB にユーザーが存在する。
    // 期待値：ユーザーが取得できる。
    it("有効なセッションでユーザーを取得できる", async () => {
      // Arrange
      const user = await prisma.user.create({
        data: {
          firebaseUid: "test-firebase-uid",
          email: "test@example.com",
        },
      });
      mockCookieStore.get.mockReturnValue({ value: "valid-session" });
      mockFirebaseAdminAuth.verifySessionCookie.mockResolvedValue({
        uid: "test-firebase-uid",
      });

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value?.id).toBe(user.id);
        expect(result.value?.email).toBe("test@example.com");
      }
    });

    // 前提：有効なセッション Cookie があるが、DB にユーザーが存在しない。
    // 期待値：USER_NOT_FOUND エラーが返される。
    it("DB にユーザーが存在しない場合は USER_NOT_FOUND エラーを返す", async () => {
      // Arrange
      mockCookieStore.get.mockReturnValue({ value: "valid-session" });
      mockFirebaseAdminAuth.verifySessionCookie.mockResolvedValue({
        uid: "non-existent-uid",
      });

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("USER_NOT_FOUND");
      }
    });

    // 前提：セッション Cookie の検証に失敗する。
    // 期待値：SESSION_EXPIRED エラーが返される。
    it("セッション検証に失敗した場合は SESSION_EXPIRED エラーを返す", async () => {
      // Arrange
      mockCookieStore.get.mockReturnValue({ value: "expired-session" });
      mockFirebaseAdminAuth.verifySessionCookie.mockRejectedValue(new Error("Session expired"));

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("SESSION_EXPIRED");
      }
    });

    // 前提：セッション Cookie の検証時に Error 以外の例外が発生する。
    // 期待値：SESSION_EXPIRED エラーが返される。
    it("Error 以外の例外でも SESSION_EXPIRED エラーを返す", async () => {
      // Arrange
      mockCookieStore.get.mockReturnValue({ value: "session" });
      mockFirebaseAdminAuth.verifySessionCookie.mockRejectedValue("string error");

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("SESSION_EXPIRED");
      }
    });
  });

  describe("requireAuth", () => {
    // 前提：認証済みのユーザーがいる。
    // 期待値：ユーザーが返される。
    it("認証済みの場合はユーザーを返す", async () => {
      // Arrange
      const user = await prisma.user.create({
        data: {
          firebaseUid: "auth-uid",
          email: "auth@example.com",
        },
      });
      mockCookieStore.get.mockReturnValue({ value: "valid-session" });
      mockFirebaseAdminAuth.verifySessionCookie.mockResolvedValue({
        uid: "auth-uid",
      });

      // Act
      const result = await requireAuth();

      // Assert
      expect(result.id).toBe(user.id);
    });

    // 前提：未認証の状態。
    // 期待値：/sign-in にリダイレクトされる。
    it("未認証の場合は /sign-in にリダイレクトする", async () => {
      // Arrange
      mockCookieStore.get.mockReturnValue(undefined);

      // Act & Assert
      await expect(requireAuth()).rejects.toThrow("NEXT_REDIRECT:/sign-in");
    });

    // 前提：セッションエラーが発生する。
    // 期待値：/sign-in にリダイレクトされる。
    it("セッションエラーの場合も /sign-in にリダイレクトする", async () => {
      // Arrange
      mockCookieStore.get.mockReturnValue({ value: "invalid-session" });
      mockFirebaseAdminAuth.verifySessionCookie.mockRejectedValue(new Error("Invalid"));

      // Act & Assert
      await expect(requireAuth()).rejects.toThrow("NEXT_REDIRECT:/sign-in");
    });
  });

  describe("hasSessionCookie", () => {
    // 前提：セッション Cookie が存在する。
    // 期待値：true が返される。
    it("セッション Cookie が存在する場合は true を返す", async () => {
      // Arrange
      mockCookieStore.get.mockReturnValue({ value: "session" });

      // Act
      const result = await hasSessionCookie();

      // Assert
      expect(result).toBe(true);
    });

    // 前提：セッション Cookie が存在しない。
    // 期待値：false が返される。
    it("セッション Cookie が存在しない場合は false を返す", async () => {
      // Arrange
      mockCookieStore.get.mockReturnValue(undefined);

      // Act
      const result = await hasSessionCookie();

      // Assert
      expect(result).toBe(false);
    });
  });
});
