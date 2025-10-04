import { NextRequest, NextResponse } from "next/server";

import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "../../../../db/dbClient";
import { user } from "../../../../db/schema";

export async function POST(request: NextRequest) {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  await db
    .update(user)
    .set({
      initialStep: 2,
    })
    .where(eq(user.id, clerkUser.id));

  return NextResponse.json({ success: true }, { status: 200 });
}
