"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ASMNode } from "@/lib/asm/types";
import { useASMStore } from "@/lib/asm/store";
import { Play, Pause, ArrowRight, Ban, Zap } from "lucide-react";

function ASMNodeComponent({ id, data }: NodeProps<ASMNode>) {
  const activeNodeId = useASMStore((s) => s.activeNodeId);
  const isActive = activeNodeId === id;

  const kindStyles: Record<string, string> = {
    entry: "bg-emerald-600 border-emerald-700 text-white",
    exit: "bg-rose-600 border-rose-700 text-white",
    any: "bg-cyan-600 border-cyan-700 text-white",
    state: isActive
      ? "bg-yellow-400 border-yellow-500 text-black font-bold shadow-[0_0_15px_rgba(250,204,21,0.6)] ring-4 ring-yellow-400/30"
      : data.isDefault
        ? "bg-orange-500/80 border-orange-600 text-white"
        : "bg-card border-muted-foreground text-foreground",
  };

  const kindIcons: Record<string, React.ReactNode> = {
    entry: <ArrowRight className="h-3.5 w-3.5" />,
    exit: <Ban className="h-3.5 w-3.5" />,
    any: <Zap className="h-3.5 w-3.5" />,
  };

  const isSpecial = data.kind !== "state";

  return (
    <div
      className={`flex items-center gap-2 rounded-sm border-2 px-4 py-2 font-mono text-xs shadow-lg transition-all ${kindStyles[data.kind]} ${isActive && !isSpecial ? "ring-2 ring-foreground/40 ring-offset-1 ring-offset-background" : ""}`}
      style={{ minWidth: 140 }}
    >
      {/* Handles */}
      {data.kind !== "entry" && (
        <Handle
          type="target"
          position={Position.Top}
          className="!h-2 !w-2 !rounded-full !border-none !bg-foreground/60"
        />
      )}
      {data.kind !== "exit" && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!h-2 !w-2 !rounded-full !border-none !bg-foreground/60"
        />
      )}

      {/* Icon for special nodes */}
      {isSpecial && kindIcons[data.kind]}

      {/* Label */}
      <span className="flex-1 truncate text-center font-medium">
        {data.label}
      </span>

      {/* Play / pause toggle for state nodes */}
      {!isSpecial && (
        <button
          className="flex h-5 w-5 items-center justify-center rounded-sm opacity-60 transition-opacity hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            useASMStore.getState().setActiveNode(id);
          }}
          aria-label={isActive ? "Currently playing" : "Play this state"}
        >
          {isActive ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
        </button>
      )}
    </div>
  );
}

export default memo(ASMNodeComponent);
