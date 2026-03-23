"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatNumber } from "@/lib/utils";
import {
  getEmployeeRoster,
  getCommutingWorkDays,
  saveCommutingWorkDays,
} from "@/services/api";
import { getEmployeeCommuteFactor } from "@/lib/commute-factors";
import type { EmployeeRosterItem } from "@/types";
import { Fragment } from "react";
import { Plus, Minus } from "lucide-react";

const MONTH_LABELS = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

const UNASSIGNED_DEPT = "미지정";

interface Scope3CommutingInputProps {
  year: string;
  onYearChange: (y: string) => void;
  /** 배출계수 (tCO₂e/근무일) */
  factor: number;
  onFactorChange: (v: number) => void;
}

export function Scope3CommutingInput({
  year,
  onYearChange,
  factor,
  onFactorChange,
}: Scope3CommutingInputProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => String(currentYear - i));
  const queryClient = useQueryClient();
  const { data: roster = [], isLoading: rosterLoading } = useQuery<EmployeeRosterItem[]>({
    queryKey: ["employee-roster"],
    queryFn: () => getEmployeeRoster(),
  });
  const { data: savedData, isLoading: workDaysLoading } = useQuery({
    queryKey: ["commuting-work-days", year],
    queryFn: () => getCommutingWorkDays(year),
  });

  const [workDays, setWorkDays] = useState<Record<string, number[]>>({});
  const [saved, setSaved] = useState(false);
  /** 부서별 확장 여부. true = 직원 행 표시, false = 부서 취합만 */
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!savedData?.workDays) return;
    const next: Record<string, number[]> = {};
    for (const [empId, days] of Object.entries(savedData.workDays)) {
      next[empId] = [...(days ?? Array(12).fill(0))];
    }
    setWorkDays(next);
  }, [savedData]);

  // Sync roster: ensure each employee has a 12-month array
  useEffect(() => {
    if (roster.length === 0) return;
    setWorkDays((prev) => {
      const next = { ...prev };
      for (const emp of roster) {
        const key = emp.id;
        if (!next[key]) next[key] = Array(12).fill(0);
        else if (next[key].length !== 12)
          next[key] = [...next[key], ...Array(12 - next[key].length).fill(0)];
      }
      return next;
    });
  }, [roster]);

  const saveMutation = useMutation({
    mutationFn: (data: { year: string; workDays: Record<string, number[]> }) =>
      saveCommutingWorkDays({ year: data.year, workDays: data.workDays }),
    onSuccess: (_, { year: y }) => {
      queryClient.invalidateQueries({ queryKey: ["commuting-work-days", y] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleWorkDayChange = (empId: string, monthIndex: number, raw: string) => {
    const v = raw === "" ? 0 : parseFloat(raw);
    const num = Number.isNaN(v) ? 0 : Math.max(0, v);
    setWorkDays((prev) => {
      const current = prev[empId] ?? Array(12).fill(0);
      const next = [...current];
      next[monthIndex] = num;
      return { ...prev, [empId]: next };
    });
  };

  const getWorkDays = (empId: string): number[] =>
    workDays[empId] ?? Array(12).fill(0);

  /** 부서별 직원 그룹 (부서명 → 직원 배열), 정렬된 부서 목록 */
  const rosterByDept = useMemo(() => {
    const map = new Map<string, typeof roster>();
    roster.forEach((emp) => {
      const dept = emp.department?.trim() || UNASSIGNED_DEPT;
      if (!map.has(dept)) map.set(dept, []);
      map.get(dept)!.push(emp);
    });
    const depts = Array.from(map.keys()).sort((a, b) => {
      if (a === UNASSIGNED_DEPT) return 1;
      if (b === UNASSIGNED_DEPT) return -1;
      return a.localeCompare(b);
    });
    return { map, depts };
  }, [roster]);

  /** 부서별 월별 근무일 합계 */
  const deptMonthlyTotals = useMemo(() => {
    const out: Record<string, number[]> = {};
    rosterByDept.depts.forEach((dept) => {
      const emps = rosterByDept.map.get(dept) ?? [];
      const months = Array(12).fill(0);
      emps.forEach((emp) => {
        const days = getWorkDays(emp.id);
        days.forEach((d, i) => { months[i] += d; });
      });
      out[dept] = months;
    });
    return out;
  }, [rosterByDept, workDays]);

  const toggleDept = (dept: string) => {
    setExpandedDepts((prev) => ({ ...prev, [dept]: !prev[dept] }));
  };

  const expandAll = () => {
    setExpandedDepts({});
  };

  const collapseAll = () => {
    setExpandedDepts(
      Object.fromEntries(rosterByDept.depts.map((d) => [d, false]))
    );
  };

  const monthlyTotals = useMemo(() => {
    const totals = Array(12).fill(0);
    roster.forEach((emp) => {
      const days = getWorkDays(emp.id);
      days.forEach((d, i) => { totals[i] += d; });
    });
    return totals;
  }, [roster, workDays]);

  /** 직원별 배출계수 (직원명부 교통수단·연료에서 자동 적용, 미지정 시 factor 사용) */
  const getFactorForEmployee = (emp: EmployeeRosterItem) =>
    getEmployeeCommuteFactor(emp.commuteTransport, emp.fuel, factor);

  /** 월별 배출량: 직원별 (근무일 × 해당 직원 배출계수) 합계 */
  const monthlyEmissions = useMemo(() => {
    const out = Array(12).fill(0);
    roster.forEach((emp) => {
      const days = getWorkDays(emp.id);
      const empFactor = getFactorForEmployee(emp);
      days.forEach((d, i) => { out[i] += d * empFactor; });
    });
    return out;
  }, [roster, workDays, factor]);
  const totalWorkDaysYear = monthlyTotals.reduce((s, v) => s + v, 0);
  const totalEmissionsYear = monthlyEmissions.reduce((s, v) => s + v, 0);

  const handleSave = () => {
    saveMutation.mutate({ year, workDays });
  };

  if (rosterLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">직원명부를 불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  if (roster.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">직원 출퇴근</CardTitle>
          <p className="text-sm text-muted-foreground">
            설정에서 직원명부를 먼저 등록하면, 여기서 월별 근무일수를 입력할 수 있습니다.
          </p>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link href="/settings/employee-roster">설정 → 직원명부 등록</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base">직원 출퇴근 — 월별 근무일수</CardTitle>
          <p className="text-sm text-muted-foreground">
            직원명부의 교통수단·연료에 따라 배출계수가 자동 적용되며, 월별 근무일수 입력 시 배출량(tCO₂e)이 산출됩니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="space-y-1 text-sm">
            <label
              htmlFor="commuting-year"
              className="mr-2 text-xs font-medium text-muted-foreground"
            >
              기간 (년)
            </label>
            <select
              id="commuting-year"
              value={year}
              onChange={(e) => onYearChange(e.target.value)}
              className="h-9 w-[120px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1 text-sm">
            <label
              htmlFor="commuting-factor"
              className="mr-2 text-xs font-medium text-muted-foreground"
            >
              기본 배출계수 (교통수단 미지정 시)
            </label>
            <input
              id="commuting-factor"
              type="number"
              min={0}
              step="any"
              value={factor}
              onChange={(e) => onFactorChange(parseFloat(e.target.value) || 0)}
              className="h-9 w-[120px] rounded-md border border-input bg-transparent px-3 py-2 text-right text-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {workDaysLoading ? (
          <p className="text-sm text-muted-foreground">저장된 데이터를 불러오는 중...</p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={expandAll}
                title="모든 부서 펼치기"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                일괄 확장
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={collapseAll}
                title="모든 부서 접기"
              >
                <Minus className="mr-1.5 h-4 w-4" />
                일괄 취합
              </Button>
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-muted-foreground">
                  <th className="w-40 px-2 py-3 text-left font-medium">
                    직원 (부서)
                  </th>
                  <th className="w-24 px-2 py-3 text-right font-medium">
                    배출계수
                  </th>
                  {MONTH_LABELS.map((label) => (
                    <th
                      key={label}
                      className="w-20 px-2 py-3 text-right font-medium"
                    >
                      {label}
                    </th>
                  ))}
                  <th className="w-24 px-2 py-3 text-right font-medium">
                    합계
                  </th>
                  <th className="w-12 px-1 py-3" aria-label="취합/확장" />
                </tr>
              </thead>
              <tbody>
                {rosterByDept.depts.map((dept) => {
                  const emps = rosterByDept.map.get(dept) ?? [];
                  const months = deptMonthlyTotals[dept] ?? Array(12).fill(0);
                  const deptSum = months.reduce((s, v) => s + v, 0);
                  const isExpanded = expandedDepts[dept] !== false;

                  return (
                    <Fragment key={dept}>
                      {/* 부서 취합 행: 항상 표시 */}
                      <tr
                        key={dept}
                        className={cn(
                          "border-b border-border/50",
                          isExpanded
                            ? "bg-muted/20"
                            : "bg-muted/30 hover:bg-muted/40"
                        )}
                      >
                        <td className="px-2 py-2 font-medium">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => toggleDept(dept)}
                            title={isExpanded ? "취합 (접기)" : "확장 (펼치기)"}
                          >
                            {isExpanded ? (
                              <Minus className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                          <span className="ml-1 align-middle">
                            {dept}
                            <span className="ml-1 text-xs text-muted-foreground">
                              ({emps.length}명)
                            </span>
                          </span>
                        </td>
                        <td className="w-24 px-2 py-2 text-right text-xs text-muted-foreground">
                          —
                        </td>
                        {MONTH_LABELS.map((_, idx) => (
                          <td
                            key={idx}
                            className="px-2 py-2 text-right font-medium"
                          >
                            {formatNumber(months[idx])}
                          </td>
                        ))}
                        <td className="px-2 py-2 text-right font-medium text-muted-foreground">
                          {formatNumber(deptSum)}
                        </td>
                        <td className="w-12 px-1" />
                      </tr>
                      {isExpanded &&
                        emps.map((emp) => {
                          const days = getWorkDays(emp.id);
                          const sum = days.reduce((s, v) => s + v, 0);
                          const empFactor = getFactorForEmployee(emp);
                          return (
                            <tr
                              key={emp.id}
                              className="border-b border-border/50 hover:bg-muted/20"
                            >
                              <td className="px-2 py-2 pl-10 text-muted-foreground">
                                {emp.name}
                              </td>
                              <td className="px-2 py-2 text-right text-xs text-muted-foreground" title="직원명부 교통수단·연료 기준 자동 적용">
                                {formatNumber(empFactor)}
                              </td>
                              {MONTH_LABELS.map((_, idx) => (
                                <td key={idx} className="px-2 py-2 text-right">
                                  <input
                                    type="number"
                                    min={0}
                                    max={31}
                                    step={1}
                                    value={days[idx] === 0 ? "" : days[idx]}
                                    onChange={(e) =>
                                      handleWorkDayChange(
                                        emp.id,
                                        idx,
                                        e.target.value
                                      )
                                    }
                                    className="h-8 w-full min-w-[3rem] rounded-md border border-input bg-transparent px-1 py-1 text-right text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                  />
                                </td>
                              ))}
                              <td className="px-2 py-2 text-right text-muted-foreground">
                                {formatNumber(sum)}
                              </td>
                              <td className="w-12 px-1" />
                            </tr>
                          );
                        })}
                    </Fragment>
                  );
                })}
                <tr className="border-b border-border bg-muted/30 font-medium">
                  <td className="px-2 py-3">합계 근무일수</td>
                  <td className="w-24 px-2 py-3" />
                  {monthlyTotals.map((v, idx) => (
                    <td key={idx} className="px-2 py-3 text-right">
                      {formatNumber(v)}
                    </td>
                  ))}
                  <td className="px-2 py-3 text-right">
                    {formatNumber(totalWorkDaysYear)}
                  </td>
                  <td className="w-12 px-1" />
                </tr>
                <tr className="border-b border-border/50 font-medium">
                  <td className="px-2 py-3">배출량 (tCO₂e)</td>
                  <td className="w-24 px-2 py-3" />
                  {monthlyEmissions.map((v, idx) => (
                    <td key={idx} className="px-2 py-3 text-right">
                      {formatNumber(v)}
                    </td>
                  ))}
                  <td className="px-2 py-3 text-right">
                    {formatNumber(totalEmissionsYear)} tCO₂e
                  </td>
                  <td className="w-12 px-1" />
                </tr>
              </tbody>
            </table>
          </div>
          </>
        )}

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending || workDaysLoading}
          >
            {saveMutation.isPending ? "저장 중..." : "저장"}
          </Button>
          <span className="text-sm text-muted-foreground">
            {saved ? "저장되었습니다." : `${year}년 데이터입니다.`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
