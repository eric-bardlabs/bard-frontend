// app/api/org-users/[membershipId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { orgId } = getAuth(req);

  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user_id } = await params;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const clerk = await clerkClient();
    const updated =
      await clerk.organizations.updateOrganizationMembershipMetadata({
        organizationId: orgId,
        userId: user_id,
        privateMetadata: body,
      });

    return NextResponse.json({ membership: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to update metadata", details: err.message },
      { status: 500 }
    );
  }
}
