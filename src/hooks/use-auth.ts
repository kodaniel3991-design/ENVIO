"use client";

import { useQuery } from "@tanstack/react-query";

interface AuthUser {
  userId: string;
  email: string;
  name: string;
  isPlatformAdmin: boolean;
}

async function fetchMe(): Promise<AuthUser> {
  const res = await fetch("/api/auth/me");
  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
}

export function useAuth() {
  const { data, isLoading } = useQuery<AuthUser>({
    queryKey: ["auth-me"],
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    user: data ?? null,
    isLoading,
    isPlatformAdmin: data?.isPlatformAdmin ?? false,
  };
}
