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
} from "recharts";
import type { SocialTrendPoint } from "@/types/social-data";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS = {
  humanRights: "hsl(262 83% 58%)",
  labor: "hsl(200 80% 45%)",
  safety: "hsl(142 76% 36%)",
  community: "hsl(25 95% 53%)",
};

type PeriodTab = "monthly" | "quarterly" | "yearly";

export type SocialTrendChartsProps = {
  trend?: SocialTrendPoint[];
};

/** 사회 지표 추이: 인권·노동·안전보건·지역사회 월별 */
export function SocialTrendCharts({ trend = [] }: SocialTrendChartsProps) {
  const [period, setPeriod] = useState<PeriodTab>("monthly");

  const chartData = trend.map((d) => ({
    ...d,
    name: d.month.slice(5),
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-1">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <h3 className="text-sm font-semibold">
            월별 사회 지표 추이 (인권·노동·안전보건·지역사회)
          </h3>
          <div className="flex rounded-md border border-border p-0.5">
            {(["monthly", "quarterly", "yearly"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={cn(
                  "rounded px-2 py-1 text-xs font-medium transition-colors",
                  period === p
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p === "monthly"
                  ? "월별"
                  : p === "quarterly"
                    ? "분기별"
                    : "연도별"}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="name"
                  tick={{
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                  axisLine={false}
                  tickLine={false}
                  domain={[80, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  formatter={(value: number) => [`${value}%`, ""]}
                />
                <Legend fontSize={11} />
                <Line
                  type="monotone"
                  dataKey="humanRights"
                  name="인권"
                  stroke={CATEGORY_COLORS.humanRights}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="labor"
                  name="노동"
                  stroke={CATEGORY_COLORS.labor}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="safety"
                  name="안전보건"
                  stroke={CATEGORY_COLORS.safety}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="community"
                  name="지역사회"
                  stroke={CATEGORY_COLORS.community}
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
