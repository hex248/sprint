import {
    Issue,
    IssueAssignee,
    IssueComment,
    Organisation,
    OrganisationMember,
    Project,
    Sprint,
    TimedSession,
} from "@sprint/shared";
import { eq, inArray } from "drizzle-orm";
import { db } from "../client";

export async function exportOrganisation(organisationId: number) {
    const organisation = await db
        .select()
        .from(Organisation)
        .where(eq(Organisation.id, organisationId))
        .limit(1);
    if (!organisation[0]) return null;

    const orgData = organisation[0];

    // get members
    const members = await db
        .select()
        .from(OrganisationMember)
        .where(eq(OrganisationMember.organisationId, organisationId));

    // get projects
    const projects = await db.select().from(Project).where(eq(Project.organisationId, organisationId));

    const projectIds = projects.map((p) => p.id);

    // get sprints
    const sprints =
        projectIds.length > 0
            ? await db.select().from(Sprint).where(inArray(Sprint.projectId, projectIds))
            : [];

    // get issues
    const issues =
        projectIds.length > 0
            ? await db.select().from(Issue).where(inArray(Issue.projectId, projectIds))
            : [];

    const issueIds = issues.map((i) => i.id);

    // get issue assignees
    const issueAssignees =
        issueIds.length > 0
            ? await db.select().from(IssueAssignee).where(inArray(IssueAssignee.issueId, issueIds))
            : [];

    // get issue comments
    const issueComments =
        issueIds.length > 0
            ? await db.select().from(IssueComment).where(inArray(IssueComment.issueId, issueIds))
            : [];

    // get timed sessions - limited to issues in this org
    const timedSessions =
        issueIds.length > 0
            ? await db.select().from(TimedSession).where(inArray(TimedSession.issueId, issueIds))
            : [];

    return {
        organisation: orgData,
        members,
        projects,
        sprints,
        issues,
        issueAssignees,
        issueComments,
        timedSessions,
    };
}
