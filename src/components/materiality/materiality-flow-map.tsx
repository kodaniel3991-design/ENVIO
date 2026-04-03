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
  Maximize2,
  Minimize2,
  Database,
  Target,
  BarChart3,
  Users,
  Leaf,
  Scale,
  FileText,
  CheckCircle,
  TrendingUp,
  Sparkles,
  ClipboardCheck,
  Layers,
  Link2,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

/* ── 색상 테마 ── */
const PHASE_STYLES: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
  issue: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-300", iconBg: "bg-amber-100" },
  assess: { bg: "bg-primary/5", text: "text-primary", border: "border-primary/40", iconBg: "bg-primary/10" },
  matrix: { bg: "bg-green-50", text: "text-carbon-success", border: "border-green-200", iconBg: "bg-green-100" },
  result: { bg: "bg-taupe-50", text: "text-taupe-600", border: "border-taupe-200", iconBg: "bg-taupe-100" },
  report: { bg: "bg-navy-50", text: "text-navy-500", border: "border-navy-200", iconBg: "bg-navy-100" },
};

/* ── 커스텀 노드: 단계 헤더 ── */
function PhaseHeaderNode({ data }: NodeProps) {
  const Icon = (data.icon as LucideIcon) ?? Database;
  const style = PHASE_STYLES[(data.phase as string) ?? "issue"];
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
  const style = PHASE_STYLES[(data.phase as string) ?? "issue"];
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground !border-muted-foreground !w-1.5 !h-1.5" />
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground !border-muted-foreground !w-1.5 !h-1.5" id="bottom" />
      <Handle type="source" position={Position.Right} className="!bg-muted-foreground !border-muted-foreground !w-1.5 !h-1.5" />
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

/* ── 피드백 노드 ── */
function FeedbackNode({ data }: NodeProps) {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} className="!bg-primary !border-primary !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-primary !border-primary !w-2 !h-2" />
      <div className="flex items-center gap-2 rounded-full border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-2">
        <TrendingUp className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold text-primary">{data.label as string}</span>
      </div>
    </div>
  );
}

/* ── 구분 라벨 노드 ── */
function SectionLabelNode({ data }: NodeProps) {
  return (
    <div className="px-3 py-1 rounded-md bg-muted/60 border border-border">
      <p className="text-[10px] font-semibold text-muted-foreground tracking-wide">{data.label as string}</p>
    </div>
  );
}

const nodeTypes = {
  phaseHeader: PhaseHeaderNode,
  subItem: SubItemNode,
  feedback: FeedbackNode,
  sectionLabel: SectionLabelNode,
};

