import { NextRequest, NextResponse } from "next/server";

import { Organization, clerkClient } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";

import { db } from "@/db/dbClient";
import { organizationCollaboratorProfile } from "@/db/schema";

function fetchOrganization(organizationId: string): Promise<any> {
    return clerkClient().then(clerk =>
      clerk.organizations.getOrganization({organizationId})
        .then(organization => {
          return organization;
        })
        .catch(error => {
          console.error('Failed to fetch organization', organizationId, error);
          throw error;  // Re-throw the error to handle it in Promise.all
        })
    );
  }

export async function POST(request: NextRequest) {
    const { organizationIds } = await request.json();
    
    const fetchPromises = organizationIds.map(fetchOrganization);

    try {
      const organizations = await Promise.all(fetchPromises);
      return NextResponse.json(organizations);
    } catch (error) {
      console.error('Error fetching one or more organizations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch organizations' }, 
        { status: 500 }
      );
    }
  }