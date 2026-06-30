import { type NextRequest } from "next/server";
import type { HatcheryRecommendation } from "@/lib/sizing-engine/types";
import { renderProposalHtml, type SystemInputDisplay } from "@/lib/proposal-html";

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

    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error: any) {
    console.error("Preview render error:", error);
    return Response.json(
      { error: error?.message || "Failed to render proposal HTML" },
      { status: 500 }
    );
  }
}
