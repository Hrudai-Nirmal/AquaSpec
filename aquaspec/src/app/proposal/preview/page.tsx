"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { FileDownIcon, ArrowLeftIcon } from "lucide-react";
import { buildProposalSessionPayload } from "@/lib/proposal-payload";
import {
  loadProposalSession,
  saveProposalSession,
  type ProposalSessionPayload,
} from "@/lib/proposal-session";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error";
}

export default function ProposalPreviewPage() {
  const router = useRouter();
  const recommendation = useStore((s) => s.recommendation);
  const budgetaryEstimateEnabled = useStore((s) => s.budgetaryEstimateEnabled);
  const systems = useStore((s) => s.systems);
  const hatcheryName = useStore((s) => s.hatcheryName);

  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const proposalPayload = useMemo<ProposalSessionPayload | null>(() => {
    if (recommendation) {
      return buildProposalSessionPayload({
        hatcheryName,
        includeBudgetary: budgetaryEstimateEnabled,
        recommendation,
        systems,
      });
    }

    return loadProposalSession();
  }, [budgetaryEstimateEnabled, hatcheryName, recommendation, systems]);

  useEffect(() => {
    if (recommendation && proposalPayload) {
      saveProposalSession(proposalPayload);
    }
  }, [proposalPayload, recommendation]);

  useEffect(() => {
    let isActive = true;

    const fetchHtml = async () => {
      if (!proposalPayload) {
        if (isActive) {
          setHtml(null);
          setError(null);
          setLoading(false);
        }
        return;
      }

      try {
        if (isActive) {
          setLoading(true);
          setError(null);
        }

        const response = await fetch("/api/proposal/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recommendation: proposalPayload.recommendation,
            includeBudgetary: proposalPayload.includeBudgetary,
            inputs: proposalPayload.inputs,
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Failed to load preview");
        }

        const htmlText = await response.text();
        if (isActive) {
          setHtml(htmlText);
        }
      } catch (error: unknown) {
        if (isActive) {
          setError(getErrorMessage(error) || "Failed to load preview");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void fetchHtml();

    return () => {
      isActive = false;
    };
  }, [proposalPayload]);

  const handleDownload = useCallback(async () => {
    if (!proposalPayload || downloading) return;

    setDownloading(true);

    try {
      const response = await fetch("/api/proposal/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendation: proposalPayload.recommendation,
          includeBudgetary: proposalPayload.includeBudgetary,
          inputs: proposalPayload.inputs,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LotusOzone_Proposal_${proposalPayload.hatcheryName.replace(/[^a-zA-Z0-9_-]/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: unknown) {
      alert(getErrorMessage(error) || "Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  }, [downloading, proposalPayload]);

  if (!proposalPayload) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold text-gray-900">No Sizing Data</h1>
          <p className="text-muted-foreground">
            No sizing data available. Please complete the wizard first.
          </p>
          <Button onClick={() => router.push("/")} variant="outline">
            <ArrowLeftIcon className="size-4 mr-2" />
            Back to Wizard
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Preparing proposal...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 max-w-md mx-auto p-8">
          <h1 className="text-xl font-bold text-red-600">Error</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => router.push("/")} variant="outline">
            <ArrowLeftIcon className="size-4 mr-2" />
            Back to Wizard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-3">
          <Button
            variant="outline"
            onClick={() => router.push("/")}
          >
            <ArrowLeftIcon className="size-4 mr-2" />
            Back to Wizard
          </Button>
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="bg-primary text-primary-foreground hover:bg-primary/85"
          >
            <FileDownIcon className="size-4 mr-2" />
            {downloading ? "Generating..." : "Download PDF"}
          </Button>
        </div>
      </div>

      {/* Preview content */}
      <div className="max-w-4xl mx-auto bg-white shadow-sm my-8 p-12 pb-24">
        <div
          dangerouslySetInnerHTML={{ __html: html || "" }}
          className="proposal-content"
        />
      </div>
    </div>
  );
}
