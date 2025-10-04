import { NextRequest, NextResponse } from "next/server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "../../../db/dbClient";
import { eq } from "drizzle-orm";
import { user } from "../../../db/schema";

export async function GET(request: NextRequest) {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.json(null);
  }

  const result = await db.query.user.findFirst({
    where: eq(user.id, clerkUser.id),
  });

  return NextResponse.json(result);
}
