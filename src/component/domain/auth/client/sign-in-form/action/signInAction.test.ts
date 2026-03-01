import { describe, expect, it, vi } from "vitest";
import { signInAction } from "./signInAction";

// authLogic のモック
const mockCreateSessionCookie = vi.fn();
const mockSetSessionCookie = vi.fn();

vi.mock("@/model/logic/auth/authLogic", () => ({
  createSessionCookie: (...args: unknown[]) => mockCreateSessionCookie(...args),
  setSessionCookie: (...args: unknown[]) => mockSetSessionCookie(...args),
}));

// userLogic のモック
const mockGetUserByFirebaseUid = vi.fn();

vi.mock("@/model/logic/user/userLogic", () => ({
  getUserByFirebaseUid: (...args: unknown[]) => mockGetUserByFirebaseUid(...args),
}));

describe("signInAction", () => {
  // 前提：指定した Firebase UID のユーザーが存在しない。
  // 期待値：エラーが返される。
  it("ユーザーが存在しない場合はエラーを返す", async () => {
    // Arrange
    mockGetUserByFirebaseUid.mockResolvedValue({
      isErr: () => true,
      error: { type: "USER_NOT_FOUND", message: "ユーザーが見つかりません" },
    });

    // Act
    const result = await signInAction({
      idToken: "test-token",
      firebaseUid: "non-existent-uid",
    });

    // Assert
    expect(result.success).toBe(false);
    expect(result.message).toBe("ユーザーが見つかりません.");
  });

  // 前提：ユーザーは存在するが、セッション Cookie の作成に失敗する。
  // 期待値：エラーが返される。
  it("セッション Cookie の作成に失敗した場合はエラーを返す", async () => {
    // Arrange
    mockGetUserByFirebaseUid.mockResolvedValue({
      isErr: () => false,
      value: { id: "user-id", firebaseUid: "test-uid", email: "test@example.com" },
    });
    mockCreateSessionCookie.mockResolvedValue({
      isErr: () => true,
      error: { type: "INVALID_TOKEN", message: "無効なトークンです" },
    });

    // Act
    const result = await signInAction({
      idToken: "invalid-token",
      firebaseUid: "test-uid",
    });

    // Assert
    expect(result.success).toBe(false);
    expect(result.message).toBe("無効なトークンです");
  });

  // 前提：セッション Cookie は作成できるが、Cookie の設定に失敗する。
  // 期待値：エラーが返される。
  it("Cookie の設定に失敗した場合はエラーを返す", async () => {
    // Arrange
    mockGetUserByFirebaseUid.mockResolvedValue({
      isErr: () => false,
      value: { id: "user-id", firebaseUid: "test-uid", email: "test@example.com" },
    });
    mockCreateSessionCookie.mockResolvedValue({
      isErr: () => false,
      value: "session-cookie-value",
    });
    mockSetSessionCookie.mockResolvedValue({
      isErr: () => true,
      error: { type: "INTERNAL_ERROR", message: "Cookie の設定に失敗しました" },
    });

    // Act
    const result = await signInAction({
      idToken: "valid-token",
      firebaseUid: "test-uid",
    });

    // Assert
    expect(result.success).toBe(false);
    expect(result.message).toBe("Cookie の設定に失敗しました");
  });

  // 前提：有効な認証情報でサインインする。
  // 期待値：サインインが成功する。
  it("正常にサインインできる", async () => {
    // Arrange
    mockGetUserByFirebaseUid.mockResolvedValue({
      isErr: () => false,
      value: { id: "user-id", firebaseUid: "test-uid", email: "test@example.com" },
    });
    mockCreateSessionCookie.mockResolvedValue({
      isErr: () => false,
      value: "session-cookie-value",
    });
    mockSetSessionCookie.mockResolvedValue({
      isErr: () => false,
      value: undefined,
    });

    // Act
    const result = await signInAction({
      idToken: "valid-token",
      firebaseUid: "test-uid",
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.message).toBe("ログインしました.");
    expect(mockGetUserByFirebaseUid).toHaveBeenCalledWith("test-uid");
    expect(mockCreateSessionCookie).toHaveBeenCalledWith("valid-token");
    expect(mockSetSessionCookie).toHaveBeenCalledWith("session-cookie-value");
  });
});