/* ── 레이아웃 ── */
function buildLayout() {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const arrow = (color: string) => ({ type: MarkerType.ArrowClosed as const, color, width: 12, height: 12 });
  const lineStyle = (color: string, dash?: boolean) => ({
    stroke: color, strokeWidth: 2, ...(dash ? { strokeDasharray: "6 4" } : {}),
  });

  // ── 상단: 이슈 도출 흐름 ──
  const topY = 0;
  const colGap = 350; // 헤더 노드 간 수평 간격
  const rowGap = 130; // 헤더 → 하위 수직 간격
  const subGap = 200; // 하위 노드 간 수평 간격

  nodes.push({ id: "label-issue", type: "sectionLabel", position: { x: -140, y: topY + 12 }, data: { label: "이슈 도출" } });

  // Phase 1: 이슈 풀 자동 생성
  const p1x = 0;
  nodes.push({ id: "p1", type: "phaseHeader", position: { x: p1x, y: topY }, data: { label: "이슈 풀 생성", sublabel: "KPI 카탈로그 기반", icon: Database, phase: "issue" } });
  nodes.push({ id: "p1-env", type: "subItem", position: { x: p1x - 60, y: topY + rowGap }, data: { label: "환경 (E)", sublabel: "탄소·에너지·수자원 등", icon: Leaf, phase: "issue" } });
  nodes.push({ id: "p1-soc", type: "subItem", position: { x: p1x + 140, y: topY + rowGap }, data: { label: "사회 (S)", sublabel: "노동·인권·공급망 등", icon: Users, phase: "issue" } });
  nodes.push({ id: "p1-gov", type: "subItem", position: { x: p1x + 340, y: topY + rowGap }, data: { label: "거버넌스 (G)", sublabel: "이사회·윤리·리스크 등", icon: Scale, phase: "issue" } });

  edges.push({ id: "p1-env-e", source: "p1", target: "p1-env", sourceHandle: "bottom", style: lineStyle("#d97706"), markerEnd: arrow("#d97706") });
  edges.push({ id: "p1-soc-e", source: "p1", target: "p1-soc", sourceHandle: "bottom", style: lineStyle("#d97706"), markerEnd: arrow("#d97706") });
  edges.push({ id: "p1-gov-e", source: "p1", target: "p1-gov", sourceHandle: "bottom", style: lineStyle("#d97706"), markerEnd: arrow("#d97706") });

  // Phase 2: 이중 중대성 평가
  const p2x = p1x + colGap + 250;
  nodes.push({ id: "p1-ai", type: "subItem", position: { x: p1x + 520, y: topY + rowGap }, data: { label: "AI 추천 점수", sublabel: "산업군 기반 초기 점수", icon: Sparkles, phase: "issue" } });
  edges.push({ id: "p1-ai-e", source: "p1", target: "p1-ai", sourceHandle: "bottom", style: lineStyle("#d97706", true), markerEnd: arrow("#d97706") });

  nodes.push({ id: "p2", type: "phaseHeader", position: { x: p2x, y: topY }, data: { label: "이중 중대성 평가", sublabel: "GRI 3요소 + 재무", icon: ClipboardCheck, phase: "assess" } });
  edges.push({ id: "p1-p2", source: "p1", target: "p2", style: lineStyle("#6366f1"), markerEnd: arrow("#6366f1"), label: "22개 이슈", labelStyle: { fontSize: 10, fill: "#6366f1" } });
  edges.push({ id: "ai-p2", source: "p1-ai", target: "p2", style: lineStyle("#6366f1", true), markerEnd: arrow("#6366f1") });

  nodes.push({ id: "p2-impact", type: "subItem", position: { x: p2x - 30, y: topY + rowGap }, data: { label: "영향 중대성", sublabel: "규모·범위·복구불가성 평균", icon: Target, phase: "assess" } });
  nodes.push({ id: "p2-financial", type: "subItem", position: { x: p2x + subGap, y: topY + rowGap }, data: { label: "재무 중대성", sublabel: "기업 리스크/기회 (1~5)", icon: BarChart3, phase: "assess" } });

  edges.push({ id: "p2-imp-e", source: "p2", target: "p2-impact", sourceHandle: "bottom", style: lineStyle("#6366f1"), markerEnd: arrow("#6366f1") });
  edges.push({ id: "p2-fin-e", source: "p2", target: "p2-financial", sourceHandle: "bottom", style: lineStyle("#6366f1"), markerEnd: arrow("#6366f1") });

  // ── 하단: 결과 흐름 ──
  const botY = 300;
  nodes.push({ id: "label-result", type: "sectionLabel", position: { x: -140, y: botY + 12 }, data: { label: "결과 도출" } });

  // Phase 3: 매트릭스
  const p3x = 0;
  nodes.push({ id: "p3", type: "phaseHeader", position: { x: p3x, y: botY }, data: { label: "이중 중대성 매트릭스", sublabel: "CSRD: 둘 중 하나 ≥ 3.5", icon: Layers, phase: "matrix" } });
  edges.push({ id: "p2-p3", source: "p2", target: "p3", style: lineStyle("#16a34a"), markerEnd: arrow("#16a34a"), label: "점수 반영", labelStyle: { fontSize: 10, fill: "#16a34a" } });

  nodes.push({ id: "p3-dual", type: "subItem", position: { x: p3x - 80, y: botY + rowGap }, data: { label: "이중 중대 (핵심)", sublabel: "영향 AND 재무 ≥ 3.5", icon: ShieldCheck, phase: "matrix" } });
  nodes.push({ id: "p3-impact-only", type: "subItem", position: { x: p3x + 130, y: botY + rowGap }, data: { label: "영향 중대", sublabel: "영향만 ≥ 3.5", icon: Leaf, phase: "matrix" } });
  nodes.push({ id: "p3-fin-only", type: "subItem", position: { x: p3x + 310, y: botY + rowGap }, data: { label: "재무 중대", sublabel: "재무만 ≥ 3.5", icon: BarChart3, phase: "matrix" } });

  edges.push({ id: "p3-d-e", source: "p3", target: "p3-dual", sourceHandle: "bottom", style: lineStyle("#16a34a"), markerEnd: arrow("#16a34a") });
  edges.push({ id: "p3-i-e", source: "p3", target: "p3-impact-only", sourceHandle: "bottom", style: lineStyle("#16a34a"), markerEnd: arrow("#16a34a") });
  edges.push({ id: "p3-f-e", source: "p3", target: "p3-fin-only", sourceHandle: "bottom", style: lineStyle("#16a34a"), markerEnd: arrow("#16a34a") });

  // Phase 4: KPI 연결
  const p4x = p2x;
  nodes.push({ id: "p4", type: "phaseHeader", position: { x: p4x, y: botY }, data: { label: "KPI 자동 연결", sublabel: "핵심 이슈 → KPI 매핑", icon: Link2, phase: "result" } });
  edges.push({ id: "p3-p4", source: "p3", target: "p4", style: lineStyle("#78716c"), markerEnd: arrow("#78716c"), label: "핵심 이슈", labelStyle: { fontSize: 10, fill: "#78716c" } });

  nodes.push({ id: "p4-critical", type: "subItem", position: { x: p4x - 60, y: botY + rowGap }, data: { label: "의무 (Critical)", sublabel: "프레임워크 필수 요구", icon: ShieldCheck, phase: "result" } });
  nodes.push({ id: "p4-material", type: "subItem", position: { x: p4x + 130, y: botY + rowGap }, data: { label: "중대 (Material)", sublabel: "중대성 평가 핵심 이슈", icon: CheckCircle, phase: "result" } });
  nodes.push({ id: "p4-general", type: "subItem", position: { x: p4x + 320, y: botY + rowGap }, data: { label: "일반 (General)", sublabel: "기본 모니터링", icon: Sparkles, phase: "result" } });

  edges.push({ id: "p4-c-e", source: "p4", target: "p4-critical", sourceHandle: "bottom", style: lineStyle("#78716c"), markerEnd: arrow("#78716c") });
  edges.push({ id: "p4-m-e", source: "p4", target: "p4-material", sourceHandle: "bottom", style: lineStyle("#78716c"), markerEnd: arrow("#78716c") });
  edges.push({ id: "p4-g-e", source: "p4", target: "p4-general", sourceHandle: "bottom", style: lineStyle("#78716c"), markerEnd: arrow("#78716c") });

  // Phase 5: 보고서 반영
  const p5x = p4x + colGap + 100;
  nodes.push({ id: "p5", type: "phaseHeader", position: { x: p5x, y: botY }, data: { label: "공시·보고서 반영", sublabel: "GRI·K-ESG·CSRD", icon: FileText, phase: "report" } });
  edges.push({ id: "p4-p5", source: "p4", target: "p5", style: lineStyle("#1e40af"), markerEnd: arrow("#1e40af"), label: "KPI 데이터", labelStyle: { fontSize: 10, fill: "#1e40af" } });

  // 피드백 루프
  nodes.push({ id: "fb", type: "feedback", position: { x: p4x, y: botY + 260 }, data: { label: "다음 주기 재평가 반영" } });
  edges.push({ id: "p5-fb", source: "p5", target: "fb", style: lineStyle("#6366f1", true), markerEnd: arrow("#6366f1") });
  edges.push({ id: "fb-p1", source: "fb", target: "p1", targetHandle: "top", style: lineStyle("#6366f1", true), markerEnd: arrow("#6366f1") });

  return { nodes, edges };
}

