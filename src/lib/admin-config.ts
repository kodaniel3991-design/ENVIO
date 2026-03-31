export type AdminLink = { href: string; label: string };

export type AdminGroup = {
  label: string;
  children: AdminLink[];
};

export const ADMIN_GROUPS: AdminGroup[] = [
  {
    label: "",
    children: [
      { href: "/admin", label: "대시보드" },
    ],
  },
  {
    label: "기업 관리",
    children: [
      { href: "/admin/organizations", label: "기업 목록" },
    ],
  },
  {
    label: "사용자 관리",
    children: [
      { href: "/admin/users", label: "사용자 승인 및 관리" },
    ],
  },
  {
    label: "공통 데이터",
    children: [
      { href: "/admin/emission-factors", label: "배출계수 마스터" },
      { href: "/admin/common-codes", label: "공통 코드 관리" },
    ],
  },
  {
    label: "서비스",
    children: [
      { href: "/admin/chatbot", label: "챗봇 관리" },
      { href: "/admin/notices", label: "공지사항" },
      { href: "/admin/support", label: "고객 문의" },
    ],
  },
  {
    label: "구독",
    children: [
      { href: "/admin/subscriptions", label: "요금제 / 구독" },
    ],
  },
  {
    label: "운영",
    children: [
      { href: "/admin/audit-logs", label: "감사 로그" },
      { href: "/admin/monitoring", label: "시스템 모니터링" },
      { href: "/admin/security", label: "접근 제어 / 보안" },
    ],
  },
];

export const ALL_ADMIN_LINKS = ADMIN_GROUPS.flatMap((g) => g.children);
