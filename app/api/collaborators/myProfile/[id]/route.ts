import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/dbClient";
import { collaboratorProfile, collaboratorRole } from "@/db/schema";
import { eq } from "drizzle-orm";
import { typeid } from "typeid-js";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { artistName, region, proId, pro, profileLink, bio } =
    await request.json();

  await db
    .update(collaboratorProfile)
    .set({
      artistName,
      region,
      proId,
      pro,
      profileLink,
      bio,
    })
    .where(eq(collaboratorProfile.id, id));

  return NextResponse.json({ success: true }, { status: 200 });
}
