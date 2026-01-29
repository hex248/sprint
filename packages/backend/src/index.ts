import type { BunRequest } from "bun";
import { withAuth, withCors, withCSRF, withRateLimit } from "./auth/middleware";
import { testDB } from "./db/client";
import { cleanupExpiredSessions } from "./db/queries";
import { withAuthedLogging, withLogging } from "./logger";
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

const withGlobal = <T extends BunRequest>(handler: RouteHandler<T>) =>
    withLogging(withCors(withRateLimit(handler)));
const withGlobalAuthed = <T extends BunRequest>(handler: RouteHandler<T>) =>
    withAuthedLogging(withCors(withRateLimit(handler)));

const main = async () => {
    const server = Bun.serve({
        port: Number(PORT),
        routes: {
            "/": withGlobal(() => new Response(`title: tnirps\ndev-mode: ${DEV}\nport: ${PORT}`)),
            "/health": withGlobal(() => new Response("OK")),

            // routes that modify state require withCSRF middleware
            "/auth/register": withGlobal(routes.authRegister),
            "/auth/login": withGlobal(routes.authLogin),
            "/auth/logout": withGlobalAuthed(withAuth(withCSRF(routes.authLogout))),
            "/auth/me": withGlobalAuthed(withAuth(routes.authMe)),
            "/auth/verify-email": withGlobalAuthed(withAuth(withCSRF(routes.authVerifyEmail))),
            "/auth/resend-verification": withGlobalAuthed(withAuth(withCSRF(routes.authResendVerification))),

            "/user/by-username": withGlobalAuthed(withAuth(routes.userByUsername)),
            "/user/update": withGlobalAuthed(withAuth(withCSRF(routes.userUpdate))),
            "/user/upload-avatar": withGlobalAuthed(withAuth(routes.userUploadAvatar)),

            "/issue/create": withGlobalAuthed(withAuth(withCSRF(routes.issueCreate))),
            "/issue/by-id": withGlobalAuthed(withAuth(routes.issueById)),
            "/issue/update": withGlobalAuthed(withAuth(withCSRF(routes.issueUpdate))),
            "/issue/delete": withGlobalAuthed(withAuth(withCSRF(routes.issueDelete))),
            "/issue-comment/create": withGlobalAuthed(withAuth(withCSRF(routes.issueCommentCreate))),
            "/issue-comment/delete": withGlobalAuthed(withAuth(withCSRF(routes.issueCommentDelete))),

            "/issues/by-project": withGlobalAuthed(withAuth(routes.issuesByProject)),
            "/issues/replace-status": withGlobalAuthed(withAuth(withCSRF(routes.issuesReplaceStatus))),
            "/issues/replace-type": withGlobalAuthed(withAuth(withCSRF(routes.issuesReplaceType))),
            "/issues/status-count": withGlobalAuthed(withAuth(routes.issuesStatusCount)),
            "/issues/type-count": withGlobalAuthed(withAuth(routes.issuesTypeCount)),
            "/issues/all": withGlobalAuthed(withAuth(routes.issues)),
            "/issue-comments/by-issue": withGlobalAuthed(withAuth(routes.issueCommentsByIssue)),

            "/organisation/create": withGlobalAuthed(withAuth(withCSRF(routes.organisationCreate))),
            "/organisation/by-id": withGlobalAuthed(withAuth(routes.organisationById)),
            "/organisation/update": withGlobalAuthed(withAuth(withCSRF(routes.organisationUpdate))),
            "/organisation/delete": withGlobalAuthed(withAuth(withCSRF(routes.organisationDelete))),
            "/organisation/upload-icon": withGlobalAuthed(withAuth(withCSRF(routes.organisationUploadIcon))),
            "/organisation/add-member": withGlobalAuthed(withAuth(withCSRF(routes.organisationAddMember))),
            "/organisation/members": withGlobalAuthed(withAuth(routes.organisationMembers)),
            "/organisation/member-time-tracking": withGlobalAuthed(
                withAuth(routes.organisationMemberTimeTracking),
            ),
            "/organisation/remove-member": withGlobalAuthed(
                withAuth(withCSRF(routes.organisationRemoveMember)),
            ),
            "/organisation/update-member-role": withGlobalAuthed(
                withAuth(withCSRF(routes.organisationUpdateMemberRole)),
            ),

            "/organisations/by-user": withGlobalAuthed(withAuth(routes.organisationsByUser)),

            "/project/create": withGlobalAuthed(withAuth(withCSRF(routes.projectCreate))),
            "/project/update": withGlobalAuthed(withAuth(withCSRF(routes.projectUpdate))),
            "/project/delete": withGlobalAuthed(withAuth(withCSRF(routes.projectDelete))),
            "/project/with-creator": withGlobalAuthed(withAuth(routes.projectWithCreator)),

            "/projects/by-creator": withGlobalAuthed(withAuth(routes.projectsByCreator)),
            "/projects/by-organisation": withGlobalAuthed(withAuth(routes.projectsByOrganisation)),
            "/projects/all": withGlobalAuthed(withAuth(routes.projectsAll)),
            "/projects/with-creators": withGlobalAuthed(withAuth(routes.projectsWithCreators)),

            "/sprint/create": withGlobalAuthed(withAuth(withCSRF(routes.sprintCreate))),
            "/sprint/update": withGlobalAuthed(withAuth(withCSRF(routes.sprintUpdate))),
            "/sprint/delete": withGlobalAuthed(withAuth(withCSRF(routes.sprintDelete))),
            "/sprints/by-project": withGlobalAuthed(withAuth(routes.sprintsByProject)),

            "/timer/toggle": withGlobalAuthed(withAuth(withCSRF(routes.timerToggle))),
            "/timer/end": withGlobalAuthed(withAuth(withCSRF(routes.timerEnd))),
            "/timer/get": withGlobalAuthed(withAuth(withCSRF(routes.timerGet))),
            "/timer/get-inactive": withGlobalAuthed(withAuth(withCSRF(routes.timerGetInactive))),
            "/timers": withGlobalAuthed(withAuth(withCSRF(routes.timers))),

            // subscription routes - webhook has no auth
            "/subscription/create-checkout-session": withGlobalAuthed(
                withAuth(withCSRF(routes.subscriptionCreateCheckoutSession)),
            ),
            "/subscription/create-portal-session": withGlobalAuthed(
                withAuth(withCSRF(routes.subscriptionCreatePortalSession)),
            ),
            "/subscription/cancel": withGlobalAuthed(withAuth(withCSRF(routes.subscriptionCancel))),
            "/subscription/get": withGlobalAuthed(withAuth(routes.subscriptionGet)),
            "/subscription/webhook": withGlobal(routes.subscriptionWebhook),
        },
    });

    console.log(`tnirps (sprint server) listening on ${server.url}`);
    await testDB();
    startSessionCleanup();
};

main();
