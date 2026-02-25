"use client";

import dynamic from "next/dynamic";

const ASMEditor = dynamic(() => import("@/components/asm/asm-editor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <span className="text-sm text-muted-foreground">Loading editor...</span>
    </div>
  ),
});

export default function Home() {
  return <ASMEditor />;
}
