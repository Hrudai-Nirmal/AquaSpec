"use client";

import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2Icon, PlusIcon } from "lucide-react";

export function Step1Identity() {
  const hatcheryName = useStore((s) => s.hatcheryName);
  const mode = useStore((s) => s.mode);
  const systems = useStore((s) => s.systems);
  const fieldErrors = useStore((s) => s.fieldErrors);
  const updateField = useStore((s) => s.updateField);
  const setMode = useStore((s) => s.setMode);
  const addSystem = useStore((s) => s.addSystem);
  const removeSystem = useStore((s) => s.removeSystem);
  const renameSystem = useStore((s) => s.renameSystem);

  return (
    <div className="space-y-6">
      {/* Hatchery Name */}
      <div className="space-y-2">
        <Label htmlFor="hatcheryName">Hatchery Name *</Label>
        <Input
          id="hatcheryName"
          placeholder="e.g. Coastal Shrimp Hatchery"
          value={hatcheryName}
          onChange={(e) => {
            updateField("hatcheryName", e.target.value);
          }}
        />
        {fieldErrors["hatcheryName"] && (
          <p className="text-xs text-destructive">
            {fieldErrors["hatcheryName"]}
          </p>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="space-y-2">
        <Label>Mode</Label>
        <div className="flex gap-2">
          <Button
            variant={mode === "aggregate" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("aggregate")}
          >
            Single System
          </Button>
          <Button
            variant={mode === "multi_system" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("multi_system")}
          >
            Multi-System
          </Button>
        </div>
      </div>

      {/* Multi-System Management */}
      {mode === "multi_system" && (
        <div className="space-y-3">
          <Label>Systems</Label>
          <div className="space-y-2">
            {systems.map((sys, i) => (
              <Card key={i} size="sm">
                <CardContent className="flex items-center gap-2 p-3">
                  <Input
                    className="flex-1"
                    placeholder={`System ${i + 1}`}
                    value={sys.name}
                    onChange={(e) => renameSystem(i, e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={systems.length <= 1}
                    onClick={() => removeSystem(i)}
                  >
                    <Trash2Icon className="size-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={addSystem}
            className="w-full"
          >
            <PlusIcon className="size-4 mr-1" />
            Add System
          </Button>
        </div>
      )}
    </div>
  );
}
