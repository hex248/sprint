import { CliLoginCode } from "@sprint/shared";
import { and, eq } from "drizzle-orm";
import { db } from "../client";

export async function createCliLoginCode(input: {
    deviceCodeHash: string;
    userCodeHash: string;
    pollIntervalSeconds: number;
    expiresAt: Date;
}) {
    const [code] = await db
        .insert(CliLoginCode)
        .values({
            deviceCodeHash: input.deviceCodeHash,
            userCodeHash: input.userCodeHash,
            pollIntervalSeconds: input.pollIntervalSeconds,
            expiresAt: input.expiresAt,
            status: "pending",
        })
        .returning();

    return code;
}

export async function getCliLoginCodeByDeviceHash(deviceCodeHash: string) {
    const [code] = await db
        .select()
        .from(CliLoginCode)
        .where(eq(CliLoginCode.deviceCodeHash, deviceCodeHash));
    return code;
}

export async function getCliLoginCodeByUserHash(userCodeHash: string) {
    const [code] = await db.select().from(CliLoginCode).where(eq(CliLoginCode.userCodeHash, userCodeHash));
    return code;
}

export async function touchCliLoginCodePoll(id: number) {
    await db.update(CliLoginCode).set({ lastPolledAt: new Date() }).where(eq(CliLoginCode.id, id));
}

export async function approveCliLoginCode(id: number, approvedByUserId: number, sessionId: number) {
    const [code] = await db
        .update(CliLoginCode)
        .set({
            status: "approved",
            approvedByUserId,
            sessionId,
            approvedAt: new Date(),
        })
        .where(and(eq(CliLoginCode.id, id), eq(CliLoginCode.status, "pending")))
        .returning();

    return code;
}

export async function expireCliLoginCode(id: number) {
    await db.update(CliLoginCode).set({ status: "expired" }).where(eq(CliLoginCode.id, id));
}
