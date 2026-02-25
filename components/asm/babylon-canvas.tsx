"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useASMStore } from "@/lib/asm/store";
import { useAnimationController } from "@/hooks/use-animation-controller";
import { Upload, Box, Loader2, X, FileBox } from "lucide-react";
import { Button } from "@/components/ui/button";

// Lazy-load Babylon core to avoid SSR issues
async function createBabylonScene(canvas: HTMLCanvasElement) {
  const { Engine } = await import("@babylonjs/core/Engines/engine");
  const { Scene } = await import("@babylonjs/core/scene");
  const { ArcRotateCamera } = await import(
    "@babylonjs/core/Cameras/arcRotateCamera"
  );
  const { Vector3 } = await import("@babylonjs/core/Maths/math.vector");
  const { HemisphericLight } = await import(
    "@babylonjs/core/Lights/hemisphericLight"
  );
  const { Color4 } = await import("@babylonjs/core/Maths/math.color");
  await import("@babylonjs/loaders/glTF");

  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
  });

  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.12, 0.12, 0.14, 1);
  scene.useRightHandedSystem = true;

  const camera = new ArcRotateCamera(
    "camera",
    Math.PI / 2,
    Math.PI / 2,
    3,
    new Vector3(0, 1.4, 0),
    scene
  );
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 1;
  camera.upperRadiusLimit = 20;
  camera.wheelPrecision = 50;
  camera.minZ = 0.01;
  camera.panningSensibility = 3000;

  new HemisphericLight("light", new Vector3(0, 1, 0.3), scene);

  engine.runRenderLoop(() => scene.render());

  const resize = () => engine.resize();
  window.addEventListener("resize", resize);

  const resizeObserver = new ResizeObserver(() => {
    engine.resize();
  });
  resizeObserver.observe(canvas);

  return {
    engine,
    scene,
    dispose: () => {
      window.removeEventListener("resize", resize);
      resizeObserver.disconnect();
      engine.dispose();
    },
  };
}

