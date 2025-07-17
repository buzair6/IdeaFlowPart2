import { defineConfig } from "drizzle-kit";

if (!process.env.NEON_DATABASE_URL) {
  throw new Error(
    "NEON_DATABASE_URL must be set. Did you forget to add it to your secrets?",
  );
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.NEON_DATABASE_URL,
  },
});