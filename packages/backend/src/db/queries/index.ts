export * from "./email-verification";
export * from "./issue-comments";
export * from "./issues";
export * from "./organisations";
export * from "./projects";
export * from "./sessions";
export * from "./sprints";
export * from "./subscriptions";
export * from "./timed-sessions";
export * from "./users";

// free tier limits
export const FREE_TIER_LIMITS = {
    organisationsPerUser: 1,
    projectsPerOrganisation: 1,
    issuesPerOrganisation: 100,
    membersPerOrganisation: 5,
    sprintsPerProject: 5,
} as const;
