import { db } from "@/db/dbClient";
import { collaboratorProfile } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";

import { eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Not Authorized" }, { status: 401 });
  }

  const profiles = await db.query.collaboratorProfile.findMany({
    where: or(
      eq(collaboratorProfile.clerkUserId, user.id),
      collaboratorProfile.email &&
        eq(
          collaboratorProfile.email,
          user.primaryEmailAddress?.emailAddress ?? ""
        )
    ),
    with: {
      roles: true,
      collabOrganization: true,
    },
  });

  return NextResponse.json({ profiles }, { status: 200 });
}
