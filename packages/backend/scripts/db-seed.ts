import "dotenv/config";
import {
    DEFAULT_ISSUE_TYPES,
    DEFAULT_STATUS_COLOURS,
    Issue,
    IssueAssignee,
    IssueComment,
    Organisation,
    OrganisationMember,
    Project,
    Sprint,
    User,
} from "@sprint/shared";
import bcrypt from "bcrypt";
import { drizzle } from "drizzle-orm/node-postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
}

const db = drizzle({
    connection: {
        connectionString: DATABASE_URL,
    },
});

const hashPassword = (password: string) => bcrypt.hash(password, 10);

const issues = [
    {
        title: "Fix login redirect loop",
        description: "Users are getting stuck in a redirect loop after login.",
    },
    {
        title: "Add pagination to user list",
        description: "The user list loads all users at once, causing slow performance.",
    },
    { title: "Update dependencies", description: "Several packages have security updates available." },
    { title: "Refactor auth middleware", description: "Current implementation is hard to maintain." },
    { title: "Add unit tests for payments", description: "Payment service has no test coverage." },
    {
        title: "Fix memory leak in websocket",
        description: "Memory usage grows over time with active connections.",
    },
    { title: "Implement password reset", description: "Users currently can't reset forgotten passwords." },
    { title: "Add API response caching", description: "Frequently accessed endpoints should be cached." },
    { title: "Fix date formatting", description: "Dates display incorrectly in some timezones." },
    { title: "Add CSV export", description: "Users want to export their data to CSV." },
    { title: "Improve form validation errors", description: "Error messages are not clear enough." },
    { title: "Fix race condition in queue", description: "Jobs occasionally process twice." },
    { title: "Add dark mode", description: "Users have requested a dark theme option." },
    { title: "Optimize dashboard queries", description: "Dashboard takes too long to load." },
    { title: "Fix image uploads on Safari", description: "Upload fails silently on Safari browsers." },
    { title: "Add rate limiting", description: "API endpoints need protection from abuse." },
    { title: "Implement activity logging", description: "Need to track user actions for audit purposes." },
    { title: "Fix timezone handling", description: "Scheduled tasks run at wrong times." },
    { title: "Add admin search", description: "Admin panel needs search functionality." },
    { title: "Refactor billing code", description: "Legacy billing code needs cleanup." },
    { title: "Fix email templates", description: "Some email clients render templates incorrectly." },
    { title: "Add webhook retries", description: "Failed webhooks should retry automatically." },
    { title: "Improve loading states", description: "Users don't know when content is loading." },
    { title: "Fix notification settings", description: "Preference changes don't persist." },
    { title: "Add bulk delete", description: "Users want to delete multiple items at once." },
    { title: "Fix SSO integration", description: "SSO login fails intermittently." },
    { title: "Add two-factor auth", description: "Security requirement for enterprise users." },
    { title: "Fix scroll position", description: "Page scrolls to top on navigation." },
    { title: "Implement lazy loading", description: "Images should load as user scrolls." },
    { title: "Add audit logging", description: "Need to log sensitive operations." },
    { title: "Fix PDF export timeout", description: "Large reports timeout during export." },
    { title: "Add keyboard shortcuts", description: "Power users want keyboard navigation." },
    { title: "Fix mobile layout", description: "Layout breaks on small screens." },
    { title: "Add file preview", description: "Users want to preview files before download." },
    { title: "Fix session expiry", description: "Users get logged out unexpectedly." },
    { title: "Add batch processing", description: "Need to process large datasets efficiently." },
];

const issueStatuses = Object.keys(DEFAULT_STATUS_COLOURS);
const issueTypes = Object.keys(DEFAULT_ISSUE_TYPES);

const issueComments = [
    "started looking into this, will share updates soon",
    "i can reproduce this on staging",
    "adding details in the description",
    "should be a small fix, pairing with u2",
    "blocked on api response shape",
    "added logs, issue still happening",
    "fix is ready for review",
    "can we confirm expected behavior?",
    "this seems related to recent deploy",
    "i will take this one",
    "qa verified on latest build",
    "needs product input before proceeding",
];

