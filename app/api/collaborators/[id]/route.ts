import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/dbClient";
import {
  collaboratorProfile,
  collaboratorRelation,
  collaboratorRole,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { typeid } from "typeid-js";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const profile = await db.query.collaboratorProfile.findFirst({
    where: eq(collaboratorProfile.id, id),
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(profile, { status: 200 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const {
    legalName,
    artistName,
    email,
    region,
    pro,
    proId,
    profileLink,
    bio,
    roles,
    managers,
    members,
    entities,
  } = await request.json();

  // await db.update
  const updated = await db
    .update(collaboratorProfile)
    .set({
      legalName: legalName ?? null,
      artistName: artistName ?? null,
      email: email ?? null,
      region: region ?? null,
      pro: pro ?? null,
      proId: proId ?? null,
      profileLink: profileLink ?? null,
      bio: bio ?? null,
    })
    .where(eq(collaboratorProfile.id, id))
    .returning();

  if (managers && managers.length > 0) {
    await db
      .insert(collaboratorRelation)
      .values(
        managers.map((manager: string) => {
          return {
            collaboratorProfileId: updated[0].id,
            parentId: manager,
            type: "manager",
            organizationId: updated[0].organizationId,
          };
        })
      )
      .onConflictDoNothing({
        target: [
          collaboratorRelation.collaboratorProfileId,
          collaboratorRelation.parentId,
          collaboratorRelation.type,
          collaboratorRelation.organizationId,
        ],
      });
  }

  if (members && members.length > 0) {
    await db
      .insert(collaboratorRelation)
      .values(
        members.map((member: string) => {
          return {
            collaboratorProfileId: member,
            parentId: updated[0].id,
            type: "member",
            organizationId: updated[0].organizationId,
          };
        })
      )
      .onConflictDoNothing({
        target: [
          collaboratorRelation.collaboratorProfileId,
          collaboratorRelation.parentId,
          collaboratorRelation.type,
          collaboratorRelation.organizationId,
        ],
      });
  }

  if (entities && entities.length > 0) {
    await db
      .insert(collaboratorRelation)
      .values(
        entities.map((entity: string) => {
          return {
            collaboratorProfileId: updated[0].id,
            parentId: entity,
            type: "entity",
            organizationId: updated[0].organizationId,
          };
        })
      )
      .onConflictDoNothing({
        target: [
          collaboratorRelation.collaboratorProfileId,
          collaboratorRelation.parentId,
          collaboratorRelation.type,
          collaboratorRelation.organizationId,
        ],
      });
  }

  if (roles && roles.length > 0) {
    await db
      .delete(collaboratorRole)
      .where(eq(collaboratorRole.collaboratorProfileId, id));

    await db.insert(collaboratorRole).values(
      roles.map((role: string) => {
        const newCollabRoleId = typeid("collabrole").toString();

        return {
          id: newCollabRoleId,
          collaboratorProfileId: id,
          role,
        };
      })
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
