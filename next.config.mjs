/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/", destination: "/dashboard", permanent: false },
      // 데이터 관리
      { source: "/esg/environment", destination: "/data/esg/environment", permanent: false },
      { source: "/esg/social", destination: "/data/esg/social", permanent: false },
      { source: "/esg/governance", destination: "/data/esg/governance", permanent: false },
      { source: "/analytics/scope1", destination: "/data/emissions/scope1", permanent: false },
      { source: "/analytics/scope2", destination: "/data/emissions/scope2", permanent: false },
      { source: "/analytics/scope3", destination: "/data/emissions/scope3", permanent: false },
      { source: "/scope3", destination: "/data/supply-chain/vendors", permanent: false },
      { source: "/scope3/vendors", destination: "/data/supply-chain/vendors", permanent: false },
      { source: "/scope3/invite", destination: "/data/supply-chain/invitations", permanent: false },
      { source: "/scope3/submissions", destination: "/data/supply-chain/submissions", permanent: false },
      { source: "/scope3/verification", destination: "/data/supply-chain/verification", permanent: false },
      // KPI
      { source: "/kpi", destination: "/kpi/dashboard", permanent: false },
      // 분석 (insights → analytics)
      { source: "/insights", destination: "/analytics/emissions", permanent: false },
      { source: "/insights/anomalies", destination: "/analytics/anomalies", permanent: false },
      { source: "/insights/scenarios", destination: "/analytics/scenarios", permanent: false },
      { source: "/insights/reports", destination: "/analytics/emissions", permanent: false },
      { source: "/carbon-flow", destination: "/analytics/carbon-flow", permanent: false },
      // 감축 허브 (simulator → action)
      { source: "/simulator", destination: "/action/targets", permanent: false },
      { source: "/simulator/opportunities", destination: "/action/targets", permanent: false },
      { source: "/simulator/scenarios", destination: "/action/projects", permanent: false },
      { source: "/simulator/projects", destination: "/action/projects", permanent: false },
      { source: "/simulator/progress", destination: "/action/progress", permanent: false },
      // 보고서
      { source: "/reports", destination: "/reports/esg", permanent: false },
      { source: "/reports/framework", destination: "/reports/frameworks/k-esg", permanent: false },
      { source: "/reports/databook", destination: "/reports/esg", permanent: false },
      // 설정
      { source: "/settings", destination: "/settings/organization", permanent: false },
      { source: "/settings/integration", destination: "/settings/integrations", permanent: false },
      // favicon
      { source: "/favicon.ico", destination: "/favicon.svg", permanent: false },
    ];
  },
};

export default nextConfig;
