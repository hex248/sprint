import { z } from "zod";

const PositiveInt = z.number().int().positive();

export const RtcIceCandidateSchema = z
    .object({
        candidate: z.string().min(1).max(4096),
        sdpMid: z.string().nullable().optional(),
        sdpMLineIndex: z.number().int().nullable().optional(),
        usernameFragment: z.string().nullable().optional(),
    })
    .strict();

export type RtcIceCandidate = z.infer<typeof RtcIceCandidateSchema>;

const SdpSchema = z.string().min(1).max(100_000);

export const RtcClientToServerMessageSchema = z.discriminatedUnion("type", [
    z
        .object({
            type: z.literal("webrtc-offer"),
            roomUserId: PositiveInt,
            targetUserId: PositiveInt,
            sdp: SdpSchema,
        })
        .strict(),
    z
        .object({
            type: z.literal("webrtc-answer"),
            roomUserId: PositiveInt,
            targetUserId: PositiveInt,
            sdp: SdpSchema,
        })
        .strict(),
    z
        .object({
            type: z.literal("webrtc-ice-candidate"),
            roomUserId: PositiveInt,
            targetUserId: PositiveInt,
            candidate: RtcIceCandidateSchema,
        })
        .strict(),
    z
        .object({
            type: z.literal("webrtc-peer-state"),
            roomUserId: PositiveInt,
            muted: z.boolean(),
            speaking: z.boolean().optional(),
        })
        .strict(),
]);

export type RtcClientToServerMessage = z.infer<typeof RtcClientToServerMessageSchema>;

export const RtcServerToClientMessageSchema = z.discriminatedUnion("type", [
    z
        .object({
            type: z.literal("webrtc-offer"),
            organisationId: PositiveInt,
            roomUserId: PositiveInt,
            fromUserId: PositiveInt,
            sdp: SdpSchema,
        })
        .strict(),
    z
        .object({
            type: z.literal("webrtc-answer"),
            organisationId: PositiveInt,
            roomUserId: PositiveInt,
            fromUserId: PositiveInt,
            sdp: SdpSchema,
        })
        .strict(),
    z
        .object({
            type: z.literal("webrtc-ice-candidate"),
            organisationId: PositiveInt,
            roomUserId: PositiveInt,
            fromUserId: PositiveInt,
            candidate: RtcIceCandidateSchema,
        })
        .strict(),
    z
        .object({
            type: z.literal("webrtc-peer-state"),
            organisationId: PositiveInt,
            roomUserId: PositiveInt,
            fromUserId: PositiveInt,
            muted: z.boolean(),
            speaking: z.boolean().optional(),
        })
        .strict(),
]);

export type RtcServerToClientMessage = z.infer<typeof RtcServerToClientMessageSchema>;
