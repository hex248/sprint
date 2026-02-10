import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set in environment variables");
}

export const db = drizzle({
    connection: {
        connectionString: process.env.DATABASE_URL,
    },
});

export const testDB = async () => {
    try {
        await db.execute("SELECT 1;");
        console.log("db connected");
    } catch (err) {
        console.log("db down");
        console.error(err);
        process.exit();
    }
};
