import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "플랫폼 관리 | CarbonOS",
  description: "기업, 사용자, 공통 데이터를 관리합니다.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