/* ── 직접 연결된 노드만 탐색 ── */
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

export function MaterialityFlowMap() {
  const { nodes: allNodes, edges: allEdges } = useMemo(() => buildLayout(), []);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const { nodes, edges } = useMemo(() => {
    if (!selectedNodeId) return { nodes: allNodes, edges: allEdges };
    const { nodeIds, edgeIds } = findDirectConnectedIds(selectedNodeId, allEdges);
    return {
      nodes: allNodes.map((n) => ({ ...n, style: { ...n.style, opacity: nodeIds.has(n.id) || n.type === "sectionLabel" ? 1 : 0.12, transition: "opacity 0.3s ease" } })),
      edges: allEdges.map((e) => {
        const c = edgeIds.has(e.id);
        return { ...e, style: { ...e.style, opacity: c ? 0.9 : 0.05, strokeWidth: c ? 2.5 : 1, transition: "opacity 0.3s ease" } };
      }),
    };
  }, [allNodes, allEdges, selectedNodeId]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === "sectionLabel") return;
    setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
  }, []);

  const flowContent = (
    <>
      {selectedNodeId && (
        <button onClick={() => setSelectedNodeId(null)} className="absolute top-3 right-3 z-10 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
          전체 보기
        </button>
      )}
      <ReactFlow
        nodes={nodes} edges={edges} nodeTypes={nodeTypes}
        onNodeClick={onNodeClick} onPaneClick={() => setSelectedNodeId(null)}
        fitView fitViewOptions={{ padding: 0.25 }}
        minZoom={0.3} maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false} nodesConnectable={false}
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
          {selectedNodeId && <button onClick={() => setSelectedNodeId(null)} className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20">전체 보기</button>}
          <button onClick={() => setFullscreen(false)} className="flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-muted">
            <Minimize2 className="h-3.5 w-3.5" /> 축소
          </button>
        </div>
        <div className="h-full w-full">{flowContent}</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <p className="text-xs font-medium text-muted-foreground">중대성 평가 흐름도 — 노드를 클릭하면 연결된 흐름만 표시됩니다</p>
        <button onClick={() => setFullscreen(true)} className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted">
          <Maximize2 className="h-3 w-3" /> 전체화면
        </button>
      </div>
      <div className="h-[500px] relative">{flowContent}</div>
    </div>
  );
}
