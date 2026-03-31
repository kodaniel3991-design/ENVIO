import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const getSecret = () =>
  new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "dev-secret-please-change-in-production"
  );

const PUBLIC_PATHS = ["/login", "/api/auth", "/api/chatbot/config"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const token = request.cookies.get("auth-token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const result = await jwtVerify(token, getSecret());
    const payload = result.payload as Record<string, unknown>;

    const isPlatformAdmin = !!payload.isPlatformAdmin;

    // /admin 경로는 플랫폼 관리자만 접근 가능
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
      if (!isPlatformAdmin) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    // 플랫폼 관리자가 /admin 외 페이지 접근 시 /admin으로 리다이렉트
    if (isPlatformAdmin && !pathname.startsWith("/admin") && !pathname.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth-token");
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|favicon\\.svg|logo\\.svg).*)"],
};
