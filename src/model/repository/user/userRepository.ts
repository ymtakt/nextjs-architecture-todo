"use server";

import { err, ok, type Result } from "neverthrow";

import { prisma } from "@/external/prisma";
import type { CreateUserInput, User } from "@/model/data/user/type";

/** リポジトリ層のエラー. */
export type RepositoryError = {
  type: "NOT_FOUND" | "DATABASE_ERROR" | "ALREADY_EXISTS";
  message: string;
};

type RepositoryResult<T> = Result<T, RepositoryError>;

/** Firebase UID でユーザーを検索する. */
export async function findUserByFirebaseUid(firebaseUid: string): Promise<RepositoryResult<User>> {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid },
    });
    if (!user) {
      return err({ type: "NOT_FOUND", message: `User with firebaseUid ${firebaseUid} not found` });
    }
    return ok(user);
  } catch (e) {
    return err({
      type: "DATABASE_ERROR",
      message: e instanceof Error ? e.message : "Unknown error",
    });
  }
}

/** ID でユーザーを検索する. */
export async function findUserById(id: string): Promise<RepositoryResult<User>> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      return err({ type: "NOT_FOUND", message: `User with id ${id} not found` });
    }
    return ok(user);
  } catch (e) {
    return err({
      type: "DATABASE_ERROR",
      message: e instanceof Error ? e.message : "Unknown error",
    });
  }
}

/** ユーザーを作成する. */
export async function createUser(input: CreateUserInput): Promise<RepositoryResult<User>> {
  try {
    const user = await prisma.user.create({
      data: {
        firebaseUid: input.firebaseUid,
        email: input.email,
        displayName: input.displayName,
      },
    });
    return ok(user);
  } catch (e) {
    // Unique constraint violation
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return err({ type: "ALREADY_EXISTS", message: "User already exists" });
    }
    return err({
      type: "DATABASE_ERROR",
      message: e instanceof Error ? e.message : "Unknown error",
    });
  }
}
