import { NextResponse } from "next/server";
import { mockPortalVendors } from "@/lib/mock";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(mockPortalVendors);
  } catch (e) {
    console.error("[api/supply-chain/vendors]", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
