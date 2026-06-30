import { HatcheryInput } from "@/lib/sizing-engine/types";
import { sizeHatchery } from "@/lib/sizing-engine/engine";
import type { SizingRulesFile } from "@/lib/sizing-engine/types";
import rulesData from "@/data/sizing-rules.json";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate with Zod
    const parseResult = HatcheryInput.safeParse(body);

    if (!parseResult.success) {
      return Response.json(
        {
          error: "Validation failed",
          details: parseResult.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const input = parseResult.data;

    // Cast the rules file (validated by SizingRulesFile schema)
    const rules = rulesData as unknown as SizingRulesFile;

    // Run the engine
    const recommendation = sizeHatchery(input, rules);

    return Response.json(recommendation);
  } catch (error: any) {
    console.error("Engine error:", error);
    return Response.json(
      {
        error: error?.message || "Internal engine error",
      },
      { status: 500 }
    );
  }
}