const passwordHash = await hashPassword("a");
const users = [
    { name: "user 1", username: "u1", email: "user1@example.com", passwordHash, avatarURL: null },
    { name: "user 2", username: "u2", email: "user2@example.com", passwordHash, avatarURL: null },
    // anything past here is just to have more users to assign issues to
    { name: "user 3", username: "u3", email: "user3@example.com", passwordHash, avatarURL: null },
    { name: "user 4", username: "u4", email: "user4@example.com", passwordHash, avatarURL: null },
    { name: "user 5", username: "u5", email: "user5@example.com", passwordHash, avatarURL: null },
    { name: "user 6", username: "u6", email: "user6@example.com", passwordHash, avatarURL: null },
    { name: "user 7", username: "u7", email: "user7@example.com", passwordHash, avatarURL: null },
    { name: "user 8", username: "u8", email: "user8@example.com", passwordHash, avatarURL: null },
];

async function seed() {
    console.log("seeding database with demo data...");

    try {
        // create 2 users
        console.log("creating users...");
        const usersDB = await db.insert(User).values(users).returning();

        if (users.length < 2 || !usersDB[0] || !usersDB[1]) {
            throw new Error("failed to create users");
        }
        const [u1, u2] = [usersDB[0], usersDB[1]];

        console.log(`created ${usersDB.length} users`);

        // create 2 orgs per user (4 total)
        console.log("creating organisations...");
        const orgs = await db
            .insert(Organisation)
            .values([
                { name: "Acme Corp", slug: "acme", description: "Enterprise software solutions" },
                { name: "Startup Labs", slug: "startup-labs", description: "Innovation hub" },
                { name: "Tech Solutions", slug: "tech-solutions", description: "IT consulting services" },
                { name: "Digital Agency", slug: "digital-agency", description: "Web and mobile development" },
            ])
            .returning();

        const [acme, startupLabs, techSolutions, digitalAgency] = orgs;
        if (!acme || !startupLabs || !techSolutions || !digitalAgency) {
            throw new Error("failed to create organisations");
        }

        console.log(`created ${orgs.length} organisations`);

        // add members to organisations (both users are members of all orgs)
        console.log("adding organisation members...");
        await db.insert(OrganisationMember).values([
            { organisationId: acme.id, userId: u1.id, role: "owner" },
            { organisationId: acme.id, userId: u2.id, role: "member" },
            { organisationId: startupLabs.id, userId: u1.id, role: "owner" },
            { organisationId: startupLabs.id, userId: u2.id, role: "member" },
            { organisationId: techSolutions.id, userId: u2.id, role: "owner" },
            { organisationId: techSolutions.id, userId: u1.id, role: "member" },
            { organisationId: digitalAgency.id, userId: u2.id, role: "owner" },
            { organisationId: digitalAgency.id, userId: u1.id, role: "member" },
        ]);

        console.log("added organisation members");

        // create 2 projects per org (8 total)
        console.log("creating projects...");
        const projects = await db
            .insert(Project)
            .values([
                { key: "WEB", name: "Website Redesign", organisationId: acme.id, creatorId: u1.id },
                { key: "API", name: "API Platform", organisationId: acme.id, creatorId: u1.id },
                { key: "APP", name: "Mobile App", organisationId: startupLabs.id, creatorId: u1.id },
                { key: "DASH", name: "Dashboard", organisationId: startupLabs.id, creatorId: u1.id },
                { key: "CRM", name: "CRM System", organisationId: techSolutions.id, creatorId: u2.id },
                { key: "ERP", name: "ERP Module", organisationId: techSolutions.id, creatorId: u2.id },
                { key: "SHOP", name: "E-commerce Site", organisationId: digitalAgency.id, creatorId: u2.id },
                { key: "CMS", name: "Content Platform", organisationId: digitalAgency.id, creatorId: u2.id },
            ])
            .returning();

        console.log(`created ${projects.length} projects`);

        console.log("creating sprints...");
        const sprintValues = [];
        const now = new Date();

        for (const project of projects) {
            sprintValues.push(
                {
                    projectId: project.id,
                    name: "Sprint 1",
                    color: "#3b82f6",
                    startDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
                    endDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
                },
                {
                    projectId: project.id,
                    name: "Sprint 2",
                    color: "#22c55e",
                    startDate: new Date(now.getTime()),
                    endDate: new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000),
                },
            );
        }

        const createdSprints = await db.insert(Sprint).values(sprintValues).returning();
        const sprintsByProject = new Map<number, (typeof createdSprints)[number][]>();

        for (const sprint of createdSprints) {
            const list = sprintsByProject.get(sprint.projectId) ?? [];
            list.push(sprint);
            sprintsByProject.set(sprint.projectId, list);
        }

        console.log(`created ${createdSprints.length} sprints`);

        // create 6-12 issues per project
        console.log("creating issues...");
        const allUsers = [u1, u2];
        const issueValues = [];
        let issueIndex = 0;

        for (const project of projects) {
            const numIssues = Math.floor(Math.random() * 7) + 6; // 6-12 issues
            for (let i = 1; i <= numIssues; i++) {
                const creator = allUsers[Math.floor(Math.random() * allUsers.length)];
                if (!creator) {
                    throw new Error("failed to select issue creator");
                }
                const issue = issues[issueIndex % issues.length];
                if (!issue) {
                    throw new Error("failed to select issue");
                }
                issueIndex++;
                const status = issueStatuses[Math.floor(Math.random() * issueStatuses.length)];
                const type = issueTypes[Math.floor(Math.random() * issueTypes.length)];
                if (!status || !type) {
                    throw new Error("failed to select issue status or type");
                }
                const projectSprints = sprintsByProject.get(project.id);
                if (!projectSprints || projectSprints.length === 0) {
                    throw new Error("failed to select project sprint");
                }
                const sprint = projectSprints[Math.floor(Math.random() * projectSprints.length)];
                if (!sprint) {
                    throw new Error("failed to select sprint");
                }

                issueValues.push({
                    projectId: project.id,
                    number: i,
                    title: issue.title,
                    description: issue.description,
                    status,
                    type,
                    creatorId: creator.id,
                    sprintId: sprint.id,
                });
            }
        }

        const createdIssues = await db.insert(Issue).values(issueValues).returning();

        console.log(`created ${createdIssues.length} issues`);

        console.log("creating issue assignees...");
        const assigneeValues = [];

        for (const issue of createdIssues) {
            const assigneeCount = Math.floor(Math.random() * 3);
            const picked = new Set<number>();
            for (let i = 0; i < assigneeCount; i++) {
                const assignee = usersDB[Math.floor(Math.random() * usersDB.length)];
                if (!assignee) {
                    throw new Error("failed to select issue assignee");
                }
                if (picked.has(assignee.id)) {
                    continue;
                }
                picked.add(assignee.id);
                assigneeValues.push({
                    issueId: issue.id,
                    userId: assignee.id,
                });
            }
        }

        if (assigneeValues.length > 0) {
            await db.insert(IssueAssignee).values(assigneeValues);
        }

        console.log(`created ${assigneeValues.length} issue assignees`);

        console.log("creating issue comments...");
        const commentValues = [];

        for (const issue of createdIssues) {
            const commentCount = Math.floor(Math.random() * 3);
            for (let i = 0; i < commentCount; i++) {
                const commenter = usersDB[Math.floor(Math.random() * usersDB.length)];
                const comment = issueComments[Math.floor(Math.random() * issueComments.length)];
                if (!commenter || !comment) {
                    throw new Error("failed to select issue comment data");
                }
                commentValues.push({
                    issueId: issue.id,
                    userId: commenter.id,
                    body: comment,
                });
            }
        }

        if (commentValues.length > 0) {
            await db.insert(IssueComment).values(commentValues);
        }

        console.log(`created ${commentValues.length} issue comments`);

        console.log("database seeding complete");
        console.log("\ndemo accounts (password: a):");
        console.log("  - u1");
        console.log("  - u2");
    } catch (error) {
        console.error("failed to seed database:", error);
        process.exit(1);
    }

    process.exit(0);
}

seed();
