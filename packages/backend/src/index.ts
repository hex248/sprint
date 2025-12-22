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

            "/auth/register": withCors(routes.authRegister),
            "/auth/login": withCors(routes.authLogin),
            "/auth/me": withCors(withAuth(routes.authMe)),

            "/issue/create": withCors(withAuth(routes.issueCreate)),
            "/issue/update": withCors(withAuth(routes.issueUpdate)),
            "/issue/delete": withCors(withAuth(routes.issueDelete)),
            "/issues/:projectBlob": withCors(withAuth(routes.issuesInProject)),
            "/issues/all": withCors(withAuth(routes.issues)),

            "/project/create": withCors(withAuth(routes.projectCreate)),
            "/project/update": withCors(withAuth(routes.projectUpdate)),
            "/project/delete": withCors(withAuth(routes.projectDelete)),
            "/projects/by-owner": withCors(withAuth(routes.projectsByOwner)),
            "/projects/all": withCors(withAuth(routes.projectsAll)),
            "/projects/with-owners": withCors(withAuth(routes.projectsWithOwners)),
            "/project/with-owner": withCors(withAuth(routes.projectWithOwner)),
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
