import { useMemo } from "react";
import { useSelection } from "@/components/selection-provider";
import { useIssues } from "@/lib/query/hooks/issues";
import { useOrganisations } from "@/lib/query/hooks/organisations";
import { useProjects } from "@/lib/query/hooks/projects";

export function useSelectedOrganisation() {
  const { selectedOrganisationId } = useSelection();
  const { data: organisations = [] } = useOrganisations();

  return useMemo(
    () => organisations.find((org) => org.Organisation.id === selectedOrganisationId) ?? null,
    [organisations, selectedOrganisationId],
  );
}

export function useSelectedProject() {
  const { selectedOrganisationId, selectedProjectId } = useSelection();
  const { data: projects = [] } = useProjects(selectedOrganisationId);

  return useMemo(
    () => projects.find((project) => project.Project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );
}

export function useSelectedIssue() {
  const { selectedProjectId, selectedIssueId } = useSelection();
  const { data: issues = [] } = useIssues(selectedProjectId);

  return useMemo(
    () => issues.find((issue) => issue.Issue.id === selectedIssueId) ?? null,
    [issues, selectedIssueId],
  );
}
