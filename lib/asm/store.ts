import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import type {
  ASMStore,
  ASMNode,
  ASMEdge,
  ASMEdgeData,
  ASMNodeData,
  Condition,
} from "./types";

let _nodeId = 0;
const nextId = () => `asm_${++_nodeId}`;

// ─── Default edge data ──────────────────────────────────────────────────────

const defaultEdgeData: ASMEdgeData = {
  hasExitTime: false,
  exitTime: 1,
  transitionDuration: 250,
  conditions: [],
};

// ─── Default nodes (Entry + Idle) ────────────────────────────────────────────

const anyStateNode: ASMNode = {
  id: "any",
  type: "asm",
  position: { x: -100, y: 50 },
  data: {
    label: "Any State",
    animationName: "",
    loop: false,
    speed: 1,
    kind: "any",
  },
};

const entryNode: ASMNode = {
  id: "entry",
  type: "asm",
  position: { x: 150, y: 50 },
  data: {
    label: "Entry",
    animationName: "",
    loop: false,
    speed: 1,
    kind: "entry",
  },
};

const exitNode: ASMNode = {
  id: "exit",
  type: "asm",
  position: { x: -100, y: 175 },
  data: {
    label: "Exit",
    animationName: "",
    loop: false,
    speed: 1,
    kind: "exit",
  },
};

// ─── Condition evaluator ─────────────────────────────────────────────────────

