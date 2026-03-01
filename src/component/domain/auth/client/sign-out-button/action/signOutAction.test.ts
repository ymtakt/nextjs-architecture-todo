import { describe, expect, it, vi } from "vitest";
import { signOutAction } from "./signOutAction";

// authLogic のモック
const mockClearSessionCookie = vi.fn();

vi.mock("@/model/logic/auth/authLogic", () => ({
  clearSessionCookie: () => mockClearSessionCookie(),
}));

// next/navigation のモック
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

describe("signOutAction", () => {
  // 前提：Cookie のクリアが成功する。
  // 期待値：/sign-in にリダイレクトされる。
  it("Cookie をクリアして /sign-in にリダイレクトする", async () => {
    // Arrange
    mockClearSessionCookie.mockResolvedValue({
      isOk: () => true,
      value: undefined,
    });

    // Act & Assert
    await expect(signOutAction()).rejects.toThrow("NEXT_REDIRECT:/sign-in");
    expect(mockClearSessionCookie).toHaveBeenCalled();
  });

  // 前提：Cookie のクリアに失敗する。
  // 期待値：エラーに関係なく /sign-in にリダイレクトされる。
  it("Cookie クリアがエラーでもリダイレクトする", async () => {
    // Arrange
    mockClearSessionCookie.mockResolvedValue({
      isOk: () => false,
      isErr: () => true,
      error: { type: "INTERNAL_ERROR", message: "Error" },
    });

    // Act & Assert
    await expect(signOutAction()).rejects.toThrow("NEXT_REDIRECT:/sign-in");
    expect(mockClearSessionCookie).toHaveBeenCalled();
  });
});
