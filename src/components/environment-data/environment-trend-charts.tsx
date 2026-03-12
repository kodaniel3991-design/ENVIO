"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  ComposedChart,
} from "recharts";
import type {
  MonthlyEmissionPoint,
  EnergyTrendPoint,
} from "@/types/environment-data";
import { cn } from "@/lib/utils";

const SCOPE_COLORS = {
  scope1: "hsl(142 76% 36%)",
  scope2: "hsl(200 80% 45%)",
  scope3: "hsl(25 95% 53%)",
};

type PeriodTab = "monthly" | "quarterly" | "yearly";

export type EnvironmentTrendChartsProps = {
  monthlyEmissions?: MonthlyEmissionPoint[];
  energyTrend?: EnergyTrendPoint[];
};

/** 차트 1: 월별 Scope 1·2·3 배출량 / 차트 2: 에너지 vs 재생에너지 비율 */
export function EnvironmentTrendCharts({
  monthlyEmissions = [],
  energyTrend = [],
}: EnvironmentTrendChartsProps) {
  const [period, setPeriod] = useState<PeriodTab>("monthly");

  const emissionData = monthlyEmissions.map((d) => ({
    ...d,
    name: d.month.slice(5), // "01", "02"...
  }));

  const energyData = energyTrend.map((d) => ({
    ...d,
    name: d.month.slice(5),
    renewable: d.renewablePercent,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>월별 Scope 1·2·3 배출량 추이</CardTitle>
          <Tabs period={period} onPeriodChange={setPeriod} />
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={emissionData}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="name"
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
                  dataKey="scope1"
                  name="Scope 1"
                  stroke={SCOPE_COLORS.scope1}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="scope2"
                  name="Scope 2"
                  stroke={SCOPE_COLORS.scope2}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="scope3"
                  name="Scope 3"
                  stroke={SCOPE_COLORS.scope3}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>에너지 사용량 vs 재생에너지 비율</CardTitle>
          <Tabs period={period} onPeriodChange={setPeriod} />
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={energyData}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Legend fontSize={11} />
                <Bar
                  yAxisId="left"
                  dataKey="totalEnergy"
                  name="에너지 사용량 (GJ)"
                  fill="hsl(var(--muted))"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="renewable"
                  name="재생에너지 비율 (%)"
                  stroke="hsl(142 76% 36%)"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold">{children}</h3>;
}

function Tabs({
  period,
  onPeriodChange,
}: {
  period: PeriodTab;
  onPeriodChange: (p: PeriodTab) => void;
}) {
  return (
    <div className="flex rounded-md border border-border p-0.5">
      {(["monthly", "quarterly", "yearly"] as const).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPeriodChange(p)}
          className={cn(
            "rounded px-2 py-1 text-xs font-medium transition-colors",
            period === p
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {p === "monthly" ? "월별" : p === "quarterly" ? "분기별" : "연도별"}
        </button>
      ))}
    </div>
  );
}
