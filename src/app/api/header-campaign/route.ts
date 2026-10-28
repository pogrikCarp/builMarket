import { NextResponse } from "next/server";
import { getHeaderCampaignState } from "@/lib/header-campaign-server";
import { EMPTY_HEADER_CAMPAIGN } from "@/lib/header-campaign";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getHeaderCampaignState(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[header-campaign] Failed to load decoration:", error);
    return NextResponse.json({ campaign: EMPTY_HEADER_CAMPAIGN, hasPromos: false }, { headers: { "Cache-Control": "no-store" } });
  }
}
