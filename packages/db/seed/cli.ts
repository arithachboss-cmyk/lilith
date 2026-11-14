import { migrationDatabaseUrl } from "../env";
import { runSeed } from "./index";

// `pnpm db:seed`. Like the migrations, it uses the direct connection.
const results = await runSeed(migrationDatabaseUrl(process.env));
for (const result of results) {
  console.log(
    `${result.table}: ${result.inserted} inserted, ${result.updated} updated, ${result.unchanged} unchanged`,
  );
}
