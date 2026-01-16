import { withAuth, withCors, withCSRF } from "./auth/middleware";
import { testDB } from "./db/client";
import { cleanupExpiredSessions } from "./db/queries";
import { routes } from "./routes";

const DEV = process.argv.find((arg) => ["--dev", "--developer", "-d"].includes(arg.toLowerCase())) != null;
const PORT = process.argv.find((arg) => arg.toLowerCase().startsWith("--port="))?.split("=")[1] || 0;

const SESSION_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour in ms

const startSessionCleanup = () => {
    const cleanup = async () => {
        const count = await cleanupExpiredSessions();
        if (count > 0) {
            console.log(`cleaned up ${count} expired sessions`);
        }
    };

    cleanup();
    setInterval(cleanup, SESSION_CLEANUP_INTERVAL);
};

const main = async () => {
    const server = Bun.serve({
        port: Number(PORT),
        routes: {
            "/": withCors(() => new Response(`title: tnirps\ndev-mode: ${DEV}\nport: ${PORT}`)),
            "/health": withCors(() => new Response("OK")),

            // routes that modify state require withCSRF middleware
            "/auth/register": withCors(routes.authRegister),
            "/auth/login": withCors(routes.authLogin),
            "/auth/logout": withCors(withAuth(withCSRF(routes.authLogout))),
            "/auth/me": withCors(withAuth(routes.authMe)),

            "/user/by-username": withCors(withAuth(routes.userByUsername)),
            "/user/update": withCors(withAuth(withCSRF(routes.userUpdate))),
            "/user/upload-avatar": withCors(withAuth(withCSRF(routes.userUploadAvatar))),

            "/issue/create": withCors(withAuth(withCSRF(routes.issueCreate))),
            "/issue/update": withCors(withAuth(withCSRF(routes.issueUpdate))),
            "/issue/delete": withCors(withAuth(withCSRF(routes.issueDelete))),

            "/issues/by-project": withCors(withAuth(routes.issuesByProject)),
            "/issues/replace-status": withCors(withAuth(withCSRF(routes.issuesReplaceStatus))),
            "/issues/status-count": withCors(withAuth(routes.issuesStatusCount)),
            "/issues/all": withCors(withAuth(routes.issues)),

            "/organisation/create": withCors(withAuth(withCSRF(routes.organisationCreate))),
            "/organisation/by-id": withCors(withAuth(routes.organisationById)),
            "/organisation/update": withCors(withAuth(withCSRF(routes.organisationUpdate))),
            "/organisation/delete": withCors(withAuth(withCSRF(routes.organisationDelete))),
            "/organisation/add-member": withCors(withAuth(withCSRF(routes.organisationAddMember))),
            "/organisation/members": withCors(withAuth(routes.organisationMembers)),
            "/organisation/remove-member": withCors(withAuth(withCSRF(routes.organisationRemoveMember))),
            "/organisation/update-member-role": withCors(
                withAuth(withCSRF(routes.organisationUpdateMemberRole)),
            ),

            "/organisations/by-user": withCors(withAuth(routes.organisationsByUser)),

            "/project/create": withCors(withAuth(withCSRF(routes.projectCreate))),
            "/project/update": withCors(withAuth(withCSRF(routes.projectUpdate))),
            "/project/delete": withCors(withAuth(withCSRF(routes.projectDelete))),
            "/project/with-creator": withCors(withAuth(routes.projectWithCreator)),

            "/projects/by-creator": withCors(withAuth(routes.projectsByCreator)),
            "/projects/by-organisation": withCors(withAuth(routes.projectsByOrganisation)),
            "/projects/all": withCors(withAuth(routes.projectsAll)),
            "/projects/with-creators": withCors(withAuth(routes.projectsWithCreators)),

            "/sprint/create": withCors(withAuth(withCSRF(routes.sprintCreate))),
            "/sprints/by-project": withCors(withAuth(routes.sprintsByProject)),

            "/timer/toggle": withCors(withAuth(withCSRF(routes.timerToggle))),
            "/timer/end": withCors(withAuth(withCSRF(routes.timerEnd))),
            "/timer/get": withCors(withAuth(withCSRF(routes.timerGet))),
            "/timer/get-inactive": withCors(withAuth(withCSRF(routes.timerGetInactive))),
            "/timers": withCors(withAuth(withCSRF(routes.timers))),
        },
    });

    console.log(`tnirps (sprint server) listening on ${server.url}`);
    await testDB();
    startSessionCleanup();
};

main();
