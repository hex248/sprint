import { Organisation, OrganisationMember, User } from "@sprint/shared";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../client";

export async function createOrganisation(name: string, slug: string, description?: string) {
    const [organisation] = await db
        .insert(Organisation)
        .values({
            name,
            slug,
            description,
        })
        .returning();
    return organisation;
}

export async function createOrganisationMember(
    organisationId: number,
    userId: number,
    role: string = "member",
) {
    const [member] = await db
        .insert(OrganisationMember)
        .values({
            organisationId,
            userId,
            role,
        })
        .returning();
    return member;
}

export async function createOrganisationWithOwner(
    name: string,
    slug: string,
    userId: number,
    description?: string,
) {
    return await db.transaction(async (tx) => {
        const [org] = await tx
            .insert(Organisation)
            .values({
                name,
                slug,
                description,
            })
            .returning();

        if (!org) {
            throw new Error("failed to create organisation");
        }

        await tx.insert(OrganisationMember).values({
            organisationId: org.id,
            userId,
            role: "owner",
        });

        return org;
    });
}

export async function getOrganisationById(id: number) {
    const [organisation] = await db.select().from(Organisation).where(eq(Organisation.id, id));
    return organisation;
}

export async function getOrganisationBySlug(slug: string) {
    const [organisation] = await db.select().from(Organisation).where(eq(Organisation.slug, slug));
    return organisation;
}

export async function getOrganisationsByUserId(userId: number) {
    const organisations = await db
        .select()
        .from(OrganisationMember)
        .where(eq(OrganisationMember.userId, userId))
        .innerJoin(Organisation, eq(OrganisationMember.organisationId, Organisation.id));
    return organisations;
}

export async function updateOrganisation(
    organisationId: number,
    updates: {
        name?: string;
        description?: string;
        slug?: string;
        iconURL?: string | null;
        statuses?: Record<string, string>;
        features?: Record<string, boolean>;
        issueTypes?: Record<string, { icon: string; color: string }>;
    },
) {
    const [organisation] = await db
        .update(Organisation)
        .set(updates)
        .where(eq(Organisation.id, organisationId))
        .returning();
    return organisation;
}

export async function deleteOrganisation(organisationId: number) {
    // Delete all organisation members first
    await db.delete(OrganisationMember).where(eq(OrganisationMember.organisationId, organisationId));
    // Delete the organisation
    await db.delete(Organisation).where(eq(Organisation.id, organisationId));
}

export async function getOrganisationMembers(organisationId: number) {
    const members = await db
        .select()
        .from(OrganisationMember)
        .where(eq(OrganisationMember.organisationId, organisationId))
        .innerJoin(Organisation, eq(OrganisationMember.organisationId, Organisation.id))
        .innerJoin(User, eq(OrganisationMember.userId, User.id));
    return members;
}

export async function getOrganisationMemberRole(organisationId: number, userId: number) {
    const [member] = await db
        .select()
        .from(OrganisationMember)
        .where(
            and(eq(OrganisationMember.organisationId, organisationId), eq(OrganisationMember.userId, userId)),
        );
    return member;
}

export async function removeOrganisationMember(organisationId: number, userId: number) {
    await db
        .delete(OrganisationMember)
        .where(
            and(eq(OrganisationMember.organisationId, organisationId), eq(OrganisationMember.userId, userId)),
        );
}

export async function updateOrganisationMemberRole(organisationId: number, userId: number, role: string) {
    const [member] = await db
        .update(OrganisationMember)
        .set({ role })
        .where(
            and(eq(OrganisationMember.organisationId, organisationId), eq(OrganisationMember.userId, userId)),
        )
        .returning();
    return member;
}

export async function getUserOrganisationCount(userId: number): Promise<number> {
    const [result] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(OrganisationMember)
        .where(eq(OrganisationMember.userId, userId));
    return result?.count ?? 0;
}

export async function getOrganisationOwner(organisationId: number) {
    const [owner] = await db
        .select({ userId: OrganisationMember.userId })
        .from(OrganisationMember)
        .where(
            and(eq(OrganisationMember.organisationId, organisationId), eq(OrganisationMember.role, "owner")),
        );
    return owner;
}
