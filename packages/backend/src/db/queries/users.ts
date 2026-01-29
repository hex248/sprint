import { type IconStyle, User, type UserRecord } from "@sprint/shared";
import { eq } from "drizzle-orm";
import { db } from "../client";

export async function createUser(
    name: string,
    username: string,
    email: string,
    passwordHash: string,
    avatarURL?: string | null,
) {
    const [user] = await db
        .insert(User)
        .values({ name, username, email, passwordHash, avatarURL })
        .returning();
    return user;
}

export async function getUserById(id: number) {
    const [user] = await db.select().from(User).where(eq(User.id, id));
    return user;
}

export async function getUserByUsername(username: string) {
    const [user] = await db.select().from(User).where(eq(User.username, username));
    return user;
}

export async function getUserByEmail(email: string) {
    const [user] = await db.select().from(User).where(eq(User.email, email));
    return user;
}

export async function updateById(
    id: number,
    updates: {
        name?: string;
        passwordHash?: string;
        avatarURL?: string | null;
        iconPreference?: IconStyle;
        plan?: string;
    },
): Promise<UserRecord | undefined> {
    const [user] = await db.update(User).set(updates).where(eq(User.id, id)).returning();
    return user;
}

export async function updateUser(id: number, updates: { plan?: string }) {
    const [user] = await db.update(User).set(updates).where(eq(User.id, id)).returning();
    return user;
}
