"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type EdgeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useASMStore } from "@/lib/asm/store";
import ASMNodeComponent from "./asm-node";
import EdgeInspector from "./edge-inspector";
import { Upload } from "lucide-react";

export default function FlowEditor() {
  // Store
  const nodes = useASMStore((s) => s.nodes);
  const edges = useASMStore((s) => s.edges);
  const onNodesChange = useASMStore((s) => s.onNodesChange);
  const onEdgesChange = useASMStore((s) => s.onEdgesChange);
  const onConnect = useASMStore((s) => s.onConnect);
  const selectEdge = useASMStore((s) => s.selectEdge);
  const addStateNode = useASMStore((s) => s.addStateNode);
  const selectedEdgeId = useASMStore((s) => s.selectedEdgeId);
  const deleteEdge = useASMStore((s) => s.deleteEdge);

  // Memo
  const nodeTypes = useMemo(
    () => ({
      asm: ASMNodeComponent,
    }),
    []
  );

  const styledEdges = useMemo(
    () =>
      edges.map((e) => ({
        ...e,
        style: {
          stroke:
            e.id === selectedEdgeId
              ? "oklch(0.75 0.16 75)"
              : "oklch(0.60 0 0)",
          strokeWidth: e.id === selectedEdgeId ? 2.5 : 1.5,
        },
        markerEnd: {
          type: "arrowclosed" as const,
          color:
            e.id === selectedEdgeId
              ? "oklch(0.75 0.16 75)"
              : "oklch(0.60 0 0)",
        },
      })),
    [edges, selectedEdgeId]
  );

  // Callback
  const onEdgeClick: EdgeMouseHandler = useCallback(
    (_event, edge) => {
      selectEdge(edge.id);
    },
    [selectEdge]
  );

  const onPaneClick = useCallback(() => {
    selectEdge(null);
  }, [selectEdge]);

  const onNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: any) => {
      if (node.id !== "any" && node.id !== "entry" && node.id !== "exit") {
        useASMStore.getState().setActiveNode(node.id);
      }
    },
    []
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedEdgeId) {
        deleteEdge(selectedEdgeId);
        selectEdge(null);
      }
    },
    [selectedEdgeId, deleteEdge, selectEdge]
  );

  if (nodes.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
        <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 p-8">
          <Upload className="mx-auto h-10 w-10 opacity-30" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">No animation states</p>
          <p className="mt-1 text-xs opacity-70">
            Load a GLB file in the Scene Preview to populate the state graph
          </p>
        </div>
      </div>
    );
  }

  // Main Render
  return (
    <div
      className="relative h-full w-full outline-none"
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        className="bg-background"
        defaultEdgeOptions={{
          type: "default",
        }}
      >
        <Background
          variant={BackgroundVariant.Lines}
          gap={20}
          size={1}
          color="var(--grid-line)"
        />
        <Controls
          className="!rounded-md !border-border !bg-card !shadow-lg [&>button]:!border-border [&>button]:!bg-card [&>button]:!fill-foreground [&>button]:hover:!bg-muted"
        />
        <MiniMap
          nodeStrokeWidth={3}
          className="!rounded-md !border-border !bg-card"
          maskColor="oklch(0.15 0.005 250 / 0.7)"
        />
      </ReactFlow>

      {/* Edge Inspector overlay */}
      <EdgeInspector />

      {/* Help tooltip */}
      <div className="pointer-events-none absolute top-4 left-4 z-50 rounded-md border border-border bg-card/80 px-3 py-1.5 text-[10px] text-muted-foreground backdrop-blur-sm">
        Double-click a state to play it. Drag between handles to connect.
      </div>
    </div>
  );
}