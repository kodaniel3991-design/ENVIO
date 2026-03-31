"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  Position,
  Handle,
  type NodeProps,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";
import {
  Target,
  Database,
  Zap,
  Plug,
  BarChart3,
  PenLine,
  FileSpreadsheet,
  Building2,
  Users,
  Leaf,
  ShieldCheck,
  TrendingDown,
  Link2,
  Maximize2,
  Minimize2,
  Settings,
  Factory,
  Layers,
  BookOpen,
  Gauge,
  type LucideIcon,
} from "lucide-react";

/* ── 색상 테마 ── */
const PHASE_STYLES: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
  setup: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-300", iconBg: "bg-amber-100" },
  kpi: { bg: "bg-primary/5", text: "text-primary", border: "border-primary/40", iconBg: "bg-primary/10" },
  scope: { bg: "bg-taupe-50", text: "text-taupe-600", border: "border-taupe-200", iconBg: "bg-taupe-100" },
  input: { bg: "bg-navy-50", text: "text-navy-500", border: "border-navy-200", iconBg: "bg-navy-100" },
  output: { bg: "bg-green-50", text: "text-carbon-success", border: "border-green-200", iconBg: "bg-green-100" },
};

/* ── 커스텀 노드: 설정 단계 (소형) ── */
function SetupStepNode({ data }: NodeProps) {
  const Icon = (data.icon as LucideIcon) ?? Settings;
  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} className="!bg-amber-400 !border-amber-400 !w-1.5 !h-1.5" />
      <Handle type="source" position={Position.Right} className="!bg-amber-400 !border-amber-400 !w-1.5 !h-1.5" />
      <Handle type="source" position={Position.Bottom} className="!bg-amber-400 !border-amber-400 !w-1.5 !h-1.5" id="bottom" />
      <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 shadow-sm min-w-[130px]">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-100">
          <Icon className="h-3.5 w-3.5 text-amber-600" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-foreground">{data.label as string}</p>
          <p className="text-[9px] text-muted-foreground">{data.sublabel as string}</p>
        </div>
      </div>
    </div>
  );
}

/* ── 커스텀 노드: 단계 헤더 ── */
function PhaseHeaderNode({ data }: NodeProps) {
  const Icon = (data.icon as LucideIcon) ?? Database;
  const style = PHASE_STYLES[(data.phase as string) ?? "scope"];
  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground !border-muted-foreground !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-muted-foreground !border-muted-foreground !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground !border-muted-foreground !w-2 !h-2" id="bottom" />
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground !border-muted-foreground !w-2 !h-2" id="top" />
      <div className={cn("flex items-center gap-3 rounded-xl border-2 px-5 py-3.5 shadow-md min-w-[160px]", style.border, style.bg)}>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", style.iconBg)}>
          <Icon className={cn("h-5 w-5", style.text)} />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{data.label as string}</p>
          <p className="text-[11px] text-muted-foreground">{data.sublabel as string}</p>
        </div>
      </div>
    </div>
  );
}

/* ── 커스텀 노드: 하위 항목 ── */
function SubItemNode({ data }: NodeProps) {
  const Icon = (data.icon as LucideIcon) ?? Database;
  const style = PHASE_STYLES[(data.phase as string) ?? "scope"];
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground !border-muted-foreground !w-1.5 !h-1.5" />
      <div className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 shadow-sm", style.border, "bg-card")}>
        <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md", style.iconBg)}>
          <Icon className={cn("h-3.5 w-3.5", style.text)} />
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground whitespace-nowrap">{data.label as string}</p>
          <p className="text-[9px] text-muted-foreground whitespace-nowrap">{data.sublabel as string}</p>
        </div>
      </div>
    </div>
  );
}

/* ── 순환 피드백 노드 ── */
function FeedbackNode({ data }: NodeProps) {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} className="!bg-primary !border-primary !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-primary !border-primary !w-2 !h-2" />
      <div className="flex items-center gap-2 rounded-full border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-2">
        <TrendingDown className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold text-primary">{data.label as string}</span>
      </div>
    </div>
  );
}

