import { db } from "../db/dbClient";
import { user } from "../db/schema";

async function globalTeardown() {
  await db.delete(user);
}

export default globalTeardown;
