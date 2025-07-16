import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.NEON_DATABASE_URL) {
  throw new Error("NEON_DATABASE_URL is not set in your environment variables");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.NEON_DATABASE_URL,
  },
});