"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore, type FacilityData } from "../wizard-store";
import { ArrowLeft, ArrowRight, Plus, Trash2, Zap, Info, Building2, Check, Factory, Warehouse, ShoppingBag, FlaskConical, Wrench, Flame, Fuel, Thermometer, Leaf, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const FACILITY_TYPES = ["공장", "사무실", "물류센터", "매장", "연구소", "기타"];

// 에너지 탭 그룹
const ENERGY_TABS: { label: string; icon: LucideIcon; items: string[]; scope: "S1" | "S2" | null }[] = [
  { label: "전기", icon: Zap, items: ["일반 전력(한전)", "산업용 전력", "자가발전", "녹색프리미엄/REC"], scope: "S2" },
  { label: "가스", icon: Flame, items: ["도시가스(LNG)", "천연가스(LNG)", "LPG", "프로판(LPG1호)", "부탄(LPG3호)"], scope: "S1" },
  { label: "연료", icon: Fuel, items: ["경유", "휘발유", "등유", "B-A유", "B-B유", "B-C유", "나프타", "용제", "항공유", "윤활유"], scope: "S1" },
  { label: "고체", icon: Flame, items: ["국내무연탄", "수입무연탄", "유연탄(역청탄)", "아역청탄", "코크스", "석유코크스"], scope: "S1" },
  { label: "열", icon: Thermometer, items: ["스팀", "지역난방"], scope: "S2" },
  { label: "재생에너지", icon: Leaf, items: ["태양광", "풍력", "수소"], scope: null },
];

const TYPE_ICONS: Record<string, LucideIcon> = {
  공장: Factory,
  사무실: Building2,
  물류센터: Warehouse,
  매장: ShoppingBag,
  연구소: FlaskConical,
  기타: Wrench,
};

// 유형별 고급 옵션
const TYPE_ADVANCED: Record<string, { label: string; options: string[] }[]> = {
  공장: [
    { label: "생산공정", options: ["조립", "가공/절삭", "화학공정", "주조/단조", "식품가공", "섬유/봉제"] },
    { label: "운영형태", options: ["자가운영", "위탁운영"] },
  ],
  사무실: [
    { label: "소유형태", options: ["자가", "임차"] },
    { label: "규모", options: ["소규모(~100명)", "중규모(100~500명)", "대규모(500명+)"] },
  ],
  물류센터: [
    { label: "보관유형", options: ["상온", "냉장(0~10℃)", "냉동(-18℃ 이하)", "위험물"] },
    { label: "운영방식", options: ["자가운영", "3PL 위탁"] },
  ],
  매장: [
    { label: "업종", options: ["식품/식음료", "의류/패션", "전자/가전", "생활용품", "복합"] },
    { label: "냉장·냉동설비", options: ["있음", "없음"] },
  ],
  연구소: [
    { label: "연구분야", options: ["화학/소재", "바이오/의약", "IT/전자", "기계/자동차", "환경/에너지"] },
    { label: "실험실등급", options: ["일반", "화학(Chem)", "생물(BSL-1/2)"] },
  ],
  기타: [
    { label: "시설유형", options: ["창고", "주차장", "정비소/차고", "기타"] },
  ],
};

type WorksiteOption = { id: string; name: string; address: string };

function FacilityCard({
  facility,
  index,
  canRemove,
  worksites,
  onUpdate,
  onRemove,
}: {
  facility: FacilityData;
  index: number;
  canRemove: boolean;
  worksites: WorksiteOption[];
  onUpdate: (data: Partial<FacilityData>) => void;
  onRemove: () => void;
}) {
  const [activeEnergyTab, setActiveEnergyTab] = useState("전기");

  const toggleType = (type: string) => {
    const current = facility.types ?? [];
    onUpdate({
      types: current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type],
    });
  };

  const toggleEnergy = (src: string) => {
    const current = facility.energySources;
    onUpdate({
      energySources: current.includes(src)
        ? current.filter((s) => s !== src)
        : [...current, src],
    });
  };

  const toggleTypeOption = (type: string, option: string) => {
    const current = facility.typeOptions ?? {};
    const existing = current[type] ?? [];
    const next = existing.includes(option)
      ? existing.filter((o) => o !== option)
      : [...existing, option];
    onUpdate({ typeOptions: { ...current, [type]: next } });
  };

  const selectedTypes = facility.types ?? [];
  const activeTypeOptions = selectedTypes.filter((t) => TYPE_ADVANCED[t]);
  const [activeTypeTab, setActiveTypeTab] = useState<string>("");

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {/* 카드 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-foreground">
            {facility.name || `사업장 ${index + 1}`}
          </span>
          {(facility.types ?? []).map((t) => {
            const Icon = TYPE_ICONS[t];
            return (
              <span key={t} className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {Icon && <Icon className="h-3 w-3" />} {t}
              </span>
            );
          })}
        </div>
        {canRemove && (
          <button
            onClick={onRemove}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> 삭제
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* 사업장 선택 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            사업장 <span className="text-destructive">*</span>
          </label>
          {worksites.length > 0 ? (
            <select
              value={facility.name}
              onChange={(e) => {
                const ws = worksites.find((w) => w.name === e.target.value);
                if (ws) onUpdate({ id: ws.id, name: ws.name, location: ws.address });
                else onUpdate({ name: "", location: "" });
              }}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary transition-colors"
            >
              <option value="">사업장을 선택하세요</option>
              {worksites.map((ws) => (
                <option key={ws.id} value={ws.name}>{ws.name}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={facility.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="예: 인천 본사 / 군산공장"
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary transition-colors"
            />
          )}
        </div>

        {/* 주소 (선택 시 자동 입력, 읽기 전용) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">주소</label>
          <input
            type="text"
            value={facility.location}
            readOnly={worksites.length > 0}
            onChange={(e) => { if (worksites.length === 0) onUpdate({ location: e.target.value }); }}
            placeholder={worksites.length > 0 ? "사업장 선택 시 자동 입력" : "예: 인천광역시 남동구 인하로 100"}
            className={cn(
              "h-9 rounded-lg border border-border px-3 text-sm outline-none transition-colors",
              worksites.length > 0 ? "bg-muted/50 text-muted-foreground" : "bg-background focus:border-primary"
            )}
          />
        </div>

        {/* 유형 선택 + 세부 옵션 — 하나의 박스 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            유형 <span className="text-destructive">*</span>
            <span className="ml-1 font-normal text-muted-foreground/70">(복수 선택 가능)</span>
          </label>
          <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
            {/* 유형 버튼 */}
            <div className="flex flex-wrap gap-1.5 p-3">
              {FACILITY_TYPES.map((type) => {
                const selected = (facility.types ?? []).includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all",
                      selected
                        ? "border-primary bg-primary/10 font-semibold text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {selected && <Check className="h-3 w-3 shrink-0" />}
                    {(() => { const Icon = TYPE_ICONS[type]; return Icon ? <Icon className="h-3.5 w-3.5 shrink-0" /> : null; })()}
                    {type}
                  </button>
                );
              })}
            </div>
            {/* 세부 옵션 탭 — 유형 선택 시 노출 */}
            {activeTypeOptions.length > 0 && (() => {
              const currentTab = activeTypeOptions.includes(activeTypeTab) ? activeTypeTab : activeTypeOptions[0];
              return (
                <div className="border-t border-border">
                  {/* 탭 헤더 */}
                  <div className="flex border-b border-border bg-background/50">
                    {activeTypeOptions.map((type) => {
                      const hasSelection = (facility.typeOptions?.[type] ?? []).length > 0;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setActiveTypeTab(type)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px",
                            currentTab === type
                              ? "border-primary text-primary bg-background"
                              : "border-transparent text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {(() => { const Icon = TYPE_ICONS[type]; return Icon ? <Icon className="h-3.5 w-3.5 shrink-0" /> : null; })()}
                          {type}
                          {hasSelection && (
                            <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                              {(facility.typeOptions?.[type] ?? []).length}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {/* 탭 콘텐츠 */}
                  <div className="flex flex-col gap-2.5 p-3">
                    {TYPE_ADVANCED[currentTab]?.map((group) => (
                      <div key={group.label} className="flex items-start gap-3">
                        <span className="mt-1 w-20 shrink-0 text-[11px] font-medium text-muted-foreground">{group.label}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {group.options.map((opt) => {
                            const selected = (facility.typeOptions?.[currentTab] ?? []).includes(opt);
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => toggleTypeOption(currentTab, opt)}
                                className={cn(
                                  "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs transition-all",
                                  selected
                                    ? "border-primary bg-primary/10 font-medium text-primary"
                                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                                )}
                              >
                                {selected && <Check className="h-3 w-3 shrink-0" />}
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* 에너지 사용 — 탭 방식 */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-carbon-warning" /> 에너지 사용 (복수 선택)
          </label>
          <div className="rounded-lg border border-border bg-muted/20">
            {/* 탭 헤더 */}
            <div className="flex border-b border-border overflow-x-auto">
              {ENERGY_TABS.map((tab) => {
                const selectedCount = tab.items.filter((i) => facility.energySources.includes(i)).length;
                return (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => setActiveEnergyTab(tab.label)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px",
                      activeEnergyTab === tab.label
                        ? "border-primary text-primary bg-background"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <tab.icon className="h-3.5 w-3.5 shrink-0" /> {tab.label}
                    {selectedCount > 0 && (
                      <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        {selectedCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {/* 탭 콘텐츠 */}
            {(() => {
              const tab = ENERGY_TABS.find((t) => t.label === activeEnergyTab) ?? ENERGY_TABS[0];
              return (
                <div className="flex flex-wrap gap-2 p-3">
                  {tab.items.map((src) => {
                    const selected = facility.energySources.includes(src);
                    return (
                      <button
                        key={src}
                        type="button"
                        onClick={() => toggleEnergy(src)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all",
                          selected
                            ? "border-primary bg-primary/10 font-medium text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        )}
                      >
                        {selected && <Check className="h-3 w-3 shrink-0" />}
                        {src}
                        {selected && tab.scope && (
                          <span className={cn(
                            "rounded-full px-1 text-[9px] font-bold",
                            tab.scope === "S2" ? "bg-green-50 text-carbon-success" : "bg-taupe-50 text-taupe-400"
                          )}>
                            {tab.scope}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FacilityPage() {
  const router = useRouter();
  const { state, hydrated, addFacility, updateFacilityById, removeFacility, markStepComplete, save } = useWizardStore();
  const facilities = state.facilities ?? [];

  // DB에서 사업장 복원 및 완료 표시
  useEffect(() => {
    if (!hydrated) return;
    fetch("/api/organization")
      .then((r) => r.json())
      .then((org) => {
        if (!org.worksites?.length) return;
        // 이미 등록된 사업장이 있으면 step 2 완료 표시
        markStepComplete(2);
        // localStorage가 비어있으면 DB에서 복원
        const hasData = facilities.some((f) => f.name.trim());
        if (hasData) return;
        const restored = org.worksites.map((w: any) => ({
          id: w.id,
          name: w.name,
          location: w.address ?? "",
          types: w.facilityTypes ?? [],
          energySources: w.energySources ?? [],
          typeOptions: w.typeOptions ?? {},
        }));
        save({ ...state, facilities: restored });
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // 조직 설정에 등록된 사업장 목록
  const [registeredWorksites, setRegisteredWorksites] = useState<WorksiteOption[]>([]);

  useEffect(() => {
    fetch("/api/organization")
      .then((r) => r.json())
      .then((org) => {
        if (org.worksites?.length) {
          setRegisteredWorksites(org.worksites.map((w: any) => ({ id: w.id, name: w.name, address: w.address ?? "" })));
        }
      })
      .catch(() => {});
  }, []);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const saveWorksites = async () => {
    await fetch("/api/organization", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationName: state.organization.companyName || "조직",
        worksites: facilities.map((f, i) => ({
          id: f.id,
          name: f.name,
          address: f.location,
          facilityTypes: f.types,
          energySources: f.energySources,
          typeOptions: f.typeOptions ?? {},
          ...(i === 0 && { isDefault: true }),
        })),
        defaultWorksiteId: facilities[0]?.id,
      }),
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage("");
    try {
      await saveWorksites();
      setSaveMessage("저장되었습니다.");
      setTimeout(() => setSaveMessage(""), 2000);
    } catch {
      setSaveMessage("저장 실패");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    await saveWorksites();
    markStepComplete(2);
    router.push("/getting-started/scope");
  };

  const isValid = facilities.length > 0 && facilities.every((f) => f.name.trim() && (f.types ?? []).length > 0);

  return (
    <div className="flex flex-col gap-4">
      {/* 상단 안내 */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3">
          <h2 className="text-base font-bold text-foreground">② 사업장 설정</h2>
          <p className="text-sm text-muted-foreground">
            사업장별로 에너지 사용을 입력하면 Scope 1/2 배출량이 자동 연결됩니다.
            본사·공장·물류센터 등 여러 사업장을 모두 등록할 수 있습니다.
          </p>
        </div>
        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <strong>에너지 유형 → Scope 자동 연결:</strong>&nbsp;
            전기 → Scope 2 (간접배출) &nbsp;|&nbsp; 가스·경유·LPG → Scope 1 (직접배출)
          </span>
        </div>
      </div>

      {/* 사업장 요약 배지 */}
      {facilities.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">등록된 사업장 {facilities.length}개:</span>
          {facilities.map((f, i) => (
            <span key={f.id} className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium",
              f.name
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}>
              {f.name || `사업장 ${i + 1}`}
            </span>
          ))}
        </div>
      )}

      {/* 사업장 카드 목록 */}
      {facilities.map((facility, index) => (
        <FacilityCard
          key={facility.id}
          facility={facility}
          index={index}
          canRemove={facilities.length > 1}
          worksites={registeredWorksites}
          onUpdate={(data) => updateFacilityById(facility.id, data)}
          onRemove={() => removeFacility(facility.id)}
        />
      ))}

      {/* 사업장 추가 버튼 */}
      <button
        onClick={addFacility}
        className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
      >
        <Plus className="h-4 w-4" /> 사업장 추가
      </button>

      {/* 네비게이션 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/getting-started/organization")}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> 이전
        </button>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className={cn("text-xs font-medium", saveMessage === "저장되었습니다." ? "text-carbon-success" : "text-carbon-danger")}>
              {saveMessage}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!isValid || isSaving}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40"
          >
            {isSaving ? "저장 중..." : "저장"}
          </button>
          <button
            onClick={handleNext}
            disabled={!isValid}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-40 hover:opacity-90"
          >
            다음: Scope 설정 <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
