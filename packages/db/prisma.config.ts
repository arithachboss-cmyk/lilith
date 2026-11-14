import { defineConfig } from "prisma/config";
import { migrationDatabaseUrl } from "./env";

// Prisma 7 reads the connection from this file, not from the schema.
// Migrations live in ./migrations as numbered folders (Blueprint §21.3).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "migrations" },
  datasource: { url: migrationDatabaseUrl(process.env) },
});
