import type { BunRequest } from "bun";
import { withAuth, withCors, withCSRF, withRateLimit } from "./auth/middleware";
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

type RouteHandler<T extends BunRequest = BunRequest> = (req: T) => Response | Promise<Response>;

const withGlobal = <T extends BunRequest>(handler: RouteHandler<T>) => withCors(withRateLimit(handler));

const main = async () => {
    const server = Bun.serve({
        port: Number(PORT),
        routes: {
            "/": withGlobal(() => new Response(`title: tnirps\ndev-mode: ${DEV}\nport: ${PORT}`)),
            "/health": withGlobal(() => new Response("OK")),

            // routes that modify state require withCSRF middleware
            "/auth/register": withGlobal(routes.authRegister),
            "/auth/login": withGlobal(routes.authLogin),
            "/auth/logout": withGlobal(withAuth(withCSRF(routes.authLogout))),
            "/auth/me": withGlobal(withAuth(routes.authMe)),

            "/user/by-username": withGlobal(withAuth(routes.userByUsername)),
            "/user/update": withGlobal(withAuth(withCSRF(routes.userUpdate))),
            "/user/upload-avatar": withGlobal(routes.userUploadAvatar),

            "/issue/create": withGlobal(withAuth(withCSRF(routes.issueCreate))),
            "/issue/by-id": withGlobal(withAuth(routes.issueById)),
            "/issue/update": withGlobal(withAuth(withCSRF(routes.issueUpdate))),
            "/issue/delete": withGlobal(withAuth(withCSRF(routes.issueDelete))),
            "/issue-comment/create": withGlobal(withAuth(withCSRF(routes.issueCommentCreate))),
            "/issue-comment/delete": withGlobal(withAuth(withCSRF(routes.issueCommentDelete))),

            "/issues/by-project": withGlobal(withAuth(routes.issuesByProject)),
            "/issues/replace-status": withGlobal(withAuth(withCSRF(routes.issuesReplaceStatus))),
            "/issues/replace-type": withGlobal(withAuth(withCSRF(routes.issuesReplaceType))),
            "/issues/status-count": withGlobal(withAuth(routes.issuesStatusCount)),
            "/issues/type-count": withGlobal(withAuth(routes.issuesTypeCount)),
            "/issues/all": withGlobal(withAuth(routes.issues)),
            "/issue-comments/by-issue": withGlobal(withAuth(routes.issueCommentsByIssue)),

            "/organisation/create": withGlobal(withAuth(withCSRF(routes.organisationCreate))),
            "/organisation/by-id": withGlobal(withAuth(routes.organisationById)),
            "/organisation/update": withGlobal(withAuth(withCSRF(routes.organisationUpdate))),
            "/organisation/delete": withGlobal(withAuth(withCSRF(routes.organisationDelete))),
            "/organisation/upload-icon": withGlobal(withAuth(withCSRF(routes.organisationUploadIcon))),
            "/organisation/add-member": withGlobal(withAuth(withCSRF(routes.organisationAddMember))),
            "/organisation/members": withGlobal(withAuth(routes.organisationMembers)),
            "/organisation/remove-member": withGlobal(withAuth(withCSRF(routes.organisationRemoveMember))),
            "/organisation/update-member-role": withGlobal(
                withAuth(withCSRF(routes.organisationUpdateMemberRole)),
            ),

            "/organisations/by-user": withGlobal(withAuth(routes.organisationsByUser)),

            "/project/create": withGlobal(withAuth(withCSRF(routes.projectCreate))),
            "/project/update": withGlobal(withAuth(withCSRF(routes.projectUpdate))),
            "/project/delete": withGlobal(withAuth(withCSRF(routes.projectDelete))),
            "/project/with-creator": withGlobal(withAuth(routes.projectWithCreator)),

            "/projects/by-creator": withGlobal(withAuth(routes.projectsByCreator)),
            "/projects/by-organisation": withGlobal(withAuth(routes.projectsByOrganisation)),
            "/projects/all": withGlobal(withAuth(routes.projectsAll)),
            "/projects/with-creators": withGlobal(withAuth(routes.projectsWithCreators)),

            "/sprint/create": withGlobal(withAuth(withCSRF(routes.sprintCreate))),
            "/sprint/update": withGlobal(withAuth(withCSRF(routes.sprintUpdate))),
            "/sprint/delete": withGlobal(withAuth(withCSRF(routes.sprintDelete))),
            "/sprints/by-project": withGlobal(withAuth(routes.sprintsByProject)),

            "/timer/toggle": withGlobal(withAuth(withCSRF(routes.timerToggle))),
            "/timer/end": withGlobal(withAuth(withCSRF(routes.timerEnd))),
            "/timer/get": withGlobal(withAuth(withCSRF(routes.timerGet))),
            "/timer/get-inactive": withGlobal(withAuth(withCSRF(routes.timerGetInactive))),
            "/timers": withGlobal(withAuth(withCSRF(routes.timers))),
        },
    });

    console.log(`tnirps (sprint server) listening on ${server.url}`);
    await testDB();
    startSessionCleanup();
};

main();
