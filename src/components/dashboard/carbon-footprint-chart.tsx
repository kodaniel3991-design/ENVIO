"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import type { ChartDataPoint } from "@/types";
import { ChartShell } from "@/components/common/chart-shell";

const CHART_COLORS = {
  scope1: "hsl(var(--taupe-400))",
  scope2: "hsl(var(--carbon-success))",
  scope3: "hsl(var(--taupe-300))",
};

interface CarbonFootprintChartProps {
  data: ChartDataPoint[];
  totalLabel: string;
  isLoading?: boolean;
  fillHeight?: boolean;
}

export function CarbonFootprintChart({
  data,
  isLoading,
  fillHeight,
}: CarbonFootprintChartProps) {
  const [activeTab, setActiveTab] = useState<string>("all");

  const scope1Data = data.map((d) => ({ ...d, value: d.scope1 as number }));
  const scope2Data = data.map((d) => ({ ...d, value: d.scope2 as number }));
  const scope3Data = data.map((d) => ({ ...d, value: d.scope3 as number }));
  const allData = data.map((d) => ({
    ...d,
    scope1: d.scope1,
    scope2: d.scope2,
    scope3: d.scope3,
    total: (d.scope1 as number) + (d.scope2 as number) + (d.scope3 as number),
  }));

  return (
    <ChartShell
      title=""
      isLoading={isLoading}
      isEmpty={!data || data.length === 0}
      fillHeight={fillHeight}
      aria-label="Scope 1-3 월별 탄소 배출량 추이 라인 차트"
      actions={
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="h-7 w-fit">
            <TabsTrigger value="s1" className="text-xs">
              S1
            </TabsTrigger>
            <TabsTrigger value="s2" className="text-xs">
              S2
            </TabsTrigger>
            <TabsTrigger value="s3" className="text-xs">
              S3
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs">
              전체
            </TabsTrigger>
            <TabsTrigger value="total" className="text-xs">
              합산
            </TabsTrigger>
          </TabsList>
          <TabsContent value="s1" className="mt-0" />
          <TabsContent value="s2" className="mt-0" />
          <TabsContent value="s3" className="mt-0" />
          <TabsContent value="all" className="mt-0" />
          <TabsContent value="total" className="mt-0" />
        </Tabs>
      }
    >
      <div className="relative h-full min-h-[120px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === "s1" ? (
              <LineChart
                data={scope1Data}
                margin={{ top: 5, right: 20, left: 5, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Scope 1"
                  stroke={CHART_COLORS.scope1}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  isAnimationActive
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </LineChart>
            ) : activeTab === "s3" ? (
              <LineChart
                data={scope3Data}
                margin={{ top: 5, right: 20, left: 5, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Scope 3"
                  stroke={CHART_COLORS.scope3}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  isAnimationActive
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </LineChart>
            ) : activeTab === "s2" ? (
              <LineChart
                data={scope2Data}
                margin={{ top: 5, right: 20, left: 5, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Scope 2"
                  stroke={CHART_COLORS.scope2}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  isAnimationActive
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </LineChart>
            ) : activeTab === "all" ? (
              <LineChart
                data={allData}
                margin={{ top: 5, right: 20, left: 5, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="scope1"
                  name="Scope 1"
                  stroke={CHART_COLORS.scope1}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  isAnimationActive
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
                <Line
                  type="monotone"
                  dataKey="scope2"
                  name="Scope 2"
                  stroke={CHART_COLORS.scope2}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  isAnimationActive
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
                <Line
                  type="monotone"
                  dataKey="scope3"
                  name="Scope 3"
                  stroke={CHART_COLORS.scope3}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  isAnimationActive
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </LineChart>
            ) : (
              <LineChart
                data={allData}
                margin={{ top: 5, right: 20, left: 5, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="합산 (S1+S2+S3)"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  isAnimationActive
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </ChartShell>
  );
}
