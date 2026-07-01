"use client";

/**
 * Step three captures hydraulic sizing inputs that drive flow-rate calculations.
 */

import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SystemTabs } from "./SystemTabs";

export function Step3Hydraulics() {
  const systems = useStore((s) => s.systems);
  const fieldErrors = useStore((s) => s.fieldErrors);
  const updateField = useStore((s) => s.updateField);

  return (
    <SystemTabs>
      {(systemIndex) => {
        const sys = systems[systemIndex];
        const prefix = `systems.${systemIndex}`;

        return (
          <div className="space-y-6">
            {/* Total Volume */}
            <div className="space-y-3">
              <Label htmlFor={`volume-${systemIndex}`}>
                Total Volume (m³) *
              </Label>
              <Input
                id={`volume-${systemIndex}`}
                type="number"
                min={0}
                step="0.1"
                placeholder="e.g. 500"
                value={sys.totalVolumeM3}
                onChange={(e) =>
                  updateField(`${prefix}.totalVolumeM3`, e.target.value)
                }
                aria-invalid={Boolean(fieldErrors[`${prefix}.totalVolumeM3`])}
                className="bg-white/92"
              />
            </div>

            {/* Turnovers Per Day */}
            <div className="space-y-3">
              <Label htmlFor={`turnovers-${systemIndex}`}>
                Turnovers Per Day *
              </Label>
              <Input
                id={`turnovers-${systemIndex}`}
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 4"
                value={sys.turnoversPerDay}
                onChange={(e) =>
                  updateField(`${prefix}.turnoversPerDay`, e.target.value)
                }
                aria-invalid={Boolean(fieldErrors[`${prefix}.turnoversPerDay`])}
                className="bg-white/92"
              />
            </div>

            {/* Operating Hours */}
            <div className="space-y-3">
              <Label htmlFor={`hours-${systemIndex}`}>
                Operating Hours Per Day *
              </Label>
              <Input
                id={`hours-${systemIndex}`}
                type="number"
                min={1}
                max={24}
                step={1}
                placeholder="1–24"
                value={sys.operatingHoursPerDay}
                onChange={(e) =>
                  updateField(
                    `${prefix}.operatingHoursPerDay`,
                    e.target.value
                  )
                }
                aria-invalid={Boolean(
                  fieldErrors[`${prefix}.operatingHoursPerDay`]
                )}
                className="bg-white/92"
              />
            </div>
          </div>
        );
      }}
    </SystemTabs>
  );
}
