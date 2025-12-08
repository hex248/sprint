import { eq } from "drizzle-orm";
import { db } from "../client";
import { User } from "../schema";

export async function createUser(name: string, username: string) {
    const [user] = await db.insert(User).values({ name, username }).returning();
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
