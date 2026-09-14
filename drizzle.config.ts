import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const connectionUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!connectionUrl) {
  throw new Error("Set DATABASE_URL_UNPOOLED or DATABASE_URL before running Drizzle commands.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: connectionUrl },
  strict: true,
  verbose: true,
});
