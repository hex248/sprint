import {
    ClientRoomMessageSchema,
    type RtcClientToServerMessage,
    RtcClientToServerMessageSchema,
} from "@sprint/shared";
import type { BunRequest } from "bun";
import { withAuth, withCors, withCSRF, withRateLimit } from "./auth/middleware";
import { parseCookies, verifyToken } from "./auth/utils";
import { testDB } from "./db/client";
import { cleanupExpiredSessions, getOrganisationMemberRole, getSession } from "./db/queries";
import { withAuthedLogging, withLogging } from "./logger";
import { registerRealtimePublisher } from "./realtime";
import { routes } from "./routes";
import { initializeFreeModelsCache } from "./routes/ai/opencode";

const DEV = process.argv.find((arg) => ["--dev", "--developer", "-d"].includes(arg.toLowerCase())) != null;
const PORT = process.argv.find((arg) => arg.toLowerCase().startsWith("--port="))?.split("=")[1] || 0;

const SESSION_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour in ms

type PresenceSocketData = {
    organisationId: number;
    userId: number;
    connectionId: string;
    activeRoomUserId: number;
};

const presenceConnections = new Map<number, Map<number, Set<string>>>();
const roomConnections = new Map<number, Map<number, Map<number, Set<string>>>>();
const socketConnections = new Map<string, Bun.ServerWebSocket<PresenceSocketData>>();

const getOrganisationPresenceTopic = (organisationId: number) => `organisation:${organisationId}:online`;
const getOrganisationRoomTopic = (organisationId: number, roomUserId: number) =>
    `organisation:${organisationId}:room:${roomUserId}`;

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

const getUsersInCall = (organisationId: number) => {
    const orgConnections = roomConnections.get(organisationId);
    if (!orgConnections) {
        return [] as number[];
    }

    const usersInCall = new Set<number>();
    for (const roomUsers of orgConnections.values()) {
        if (roomUsers.size < 2) {
            continue;
        }

        for (const userId of roomUsers.keys()) {
            usersInCall.add(userId);
        }
    }

    return [...usersInCall];
};

const isUserInCall = (organisationId: number, userId: number) => {
    const orgConnections = roomConnections.get(organisationId);
    if (!orgConnections) {
        return false;
    }

    for (const roomUsers of orgConnections.values()) {
        if (roomUsers.size < 2) {
            continue;
        }

        if (roomUsers.has(userId)) {
            return true;
        }
    }

    return false;
};

const getInCallRoomOwnerUserIds = (organisationId: number) => {
    const orgConnections = roomConnections.get(organisationId);
    if (!orgConnections) {
        return [] as number[];
    }

    const roomOwnerUserIds: number[] = [];
    for (const [roomUserId, roomUsers] of orgConnections.entries()) {
        if (roomUsers.size >= 2) {
            roomOwnerUserIds.push(roomUserId);
        }
    }

    return roomOwnerUserIds;
};

const addRoomConnection = (
    organisationId: number,
    roomUserId: number,
    userId: number,
    connectionId: string,
) => {
    let orgConnections = roomConnections.get(organisationId);
    if (!orgConnections) {
        orgConnections = new Map();
        roomConnections.set(organisationId, orgConnections);
    }

    let roomUsers = orgConnections.get(roomUserId);
    if (!roomUsers) {
        roomUsers = new Map();
        orgConnections.set(roomUserId, roomUsers);
    }

    let userConnections = roomUsers.get(userId);
    if (!userConnections) {
        userConnections = new Set();
        roomUsers.set(userId, userConnections);
    }

    userConnections.add(connectionId);
};

const removeRoomConnection = (
    organisationId: number,
    roomUserId: number,
    userId: number,
    connectionId: string,
) => {
    const orgConnections = roomConnections.get(organisationId);
    if (!orgConnections) {
        return;
    }

    const roomUsers = orgConnections.get(roomUserId);
    if (!roomUsers) {
        return;
    }

    const userConnections = roomUsers.get(userId);
    if (!userConnections) {
        return;
    }

    userConnections.delete(connectionId);

    if (userConnections.size === 0) {
        roomUsers.delete(userId);
    }

    if (roomUsers.size === 0) {
        orgConnections.delete(roomUserId);
    }

    if (orgConnections.size === 0) {
        roomConnections.delete(organisationId);
    }
};

