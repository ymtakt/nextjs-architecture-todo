"use server";

import { err, ok, type Result } from "neverthrow";

import { logger } from "@/external/logger";
import type { CreateUserInput, User } from "@/model/data/user/type";
import {
  createUser,
  findUserByFirebaseUid,
  type RepositoryError,
} from "@/model/repository/user/userRepository";

/** サービス層のエラー. */
type ServiceError = {
  type: "NOT_FOUND" | "ALREADY_EXISTS" | "INTERNAL_ERROR";
  message: string;
};

type ServiceResult<T> = Result<T, ServiceError>;

/** リポジトリエラーをサービスエラーに変換する. */
function toServiceError(e: RepositoryError): ServiceError {
  if (e.type === "NOT_FOUND") {
    return { type: "NOT_FOUND", message: e.message };
  }
  if (e.type === "ALREADY_EXISTS") {
    return { type: "ALREADY_EXISTS", message: e.message };
  }
  return { type: "INTERNAL_ERROR", message: e.message };
}

/** Firebase UID でユーザーを取得する. */
export async function getUserByFirebaseUid(firebaseUid: string): Promise<ServiceResult<User>> {
  logger.info({ firebaseUid }, "Fetching user by Firebase UID");
  const result = await findUserByFirebaseUid(firebaseUid);
  if (result.isErr()) {
    return err(toServiceError(result.error));
  }
  return ok(result.value);
}

/** ユーザーを取得、存在しなければ作成する. */
export async function getOrCreateUser(input: CreateUserInput): Promise<ServiceResult<User>> {
  logger.info({ firebaseUid: input.firebaseUid }, "Get or create user");

  // まず既存ユーザーを検索
  const existingResult = await findUserByFirebaseUid(input.firebaseUid);
  if (existingResult.isOk()) {
    return ok(existingResult.value);
  }

  // NOT_FOUND の場合は新規作成
  if (existingResult.error.type === "NOT_FOUND") {
    const createResult = await createUser(input);
    if (createResult.isErr()) {
      return err(toServiceError(createResult.error));
    }
    logger.info({ userId: createResult.value.id }, "Created new user");
    return ok(createResult.value);
  }

  return err(toServiceError(existingResult.error));
}
