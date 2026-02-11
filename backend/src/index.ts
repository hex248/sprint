import type { BunRequest } from "bun";
import { withAuth, withCors, withCSRF, withRateLimit } from "./auth/middleware";
import { parseCookies, verifyToken } from "./auth/utils";
import { testDB } from "./db/client";
import { cleanupExpiredSessions, getOrganisationMemberRole, getSession } from "./db/queries";
import { withAuthedLogging, withLogging } from "./logger";
import { routes } from "./routes";
import { initializeFreeModelsCache } from "./routes/ai/opencode";

const DEV = process.argv.find((arg) => ["--dev", "--developer", "-d"].includes(arg.toLowerCase())) != null;
const PORT = process.argv.find((arg) => arg.toLowerCase().startsWith("--port="))?.split("=")[1] || 0;

const SESSION_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour in ms

type PresenceSocketData = {
    organisationId: number;
    userId: number;
    connectionId: string;
};

const presenceConnections = new Map<number, Map<number, Set<string>>>();

const getOrganisationPresenceTopic = (organisationId: number) => `organisation:${organisationId}:online`;

const addPresenceConnection = (organisationId: number, userId: number, connectionId: string) => {
    let orgConnections = presenceConnections.get(organisationId);
    if (!orgConnections) {
        orgConnections = new Map();
        presenceConnections.set(organisationId, orgConnections);
    }

    let userConnections = orgConnections.get(userId);
    if (!userConnections) {
        userConnections = new Set();
        orgConnections.set(userId, userConnections);
    }

    userConnections.add(connectionId);
};

const removePresenceConnection = (organisationId: number, userId: number, connectionId: string) => {
    const orgConnections = presenceConnections.get(organisationId);
    if (!orgConnections) {
        return;
    }

    const userConnections = orgConnections.get(userId);
    if (!userConnections) {
        return;
    }

    userConnections.delete(connectionId);

    if (userConnections.size === 0) {
        orgConnections.delete(userId);
    }

    if (orgConnections.size === 0) {
        presenceConnections.delete(organisationId);
    }
};

const getOnlineUserIds = (organisationId: number) => {
    const orgConnections = presenceConnections.get(organisationId);
    if (!orgConnections) {
        return [] as number[];
    }

    return [...orgConnections.keys()];
};

