"use client";

import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileDownIcon, XIcon } from "lucide-react";
import { buildProposalSessionPayload } from "@/lib/proposal-payload";
import { saveProposalSession } from "@/lib/proposal-session";

export function ProposalPreview() {
  const router = useRouter();
  const proposalOpen = useStore((s) => s.proposalOpen);
  const setProposalOpen = useStore((s) => s.setProposalOpen);
  const hatcheryName = useStore((s) => s.hatcheryName);
  const systems = useStore((s) => s.systems);
  const recommendation = useStore((s) => s.recommendation);
  const budgetaryEstimateEnabled = useStore((s) => s.budgetaryEstimateEnabled);
  const toggleBudgetaryEstimate = useStore((s) => s.toggleBudgetaryEstimate);

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleDownload = () => {
    if (recommendation) {
      saveProposalSession(
        buildProposalSessionPayload({
          hatcheryName,
          includeBudgetary: budgetaryEstimateEnabled,
          recommendation,
          systems,
        })
      );
    }

    setProposalOpen(false);
    router.push("/proposal/preview");
  };

  return (
    <Dialog open={proposalOpen} onOpenChange={setProposalOpen}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto p-8 text-base md:p-10">
        <DialogHeader>
          <DialogTitle className="sr-only">Proposal Preview</DialogTitle>
        </DialogHeader>

        {/* Header */}
        <div className="text-center space-y-2 pb-6 border-b">
          <h2 className="text-3xl font-bold tracking-tight">LOTUS OZONE</h2>
          <p className="text-base text-muted-foreground">AquaSpec Proposal</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              <strong>Hatchery:</strong> {hatcheryName || "Unnamed"}
            </p>
            <p>{today}</p>
          </div>
        </div>

        {/* Body — System Summaries */}
        <div className="space-y-8 py-8">
          {systems.map((sys, i) => {
            const sysRec = recommendation?.systems[i];
            return (
              <div key={i} className="space-y-2">
                <h3 className="border-b pb-2 text-lg font-semibold">
                  {sys.name || `System ${i + 1}`}
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Water Source:</span>{" "}
                    {sys.waterSource}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Quality:</span>{" "}
                    {sys.qualityBand}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Salinity:</span>{" "}
                    {sys.salinityPpt} ppt
                  </div>
                  <div>
                    <span className="text-muted-foreground">Volume:</span>{" "}
                    {sys.totalVolumeM3} m³
                  </div>
                  <div>
                    <span className="text-muted-foreground">Turnovers:</span>{" "}
                    {sys.turnoversPerDay}/day
                  </div>
                  <div>
                    <span className="text-muted-foreground">Op. Hours:</span>{" "}
                    {sys.operatingHoursPerDay}h
                  </div>
                  {sysRec && (
                    <>
                      <div className="col-span-2 mt-2 border-t pt-2 text-sm font-medium">
                        Engineering Results
                      </div>
                      <div>
                        Flow:{" "}
                        <strong>
                          {sysRec.flowRate.flowRateM3Hr.toFixed(2)} m³/hr
                        </strong>
                      </div>
                      <div>
                        Ozone:{" "}
                        <strong>
                          {sysRec.ozoneDemand.ozoneDemandGHr.toFixed(2)} g/hr →{" "}
                          {sysRec.ozoneGeneratorModel}
                        </strong>
                      </div>
                      <div>
                        UV: <strong>{sysRec.uvSizing.selectedModel}</strong>
                        {sysRec.uvSizing.parallelUnits > 1 &&
                          ` ×${sysRec.uvSizing.parallelUnits}`}
                      </div>
                      <div>
                        Oxygen:{" "}
                        <strong>
                          {sysRec.oxygenDemand.selectedModel}
                        </strong>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {recommendation?.aggregateSummary && (
            <div className="space-y-1 pt-4 border-t">
              <h3 className="text-sm font-semibold">Aggregate Totals</h3>
              <div className="text-xs space-y-0.5">
                <p>
                  Total Flow:{" "}
                  <strong>
                    {recommendation.aggregateSummary.totalFlowRateM3Hr.toFixed(
                      2
                    )}{" "}
                    m³/hr
                  </strong>
                </p>
                <p>
                  Total Ozone:{" "}
                  <strong>
                    {recommendation.aggregateSummary.totalOzoneDemandGHr.toFixed(
                      2
                    )}{" "}
                    g/hr
                  </strong>
                </p>
                <p>
                  Total Oxygen:{" "}
                  <strong>
                    {recommendation.aggregateSummary.totalOxygenDemandM3Hr.toFixed(
                      3
                    )}{" "}
                    m³/hr
                  </strong>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <DialogClose>
            <Button variant="outline" size="sm">
              <XIcon className="size-4 mr-1" />
              Close
            </Button>
          </DialogClose>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={budgetaryEstimateEnabled}
                onChange={toggleBudgetaryEstimate}
                className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              Include Budgetary Estimate
            </label>

            <Button
              size="sm"
              onClick={handleDownload}
            >
              <FileDownIcon className="size-4 mr-1" />
              Download PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
