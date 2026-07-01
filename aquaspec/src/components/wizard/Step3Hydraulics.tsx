"use client";

/**
 * Step three captures hydraulic sizing inputs that drive flow-rate calculations.
 */

import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { FieldHint } from "./FieldHint";
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
              <FieldHint
                htmlFor={`volume-${systemIndex}`}
                hint="Total volume is the complete water volume that needs to be turned over through treatment."
              >
                Total Volume (m³) *
              </FieldHint>
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
              <FieldHint
                htmlFor={`turnovers-${systemIndex}`}
                hint="Turnovers per day define how many full treatment cycles the system should complete each day."
              >
                Turnovers Per Day *
              </FieldHint>
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
              <FieldHint
                htmlFor={`hours-${systemIndex}`}
                hint="Operating hours set how many hours per day the treatment train is expected to run."
              >
                Operating Hours Per Day *
              </FieldHint>
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
