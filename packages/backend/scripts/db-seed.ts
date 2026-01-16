import "dotenv/config";
import { Issue, Organisation, OrganisationMember, Project, User } from "@sprint/shared";
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

async function seed() {
    console.log("seeding database with demo data...");

    try {
        const passwordHash = await hashPassword("a");

        // create 2 users
        console.log("creating users...");
        const users = await db
            .insert(User)
            .values([
                { name: "user 1", username: "u1", passwordHash, avatarURL: null },
                { name: "user 2", username: "u2", passwordHash, avatarURL: null },
            ])
            .returning();

        if (users.length < 2 || !users[0] || !users[1]) {
            throw new Error("failed to create users");
        }
        const [u1, u2] = users;

        console.log(`created ${users.length} users`);

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

        // create 3-6 issues per project
        console.log("creating issues...");
        const allUsers = [u1, u2];
        const issueValues = [];
        let issueIndex = 0;

        for (const project of projects) {
            const numIssues = Math.floor(Math.random() * 4) + 3; // 3-6 issues
            for (let i = 1; i <= numIssues; i++) {
                const creator = allUsers[Math.floor(Math.random() * allUsers.length)];
                if (!creator) {
                    throw new Error("failed to select issue creator");
                }
                const assignee =
                    Math.random() > 0.25 ? allUsers[Math.floor(Math.random() * allUsers.length)] : null;
                const issue = issues[issueIndex % issues.length];
                if (!issue) {
                    throw new Error("failed to select issue");
                }
                issueIndex++;

                issueValues.push({
                    projectId: project.id,
                    number: i,
                    title: issue.title,
                    description: issue.description,
                    creatorId: creator.id,
                    assigneeId: assignee?.id ?? null,
                });
            }
        }

        await db.insert(Issue).values(issueValues);

        console.log(`created ${issueValues.length} issues`);

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