export default function BabylonCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Awaited<ReturnType<typeof createBabylonScene>> | null>(null);
  const [animGroups, setAnimGroups] = useState<
    import("@babylonjs/core/Animations/animationGroup").AnimationGroup[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const glbObjectUrl = useASMStore((s) => s.glbObjectUrl);
  const glbFileName = useASMStore((s) => s.glbFileName);
  const animationClipNames = useASMStore((s) => s.animationClipNames);
  const setGlbFile = useASMStore((s) => s.setGlbFile);
  const clearGlbFile = useASMStore((s) => s.clearGlbFile);
  const populateFromAnimationGroups = useASMStore((s) => s.populateFromAnimationGroups);
  const activeNodeId = useASMStore((s) => s.activeNodeId);

  // Initialize the Babylon engine
  useEffect(() => {
    if (!canvasRef.current) return;

    let disposed = false;
    createBabylonScene(canvasRef.current).then((result) => {
      if (disposed) {
        result.dispose();
        return;
      }
      sceneRef.current = result;
    });

    return () => {
      disposed = true;
      sceneRef.current?.dispose();
    };
  }, []);

  // Load GLB when glbObjectUrl changes
  useEffect(() => {
    if (!glbObjectUrl) {
      // Clear existing meshes/animations
      const ref = sceneRef.current;
      if (ref) {
        ref.scene.meshes.slice().forEach((m) => m.dispose());
        ref.scene.animationGroups.slice().forEach((ag) => ag.dispose());
      }
      setAnimGroups([]);
      return;
    }

    let cancelled = false;

    async function loadGlb() {
      const ref = sceneRef.current;
      if (!ref) return;

      setLoading(true);
      try {
        const { SceneLoader } = await import("@babylonjs/core/Loading/sceneLoader");
        await import("@babylonjs/loaders/glTF");

        // Clear previous meshes
        ref.scene.meshes.slice().forEach((m) => m.dispose());
        ref.scene.animationGroups.slice().forEach((ag) => ag.dispose());

        const result = await SceneLoader.ImportMeshAsync(
          "",
          "",
          glbObjectUrl,
          ref.scene,
          undefined,
          ".glb"
        );

        if (cancelled) return;

        // Collect animation groups
        const groups = ref.scene.animationGroups;
        setAnimGroups([...groups]);

        // Sync with ASM store
        const names = groups.map((g) => g.name);
        if (names.length > 0) {
          populateFromAnimationGroups(names);

          // Stop all and play the first one
          groups.forEach((g) => {
            g.stop();
            g.setWeightForAllAnimatables(0);
          });
          groups[0]?.start(true);
          groups[0]?.setWeightForAllAnimatables(1);
        } else {
          populateFromAnimationGroups([]);
        }

        // Frame the model
        if (result.meshes.length > 0) {
          const camera = ref.scene.activeCamera;
          if (camera && "setTarget" in camera) {
            const arcCam = camera as import("@babylonjs/core/Cameras/arcRotateCamera").ArcRotateCamera;
            arcCam.setTarget(result.meshes[0].getAbsolutePosition());
          }
        }
      } catch (err) {
        console.error("Failed to load GLB:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadGlb();

    return () => {
      cancelled = true;
    };
  }, [glbObjectUrl, populateFromAnimationGroups]);

  // Use the animation controller hook
  useAnimationController(animGroups);

  // Handle file selection
  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".glb") && !file.name.endsWith(".gltf")) return;
      const url = URL.createObjectURL(file);
      setGlbFile(url, file.name);
    },
    [setGlbFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const hasModel = !!glbObjectUrl;

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden bg-background"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
        <Box className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Scene Preview
        </span>
        {glbFileName && (
          <span className="ml-1 rounded-sm bg-muted px-2 py-0.5 font-mono text-[10px] text-foreground">
            {glbFileName}
          </span>
        )}
        <div className="flex-1" />
        {hasModel && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
            onClick={clearGlbFile}
          >
            <X className="h-3 w-3" />
            Remove
          </Button>
        )}
        <label>
          <input
            type="file"
            accept=".glb,.gltf"
            className="hidden"
            onChange={handleInputChange}
          />
          <Button
            size="sm"
            variant="secondary"
            className="h-7 gap-1.5 text-xs"
            asChild
          >
            <span>
              <Upload className="h-3 w-3" />
              {hasModel ? "Replace GLB" : "Load GLB"}
            </span>
          </Button>
        </label>
      </div>

      {/* Canvas */}
      <div className="relative flex-1 min-h-0">
        <canvas
          ref={canvasRef}
          className="h-full w-full outline-none"
          style={{ display: "block" }}
        />

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">
              Loading model...
            </span>
          </div>
        )}

        {/* Drag-over overlay */}
        {isDragOver && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-primary bg-primary/10 z-50">
            <FileBox className="h-10 w-10 text-primary" />
            <p className="text-sm font-medium text-primary">
              Drop GLB file here
            </p>
          </div>
        )}

        {/* Empty state */}
        {!hasModel && !loading && !isDragOver && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="rounded-xl border-2 border-dashed border-muted-foreground/30 p-6">
              <Upload className="mx-auto h-8 w-8 opacity-40" />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium">No model loaded</p>
              <p className="mt-0.5 text-[10px] opacity-70">
                Drop a .glb file here or click &quot;Load GLB&quot; above
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Animation clips list */}
      {animationClipNames.length > 0 && (
        <div className="border-t border-border px-3 py-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Animation Clips ({animationClipNames.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {animationClipNames.map((name) => {
              const isPlaying =
                activeNodeId != null &&
                useASMStore
                  .getState()
                  .nodes.find((n) => n.id === activeNodeId)?.data
                  .animationName === name;

              return (
                <span
                  key={name}
                  className={`rounded-sm px-2 py-0.5 text-[10px] transition-colors ${isPlaying
                    ? "bg-node-active text-background font-medium"
                    : "bg-muted text-muted-foreground"
                    }`}
                >
                  {name}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
