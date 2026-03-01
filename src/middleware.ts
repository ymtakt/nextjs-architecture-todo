import { type NextRequest, NextResponse } from "next/server";

/** セッション Cookie 名. */
const SESSION_COOKIE_NAME = "session";

/** 認証が必要なパス. */
const protectedPaths = ["/todo"];

/** 認証済みユーザーがアクセスできないパス. */
const authPaths = ["/sign-in", "/sign-up"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // 認証が必要なパスに未認証でアクセス → サインインへリダイレクト
  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    if (!sessionCookie) {
      const signInUrl = new URL("/sign-in", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  // 認証済みで認証ページにアクセス → Todo へリダイレクト
  if (authPaths.some((path) => pathname.startsWith(path))) {
    if (sessionCookie) {
      const todoUrl = new URL("/todo", request.url);
      return NextResponse.redirect(todoUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/todo/:path*", "/sign-in", "/sign-up"],
};
