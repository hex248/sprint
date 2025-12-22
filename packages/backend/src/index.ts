import { User } from "@issue/shared";
import { withAuth, withCors } from "./auth/middleware";
import { db, testDB } from "./db/client";
import { routes } from "./routes";
import { createDemoData } from "./utils";

const DEV = process.argv.find((arg) => ["--dev", "--developer", "-d"].includes(arg.toLowerCase())) != null;
const PORT = process.argv.find((arg) => arg.toLowerCase().startsWith("--port="))?.split("=")[1] || 0;

const main = async () => {
    const server = Bun.serve({
        port: Number(PORT),
        routes: {
            "/": withCors(() => new Response(`title: eussi\ndev-mode: ${DEV}\nport: ${PORT}`)),

            "/issue/create": withCors(routes.issueCreate),
            "/issue/update": withCors(routes.issueUpdate),
            "/issue/delete": withCors(routes.issueDelete),
            "/issues/:projectBlob": withCors(routes.issuesInProject),
            "/issues/all": withCors(routes.issues),

            "/project/create": withCors(routes.projectCreate),
            "/project/update": withCors(routes.projectUpdate),
            "/project/delete": withCors(routes.projectDelete),
            "/projects/by-owner": withCors(routes.projectsByOwner),
            "/projects/all": withCors(routes.projectsAll),
            "/projects/with-owners": withCors(routes.projectsWithOwners),
            "/project/with-owner": withCors(routes.projectWithOwner),
        },
    });

    console.log(`eussi (issue server) listening on ${server.url}`);
    await testDB();

    if (DEV) {
        const users = await db.select().from(User);
        if (users.length === 0) {
            console.log("creating demo data...");
            await createDemoData();
            console.log("demo data created");
        }
    }
};

main();
