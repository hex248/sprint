import { useMemo } from "react";
import { IssueDetails } from "@/components/issue-details";
import { useSelection } from "@/components/selection-provider";
import {
  useOrganisationMembers,
  useSelectedIssue,
  useSelectedOrganisation,
  useSelectedProject,
  useSprints,
} from "@/lib/query/hooks";

export function IssueDetailPane() {
  const { selectIssue } = useSelection();
  const selectedOrganisation = useSelectedOrganisation();
  const selectedProject = useSelectedProject();
  const issueData = useSelectedIssue();
  const { data: sprints = [] } = useSprints(selectedProject?.Project.id);
  const { data: membersData = [] } = useOrganisationMembers(selectedOrganisation?.Organisation.id);

  const members = useMemo(() => membersData.map((member) => member.User), [membersData]);
  const statuses = selectedOrganisation?.Organisation.statuses ?? {};

  if (!issueData || !selectedProject || !selectedOrganisation) {
    return null;
  }

  return (
    <IssueDetails
      issueData={issueData}
      projectKey={selectedProject.Project.key}
      sprints={sprints}
      members={members}
      statuses={statuses}
      onClose={() => selectIssue(null)}
      onDelete={() => selectIssue(null)}
    />
  );
}
