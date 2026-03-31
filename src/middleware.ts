import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const getSecret = () =>
  new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "dev-secret-please-change-in-production"
  );

const PUBLIC_PATHS = ["/login", "/api/auth", "/api/chatbot/config", "/api/chatbot-tools"];

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
    const organizationId = payload.organizationId as number | null;

    // /admin 경로는 플랫폼 관리자만 접근 가능
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
      if (!isPlatformAdmin) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      // 플랫폼 관리자는 조직 필터 없이 접근 — 그대로 통과
      return NextResponse.next();
    }

    // 플랫폼 관리자가 /admin 외 페이지 접근 시 /admin으로 리다이렉트
    if (isPlatformAdmin && !pathname.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    // 일반 사용자: organizationId가 없으면 API 접근 차단 (로그인/getting-started 제외)
    if (!isPlatformAdmin && !organizationId) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "소속 조직이 없습니다. 관리자에게 문의하세요." }, { status: 403 });
      }
      // 페이지 접근은 허용 (getting-started에서 조직을 설정할 수 있으므로)
    }

    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth-token");
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|favicon\\.svg|logo\\.svg|ESG_ON_logo_header\\.png).*)"],
};