const publishOnlineUsers = (server: Bun.Server<PresenceSocketData>, organisationId: number) => {
    const payload = JSON.stringify({
        type: "online-users",
        organisationId,
        userIds: getOnlineUserIds(organisationId),
    });
    server.publish(getOrganisationPresenceTopic(organisationId), payload);
};

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
    let server: Bun.Server<PresenceSocketData>;

    const handleOrganisationWebSocket = async (req: Request) => {
        const { searchParams } = new URL(req.url);
        const organisationIdRaw = searchParams.get("organisationId") ?? searchParams.get("orgId");
        const organisationId = Number(organisationIdRaw);

        if (!Number.isInteger(organisationId) || organisationId <= 0) {
            return new Response("Invalid organisation id", { status: 400 });
        }

        const token = parseCookies(req.headers.get("Cookie")).token;
        if (!token) {
            return new Response("Unauthorized", { status: 401 });
        }

        let sessionId: number;
        let userId: number;
        try {
            const verified = verifyToken(token);
            sessionId = verified.sessionId;
            userId = verified.userId;
        } catch {
            return new Response("Invalid token", { status: 401 });
        }

        const session = await getSession(sessionId);
        if (!session || session.expiresAt < new Date() || session.userId !== userId) {
            return new Response("Session expired", { status: 401 });
        }

        const organisationMember = await getOrganisationMemberRole(organisationId, userId);
        if (!organisationMember) {
            return new Response("Forbidden", { status: 403 });
        }

        const upgraded = server.upgrade(req, {
            data: {
                organisationId,
                userId,
                connectionId: crypto.randomUUID(),
            },
        });

        if (!upgraded) {
            return new Response("WebSocket upgrade failed", { status: 500 });
        }

        return;
    };

    server = Bun.serve<PresenceSocketData>({
        port: Number(PORT),
        idleTimeout: 60, // 1 minute for AI chat responses
        routes: {
            "/": withGlobal(() => new Response(`title: tnirps\ndev-mode: ${DEV}\nport: ${PORT}`)),
            "/health": withGlobal(() => new Response("OK")),

            "/organisation/ws": handleOrganisationWebSocket,

            "/ai/chat": withGlobalAuthed(withAuth(routes.aiChat)),
            "/ai/models": withGlobalAuthed(withAuth(routes.aiModels)),

            // routes that modify state require withCSRF middleware
            "/auth/register": withGlobal(routes.authRegister),
            "/auth/login": withGlobal(routes.authLogin),
            "/auth/logout": withGlobalAuthed(withAuth(withCSRF(routes.authLogout))),
            "/auth/me": withGlobalAuthed(withAuth(routes.authMe)),
            "/auth/verify-email": withGlobalAuthed(withAuth(withCSRF(routes.authVerifyEmail))),
            "/auth/resend-verification": withGlobalAuthed(withAuth(withCSRF(routes.authResendVerification))),
            "/cli/login/start": withGlobal(routes.cliLoginStart),
            "/cli/login/poll": withGlobal(routes.cliLoginPoll),
            "/cli/login/approve": withGlobalAuthed(withAuth(withCSRF(routes.cliLoginApprove))),

            "/user/by-username": withGlobalAuthed(withAuth(routes.userByUsername)),
            "/user/update": withGlobalAuthed(withAuth(withCSRF(routes.userUpdate))),
            "/user/upload-avatar": withGlobal(routes.userUploadAvatar),
            "/attachment/upload": withGlobalAuthed(withAuth(withCSRF(routes.attachmentUpload))),

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
            "/organisation/export": withGlobalAuthed(withAuth(routes.organisationExport)),
            "/organisation/import": withGlobalAuthed(withAuth(withCSRF(routes.organisationImport))),
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
            "/sprint/close": withGlobalAuthed(withAuth(withCSRF(routes.sprintClose))),
            "/sprint/update": withGlobalAuthed(withAuth(withCSRF(routes.sprintUpdate))),
            "/sprint/delete": withGlobalAuthed(withAuth(withCSRF(routes.sprintDelete))),
            "/sprints/by-project": withGlobalAuthed(withAuth(routes.sprintsByProject)),

            "/timer/toggle": withGlobalAuthed(withAuth(withCSRF(routes.timerToggle))),
            "/timer/toggle-global": withGlobalAuthed(withAuth(withCSRF(routes.timerToggleGlobal))),
            "/timer/end": withGlobalAuthed(withAuth(withCSRF(routes.timerEnd))),
            "/timer/end-global": withGlobalAuthed(withAuth(withCSRF(routes.timerEndGlobal))),
            "/timer/get": withGlobalAuthed(withAuth(withCSRF(routes.timerGet))),
            "/timer/get-global": withGlobalAuthed(withAuth(routes.timerGetGlobal)),
            "/timer/get-inactive": withGlobalAuthed(withAuth(withCSRF(routes.timerGetInactive))),
            "/timer/get-inactive-global": withGlobalAuthed(withAuth(routes.timerGetInactiveGlobal)),
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
        websocket: {
            open(ws) {
                const { organisationId, userId, connectionId } = ws.data;
                ws.subscribe(getOrganisationPresenceTopic(organisationId));
                addPresenceConnection(organisationId, userId, connectionId);
                publishOnlineUsers(server, organisationId);
            },
            message() {},
            close(ws) {
                const { organisationId, userId, connectionId } = ws.data;
                removePresenceConnection(organisationId, userId, connectionId);
                publishOnlineUsers(server, organisationId);
            },
        },
    });

    console.log(`tnirps (sprint server) listening on ${server.url}`);
    await testDB();
    await initializeFreeModelsCache();
    startSessionCleanup();
};

main();
