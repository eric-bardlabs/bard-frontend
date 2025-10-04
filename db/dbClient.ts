import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const rawDb = postgres(process.env.DATABASE_URL ?? "");
const db = drizzle(rawDb, { schema });

export { db };