/* ── 구분선 라벨 노드 ── */
function SectionLabelNode({ data }: NodeProps) {
  return (
    <div className="px-3 py-1 rounded-md bg-muted/60 border border-border">
      <p className="text-[10px] font-semibold text-muted-foreground tracking-wide">{data.label as string}</p>
    </div>
  );
}

const nodeTypes = {
  setupStep: SetupStepNode,
  phaseHeader: PhaseHeaderNode,
  subItem: SubItemNode,
  feedback: FeedbackNode,
  sectionLabel: SectionLabelNode,
};

/* ── 레이아웃 ── */
function buildLayout() {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // ────────────────────────────────────
  // 상단: 설정 흐름 (5 Wizard Steps)
  // ────────────────────────────────────
  const setupY = 0;
  const setupGap = 120;

  nodes.push({ id: "label-setup", type: "sectionLabel", position: { x: -120, y: setupY + 8 }, data: { label: "설정 흐름" } });

  const setupSteps = [
    { id: "ws-1", label: "① 조직 설정", sublabel: "회사·산업군", icon: Settings },
    { id: "ws-2", label: "② 사업장 설정", sublabel: "시설·에너지원", icon: Factory },
    { id: "ws-3", label: "③ Scope 설정", sublabel: "1·2·3 범위", icon: Layers },
    { id: "ws-4", label: "④ 공시 기준", sublabel: "GRI·ISSB·K-ESG", icon: BookOpen },
    { id: "ws-5", label: "⑤ KPI 선택", sublabel: "AI 추천 반영", icon: Gauge },
  ];

  setupSteps.forEach((s, i) => {
    nodes.push({
      id: s.id, type: "setupStep", position: { x: i * setupGap, y: setupY },
      data: { ...s },
    });
    if (i > 0) {
      edges.push({
        id: `e-ws-${i}`, source: setupSteps[i - 1].id, target: s.id,
        style: { stroke: "hsl(35, 80%, 60%)", strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(35, 80%, 60%)" },
      });
    }
  });

  // 설정 → 데이터 흐름 연결 (KPI 선택 → KPI 매핑)
  edges.push({
    id: "e-ws5-kpi", source: "ws-5", target: "kpi", sourceHandle: "bottom",
    targetHandle: "top",
    style: { stroke: "hsl(35, 80%, 60%)", strokeWidth: 1.5, strokeDasharray: "4 3" },
    markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(35, 80%, 60%)" },
    label: "설정 완료",
    labelStyle: { fontSize: 9, fill: "hsl(35, 80%, 50%)" },
  });

  // 설정 → 배출량 관리 연결 (사업장 설정 → 배출량 관리)
  edges.push({
    id: "e-ws2-scope", source: "ws-2", target: "scope", sourceHandle: "bottom",
    targetHandle: "top",
    style: { stroke: "hsl(35, 80%, 60%)", strokeWidth: 1.5, strokeDasharray: "4 3" },
    markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(35, 80%, 60%)" },
    label: "시설 등록",
    labelStyle: { fontSize: 9, fill: "hsl(35, 80%, 50%)" },
  });

  // ────────────────────────────────────
  // 하단: 데이터 흐름 (4 Phases)
  // ────────────────────────────────────
  const headerY = 120;
  const subY = headerY + 140;
  const phaseGap = 500;
  const subGap = 163;

  nodes.push({ id: "label-data", type: "sectionLabel", position: { x: -120, y: headerY + 8 }, data: { label: "데이터 흐름" } });

  // ── Phase 1: KPI 매핑 ──
  const x1 = 0;
  nodes.push({
    id: "kpi", type: "phaseHeader", position: { x: x1, y: headerY },
    data: { label: "KPI 매핑", sublabel: "자동 집계 / 수동 연결", icon: Target, phase: "kpi" },
  });
  const kpiSubs = [
    { id: "kpi-auto", label: "자동 집계 KPI", sublabel: "탄소·환경 → Scope 연동", icon: Leaf },
    { id: "kpi-manual", label: "수동 입력 KPI", sublabel: "사회·거버넌스 직접 입력", icon: Users },
    { id: "kpi-preset", label: "프리셋 설정", sublabel: "Scope 범위 → calcRule", icon: Link2 },
  ];
  kpiSubs.forEach((s, i) => {
    nodes.push({
      id: s.id, type: "subItem", position: { x: x1 + i * subGap - 80, y: subY },
      data: { ...s, phase: "kpi" },
    });
    edges.push({
      id: `e-kpi-${s.id}`, source: "kpi", target: s.id, sourceHandle: "bottom",
      style: { stroke: "hsl(var(--primary))", strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(var(--primary))" },
    });
  });

  // ── Phase 2: 배출량 관리 ──
  const x2 = phaseGap;
  nodes.push({
    id: "scope", type: "phaseHeader", position: { x: x2, y: headerY },
    data: { label: "배출량 관리", sublabel: "Scope 1 · 2 · 3", icon: Database, phase: "scope" },
  });
  edges.push({
    id: "e-kpi-scope", source: "kpi", target: "scope",
    style: { stroke: "hsl(var(--muted-foreground))", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(var(--muted-foreground))" },
    label: "calcRule",
    labelStyle: { fontSize: 10, fill: "hsl(var(--muted-foreground))" },
  });
  const scopeSubs = [
    { id: "s1", label: "Scope 1", sublabel: "고정·이동·비가스 연소", icon: Building2 },
    { id: "s2", label: "Scope 2", sublabel: "구입전력 / 증기·열", icon: Zap },
    { id: "s3", label: "Scope 3", sublabel: "공급망 / 출장 / 통근", icon: Users },
  ];
  scopeSubs.forEach((s, i) => {
    nodes.push({
      id: s.id, type: "subItem", position: { x: x2 + i * subGap - 80, y: subY },
      data: { ...s, phase: "scope" },
    });
    edges.push({
      id: `e-scope-${s.id}`, source: "scope", target: s.id, sourceHandle: "bottom",
      style: { stroke: "hsl(var(--taupe-400))", strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(var(--taupe-400))" },
    });
  });

  // ── Phase 3: 데이터 입력 ──
  const x3 = phaseGap * 2;
  nodes.push({
    id: "input", type: "phaseHeader", position: { x: x3, y: headerY },
    data: { label: "데이터 입력", sublabel: "3가지 입력 방식", icon: PenLine, phase: "input" },
  });
  edges.push({
    id: "e-scope-input", source: "scope", target: "input",
    style: { stroke: "hsl(var(--muted-foreground))", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(var(--muted-foreground))" },
    label: "시설별 데이터",
    labelStyle: { fontSize: 10, fill: "hsl(var(--muted-foreground))" },
  });
  const inputSubs = [
    { id: "in-manual", label: "직접 입력", sublabel: "월별 활동량 수기 입력", icon: PenLine },
    { id: "in-excel", label: "Excel 업로드", sublabel: "템플릿 일괄 업로드", icon: FileSpreadsheet },
    { id: "in-api", label: "API 연동", sublabel: "KEPCO 등 자동 수집", icon: Plug },
  ];
  inputSubs.forEach((s, i) => {
    nodes.push({
      id: s.id, type: "subItem", position: { x: x3 + i * subGap - 80, y: subY },
      data: { ...s, phase: "input" },
    });
    edges.push({
      id: `e-input-${s.id}`, source: "input", target: s.id, sourceHandle: "bottom",
      style: { stroke: "hsl(var(--navy-400))", strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(var(--navy-400))" },
    });
  });

  // ── Phase 4: 자동 집계 ──
  const x4 = phaseGap * 3;
  nodes.push({
    id: "output", type: "phaseHeader", position: { x: x4, y: headerY },
    data: { label: "자동 집계", sublabel: "활동량 × 배출계수", icon: BarChart3, phase: "output" },
  });
  edges.push({
    id: "e-input-output", source: "input", target: "output",
    style: { stroke: "hsl(var(--muted-foreground))", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(var(--muted-foreground))" },
    label: "활동 데이터",
    labelStyle: { fontSize: 10, fill: "hsl(var(--muted-foreground))" },
  });
  const outputSubs = [
    { id: "out-calc", label: "배출량 산정", sublabel: "NIER-2023 배출계수 적용", icon: Zap },
    { id: "out-compare", label: "비교 분석", sublabel: "전년 대비 / 시설별", icon: BarChart3 },
    { id: "out-verify", label: "검증 & 이력", sublabel: "이상치 감지 + Audit", icon: ShieldCheck },
  ];
  outputSubs.forEach((s, i) => {
    nodes.push({
      id: s.id, type: "subItem", position: { x: x4 + i * subGap - 80, y: subY },
      data: { ...s, phase: "output" },
    });
    edges.push({
      id: `e-output-${s.id}`, source: "output", target: s.id, sourceHandle: "bottom",
      style: { stroke: "hsl(var(--carbon-success))", strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(var(--carbon-success))" },
    });
  });

  // ── 피드백 루프: 자동 집계 → KPI 실적 갱신 ──
  nodes.push({
    id: "feedback", type: "feedback", position: { x: (x1 + x4) / 2, y: subY + 110 },
    data: { label: "KPI 실적 자동 반영" },
  });
  edges.push({
    id: "e-output-feedback", source: "out-calc", target: "feedback",
    style: { stroke: "hsl(var(--primary))", strokeWidth: 1.5, strokeDasharray: "6 3" },
    markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(var(--primary))" },
  });
  edges.push({
    id: "e-feedback-kpi", source: "feedback", target: "kpi-auto",
    style: { stroke: "hsl(var(--primary))", strokeWidth: 1.5, strokeDasharray: "6 3" },
    markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(var(--primary))" },
  });

  return { nodes, edges };
}

/* ── 직접 연결된 노드만 탐색 (1-hop) ── */
function findDirectConnectedIds(nodeId: string, allEdges: Edge[]): { nodeIds: Set<string>; edgeIds: Set<string> } {
  const nodeIds = new Set<string>([nodeId]);
  const edgeIds = new Set<string>();

  for (const e of allEdges) {
    if (e.source === nodeId || e.target === nodeId) {
      edgeIds.add(e.id);
      nodeIds.add(e.source);
      nodeIds.add(e.target);
    }
  }
  return { nodeIds, edgeIds };
}

export function DataFlowMindMap() {
  const { nodes: allNodes, edges: allEdges } = useMemo(() => buildLayout(), []);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // 선택된 노드에 연결된 흐름만 하이라이트
  const { nodes, edges } = useMemo(() => {
    if (!selectedNodeId) return { nodes: allNodes, edges: allEdges };

    const { nodeIds: connectedIds, edgeIds: connectedEdgeIds } = findDirectConnectedIds(selectedNodeId, allEdges);

    const styledNodes = allNodes.map((n) => ({
      ...n,
      style: {
        ...n.style,
        opacity: connectedIds.has(n.id) || n.type === "sectionLabel" ? 1 : 0.12,
        transition: "opacity 0.3s ease",
      },
    }));

    const styledEdges = allEdges.map((e) => {
      const isConnected = connectedEdgeIds.has(e.id);
      return {
        ...e,
        style: {
          ...e.style,
          opacity: isConnected ? 0.9 : 0.05,
          strokeWidth: isConnected ? (e.style?.strokeWidth === 2 ? 2.5 : 2) : 1,
          transition: "opacity 0.3s ease",
        },
      };
    });

    return { nodes: styledNodes, edges: styledEdges };
  }, [allNodes, allEdges, selectedNodeId]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === "sectionLabel") return;
      setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
    },
    []
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const flowContent = (
    <>
      {selectedNodeId && (
        <button
          onClick={() => setSelectedNodeId(null)}
          className="absolute top-3 right-3 z-10 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          전체 보기
        </button>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
      >
        <Background gap={20} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
          {selectedNodeId && (
            <button
              onClick={() => setSelectedNodeId(null)}
              className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              전체 보기
            </button>
          )}
          <button
            onClick={() => setFullscreen(false)}
            className="flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-muted"
          >
            <Minimize2 className="h-3.5 w-3.5" />
            축소
          </button>
        </div>
        <div className="h-full w-full">{flowContent}</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-3">
          <p className="text-xs font-medium text-muted-foreground">전체 흐름도 — 노드를 클릭하면 연결된 흐름만 표시됩니다</p>
        </div>
        <button
          onClick={() => setFullscreen(true)}
          className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
        >
          <Maximize2 className="h-3 w-3" />
          전체화면
        </button>
      </div>
      <div className="h-[500px] relative">{flowContent}</div>
    </div>
  );
}
