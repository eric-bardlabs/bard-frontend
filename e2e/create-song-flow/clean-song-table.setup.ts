import { test as setup } from "playwright/test";
import { db } from "../../db/dbClient";
import { spotifyTrack } from "../../db/schema";

setup("setup - clean song table", async ({}) => {
  await db.delete(spotifyTrack);
});
