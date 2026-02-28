import pino from "pino";

/**
 * アプリケーション全体で使用するロガーインスタンス.
 * 開発環境では pino-pretty による整形出力を行う.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});
