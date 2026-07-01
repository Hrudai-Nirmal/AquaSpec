"use client";

import { useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  XIcon,
  Trash2Icon,
  BookmarkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SaveConfigDialog } from "./SaveConfigDialog";
import { UnsavedWorkDialog } from "./UnsavedWorkDialog";
import type { ConfigRecord } from "@/lib/config-persistence";

interface SavedConfigsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Provides quick access to saved sizing snapshots without leaving the wizard. */
export function SavedConfigsSidebar({
  isOpen,
  onClose,
}: SavedConfigsSidebarProps) {
  const configs = useStore((s) => s.configs);
  const configsLoaded = useStore((s) => s.configsLoaded);
  const activeConfigId = useStore((s) => s.activeConfigId);
  const hatcheryName = useStore((s) => s.hatcheryName);
  const systems = useStore((s) => s.systems);

  const loadConfig = useStore((s) => s.loadConfig);
  const saveConfig = useStore((s) => s.saveConfig);
  const deleteConfig = useStore((s) => s.deleteConfig);

  // Dialog states
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [pendingLoadId, setPendingLoadId] = useState<string | null>(null);
  const [pendingLoadName, setPendingLoadName] = useState("");

  // Detect if there are unsaved changes
  const hasUnsavedWork = useCallback((): boolean => {
    if (activeConfigId !== null) {
      // A config is loaded — check if form is different
      // We rely on the store's stale-edit logic via pristineInput
      // For simplicity, we just check if any system has data or hatcheryName is non-empty
      return (
        hatcheryName.trim().length > 0 ||
        systems.some(
          (s) =>
            s.name.trim().length > 0 ||
            s.waterSource !== "" ||
            s.qualityBand !== "" ||
            s.totalVolumeM3 !== "" ||
            s.turnoversPerDay !== "" ||
            s.operatingHoursPerDay !== "" ||
            s.salinityPpt !== "" ||
            s.targetPathogen !== "" ||
            s.species !== "" ||
            s.systemType !== ""
        )
      );
    }

    // No active config: check if there's any non-trivial data
    const hasName = hatcheryName.trim().length > 0;
    const hasSystemData = systems.some(
      (s) =>
        s.name.trim().length > 0 &&
        s.name !== "System 1" &&
        (s.waterSource !== "" ||
          s.totalVolumeM3 !== "" ||
          s.turnoversPerDay !== "" ||
          s.salinityPpt !== "")
    );

    // Pristine if: empty hatcheryName, exactly one system named "System 1", all fields empty
    const isPristine =
      !hasName &&
      systems.length === 1 &&
      systems[0].name === "System 1" &&
      systems[0].waterSource === "" &&
      systems[0].totalVolumeM3 === "" &&
      systems[0].turnoversPerDay === "" &&
      systems[0].salinityPpt === "";

    return !isPristine && (hasName || hasSystemData);
  }, [activeConfigId, hatcheryName, systems]);

  // Handle clicking a config row
  function handleConfigClick(config: ConfigRecord) {
    // Already loaded — no-op
    if (activeConfigId === config.id) return;

    // Check for unsaved work
    if (hasUnsavedWork()) {
      setPendingLoadId(config.id);
      setPendingLoadName(config.name);
      setUnsavedDialogOpen(true);
    } else {
      loadConfig(config.id);
    }
  }

  // Handle "Save Current" button
  function handleSaveCurrent() {
    if (activeConfigId !== null) {
      // Already editing a saved config — overwrite silently
      const existingConfig = configs.find((c) => c.id === activeConfigId);
      const fallbackName = hatcheryName || "Untitled";
      const name = existingConfig?.name ?? fallbackName;
      saveConfig(name).catch(() => {
        // If save fails (e.g., no recommendation), silently ignore
      });
    } else {
      // New config — open save dialog
      setSaveDialogOpen(true);
    }
  }

  // Handle save from dialog
  function handleSaveFromDialog(name: string) {
    saveConfig(name).catch(() => {
      // Silently handle save errors
    });
  }

  // Handle "Save & Load" from unsaved dialog
  function handleSaveAndLoad() {
    if (!pendingLoadId) return;
    // Save current work first (generate a name)
    const name = hatcheryName || "Unsaved Configuration";
    saveConfig(name)
      .then(() => {
        // Clear pending and load the target
        const targetId = pendingLoadId;
        setPendingLoadId(null);
        if (targetId) {
          loadConfig(targetId);
        }
      })
      .catch(() => {
        // If save fails (no results), just discard and load
        const targetId = pendingLoadId;
        setPendingLoadId(null);
        if (targetId) {
          loadConfig(targetId);
        }
      });
  }

  // Handle "Discard & Load" from unsaved dialog
  function handleDiscardAndLoad() {
    if (!pendingLoadId) return;
    const targetId = pendingLoadId;
    setPendingLoadId(null);
    loadConfig(targetId);
  }

  // Format date
  function formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Mode label
  function modeLabel(mode: string): string {
    return mode === "aggregate" ? "Aggregate" : "Multi-System";
  }

  return (
    <>
      {/* Overlay for mobile/tablet */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/10 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={cn(
          "fixed right-0 top-0 bottom-0 z-50 flex w-full flex-col border-l border-border bg-background shadow-lg transition-transform duration-200 ease-in-out lg:w-[360px]",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="h-[3px] shrink-0 bg-secondary" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <h2 className="font-heading text-sm font-semibold">
            Saved Configurations
          </h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <XIcon className="size-4" />
          </Button>
        </div>

        {/* Save Current button */}
        <div className="px-4 py-3 border-b shrink-0">
          <Button className="w-full" onClick={handleSaveCurrent}>
            <BookmarkIcon className="size-4 mr-1.5" />
            Save Current
          </Button>
        </div>

        {/* Config list */}
        <div className="flex-1 overflow-y-auto">
          {!configsLoaded ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Loading...
            </div>
          ) : configs.length === 0 ? (
            <div className="flex items-center justify-center py-12 px-4 text-sm text-muted-foreground text-center">
              <p>
                No saved configurations yet.
                <br />
                Save your current work to get started.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {configs.map((config) => {
                const isActive = config.id === activeConfigId;
                return (
                  <button
                    key={config.id}
                    type="button"
                    onClick={() => handleConfigClick(config)}
                    className={cn(
                      "w-full text-left px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:bg-muted/50",
                      isActive && "border-l-2 border-l-primary bg-background"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {config.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(config.savedAt)}
                          </span>
                          <Badge variant="secondary">
                            {modeLabel(config.input.mode)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            v{config.rulesVersionAtSave}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              `Delete "${config.name}"? This cannot be undone.`
                            )
                          ) {
                            deleteConfig(config.id);
                          }
                        }}
                      >
                        <Trash2Icon className="size-3" />
                      </Button>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <SaveConfigDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveFromDialog}
      />

      <UnsavedWorkDialog
        open={unsavedDialogOpen}
        onOpenChange={setUnsavedDialogOpen}
        onSaveAndLoad={handleSaveAndLoad}
        onDiscardAndLoad={handleDiscardAndLoad}
        targetConfigName={pendingLoadName}
      />
    </>
  );
}
