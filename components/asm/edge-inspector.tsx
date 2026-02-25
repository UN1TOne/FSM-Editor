"use client";

import { useASMStore } from "@/lib/asm/store";
import type { ComparisonOp } from "@/lib/asm/types";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const opLabels: Record<ComparisonOp, string> = {
  eq: "==",
  neq: "!=",
  gt: ">",
  lt: "<",
  gte: ">=",
  lte: "<=",
};

export default function EdgeInspector() {
  const selectedEdgeId = useASMStore((s) => s.selectedEdgeId);
  const edges = useASMStore((s) => s.edges);
  const nodes = useASMStore((s) => s.nodes);
  const parameters = useASMStore((s) => s.parameters);
  const selectEdge = useASMStore((s) => s.selectEdge);
  const updateEdgeData = useASMStore((s) => s.updateEdgeData);
  const addConditionToEdge = useASMStore((s) => s.addConditionToEdge);
  const removeConditionFromEdge = useASMStore(
    (s) => s.removeConditionFromEdge
  );

  const edge = edges.find((e) => e.id === selectedEdgeId);
  if (!edge || !edge.data) return null;

  const sourceNode = nodes.find((n) => n.id === edge.source);
  const targetNode = nodes.find((n) => n.id === edge.target);
  const data = edge.data;

  return (
    <div className="absolute bottom-4 right-4 z-50 w-72 rounded-md border border-border bg-card shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Transition
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-5 w-5"
          onClick={() => selectEdge(null)}
          aria-label="Close inspector"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="space-y-3 p-3">
        {/* Source -> Target */}
        <div className="text-xs text-muted-foreground">
          <span className="text-foreground">
            {sourceNode?.data.label ?? edge.source}
          </span>
          {" -> "}
          <span className="text-foreground">
            {targetNode?.data.label ?? edge.target}
          </span>
        </div>

        {/* Has Exit Time */}
        <div className="flex items-center justify-between">
          <Label className="text-xs">Has Exit Time</Label>
          <Switch
            checked={data.hasExitTime}
            onCheckedChange={(v) =>
              updateEdgeData(edge.id, { hasExitTime: v })
            }
            className="scale-75"
          />
        </div>

        {data.hasExitTime && (
          <div className="flex items-center gap-2">
            <Label className="w-16 text-xs">Exit Time</Label>
            <Input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={data.exitTime}
              onChange={(e) =>
                updateEdgeData(edge.id, {
                  exitTime: parseFloat(e.target.value) || 0,
                })
              }
              className="h-7 text-xs"
            />
          </div>
        )}

        {/* Transition Duration */}
        <div className="flex items-center gap-2">
          <Label className="w-16 text-xs">Duration</Label>
          <Input
            type="number"
            min={0}
            step={50}
            value={data.transitionDuration}
            onChange={(e) =>
              updateEdgeData(edge.id, {
                transitionDuration: parseInt(e.target.value) || 0,
              })
            }
            className="h-7 text-xs"
          />
          <span className="text-[10px] text-muted-foreground">ms</span>
        </div>

        {/* Conditions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Conditions
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5"
              onClick={() => {
                if (parameters.length === 0) return;
                addConditionToEdge(edge.id, {
                  parameterId: parameters[0].id,
                  op: "eq",
                  threshold: true,
                });
              }}
              aria-label="Add condition"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {data.conditions.map((cond, i) => {
            const param = parameters.find((p) => p.id === cond.parameterId);
            return (
              <div
                key={i}
                className="flex items-center gap-1 rounded-sm bg-muted/50 px-2 py-1"
              >
                {/* Parameter select */}
                <Select
                  value={cond.parameterId}
                  onValueChange={(v) => {
                    const newConds = [...data.conditions];
                    newConds[i] = { ...newConds[i], parameterId: v };
                    updateEdgeData(edge.id, { conditions: newConds });
                  }}
                >
                  <SelectTrigger className="h-6 w-20 text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {parameters.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Op select */}
                <Select
                  value={cond.op}
                  onValueChange={(v) => {
                    const newConds = [...data.conditions];
                    newConds[i] = {
                      ...newConds[i],
                      op: v as ComparisonOp,
                    };
                    updateEdgeData(edge.id, { conditions: newConds });
                  }}
                >
                  <SelectTrigger className="h-6 w-12 text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(opLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Threshold */}
                {param?.type === "float" ? (
                  <Input
                    type="number"
                    value={cond.threshold as number}
                    onChange={(e) => {
                      const newConds = [...data.conditions];
                      newConds[i] = {
                        ...newConds[i],
                        threshold: parseFloat(e.target.value) || 0,
                      };
                      updateEdgeData(edge.id, { conditions: newConds });
                    }}
                    className="h-6 w-12 text-[10px]"
                    step={0.1}
                  />
                ) : (
                  <Select
                    value={String(cond.threshold)}
                    onValueChange={(v) => {
                      const newConds = [...data.conditions];
                      newConds[i] = {
                        ...newConds[i],
                        threshold: v === "true",
                      };
                      updateEdgeData(edge.id, { conditions: newConds });
                    }}
                  >
                    <SelectTrigger className="h-6 w-14 text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">true</SelectItem>
                      <SelectItem value="false">false</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5 opacity-40 hover:opacity-100"
                  onClick={() => removeConditionFromEdge(edge.id, i)}
                  aria-label="Remove condition"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