const getRoomParticipantUserIds = (organisationId: number, roomUserId: number) => {
    const orgConnections = roomConnections.get(organisationId);
    if (!orgConnections) {
        return [] as number[];
    }

    const roomUsers = orgConnections.get(roomUserId);
    if (!roomUsers) {
        return [] as number[];
    }

    return [...roomUsers.keys()];
};

const publishOnlineUsers = (server: Bun.Server<PresenceSocketData>, organisationId: number) => {
    const payload = JSON.stringify({
        type: "online-users",
        organisationId,
        userIds: getOnlineUserIds(organisationId),
        inCallUserIds: getUsersInCall(organisationId),
        inCallRoomOwnerUserIds: getInCallRoomOwnerUserIds(organisationId),
    });
    server.publish(getOrganisationPresenceTopic(organisationId), payload);
};

const publishRoomJoin = (
    server: Bun.Server<PresenceSocketData>,
    organisationId: number,
    roomUserId: number,
    userId: number,
) => {
    const payload = JSON.stringify({
        type: "room-user-joined",
        organisationId,
        roomUserId,
        userId,
    });
    server.publish(getOrganisationPresenceTopic(organisationId), payload);
};

const publishRoomParticipants = (
    server: Bun.Server<PresenceSocketData>,
    organisationId: number,
    roomUserId: number,
) => {
    const payload = JSON.stringify({
        type: "room-participants",
        organisationId,
        roomUserId,
        participantUserIds: getRoomParticipantUserIds(organisationId, roomUserId),
    });
    server.publish(getOrganisationRoomTopic(organisationId, roomUserId), payload);
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
                activeRoomUserId: userId,
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
            "/rtc/config": withGlobalAuthed(withAuth(routes.rtcConfig)),
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
            "/issue/import-jira-csv": withGlobalAuthed(withAuth(withCSRF(routes.issueImportJiraCsv))),
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
                socketConnections.set(connectionId, ws);
                ws.subscribe(getOrganisationPresenceTopic(organisationId));
                addPresenceConnection(organisationId, userId, connectionId);
                publishOnlineUsers(server, organisationId);

                ws.subscribe(getOrganisationRoomTopic(organisationId, userId));
                addRoomConnection(organisationId, userId, userId, connectionId);
                publishRoomParticipants(server, organisationId, userId);
                publishOnlineUsers(server, organisationId);
            },
            async message(ws, message) {
                let parsedMessage: unknown;
                try {
                    const raw = typeof message === "string" ? message : Buffer.from(message).toString("utf8");
                    parsedMessage = JSON.parse(raw);
                } catch {
                    return;
                }

                const { organisationId, userId, connectionId } = ws.data;

                const sendSignalInvalid = (msg: string) => {
                    ws.send(
                        JSON.stringify({
                            type: "room-error",
                            code: "SIGNAL_INVALID",
                            message: msg,
                        }),
                    );
                };

                const handleRtcMessage = (rtc: RtcClientToServerMessage) => {
                    const activeRoomUserId = ws.data.activeRoomUserId;
                    if (rtc.roomUserId !== activeRoomUserId) {
                        sendSignalInvalid("stale room signaling");
                        return;
                    }

                    const roomParticipantUserIds = getRoomParticipantUserIds(organisationId, rtc.roomUserId);
                    if (!roomParticipantUserIds.includes(userId)) {
                        sendSignalInvalid("sender not in room");
                        return;
                    }

                    if (rtc.type === "webrtc-peer-state") {
                        server.publish(
                            getOrganisationRoomTopic(organisationId, rtc.roomUserId),
                            JSON.stringify({
                                type: "webrtc-peer-state",
                                organisationId,
                                roomUserId: rtc.roomUserId,
                                fromUserId: userId,
                                muted: rtc.muted,
                                speaking: rtc.speaking ?? false,
                            }),
                        );
                        return;
                    }

                    const targetUserId = rtc.targetUserId;
                    if (targetUserId === userId) {
                        sendSignalInvalid("invalid target");
                        return;
                    }

                    if (!roomParticipantUserIds.includes(targetUserId)) {
                        sendSignalInvalid("target not in room");
                        return;
                    }

                    const orgConnections = roomConnections.get(organisationId);
                    const roomUsers = orgConnections?.get(rtc.roomUserId);
                    const targetConnectionIds = roomUsers?.get(targetUserId);
                    if (!targetConnectionIds || targetConnectionIds.size === 0) {
                        sendSignalInvalid("target not connected");
                        return;
                    }

                    const forwarded =
                        rtc.type === "webrtc-offer"
                            ? {
                                  type: "webrtc-offer" as const,
                                  organisationId,
                                  roomUserId: rtc.roomUserId,
                                  fromUserId: userId,
                                  sdp: rtc.sdp,
                              }
                            : rtc.type === "webrtc-answer"
                              ? {
                                    type: "webrtc-answer" as const,
                                    organisationId,
                                    roomUserId: rtc.roomUserId,
                                    fromUserId: userId,
                                    sdp: rtc.sdp,
                                }
                              : {
                                    type: "webrtc-ice-candidate" as const,
                                    organisationId,
                                    roomUserId: rtc.roomUserId,
                                    fromUserId: userId,
                                    candidate: rtc.candidate,
                                };

                    const payload = JSON.stringify(forwarded);
                    for (const targetConnectionId of targetConnectionIds) {
                        const targetSocket = socketConnections.get(targetConnectionId);
                        if (!targetSocket || targetSocket.data.organisationId !== organisationId) {
                            continue;
                        }

                        if (targetSocket.data.activeRoomUserId !== rtc.roomUserId) {
                            continue;
                        }

                        targetSocket.send(payload);
                    }
                };

                const rtcParse = RtcClientToServerMessageSchema.safeParse(parsedMessage);
                if (rtcParse.success) {
                    handleRtcMessage(rtcParse.data);
                    return;
                }

                const roomParse = ClientRoomMessageSchema.safeParse(parsedMessage);
                if (!roomParse.success) {
                    return;
                }

                const data = roomParse.data;

                const joinRoom = (roomUserId: number) => {
                    const previousRoomUserId = ws.data.activeRoomUserId;
                    if (previousRoomUserId === roomUserId) {
                        ws.send(
                            JSON.stringify({
                                type: "room-joined",
                                organisationId,
                                roomUserId,
                            }),
                        );
                        ws.send(
                            JSON.stringify({
                                type: "room-participants",
                                organisationId,
                                roomUserId,
                                participantUserIds: getRoomParticipantUserIds(organisationId, roomUserId),
                            }),
                        );
                        return;
                    }

                    ws.unsubscribe(getOrganisationRoomTopic(organisationId, previousRoomUserId));
                    removeRoomConnection(organisationId, previousRoomUserId, userId, connectionId);
                    publishRoomParticipants(server, organisationId, previousRoomUserId);

                    ws.subscribe(getOrganisationRoomTopic(organisationId, roomUserId));
                    addRoomConnection(organisationId, roomUserId, userId, connectionId);
                    ws.data.activeRoomUserId = roomUserId;
                    publishRoomParticipants(server, organisationId, roomUserId);
                    publishOnlineUsers(server, organisationId);

                    ws.send(
                        JSON.stringify({
                            type: "room-joined",
                            organisationId,
                            roomUserId,
                        }),
                    );
                };

                if (data.type === "leave-room") {
                    joinRoom(userId);
                    return;
                }

                if (data.type === "end-room") {
                    const activeRoomUserId = ws.data.activeRoomUserId;
                    if (activeRoomUserId !== userId) {
                        ws.send(
                            JSON.stringify({
                                type: "room-error",
                                code: "FORBIDDEN_ROOM",
                                message: "forbidden room",
                            }),
                        );
                        return;
                    }

                    const orgConnections = roomConnections.get(organisationId);
                    const roomUsers = orgConnections?.get(activeRoomUserId);
                    if (!roomUsers) {
                        ws.send(
                            JSON.stringify({
                                type: "room-participants",
                                organisationId,
                                roomUserId: activeRoomUserId,
                                participantUserIds: getRoomParticipantUserIds(
                                    organisationId,
                                    activeRoomUserId,
                                ),
                            }),
                        );
                        return;
                    }

                    const movedUserIds = new Set<number>();
                    for (const [participantUserId, participantConnectionIds] of roomUsers.entries()) {
                        if (participantUserId === userId) {
                            continue;
                        }

                        for (const participantConnectionId of participantConnectionIds) {
                            const participantSocket = socketConnections.get(participantConnectionId);
                            if (
                                !participantSocket ||
                                participantSocket.data.organisationId !== organisationId
                            ) {
                                continue;
                            }

                            participantSocket.unsubscribe(
                                getOrganisationRoomTopic(organisationId, activeRoomUserId),
                            );
                            removeRoomConnection(
                                organisationId,
                                activeRoomUserId,
                                participantUserId,
                                participantConnectionId,
                            );

                            participantSocket.subscribe(
                                getOrganisationRoomTopic(organisationId, participantSocket.data.userId),
                            );
                            addRoomConnection(
                                organisationId,
                                participantSocket.data.userId,
                                participantUserId,
                                participantConnectionId,
                            );
                            participantSocket.data.activeRoomUserId = participantSocket.data.userId;
                            movedUserIds.add(participantSocket.data.userId);

                            participantSocket.send(
                                JSON.stringify({
                                    type: "room-joined",
                                    organisationId,
                                    roomUserId: participantSocket.data.userId,
                                }),
                            );
                        }
                    }

                    publishRoomParticipants(server, organisationId, activeRoomUserId);
                    for (const movedUserId of movedUserIds) {
                        publishRoomParticipants(server, organisationId, movedUserId);
                    }
                    publishOnlineUsers(server, organisationId);

                    return;
                }

                if (data.type !== "join-room") {
                    return;
                }

                if (isUserInCall(organisationId, userId)) {
                    ws.send(
                        JSON.stringify({
                            type: "room-error",
                            code: "IN_CALL",
                            message: "already in call",
                        }),
                    );
                    return;
                }

                const roomUserId = Number(data.roomUserId);
                if (!Number.isInteger(roomUserId) || roomUserId <= 0) {
                    ws.send(
                        JSON.stringify({
                            type: "room-error",
                            code: "INVALID_ROOM",
                            message: "invalid room",
                        }),
                    );
                    return;
                }

                const targetMember = await getOrganisationMemberRole(organisationId, roomUserId);
                if (!targetMember) {
                    ws.send(
                        JSON.stringify({
                            type: "room-error",
                            code: "FORBIDDEN_ROOM",
                            message: "forbidden room",
                        }),
                    );
                    return;
                }

                const previousRoomUserId = ws.data.activeRoomUserId;
                joinRoom(roomUserId);
                if (previousRoomUserId !== roomUserId) {
                    publishRoomJoin(server, organisationId, roomUserId, userId);
                }
            },
            close(ws) {
                const { organisationId, userId, connectionId, activeRoomUserId } = ws.data;
                socketConnections.delete(connectionId);
                removePresenceConnection(organisationId, userId, connectionId);
                publishOnlineUsers(server, organisationId);

                removeRoomConnection(organisationId, activeRoomUserId, userId, connectionId);
                publishRoomParticipants(server, organisationId, activeRoomUserId);
                publishOnlineUsers(server, organisationId);
            },
        },
    });
    registerRealtimePublisher((event) => {
        server.publish(getOrganisationPresenceTopic(event.organisationId), JSON.stringify(event));
    });

    console.log(`tnirps (sprint server) listening on ${server.url}`);
    await testDB();
    await initializeFreeModelsCache();
    startSessionCleanup();
};

main();