function evaluateCondition(
  condition: Condition,
  paramValue: boolean | number
): boolean {
  const { op, threshold } = condition;
  if (typeof paramValue === "boolean" && typeof threshold === "boolean") {
    return op === "eq" ? paramValue === threshold : paramValue !== threshold;
  }
  const a = paramValue as number;
  const b = threshold as number;
  switch (op) {
    case "eq":
      return a === b;
    case "neq":
      return a !== b;
    case "gt":
      return a > b;
    case "lt":
      return a < b;
    case "gte":
      return a >= b;
    case "lte":
      return a <= b;
    default:
      return false;
  }
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useASMStore = create<ASMStore>()(subscribeWithSelector((set, get) => ({
  // ── Graph ── (starts empty until GLB is loaded)
  nodes: [],
  edges: [],

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) =>
    set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) })),

  onEdgesChange: (changes) =>
    set((s) => ({ edges: applyEdgeChanges(changes, s.edges) })),

  onConnect: (connection) =>
    set((s) => {
      const filteredEdges = s.edges.filter(
        (edge) => edge.source !== connection.source
      );

      return {
        edges: addEdge(
          { ...connection, data: { ...defaultEdgeData } },
          filteredEdges
        ),
      };
    }),

  deleteEdge: (id) =>
    set((s) => ({
      edges: s.edges.filter((e) => e.id !== id),
      selectedEdgeId: s.selectedEdgeId === id ? null : s.selectedEdgeId,
    })),

  // ── Active State ──
  activeNodeId: null,
  previousNodeId: null,

  setActiveNode: (id) =>
    set((s) => ({
      activeNodeId: id,
      previousNodeId: s.activeNodeId,
    })),

  // ── Parameters ── (empty until user adds them)
  parameters: [],

  addParameter: (param) =>
    set((s) => ({
      parameters: [...s.parameters, { ...param, id: `p_${Date.now()}` }],
    })),

  removeParameter: (id) =>
    set((s) => ({
      parameters: s.parameters.filter((p) => p.id !== id),
    })),

  updateParameter: (id, value) =>
    set((s) => ({
      parameters: s.parameters.map((p) =>
        p.id === id ? { ...p, value } : p
      ),
    })),

  setParameterName: (id, name) =>
    set((s) => ({
      parameters: s.parameters.map((p) =>
        p.id === id ? { ...p, name } : p
      ),
    })),

  // ── Edge Inspector ──
  selectedEdgeId: null,
  selectEdge: (id) => set({ selectedEdgeId: id }),

  updateEdgeData: (id, data) =>
    set((s) => ({
      edges: s.edges.map((e) =>
        e.id === id ? { ...e, data: { ...e.data!, ...data } } : e
      ),
    })),

  addConditionToEdge: (edgeId, condition) =>
    set((s) => ({
      edges: s.edges.map((e) =>
        e.id === edgeId
          ? {
            ...e,
            data: {
              ...e.data!,
              conditions: [...(e.data?.conditions ?? []), condition],
            },
          }
          : e
      ),
    })),

  removeConditionFromEdge: (edgeId, index) =>
    set((s) => ({
      edges: s.edges.map((e) =>
        e.id === edgeId
          ? {
            ...e,
            data: {
              ...e.data!,
              conditions: (e.data?.conditions ?? []).filter(
                (_, i) => i !== index
              ),
            },
          }
          : e
      ),
    })),

  // ── State Node Operations ──
  addStateNode: (position, animationName) => {
    const name = animationName ?? `state_${_nodeId + 1}`;
    const node: ASMNode = {
      id: nextId(),
      type: "asm",
      position,
      data: {
        label: name,
        animationName: name,
        loop: true,
        speed: 1,
        kind: "state",
      },
    };
    set((s) => ({ nodes: [...s.nodes, node] }));
  },

  removeNode: (id) =>
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
    })),

  updateNodeData: (id, data) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id
          ? { ...n, data: { ...n.data, ...data } as ASMNodeData }
          : n
      ),
    })),

  // ── GLB State ──
  glbObjectUrl: null,
  glbFileName: null,
  animationClipNames: [],

  setGlbFile: (url, fileName) =>
    set({ glbObjectUrl: url, glbFileName: fileName }),

  clearGlbFile: () =>
    set({
      glbObjectUrl: null,
      glbFileName: null,
      animationClipNames: [],
      nodes: [],
      edges: [],
      activeNodeId: null,
      parameters: [],
    }),

  // ── GLB Sync ──
  populateFromAnimationGroups: (names) => {
    const stateNodes: ASMNode[] = names.map((name, i) => ({
      id: nextId(),
      type: "asm" as const,
      position: { x: 150 + (i % 3) * 280, y: 180 + Math.floor(i / 3) * 140 },
      data: {
        label: name,
        animationName: name,
        loop: true,
        speed: 1,
        kind: "state" as const,
        isDefault: i === 0,
      },
    }));

    const baseNodes = [entryNode, anyStateNode, exitNode];
    const entryEdge: ASMEdge | null = stateNodes[0]
      ? {
        id: `entry->${stateNodes[0].id}`,
        source: "entry",
        target: stateNodes[0].id,
        type: "default",
        animated: true,
        data: { ...defaultEdgeData },
      }
      : null;

    set({
      nodes: [...baseNodes, ...stateNodes],
      edges: entryEdge ? [entryEdge] : [],
      activeNodeId: stateNodes[0]?.id ?? null,
      animationClipNames: names,
    });
  },

  // ── Transition Logic ──
  evaluateTransitions: () => {
    const { activeNodeId, edges, parameters } = get();
    if (!activeNodeId) return null;

    // Find all outgoing edges from active node
    const outgoing = edges.filter((e) => e.source === activeNodeId);

    for (const edge of outgoing) {
      const data = edge.data;
      if (!data || data.conditions.length === 0) continue;

      const allMet = data.conditions.every((cond) => {
        const param = parameters.find((p) => p.id === cond.parameterId);
        if (!param) return false;
        return evaluateCondition(cond, param.value);
      });

      if (allMet) return edge.target;
    }

    // Also check "Any State" outgoing edges
    const anyEdges = edges.filter((e) => e.source === "any");
    for (const edge of anyEdges) {
      const data = edge.data;
      if (!data || data.conditions.length === 0) continue;

      const allMet = data.conditions.every((cond) => {
        const param = parameters.find((p) => p.id === cond.parameterId);
        if (!param) return false;
        return evaluateCondition(cond, param.value);
      });

      if (allMet && edge.target !== activeNodeId) return edge.target;
    }

    return null;
  },

  tick: () => {
    const nextState = get().evaluateTransitions();
    if (nextState) {
      get().setActiveNode(nextState);

      // Auto-reset triggers
      set((s) => ({
        parameters: s.parameters.map((p) =>
          p.type === "trigger" && p.value === true
            ? { ...p, value: false }
            : p
        ),
      }));
    }
  },
})));