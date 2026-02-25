// ─── Parameter Types ─────────────────────────────────────────────────────────

export type ParameterType = "trigger" | "bool" | "float";

export interface Parameter {
  id: string;
  name: string;
  type: ParameterType;
  value: boolean | number; // triggers are booleans that auto-reset
}

// ─── Condition Types ─────────────────────────────────────────────────────────

export type ComparisonOp = "eq" | "neq" | "gt" | "lt" | "gte" | "lte";

export interface Condition {
  parameterId: string;
  op: ComparisonOp;
  threshold: boolean | number; // bool for triggers/booleans, number for floats
}

// ─── Node (State) Data ───────────────────────────────────────────────────────

export type ASMNodeKind = "state" | "entry" | "exit" | "any";

export interface ASMNodeData {
  label: string;
  animationName: string;
  loop: boolean;
  speed: number;
  kind: ASMNodeKind;
  isDefault?: boolean; // The orange "default state" in Unity
}

// ─── Edge (Transition) Data ──────────────────────────────────────────────────

export interface ASMEdgeData {
  hasExitTime: boolean;
  exitTime: number; // normalised 0-1
  transitionDuration: number; // milliseconds
  conditions: Condition[];
}

// ─── React Flow Aliases ──────────────────────────────────────────────────────

import type { Node, Edge } from "@xyflow/react";

export type ASMNode = Node<ASMNodeData, "asm">;
export type ASMEdge = Edge<ASMEdgeData>;

// ─── Store Interface ─────────────────────────────────────────────────────────

export interface ASMStore {
  // ── Graph ──
  nodes: ASMNode[];
  edges: ASMEdge[];
  setNodes: (nodes: ASMNode[]) => void;
  setEdges: (edges: ASMEdge[]) => void;
  onNodesChange: (changes: import("@xyflow/react").NodeChange<ASMNode>[]) => void;
  onEdgesChange: (changes: import("@xyflow/react").EdgeChange<ASMEdge>[]) => void;
  onConnect: (connection: import("@xyflow/react").Connection) => void;
  deleteEdge: (id: string) => void;

  // ── Active State ──
  activeNodeId: string | null;
  previousNodeId: string | null;
  setActiveNode: (id: string) => void;

  // ── Parameters ──
  parameters: Parameter[];
  addParameter: (param: Omit<Parameter, "id">) => void;
  removeParameter: (id: string) => void;
  updateParameter: (id: string, value: boolean | number) => void;
  setParameterName: (id: string, name: string) => void;

  // ── Edge Inspector ──
  selectedEdgeId: string | null;
  selectEdge: (id: string | null) => void;
  updateEdgeData: (id: string, data: Partial<ASMEdgeData>) => void;
  addConditionToEdge: (edgeId: string, condition: Condition) => void;
  removeConditionFromEdge: (edgeId: string, index: number) => void;

  // ── State Node Operations ──
  addStateNode: (position: { x: number; y: number }, animationName?: string) => void;
  removeNode: (id: string) => void;
  updateNodeData: (id: string, data: Partial<ASMNodeData>) => void;

  // ── GLB Sync ──
  glbObjectUrl: string | null;
  glbFileName: string | null;
  animationClipNames: string[];
  setGlbFile: (url: string, fileName: string) => void;
  clearGlbFile: () => void;
  populateFromAnimationGroups: (names: string[]) => void;

  // ── Transition Logic ──
  evaluateTransitions: () => string | null;
  tick: () => void;
}
