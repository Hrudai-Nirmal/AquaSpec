import { type NextRequest } from "next/server";
import { chromium } from "playwright";
import type { HatcheryRecommendation } from "@/lib/sizing-engine/types";
import { renderProposalHtml, type SystemInputDisplay } from "@/lib/proposal-html";

const PDF_TIMEOUT_MS = 15_000;

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("PDF generation timed out. Please try again.")), ms)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      recommendation: HatcheryRecommendation;
      includeBudgetary: boolean;
      inputs?: SystemInputDisplay[];
    };

    if (!body.recommendation) {
      return Response.json(
        { error: "Missing recommendation data" },
        { status: 400 }
      );
    }

    const logoUrl = `${request.nextUrl.origin}/LotusOzoneLogo.png`;

    const html = renderProposalHtml(
      body.recommendation,
      body.includeBudgetary ?? false,
      logoUrl,
      body.inputs
    );

    // Generate PDF with Playwright (with timeout and retry for Chromium)
    let browser: Awaited<ReturnType<typeof chromium.launch>>;
    try {
      browser = await chromium.launch();
    } catch (launchError: any) {
      console.error("First Chromium launch failed, retrying:", launchError);
      try {
        browser = await chromium.launch();
      } catch (retryError: any) {
        console.error("Second Chromium launch failed:", retryError);
        return Response.json(
          { error: "PDF service unavailable. Please try again later." },
          { status: 503 }
        );
      }
    }

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle" });

      const pdfBuffer = await Promise.race([
        page.pdf({
          format: "A4",
          printBackground: true,
          margin: { top: "20mm", bottom: "20mm", left: "20mm", right: "20mm" },
        }),
        timeout(PDF_TIMEOUT_MS),
      ]);

      await browser.close();

      const hatcheryName = sanitizeFilename(body.recommendation.hatcheryName);
      const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const filename = `LotusOzone_Proposal_${hatcheryName}_${date}.pdf`;

      return new Response(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } catch (error: any) {
      await browser.close().catch(() => {});
      if (error?.message?.includes("timed out")) {
        return Response.json(
          { error: "PDF generation timed out. Please try again." },
          { status: 504 }
        );
      }
      console.error("PDF generation error:", error);
      return Response.json(
        { error: error?.message || "Failed to generate PDF" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("PDF route error:", error);
    return Response.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
