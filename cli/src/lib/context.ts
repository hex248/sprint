import type { IssueResponse, OrganisationResponse, ProjectResponse } from "@sprint/shared";
import { getIssuesByProject, getOrganisations, getProjectsByOrganisation } from "./api";
import type { CliConfig } from "./config";
import { parseIssueRef } from "./issue-ref";

const sameText = (a: string, b: string) => a.toUpperCase() === b.toUpperCase();

export const resolveOrganisation = async (
    config: CliConfig,
    slug = config.currentOrgSlug,
): Promise<OrganisationResponse> => {
    if (!slug) {
        throw new Error("No org selected. Run: sprint org <org-slug>");
    }

    const organisations = await getOrganisations(config);
    const organisation = organisations.find((entry) => sameText(entry.Organisation.slug, slug));
    if (!organisation) {
        throw new Error(`Organisation not found: ${slug}`);
    }

    return organisation;
};

export const resolveProject = async (
    config: CliConfig,
    organisationId: number,
    key = config.currentProjectKey,
): Promise<ProjectResponse> => {
    if (!key) {
        throw new Error("No project selected. Run: sprint project");
    }

    const projects = await getProjectsByOrganisation(config, organisationId);
    const project = projects.find((entry) => sameText(entry.Project.key, key));
    if (!project) {
        throw new Error(`Project not found in selected org: ${key}`);
    }

    return project;
};

export const resolveIssueByRef = async (
    config: CliConfig,
    issueRefInput: string,
): Promise<{ project: ProjectResponse; issue: IssueResponse }> => {
    const issueRef = parseIssueRef(issueRefInput);
    if (!issueRef) {
        throw new Error(`Invalid issue reference: ${issueRefInput}. Expected format: ABC-123`);
    }

    const organisation = await resolveOrganisation(config);
    const project = await resolveProject(config, organisation.Organisation.id, issueRef.projectKey);
    const issues = await getIssuesByProject(config, project.Project.id);

    const issue = issues.find((entry) => entry.Issue.number === issueRef.issueNumber);
    if (!issue) {
        throw new Error(`Issue not found: ${issueRef.projectKey}-${issueRef.issueNumber}`);
    }

    return { project, issue };
};

export const getProjectIssues = async (
    config: CliConfig,
): Promise<{ project: ProjectResponse; issues: IssueResponse[] }> => {
    const organisation = await resolveOrganisation(config);
    const project = await resolveProject(config, organisation.Organisation.id);
    const issues = await getIssuesByProject(config, project.Project.id);
    return { project, issues };
};
