"use client";

import { useStore } from "@/lib/store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function SystemTabs({
  children,
}: {
  children: (systemIndex: number) => React.ReactNode;
}) {
  const systems = useStore((s) => s.systems);
  const activeIndex = useStore((s) => s.activeSystemIndex);
  const setActiveIndex = useStore((s) => s.setActiveSystemIndex);
  const mode = useStore((s) => s.mode);

  if (mode === "aggregate") {
    return <>{children(0)}</>;
  }

  return (
    <Tabs
      value={String(activeIndex)}
      onValueChange={(v) => {
        if (v) setActiveIndex(Number(v));
      }}
    >
      <TabsList className="w-full overflow-x-auto">
        {systems.map((sys, i) => (
          <TabsTrigger key={i} value={String(i)} className="text-sm whitespace-nowrap">
            {sys.name || `System ${i + 1}`}
          </TabsTrigger>
        ))}
      </TabsList>
      {systems.map((_, i) => (
        <TabsContent key={i} value={String(i)} className="mt-4">
          {children(i)}
        </TabsContent>
      ))}
    </Tabs>
  );
}
