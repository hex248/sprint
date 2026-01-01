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
            "/health": withCors(() => new Response("OK")),

            "/auth/register": withCors(routes.authRegister),
            "/auth/login": withCors(routes.authLogin),
            "/auth/me": withCors(withAuth(routes.authMe)),

            "/user/by-username": withCors(withAuth(routes.userByUsername)),
            "/user/update": withCors(withAuth(routes.userUpdate)),
            "/user/upload-avatar": withCors(routes.userUploadAvatar),

            "/issue/create": withCors(withAuth(routes.issueCreate)),
            "/issue/update": withCors(withAuth(routes.issueUpdate)),
            "/issue/delete": withCors(withAuth(routes.issueDelete)),

            "/issues/by-project": withCors(withAuth(routes.issuesByProject)),
            "/issues/all": withCors(withAuth(routes.issues)),

            "/organisation/create": withCors(withAuth(routes.organisationCreate)),
            "/organisation/by-id": withCors(withAuth(routes.organisationById)),
            "/organisation/update": withCors(withAuth(routes.organisationUpdate)),
            "/organisation/delete": withCors(withAuth(routes.organisationDelete)),
            "/organisation/add-member": withCors(withAuth(routes.organisationAddMember)),
            "/organisation/members": withCors(withAuth(routes.organisationMembers)),
            "/organisation/remove-member": withCors(withAuth(routes.organisationRemoveMember)),
            "/organisation/update-member-role": withCors(withAuth(routes.organisationUpdateMemberRole)),

            "/organisations/by-user": withCors(withAuth(routes.organisationsByUser)),

            "/project/create": withCors(withAuth(routes.projectCreate)),
            "/project/update": withCors(withAuth(routes.projectUpdate)),
            "/project/delete": withCors(withAuth(routes.projectDelete)),
            "/project/with-creator": withCors(withAuth(routes.projectWithCreator)),

            "/projects/by-creator": withCors(withAuth(routes.projectsByCreator)),
            "/projects/by-organisation": withCors(withAuth(routes.projectsByOrganisation)),
            "/projects/all": withCors(withAuth(routes.projectsAll)),
            "/projects/with-creators": withCors(withAuth(routes.projectsWithCreators)),
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
