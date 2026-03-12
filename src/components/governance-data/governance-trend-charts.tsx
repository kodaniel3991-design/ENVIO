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
import type { GovernanceTrendPoint } from "@/types/governance-data";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS = {
  board: "hsl(262 83% 58%)",
  ethics: "hsl(142 76% 36%)",
  compliance: "hsl(200 80% 45%)",
  audit: "hsl(25 95% 53%)",
};

type PeriodTab = "monthly" | "quarterly" | "yearly";

export type GovernanceTrendChartsProps = {
  trend?: GovernanceTrendPoint[];
};

/** 거버넌스 지표 추이: 이사회·윤리·준법·감사 월별 */
export function GovernanceTrendCharts({ trend = [] }: GovernanceTrendChartsProps) {
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
            월별 거버넌스 지표 추이 (이사회·윤리·준법·감사)
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
                  domain={[50, 100]}
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
                  dataKey="board"
                  name="이사회"
                  stroke={CATEGORY_COLORS.board}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="ethics"
                  name="윤리"
                  stroke={CATEGORY_COLORS.ethics}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="compliance"
                  name="준법"
                  stroke={CATEGORY_COLORS.compliance}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="audit"
                  name="감사"
                  stroke={CATEGORY_COLORS.audit}
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
