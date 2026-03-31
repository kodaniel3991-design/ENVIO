import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const getSecret = () =>
  new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "dev-secret-please-change-in-production"
  );

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  isPlatformAdmin: boolean;
  organizationId: number | null;
}

export async function signToken(payload: TokenPayload) {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as unknown as TokenPayload;
}

/**
 * API Route에서 현재 로그인 사용자의 인증 정보를 가져옵니다.
 * organizationId가 없으면 403을 던집니다.
 */
export async function getAuthOrg(): Promise<{ userId: string; organizationId: number }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) throw new AuthError("Unauthorized", 401);

  const payload = await verifyToken(token);
  if (!payload.organizationId) throw new AuthError("소속 조직이 없습니다.", 403);

  return { userId: payload.userId, organizationId: payload.organizationId };
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
