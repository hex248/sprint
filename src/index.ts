import { db, testDB } from "./db/client";
import { User } from "./db/schema";
import { routes } from "./routes";
import { createDemoData } from "./utils";

const DEV = process.argv.find((arg) => ["--dev", "--developer", "-d"].includes(arg.toLowerCase())) != null;
const PORT = process.argv.find((arg) => arg.toLowerCase().startsWith("--port="))?.split("=")[1] || 0;

const main = async () => {
    const server = Bun.serve({
        port: Number(PORT),
        routes: {
            "/": () => new Response(`title: eussi\ndev-mode: ${DEV}\nport: ${PORT}`),
            "/issue/create": routes.issueCreate,
            "/issue/update": routes.issueUpdate,
            "/issues/:projectId": routes.issues,
        },
    });

    console.log(`eussi (issue server) listening on ${server.url}`);
    await testDB();

    let users = await db.select().from(User);

    if (DEV && users.length === 0) {
        console.log("creating demo data...");
        await createDemoData();
        console.log("demo data created");
        users = await db.select().from(User);
    }

    console.log(`serving ${users.length} user${users.length === 1 ? "" : "s"}`);
};

main();
