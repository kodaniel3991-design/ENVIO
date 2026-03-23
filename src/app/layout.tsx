import type { Metadata } from "next";
import { RootShell } from "@/components/layout/root-shell";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "CarbonOS – ESG Carbon Management",
  description: "AI-native carbon and ESG management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">
        <RootShell>{children}</RootShell>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
