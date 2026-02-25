"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import ParametersPanel from "./parameters-panel";
import NodeInspector from "./node-inspector";
import { Layers, GitBranch, FileBox, Download, Columns, Rows } from "lucide-react";
import { useASMStore } from "@/lib/asm/store";
import { Button } from "@/components/ui/button";

// Lazy-load heavy components that rely on browser APIs
const FlowEditor = dynamic(() => import("./flow-editor"), { ssr: false });
const BabylonCanvas = dynamic(() => import("./babylon-canvas"), { ssr: false });

export default function ASMEditor() {
  const glbFileName = useASMStore((s) => s.glbFileName);
  const clipCount = useASMStore((s) => s.animationClipNames.length);
  const nodes = useASMStore((s) => s.nodes);
  const edges = useASMStore((s) => s.edges);

  const [splitDirection, setSplitDirection] = useState<"horizontal" | "vertical">("vertical");

  const handleExportCode = () => {
    const connectedNodeIds = new Set(edges.flatMap((e) => [e.source, e.target]));
    connectedNodeIds.add("entry");
    const exportNodes = nodes.filter((n) => connectedNodeIds.has(n.id));

    let codeStr = `// Auto-generated Babylon.js FSM Animation Loop\n\n`;
    codeStr += `class AnimationFSM {\n`;
    codeStr += `  constructor(scene, animGroups) {\n`;
    codeStr += `    this.scene = scene;\n`;
    codeStr += `    this.animGroups = animGroups;\n`;
    codeStr += `    this.currentState = "Entry";\n`;
    codeStr += `    this.nodes = ${JSON.stringify(exportNodes.map(n => ({ id: n.id, data: n.data })), null, 2).replace(/\n/g, '\n    ')};\n`;
    codeStr += `    this.edges = ${JSON.stringify(edges.map(e => ({ source: e.source, target: e.target, conditions: e.data?.conditions })), null, 2).replace(/\n/g, '\n    ')};\n`;
    codeStr += `\n    this.init();\n  }\n\n`;
    codeStr += `  init() {\n`;
    codeStr += `    this.scene.onBeforeRenderObservable.add(() => {\n`;
    codeStr += `      this.update();\n`;
    codeStr += `    });\n  }\n\n`;
    codeStr += `  update() {\n`;
    codeStr += `    // FSM 상태 평가 및 애니메이션 전환 로직 구현\n`;
    codeStr += `    // ...\n`;
    codeStr += `  }\n}\n`;

    const blob = new Blob([codeStr], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${glbFileName ? glbFileName.split('.')[0] : 'fsm'}_logic.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Top bar */}
      <header className="flex h-9 items-center gap-3 border-b border-border bg-card px-4">
        <GitBranch className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold tracking-wide text-foreground">
          Animation State Machine Editor
        </span>
        <span className="text-[10px] text-muted-foreground">
          Base Layer
        </span>
        {glbFileName && (
          <span className="flex items-center gap-1 rounded-sm bg-muted px-2 py-0.5 text-[10px] text-foreground">
            <FileBox className="h-3 w-3 text-muted-foreground" />
            {glbFileName}
            <span className="ml-1 text-muted-foreground">
              {clipCount} clip{clipCount !== 1 ? "s" : ""}
            </span>
          </span>
        )}
        <div className="flex-1" />

        {/* Layout Change */}
        <Button
          onClick={() => setSplitDirection((prev) => (prev === "horizontal" ? "vertical" : "horizontal"))}
          variant="outline"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground mr-1"
          title="Toggle Layout (Vertical / Horizontal)"
        >
          {splitDirection === "horizontal" ? (
            <Rows className="h-3.5 w-3.5" />
          ) : (
            <Columns className="h-3.5 w-3.5" />
          )}
        </Button>

        <Button
          onClick={handleExportCode}
          variant="outline"
          size="sm"
          className="h-6 text-[10px] px-2"
        >
          <Download className="h-3 w-3 mr-1" />
          Export FSM
        </Button>
      </header>

      {/* Main content area */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left: Parameters */}
        <ResizablePanel defaultSize={15} minSize={10} maxSize={25}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={50}>
              <div className="flex h-full flex-col">
                {/* Layers tab header */}
                <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Layers
                  </span>
                </div>
                <div className="flex-1 overflow-auto px-3 py-2">
                  <div className="flex items-center gap-2 rounded-sm bg-muted/50 px-2 py-1 text-xs text-foreground">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    Base Layer
                  </div>
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={50}>
              <ParametersPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle />

        {/* Center: Flow Editor + Babylon */}
        <ResizablePanel defaultSize={65}>
          <ResizablePanelGroup direction={splitDirection}>
            {/* Flow Editor */}
            <ResizablePanel defaultSize={60} minSize={30}>
              <FlowEditor />
            </ResizablePanel>

            <ResizableHandle />

            {/* Babylon Preview */}
            <ResizablePanel defaultSize={40} minSize={20}>
              <BabylonCanvas />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle />

        {/* Right: Inspector */}
        <ResizablePanel defaultSize={20} minSize={10} maxSize={30}>
          <NodeInspector />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}