"use client";

import { useState } from "react";
import { useASMStore } from "@/lib/asm/store";
import type { ParameterType } from "@/lib/asm/types";
import { Plus, Trash2, ToggleLeft, Hash, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const typeIcons: Record<ParameterType, React.ReactNode> = {
  trigger: <Zap className="h-3.5 w-3.5 text-node-active" />,
  bool: <ToggleLeft className="h-3.5 w-3.5 text-primary" />,
  float: <Hash className="h-3.5 w-3.5 text-chart-2" />,
};

export default function ParametersPanel() {
  const parameters = useASMStore((s) => s.parameters);
  const addParameter = useASMStore((s) => s.addParameter);
  const removeParameter = useASMStore((s) => s.removeParameter);
  const updateParameter = useASMStore((s) => s.updateParameter);
  const setParameterName = useASMStore((s) => s.setParameterName);
  const tick = useASMStore((s) => s.tick);

  const [newType, setNewType] = useState<ParameterType>("bool");
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) return;
    addParameter({
      name: newName.trim(),
      type: newType,
      value: newType === "float" ? 0 : false,
    });
    setNewName("");
  };

  const handleToggle = (id: string, current: boolean | number) => {
    updateParameter(id, typeof current === "boolean" ? !current : current);
    // Auto-tick after parameter change
    setTimeout(() => tick(), 0);
  };

  const handleFloat = (id: string, val: number) => {
    updateParameter(id, val);
    setTimeout(() => tick(), 0);
  };

  return (
    <div className="flex h-full flex-col border-r border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Parameters
          </span>
        </div>
      </div>

      {/* Add parameter */}
      <div className="flex items-center gap-1 border-b border-border px-2 py-2">
        <Select
          value={newType}
          onValueChange={(v) => setNewType(v as ParameterType)}
        >
          <SelectTrigger className="h-7 w-20 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bool">Bool</SelectItem>
            <SelectItem value="trigger">Trigger</SelectItem>
            <SelectItem value="float">Float</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Name..."
          className="h-7 flex-1 text-xs"
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={handleAdd}
          aria-label="Add parameter"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Parameter list */}
      <div className="flex-1 overflow-auto">
        {parameters.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-2 border-b border-border/50 px-3 py-2"
          >
            {typeIcons[p.type]}

            <Input
              value={p.name}
              onChange={(e) => setParameterName(p.id, e.target.value)}
              className="h-6 flex-1 border-none bg-transparent px-1 text-xs text-foreground"
            />

            {/* Control */}
            {p.type === "bool" || p.type === "trigger" ? (
              <Switch
                checked={!!p.value}
                onCheckedChange={() => handleToggle(p.id, p.value)}
                className="scale-75"
                aria-label={`Toggle ${p.name}`}
              />
            ) : (
              <div className="flex w-24 items-center gap-1">
                <Slider
                  value={[p.value as number]}
                  onValueChange={([v]) => handleFloat(p.id, v)}
                  min={0}
                  max={1}
                  step={0.01}
                  className="flex-1"
                />
                <span className="w-7 text-right text-[10px] text-muted-foreground">
                  {(p.value as number).toFixed(2)}
                </span>
              </div>
            )}

            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 opacity-40 hover:opacity-100"
              onClick={() => removeParameter(p.id)}
              aria-label={`Remove ${p.name}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}

        {parameters.length === 0 && (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            No parameters. Add one above.
          </div>
        )}
      </div>
    </div>
  );
}
