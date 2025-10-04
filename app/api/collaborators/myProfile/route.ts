import { db } from "@/db/dbClient";
import {
  collaboratorProfile,
} from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";

import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Not Authorized" }, { status: 401 });
  }
  
  const profile = await db.query.collaboratorProfile.findFirst({
    where: eq(collaboratorProfile.clerkUserId, user.id),
  });

  return NextResponse.json({ collaboratorProfile: profile }, { status: 200 });
}
