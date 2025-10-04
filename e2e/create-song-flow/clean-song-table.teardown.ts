import { test as teardown } from "playwright/test";
import { db } from "../../db/dbClient";
import { spotifyTrack } from "../../db/schema";

teardown("teardown - clean song table", async ({}) => {
  await db.delete(spotifyTrack);
});
