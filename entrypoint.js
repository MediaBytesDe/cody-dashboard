const postgres = require("postgres");
const fs = require("fs");
const path = require("path");

async function migrate() {
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });

  // Create migrations tracking table
  await sql`CREATE TABLE IF NOT EXISTS __drizzle_migrations (
    id serial PRIMARY KEY,
    hash text NOT NULL UNIQUE,
    created_at bigint
  )`;

  // Read migration files
  const migrationsDir = path.join(__dirname, "drizzle");
  if (!fs.existsSync(migrationsDir)) {
    console.log("No migrations directory found, skipping...");
    await sql.end();
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const hash = file;
    const [existing] = await sql`SELECT id FROM __drizzle_migrations WHERE hash = ${hash}`;
    if (existing) {
      console.log(`Migration ${file} already applied, skipping.`);
      continue;
    }

    console.log(`Applying migration: ${file}`);
    const content = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    const statements = content
      .split("--> statement-breakpoint")
      .map(s => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      await sql.unsafe(stmt);
    }

    await sql`INSERT INTO __drizzle_migrations (hash, created_at) VALUES (${hash}, ${Date.now()})`;
    console.log(`Migration ${file} applied successfully.`);
  }

  await sql.end();
  console.log("All migrations complete!");
}

migrate()
  .then(() => {
    console.log("Starting Next.js server...");
    require("./server.js");
  })
  .catch(e => {
    console.error("Migration failed:", e);
    process.exit(1);
  });
