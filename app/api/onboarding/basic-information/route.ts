import { db } from "@/db/dbClient";
import {
  collaboratorProfile,
  organizationCollaboratorProfile,
  user,
} from "@/db/schema";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { eq, and, sql, isNull, ne, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { typeid } from "typeid-js";
import { BasicInformationData } from "@/types/onboarding";

export async function POST(request: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const data: BasicInformationData = await request.json();

    // Validate required fields
    if (!data.identity?.legalName || !data.identity?.organization) {
      return NextResponse.json(
        { error: "Legal name and organization are required" },
        { status: 400 }
      );
    }

    const clerk = await clerkClient();
    
    // Get user's active organization from Clerk
    const { orgId: activeOrgId } = await auth();
    
    let organizationId: string;
    let organization;

    if (activeOrgId) {
      // Update existing organization
      organization = await clerk.organizations.updateOrganization(activeOrgId, {
        name: data.identity.organization,
      });
      organizationId = activeOrgId;
    } else {
      // Create new organization (same as /finish endpoint)
      organization = await clerk.organizations.createOrganization({
        name: data.identity.organization,
        createdBy: clerkUser.id,
      });
      organizationId = organization.id;
    }


    // Create or update the current user's collaborator profile (similar to /finish)
    const userCollaboratorId = typeid("collabprofile").toString();
    const userCollaborator = {
      id: userCollaboratorId,
      legalName: data.identity.legalName,
      artistName: data.identity.artistName,
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
      pro: data.identity.pro || null,
      proId: data.identity.proId || null,
      organizationId: organizationId,
      phoneNumber: null,
      clerkUserId: clerkUser.id,
      spotifyArtistId: null, // Using clerk user id as spotify artist id (as in /finish)
      isPartOfOrganization: true,
      initialSource: "organization",
    };

    const existingCollaboratorProfile = await db.query.collaboratorProfile.findFirst({
      where: and(eq(collaboratorProfile.clerkUserId, clerkUser.id), eq(collaboratorProfile.organizationId, organizationId)),
    });
    if (existingCollaboratorProfile) {
      userCollaborator.id = existingCollaboratorProfile.id;
    }

    const [insertedUserCollaborator] = await db
      .insert(collaboratorProfile)
      .values(userCollaborator)
      .onConflictDoUpdate({
        target: [collaboratorProfile.id],
        set: {
          legalName: sql`EXCLUDED.legal_name`,
          artistName: sql`EXCLUDED.artist_name`,
          email: sql`EXCLUDED.email`,
          pro: sql`EXCLUDED.pro`,
          proId: sql`EXCLUDED.pro_id`,
          organizationId: sql`EXCLUDED.organization_id`,
          phoneNumber: sql`EXCLUDED.phone_number`,
          clerkUserId: sql`EXCLUDED.clerk_user_id`,
          spotifyArtistId: sql`EXCLUDED.spotify_artist_id`,
          isPartOfOrganization: sql`EXCLUDED.is_part_of_organization`,
          initialSource: sql`EXCLUDED.initial_source`,
        },
      })
      .returning();

    // First, get all existing organization members (excluding the current user)
    const existingOrgMembers = await db.query.collaboratorProfile.findMany({
      where: and(
        eq(collaboratorProfile.organizationId, organizationId),
        eq(collaboratorProfile.initialSource, "organization"),
        or(
          isNull(collaboratorProfile.clerkUserId),
          ne(collaboratorProfile.clerkUserId, clerkUser.id)
        )
      ),
    });

    // Get IDs of members that should be kept (from the submitted data)
    const submittedMemberIds = new Set(
      data.organizationMembers?.map(m => m.id).filter(Boolean) || []
    );

    // Delete members that are no longer in the submitted list
    for (const existingMember of existingOrgMembers) {
      if (!submittedMemberIds.has(existingMember.id)) {
        await db
          .delete(collaboratorProfile)
          .where(eq(collaboratorProfile.id, existingMember.id));
      }
    }

    // Process organization members if provided (from artists that are part of organization)
    const createdMembers: Array<{
      id: string;
      legalName: string | null;
      artistName: string | null;
      email: string | null;
      pro: string | null;
      proId: string | null;
      isPartOfOrganization?: boolean;
    }> = [];
    if (data.organizationMembers && data.organizationMembers.length > 0) {
      for (const member of data.organizationMembers) {
        const memberId = member.id || typeid("collabprofile").toString();
        
        const memberData = {
          id: memberId,
          legalName: member.legalName,
          artistName: member.artistName,
          email: member.email || null,
          pro: member.pro || null,
          proId: member.proId || null,
          organizationId: organizationId,
          phoneNumber: null,
          clerkUserId: null,
          spotifyArtistId: null,
          isPartOfOrganization: true,
          initialSource: "organization",
        };

        const [insertedMember] = await db
          .insert(collaboratorProfile)
          .values(memberData)
          .onConflictDoUpdate({
            target: [collaboratorProfile.id],
            set: {
              legalName: sql`EXCLUDED.legal_name`,
              artistName: sql`EXCLUDED.artist_name`,
              email: sql`EXCLUDED.email`,
              pro: sql`EXCLUDED.pro`,
              proId: sql`EXCLUDED.pro_id`,
              organizationId: sql`EXCLUDED.organization_id`,
              spotifyArtistId: sql`EXCLUDED.spotify_artist_id`,
              isPartOfOrganization: sql`EXCLUDED.is_part_of_organization`,
              initialSource: sql`EXCLUDED.initial_source`,
            },
          })
          .returning();

        createdMembers.push({
          id: insertedMember.id,
          legalName: insertedMember.legalName,
          artistName: insertedMember.artistName,
          email: insertedMember.email,
          pro: insertedMember.pro,
          proId: insertedMember.proId,
          isPartOfOrganization: insertedMember.isPartOfOrganization || true,
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        organizationId: organizationId,
        userCollaboratorId: insertedUserCollaborator.id,
        organizationMembers: createdMembers,
        message: "Basic information saved successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving basic information:", error);
    return NextResponse.json(
      { error: "Failed to save basic information" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve existing data
export async function GET() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Get user's active organization from Clerk
    const { orgId } = await auth();

    // Get organization details from Clerk
    const clerk = await clerkClient();
    let organization;
    let orgMembers;
    let userCollaboratorProfile;
    if (orgId) {
    // Get user's collaborator profile
      userCollaboratorProfile = await db.query.collaboratorProfile.findFirst({
        where: and(eq(collaboratorProfile.clerkUserId, clerkUser.id), eq(collaboratorProfile.organizationId, orgId)),
      });

      organization = await clerk.organizations.getOrganization({
        organizationId: orgId,
      });

      // Get all organization members (excluding the current user)
      orgMembers = await db.query.collaboratorProfile.findMany({
        where: and(
          eq(collaboratorProfile.organizationId, orgId),
          eq(collaboratorProfile.initialSource, "organization"),
          or(
            isNull(collaboratorProfile.clerkUserId),
            ne(collaboratorProfile.clerkUserId, clerkUser.id)
          )
        ),
      });
    } else {
      organization = null;
      orgMembers = [];
      userCollaboratorProfile = null;
    }

    return NextResponse.json({
      identity: {
        legalName: userCollaboratorProfile?.legalName || clerkUser.firstName + " " + clerkUser.lastName,
        artistName: userCollaboratorProfile?.artistName || "",
        organization: organization?.name || "",
        pro: userCollaboratorProfile?.pro || "",
        proId: userCollaboratorProfile?.proId || "",
      },
      organizationMembers: orgMembers.map((member) => ({
        id: member.id,
        legalName: member.legalName || "",
        artistName: member.artistName || "",
        email: member.email || "",
        region: member.region || "",
        pro: member.pro || "",
        proId: member.proId || "",
        profileLink: member.profileLink || "",
        bio: member.bio || "",
        phoneNumber: member.phoneNumber || "",
        initialSource: member.initialSource || "",
      })),
      organizationId: orgId,
    });
  } catch (error) {
    console.error("Error fetching basic information:", error);
    return NextResponse.json(
      { error: "Failed to fetch basic information" },
      { status: 500 }
    );
  }
}