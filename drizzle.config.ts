import { config } from "dotenv";
import type { Config } from "drizzle-kit";

config({ path: process.env.ENV_PATH ? process.env.ENV_PATH : ".env" });

export default {
  schema: "./db/schema.ts",
  out: "./db/drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
} satisfies Config;
