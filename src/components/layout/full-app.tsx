"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Providers } from "@/app/providers";
import { AppLayout } from "./app-layout";
import { SeedInitializer } from "./seed-initializer";

function LayoutFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export function FullApp({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login";

  if (isAuthPage) {
    return <Providers>{children}</Providers>;
  }

  return (
    <Providers>
      <SeedInitializer />
      <Suspense fallback={<LayoutFallback />}>
        <AppLayout>
          <Suspense fallback={<LayoutFallback />}>{children}</Suspense>
        </AppLayout>
      </Suspense>
    </Providers>
  );
}
