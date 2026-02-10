export type IssueRef = {
    projectKey: string;
    issueNumber: number;
};

export const parseIssueRef = (input: string): IssueRef | null => {
    const match = input.trim().match(/^([A-Za-z]{1,10})-(\d{1,8})$/);
    if (!match) return null;

    const projectKey = match[1]?.toUpperCase();
    const issueNumber = Number.parseInt(match[2] ?? "", 10);
    if (!projectKey || Number.isNaN(issueNumber)) return null;

    return {
        projectKey,
        issueNumber,
    };
};

export const issueRefToString = (projectKey: string, issueNumber: number) => `${projectKey}-${issueNumber}`;
