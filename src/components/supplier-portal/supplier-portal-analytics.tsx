"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import type { StatusDistribution, ResponseTrendPoint } from "@/types/supplier-portal";

interface SupplierPortalAnalyticsProps {
  statusDistribution: StatusDistribution[];
  tierDistribution: { tier: string; count: number }[];
  riskDistribution: { risk: string; count: number }[];
  responseTrend: ResponseTrendPoint[];
}

const RISK_COLORS = ["hsl(142 76% 36%)", "hsl(38 92% 50%)", "hsl(25 95% 53%)", "hsl(0 84% 60%)"];

/** 네트워크 현황 분석 - 4개 차트 */
export function SupplierPortalAnalytics({
  statusDistribution,
  tierDistribution,
  riskDistribution,
  responseTrend,
}: SupplierPortalAnalyticsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-sm font-semibold">상태별 협력사 분포</h3>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution.filter((d) => d.count > 0)}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  label={({ status, count }) => `${status} ${count}`}
                >
                  {statusDistribution
                    .filter((d) => d.count > 0)
                    .map((entry) => (
                      <Cell key={entry.status} fill={entry.fill ?? "hsl(var(--muted))"} />
                    ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-sm font-semibold">Tier별 협력사 수</h3>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={tierDistribution}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="tier"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Bar
                  dataKey="count"
                  name="협력사 수"
                  fill="hsl(217 91% 60%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-sm font-semibold">리스크 분포</h3>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={riskDistribution}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 50, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="risk"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Bar
                  dataKey="count"
                  name="건수"
                  radius={[0, 4, 4, 0]}
                  label={{ position: "right", fontSize: 11 }}
                >
                  {riskDistribution.map((_, index) => (
                    <Cell key={index} fill={RISK_COLORS[index % RISK_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-sm font-semibold">주차별 응답 추이</h3>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={responseTrend}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Legend fontSize={11} />
                <Line
                  type="monotone"
                  dataKey="invited"
                  name="초대"
                  stroke="hsl(217 91% 60%)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="responded"
                  name="응답"
                  stroke="hsl(142 76% 36%)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
