import type { NextRequest } from "next/server";
import type { SizingRulesFile } from "@/lib/sizing-engine/types";
import rulesData from "@/data/sizing-rules.json";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const species = searchParams.get("species");
  const systemType = searchParams.get("systemType");

  if (!species || !systemType) {
    return Response.json(
      { error: "Missing species or systemType query parameter" },
      { status: 400 }
    );
  }

  const rules = rulesData as unknown as SizingRulesFile;

  const match = rules.biomassDODefaults.find(
    (d) => d.species === species && d.systemType === systemType
  );

  if (!match) {
    return Response.json(
      {
        error: `No default found for species="${species}" and systemType="${systemType}"`,
      },
      { status: 404 }
    );
  }

  return Response.json({
    species: match.species,
    systemType: match.systemType,
    defaultDODemandM3Hr: match.defaultDODemandM3Hr,
  });
}
