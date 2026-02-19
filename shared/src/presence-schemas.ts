import { z } from "zod";

const IdSchema = z.number().int().positive();

export const PresenceOnlineUsersMessageSchema = z.object({
    type: z.literal("online-users"),
    organisationId: IdSchema,
    userIds: z.array(IdSchema),
    inCallUserIds: z.array(IdSchema),
    inCallRoomOwnerUserIds: z.array(IdSchema),
});

export const RoomParticipantsMessageSchema = z.object({
    type: z.literal("room-participants"),
    organisationId: IdSchema,
    roomUserId: IdSchema,
    participantUserIds: z.array(IdSchema),
});

export const RoomJoinedMessageSchema = z.object({
    type: z.literal("room-joined"),
    organisationId: IdSchema,
    roomUserId: IdSchema,
});

export const RoomErrorCodeSchema = z.enum(["INVALID_ROOM", "FORBIDDEN_ROOM", "IN_CALL", "SIGNAL_INVALID"]);

export const RoomErrorMessageSchema = z.object({
    type: z.literal("room-error"),
    code: RoomErrorCodeSchema,
    message: z.string(),
});

export const RoomUserJoinedMessageSchema = z.object({
    type: z.literal("room-user-joined"),
    organisationId: IdSchema,
    roomUserId: IdSchema,
    userId: IdSchema,
});

export const IssueChangedActionSchema = z.enum(["created", "updated"]);

export const IssueChangedMessageSchema = z.object({
    type: z.literal("issue-changed"),
    organisationId: IdSchema,
    projectId: IdSchema,
    issueId: IdSchema,
    action: IssueChangedActionSchema,
    actorUserId: IdSchema,
});

export const PresenceServerToClientMessageSchema = z.discriminatedUnion("type", [
    PresenceOnlineUsersMessageSchema,
    RoomParticipantsMessageSchema,
    RoomJoinedMessageSchema,
    RoomErrorMessageSchema,
    RoomUserJoinedMessageSchema,
    IssueChangedMessageSchema,
]);

export const ClientRoomJoinMessageSchema = z.object({
    type: z.literal("join-room"),
    roomUserId: IdSchema,
});

export const ClientRoomLeaveMessageSchema = z.object({
    type: z.literal("leave-room"),
});

export const ClientRoomEndMessageSchema = z.object({
    type: z.literal("end-room"),
});

export const ClientRoomMessageSchema = z.discriminatedUnion("type", [
    ClientRoomJoinMessageSchema,
    ClientRoomLeaveMessageSchema,
    ClientRoomEndMessageSchema,
]);

export type IssueChangedMessage = z.infer<typeof IssueChangedMessageSchema>;
export type PresenceServerToClientMessage = z.infer<typeof PresenceServerToClientMessageSchema>;
export type ClientRoomMessage = z.infer<typeof ClientRoomMessageSchema>;
