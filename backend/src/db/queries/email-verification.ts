import { EmailVerification, type EmailVerificationRecord, User } from "@sprint/shared";
import { eq, lt, sql } from "drizzle-orm";
import { db } from "../client";

const CODE_EXPIRY_MINUTES = 15;
const MAX_ATTEMPTS = 5;

export function generateVerificationCode(): string {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);

    // 6 digit
    const code = ((bytes[0] ?? 0) * 256 * 256 + (bytes[1] ?? 0) * 256 + (bytes[2] ?? 0)) % 1000000;
    return code.toString().padStart(6, "0");
}

export async function createVerificationCode(userId: number): Promise<EmailVerificationRecord> {
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

    // delete existing codes for the user
    await db.delete(EmailVerification).where(eq(EmailVerification.userId, userId));

    const [verification] = await db
        .insert(EmailVerification)
        .values({
            userId,
            code,
            expiresAt,
            attempts: 0,
            maxAttempts: MAX_ATTEMPTS,
        })
        .returning();

    if (!verification) {
        throw new Error("Failed to create verification code");
    }

    return verification;
}

export async function getVerificationByUserId(userId: number): Promise<EmailVerificationRecord | undefined> {
    const [verification] = await db
        .select()
        .from(EmailVerification)
        .where(eq(EmailVerification.userId, userId));
    return verification;
}

export async function incrementAttempts(id: number): Promise<void> {
    await db
        .update(EmailVerification)
        .set({
            attempts: sql`CASE WHEN ${EmailVerification.attempts} IS NULL THEN 1 ELSE ${EmailVerification.attempts} + 1 END`,
        })
        .where(eq(EmailVerification.id, id));
}

export async function markAsVerified(id: number): Promise<void> {
    await db.update(EmailVerification).set({ verifiedAt: new Date() }).where(eq(EmailVerification.id, id));
}

export async function deleteVerification(id: number): Promise<void> {
    await db.delete(EmailVerification).where(eq(EmailVerification.id, id));
}

export async function deleteUserVerifications(userId: number): Promise<void> {
    await db.delete(EmailVerification).where(eq(EmailVerification.userId, userId));
}

export async function cleanupExpiredVerifications(): Promise<number> {
    const result = await db.delete(EmailVerification).where(lt(EmailVerification.expiresAt, new Date()));
    return result.rowCount ?? 0;
}

export async function verifyCode(
    userId: number,
    code: string,
): Promise<{ success: boolean; error?: string }> {
    const verification = await getVerificationByUserId(userId);

    if (!verification) {
        return { success: false, error: "No verification code found" };
    }

    if (verification.verifiedAt) {
        return { success: false, error: "Email already verified" };
    }

    if (new Date() > verification.expiresAt) {
        await deleteVerification(verification.id);
        return { success: false, error: "Verification code expired" };
    }

    if (verification.attempts >= verification.maxAttempts) {
        await deleteVerification(verification.id);
        return { success: false, error: "Too many attempts. Please request a new code." };
    }

    if (verification.code !== code) {
        await db
            .update(EmailVerification)
            .set({ attempts: verification.attempts + 1 })
            .where(eq(EmailVerification.id, verification.id));

        const remainingAttempts = verification.maxAttempts - (verification.attempts + 1);
        return {
            success: false,
            error: `Invalid code. ${remainingAttempts} attempts remaining.`,
        };
    }

    await db
        .update(User)
        .set({ emailVerified: true, emailVerifiedAt: new Date() })
        .where(eq(User.id, userId));

    await deleteVerification(verification.id);

    return { success: true };
}
