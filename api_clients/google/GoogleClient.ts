// lib/googleClient.ts
import { google } from 'googleapis';

export function getGoogleCalendarClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}
