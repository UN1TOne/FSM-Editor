"use client";

import { useEffect, useRef } from "react";
import { useASMStore } from "@/lib/asm/store";
import type { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";

function evaluateCondition(condition: any, paramValue: any): boolean {
  const { op, threshold } = condition;
  if (typeof paramValue === "boolean" && typeof threshold === "boolean") {
    return op === "eq" ? paramValue === threshold : paramValue !== threshold;
  }
  const a = paramValue as number;
  const b = threshold as number;
  switch (op) {
    case "eq": return a === b;
    case "neq": return a !== b;
    case "gt": return a > b;
    case "lt": return a < b;
    case "gte": return a >= b;
    case "lte": return a <= b;
    default: return false;
  }
}

export function useAnimationController(animationGroups: AnimationGroup[]) {
  const prevGroupRef = useRef<AnimationGroup | null>(null);
  const rafRef = useRef<number | null>(null);

  // ─────────────────────────────────────────────────────────
  // Node transition detection and crossfade + Dealing with exit Time 
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = useASMStore.subscribe(
      (state) => state.activeNodeId,
      (activeNodeId, previousActiveNodeId) => {
        if (!activeNodeId || activeNodeId === previousActiveNodeId) return;

        const store = useASMStore.getState();
        const activeNode = store.nodes.find((n) => n.id === activeNodeId);
        if (!activeNode || activeNode.data.kind !== "state") return;

        const nextGroup = animationGroups.find(
          (ag) => ag.name === activeNode.data.animationName
        );
        if (!nextGroup) return;

        let duration = 250;
        if (previousActiveNodeId) {
          const edge = store.edges.find(
            (e) => e.source === previousActiveNodeId && e.target === activeNodeId
          );
          if (edge?.data?.transitionDuration) {
            duration = edge.data.transitionDuration;
          }
        }

        const prevGroup = prevGroupRef.current;

        nextGroup.start(activeNode.data.loop, activeNode.data.speed);
        nextGroup.setWeightForAllAnimatables(0);

        let isTransitioning = false;
        let frameCount = 0;

        const startTime = performance.now();
        const tick = (now: number) => {
          frameCount++;
          const elapsed = now - startTime;
          const t = Math.min(elapsed / Math.max(duration, 1), 1);
          const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

          nextGroup.setWeightForAllAnimatables(ease);
          if (prevGroup && prevGroup !== nextGroup) {
            prevGroup.setWeightForAllAnimatables(1 - ease);
          }

          if (t >= 1 && prevGroup && prevGroup !== nextGroup) {
            prevGroup.stop();
            prevGroup.setWeightForAllAnimatables(0);
          }

          if (!isTransitioning && frameCount > 2) {
            let progress = 0;

            // Normalizing animation frame to 0.0 ~ 1.0
            if (nextGroup.animatables && nextGroup.animatables.length > 0) {
              const currentFrame = nextGroup.animatables[0].masterFrame;
              const totalFrames = nextGroup.to - nextGroup.from;
              if (totalFrames > 0) {
                progress = (currentFrame - nextGroup.from) / totalFrames;
              }
            } else if (!nextGroup.isPlaying) {
              progress = 1; // if finsished, progress 100%
            }

            const currentStore = useASMStore.getState();
            const outgoingEdges = currentStore.edges.filter((e) => e.source === activeNodeId);

            for (const edge of outgoingEdges) {
              if (!edge.data?.hasExitTime) continue;

              const targetExitTime = edge.data.exitTime ?? 1; // default 1.0 (100%)

              // Check exit Time
              if (progress >= targetExitTime || (!nextGroup.isPlaying && progress >= 0.99)) {
                let conditionsMet = true;
                if (edge.data.conditions && edge.data.conditions.length > 0) {
                  conditionsMet = edge.data.conditions.every((cond) => {
                    const param = currentStore.parameters.find((p) => p.id === cond.parameterId);
                    return param ? evaluateCondition(cond, param.value) : false;
                  });
                }

                if (conditionsMet) {
                  isTransitioning = true;

                  const targetNode = currentStore.nodes.find(n => n.id === edge.target);
                  if (targetNode && targetNode.data.kind === "exit") {
                    const entryNode = currentStore.nodes.find(n => n.data.kind === "entry");
                    const entryEdge = currentStore.edges.find(e => e.source === entryNode?.id);
                    if (entryEdge) {
                      currentStore.setActiveNode(entryEdge.target);
                    } else {
                      currentStore.setActiveNode(edge.target);
                    }
                  } else {
                    currentStore.setActiveNode(edge.target);
                  }

                  useASMStore.setState((s) => ({
                    parameters: s.parameters.map((p) =>
                      p.type === "trigger" && p.value === true ? { ...p, value: false } : p
                    ),
                  }));
                  break;
                }
              }
            }
          }

          rafRef.current = requestAnimationFrame(tick);
        };

        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(tick);

        prevGroupRef.current = nextGroup;
      }
    );

    return () => {
      unsubscribe();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animationGroups]);

  // ─────────────────────────────────────────────────────────
  //  Apply inspector changes to WebGL engine in realtime
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = useASMStore.subscribe(
      (state) => {
        const activeNode = state.nodes.find((n) => n.id === state.activeNodeId);
        return activeNode ? `${activeNode.data.loop}-${activeNode.data.speed}` : null;
      },
      (currentSettings, previousSettings) => {
        if (!currentSettings || currentSettings === previousSettings) return;

        const store = useASMStore.getState();
        const activeNode = store.nodes.find((n) => n.id === store.activeNodeId);
        if (!activeNode) return;

        const activeGroup = animationGroups.find(
          (ag) => ag.name === activeNode.data.animationName
        );
        if (!activeGroup) return;

        if (activeGroup.speedRatio !== activeNode.data.speed) {
          activeGroup.speedRatio = activeNode.data.speed;
        }

        if (activeGroup.loopAnimation !== activeNode.data.loop) {
          activeGroup.loopAnimation = activeNode.data.loop;
          if (activeNode.data.loop && !activeGroup.isPlaying) {
            activeGroup.play(true);
          }
        }
      }
    );

    return () => unsubscribe();
  }, [animationGroups]);
}