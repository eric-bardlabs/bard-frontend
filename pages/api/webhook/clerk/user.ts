import { db } from "@/db/dbClient";
import {
  collaboratorProfile,
  organizationCollaboratorProfile,
  user,
} from "@/db/schema";
import type { NextApiRequest, NextApiResponse } from "next";
import { and, eq } from "drizzle-orm";
import { sendSms } from "@/api_clients/twilio/TwilioAPIClient";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.body.type === "user.created") {
    const {
      created_at: createdAt,
      email_addresses: emailAddresses,
      updated_at: updatedAt,
      last_name: lastName,
      first_name: firstName,
      phone_numbers: phoneNumbers,
      primary_phone_number_id: primaryPhoneNumberId,
      image_url: imageUrl,
      public_metadata: publicMetadata,
      id,
    } = req.body.data;

    // find collaborator profile
    // if not create a new one
    // Create Organization for user

    // const newOrgId = typeid("organization").toString();
    // await db.insert(organization).values({
    //   id: newOrgId,
    // });
    const phone = primaryPhoneNumberId
      ? phoneNumbers.find((p) => p.id === primaryPhoneNumberId)?.phone_number
      : undefined;
    const allowSms = phone ? true : false;
    await db.insert(user).values({
      id,
      createdAt: new Date(createdAt as string),
      updatedAt: new Date(updatedAt as string),
      lastName,
      firstName,
      profilePic: imageUrl,
      phone: phone,
      allowSms: allowSms,
      initialStep: 1,
      emailAddress: emailAddresses[0].email_address,
      // organizationId: newOrgId,
    });

    if (publicMetadata.collaboratorProfileId) {
      await db
        .update(collaboratorProfile)
        .set({
          clerkUserId: id,
        })
        .where(
          eq(collaboratorProfile.id, publicMetadata.collaboratorProfileId)
        );
    }

    if (publicMetadata.collaboratorProfileId && publicMetadata.organizationId) {
      await db
        .update(organizationCollaboratorProfile)
        .set({
          collabStatus: "SHARED_BASIC",
        })
        .where(
          and(
            eq(
              organizationCollaboratorProfile.organizationId,
              publicMetadata.organizationId
            ),
            eq(
              organizationCollaboratorProfile.collaboratorProfileId,
              publicMetadata.collaboratorProfileId
            )
          )
        );
    }

    // Send welcome message via SMS if phone number exists
    if (phone) {
      try {
        await sendSms(
          "Hi, I'm Melody! Your music catalog assistant. I can add or update songs and collaborators, confirm details, and keep everything in sync. What's new in your catalog?",
          phone
        );
      } catch (error) {
        console.error("Failed to send welcome SMS:", error);
      }
    }
  }
  if (req.body.type === "user.updated") {
    const {
      id,
      phone_numbers: phoneNumbers,
      primary_phone_number_id: primaryPhoneNumberId,
    } = req.body.data;
    const phone = primaryPhoneNumberId
      ? phoneNumbers.find((p) => p.id === primaryPhoneNumberId)?.phone_number
      : undefined;
    await db
      .update(user)
      .set({
        phone: phone,
        allowSms: true,
      })
      .where(eq(user.id, id));
    
    // Send welcome message via SMS if phone number exists
    if (phone) {
      try {
        await sendSms(
          "Hi, I'm Melody! Your music catalog assistant. I can add or update songs and collaborators, confirm details, and keep everything in sync. What's new in your catalog?",
          phone
        );
      } catch (error) {
        console.error("Failed to send welcome SMS:", error);
      }
    }
  }
  res.status(200).json({ success: true });
}
