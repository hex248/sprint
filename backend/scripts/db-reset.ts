import "dotenv/config";
import { execSync } from "node:child_process";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
}

const db = drizzle({
    connection: {
        connectionString: DATABASE_URL,
    },
});

async function resetDatabase() {
    console.log("resetting database...");

    try {
        // drop drizzle metadata and recreate public schema
        await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);
        await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`);
        await db.execute(sql`CREATE SCHEMA public`);

        console.log("all tables dropped");

        // run migrations to recreate tables
        console.log("running migrations...");
        execSync("bunx drizzle-kit migrate", {
            stdio: "inherit",
            cwd: `${import.meta.dir}/..`,
        });

        console.log("database reset complete");
    } catch (error) {
        console.error("failed to reset database:", error);
        process.exit(1);
    }

    process.exit(0);
}

resetDatabase();
