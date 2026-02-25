"use client";

import { useASMStore } from "@/lib/asm/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings2 } from "lucide-react";

export default function NodeInspector() {
  const activeNodeId = useASMStore((s) => s.activeNodeId);
  const nodes = useASMStore((s) => s.nodes);
  const updateNodeData = useASMStore((s) => s.updateNodeData);
  const animationClipNames = useASMStore((s) => s.animationClipNames);

  const node = nodes.find((n) => n.id === activeNodeId);

  if (!node || node.data.kind !== "state") {
    return (
      <div className="flex h-full flex-col border-l border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Inspector
          </span>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 text-center text-xs text-muted-foreground">
          Select a state node to inspect its properties.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col border-l border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Inspector
        </span>
      </div>

      <div className="space-y-4 p-3">
        {/* Node label */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Label</Label>
          <Input
            value={node.data.label}
            onChange={(e) =>
              updateNodeData(node.id, { label: e.target.value })
            }
            className="h-7 text-xs"
          />
        </div>

        {/* Animation clip */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            Animation Clip
          </Label>
          {animationClipNames.length > 0 ? (
            <Select
              value={node.data.animationName}
              onValueChange={(v) =>
                updateNodeData(node.id, { animationName: v })
              }
            >
              <SelectTrigger className="h-7 font-mono text-xs">
                <SelectValue placeholder="Select clip" />
              </SelectTrigger>
              <SelectContent>
                {animationClipNames.map((name) => (
                  <SelectItem key={name} value={name} className="font-mono text-xs">
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={node.data.animationName}
              onChange={(e) =>
                updateNodeData(node.id, { animationName: e.target.value })
              }
              className="h-7 font-mono text-xs"
              placeholder="Load a GLB to see clips"
            />
          )}
        </div>

        {/* Loop */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Loop</Label>
          <Switch
            checked={node.data.loop}
            onCheckedChange={(v) => updateNodeData(node.id, { loop: v })}
            className="scale-75"
          />
        </div>

        {/* Speed */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Speed</Label>
            <span className="text-[10px] text-muted-foreground">
              {node.data.speed.toFixed(2)}x
            </span>
          </div>
          <Slider
            value={[node.data.speed]}
            onValueChange={([v]) => updateNodeData(node.id, { speed: v })}
            min={0}
            max={3}
            step={0.05}
          />
        </div>

        {/* Default state */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">
            Default State
          </Label>
          <Switch
            checked={!!node.data.isDefault}
            onCheckedChange={(v) =>
              updateNodeData(node.id, { isDefault: v })
            }
            className="scale-75"
          />
        </div>
      </div>
    </div>
  );
}
