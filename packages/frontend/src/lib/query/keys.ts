// query key factory for granular cache invalidation

export const queryKeys = {
  organisations: {
    all: ["organisations"] as const,
    byUser: () => [...queryKeys.organisations.all, "by-user"] as const,
    members: (orgId: number) => [...queryKeys.organisations.all, orgId, "members"] as const,
    memberTimeTracking: (orgId: number, fromDate?: string) =>
      [...queryKeys.organisations.all, orgId, "member-time-tracking", fromDate ?? "all"] as const,
  },
  projects: {
    all: ["projects"] as const,
    byOrganisation: (orgId: number) => [...queryKeys.projects.all, "by-org", orgId] as const,
  },
  issues: {
    all: ["issues"] as const,
    byProject: (projectId: number) => [...queryKeys.issues.all, "by-project", projectId] as const,
    byId: (issueId: number) => [...queryKeys.issues.all, "by-id", issueId] as const,
    statusCount: (organisationId: number, status: string) =>
      [...queryKeys.issues.all, "status-count", organisationId, status] as const,
    typeCount: (organisationId: number, type: string) =>
      [...queryKeys.issues.all, "type-count", organisationId, type] as const,
  },
  issueComments: {
    all: ["issue-comments"] as const,
    byIssue: (issueId: number) => [...queryKeys.issueComments.all, "by-issue", issueId] as const,
  },
  sprints: {
    all: ["sprints"] as const,
    byProject: (projectId: number) => [...queryKeys.sprints.all, "by-project", projectId] as const,
  },
  timers: {
    all: ["timers"] as const,
    active: (issueId: number) => [...queryKeys.timers.all, "active", issueId] as const,
    inactive: (issueId: number) => [...queryKeys.timers.all, "inactive", issueId] as const,
    inactiveGlobal: () => [...queryKeys.timers.all, "inactive-global"] as const,
    list: () => [...queryKeys.timers.all, "list"] as const,
  },
  users: {
    all: ["users"] as const,
    byUsername: (username: string) => [...queryKeys.users.all, "by-username", username] as const,
  },
  subscription: {
    all: ["subscription"] as const,
    current: () => [...queryKeys.subscription.all, "current"] as const,
  },
};
