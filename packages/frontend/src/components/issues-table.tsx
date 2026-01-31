import { useEffect, useMemo } from "react";
import Avatar from "@/components/avatar";
import { useSelection } from "@/components/selection-provider";
import StatusTag from "@/components/status-tag";
import Icon, { type IconName } from "@/components/ui/icon";
import { useIssues, useSelectedOrganisation, useSelectedProject } from "@/lib/query/hooks";
import { cn } from "@/lib/utils";

export type IssuesTableFilters = {
  query: string;
  statuses: string[];
  types: string[];
  assignees: string[];
  sprintId: "all" | "none" | number;
  sort: "newest" | "oldest" | "title-asc" | "title-desc" | "status";
};

export const defaultIssuesTableFilters: IssuesTableFilters = {
  query: "",
  statuses: [],
  types: [],
  assignees: [],
  sprintId: "all",
  sort: "newest",
};

export function IssuesTable({
  columns = {},
  className,
  filters,
  highlighted,
}: {
  columns?: { id?: boolean; title?: boolean; description?: boolean; status?: boolean; assignee?: boolean };
  className: string;
  filters?: IssuesTableFilters;
  highlighted?: number[];
}) {
  const { selectedProjectId, selectedIssueId, selectIssue } = useSelection();
  const { data: issuesData = [] } = useIssues(selectedProjectId);
  const selectedOrganisation = useSelectedOrganisation();
  const selectedProject = useSelectedProject();
  const statuses = selectedOrganisation?.Organisation.statuses ?? {};
  const issueTypes = (selectedOrganisation?.Organisation.issueTypes ?? {}) as Record<
    string,
    { icon: string; color: string }
  >;

  const issues = useMemo(() => {
    const query = filters?.query?.trim().toLowerCase() ?? "";
    const queryIsNumber = query !== "" && /^[0-9]+$/.test(query);
    const statusSet = new Set(filters?.statuses ?? []);
    const typeSet = new Set(filters?.types ?? []);
    const assigneeFilters = filters?.assignees ?? [];
    const includeUnassigned = assigneeFilters.includes("unassigned");
    const assigneeIds = new Set(
      assigneeFilters
        .filter((assignee) => assignee !== "unassigned")
        .map((assignee) => Number.parseInt(assignee, 10))
        .filter((assigneeId) => !Number.isNaN(assigneeId)),
    );
    const sprintFilter = filters?.sprintId ?? "all";
    const sort = filters?.sort ?? "newest";

    let next = [...issuesData];

    if (query) {
      next = next.filter((issueData) => {
        const title = issueData.Issue.title.toLowerCase();
        const description = issueData.Issue.description.toLowerCase();
        const matchesText = title.includes(query) || description.includes(query);
        if (matchesText) return true;
        if (queryIsNumber) {
          return issueData.Issue.number.toString().includes(query);
        }
        return false;
      });
    }

    if (statusSet.size > 0) {
      next = next.filter((issueData) => statusSet.has(issueData.Issue.status));
    }

    if (typeSet.size > 0) {
      next = next.filter((issueData) => typeSet.has(issueData.Issue.type));
    }

    if (assigneeFilters.length > 0) {
      next = next.filter((issueData) => {
        const hasAssignees = issueData.Assignees && issueData.Assignees.length > 0;
        const matchesAssigned =
          hasAssignees && issueData.Assignees.some((assignee) => assigneeIds.has(assignee.id));
        const matchesUnassigned = includeUnassigned && !hasAssignees;
        return matchesAssigned || matchesUnassigned;
      });
    }

    if (sprintFilter !== "all") {
      if (sprintFilter === "none") {
        next = next.filter((issueData) => issueData.Issue.sprintId == null);
      } else {
        next = next.filter((issueData) => issueData.Issue.sprintId === sprintFilter);
      }
    }

    switch (sort) {
      case "oldest":
        next.sort((a, b) => a.Issue.number - b.Issue.number);
        break;
      case "title-asc":
        next.sort((a, b) => a.Issue.title.localeCompare(b.Issue.title));
        break;
      case "title-desc":
        next.sort((a, b) => b.Issue.title.localeCompare(a.Issue.title));
        break;
      case "status":
        next.sort((a, b) => a.Issue.status.localeCompare(b.Issue.status));
        break;
      default:
        next.sort((a, b) => b.Issue.number - a.Issue.number);
        break;
    }

    return next;
  }, [issuesData, filters]);

  useEffect(() => {
    if (selectedIssueId == null) return;
    const isVisible = issues.some((issueData) => issueData.Issue.id === selectedIssueId);
    if (!isVisible) {
      selectIssue(null);
    }
  }, [issues, selectedIssueId, selectIssue]);

  const getIssueUrl = (issueNumber: number) => {
    if (!selectedOrganisation || !selectedProject) return "#";
    const params = new URLSearchParams();
    params.set("o", selectedOrganisation.Organisation.slug.toLowerCase());
    params.set("p", selectedProject.Project.key.toLowerCase());
    params.set("i", issueNumber.toString());
    return `/issues?${params.toString()}`;
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) {
      e.stopPropagation();
      return;
    }
    e.preventDefault();
  };

  const showId = columns.id == null || columns.id === true;
  const showTitle = columns.title == null || columns.title === true;
  const showDescription = columns.description == null || columns.description === true;
  const showAssignee = columns.assignee == null || columns.assignee === true;

  return (
    <div className={cn("h-full overflow-auto border-t", className)}>
      <table className="w-full table-fixed border-collapse text-sm border-l border-r ">
        <thead className="sticky top-0 z-10 bg-secondary">
          <tr className="border-b h-[25px]">
            {showId && (
              <th className="text-right w-10 border-r text-xs font-medium text-muted-foreground px-2 align-middle">
                ID
              </th>
            )}
            {showTitle && (
              <th className="text-xs font-medium text-muted-foreground px-2 align-middle text-left">Title</th>
            )}
            {showDescription && (
              <th className="text-xs font-medium text-muted-foreground px-2 align-middle text-left">
                Description
              </th>
            )}
            {showAssignee && <th className="w-[1%] px-2"></th>}
          </tr>
        </thead>
        <tbody>
          {issues.map((issueData) => {
            const isSelected = issueData.Issue.id === selectedIssueId;
            return (
              <tr
                key={issueData.Issue.id}
                className={cn("cursor-pointer h-[25px] border-b hover:bg-muted/40")}
                onClick={() => {
                  if (isSelected) {
                    selectIssue(null);
                    return;
                  }
                  selectIssue(issueData);
                }}
              >
                {showId && (
                  <td
                    className={cn(
                      "font-medium border-r text-right p-0 align-middle",
                      (isSelected || highlighted?.includes(issueData.Issue.id)) &&
                        "shadow-[inset_1px_1px_0_0_var(--personality),inset_0_-1px_0_0_var(--personality)]",
                    )}
                  >
                    <a
                      href={getIssueUrl(issueData.Issue.number)}
                      onClick={handleLinkClick}
                      className="block w-full h-full px-2 py-1 text-inherit hover:underline decoration-transparent"
                    >
                      {issueData.Issue.number.toString().padStart(3, "0")}
                    </a>
                  </td>
                )}
                {showTitle && (
                  <td
                    className={cn(
                      "min-w-0 p-0 align-middle",
                      (isSelected || highlighted?.includes(issueData.Issue.id)) &&
                        "shadow-[inset_0_1px_0_0_var(--personality),inset_0_-1px_0_0_var(--personality)]",
                    )}
                  >
                    <a
                      href={getIssueUrl(issueData.Issue.number)}
                      onClick={handleLinkClick}
                      className="flex items-center gap-2 min-w-0 w-full h-full px-2 py-1 text-inherit hover:underline decoration-transparent"
                    >
                      {selectedOrganisation?.Organisation.features.issueTypes &&
                        issueTypes[issueData.Issue.type] && (
                          <Icon
                            icon={issueTypes[issueData.Issue.type].icon as IconName}
                            size={16}
                            color={issueTypes[issueData.Issue.type].color}
                          />
                        )}
                      {selectedOrganisation?.Organisation.features.issueStatus &&
                        (columns.status == null || columns.status === true) && (
                          <StatusTag
                            status={issueData.Issue.status}
                            colour={statuses[issueData.Issue.status]}
                          />
                        )}
                      <span className="truncate">{issueData.Issue.title}</span>
                    </a>
                  </td>
                )}
                {showDescription && (
                  <td
                    className={cn(
                      "overflow-hidden p-0 align-middle",
                      (isSelected || highlighted?.includes(issueData.Issue.id)) &&
                        "shadow-[inset_0_1px_0_0_var(--personality),inset_0_-1px_0_0_var(--personality)]",
                    )}
                  >
                    <a
                      href={getIssueUrl(issueData.Issue.number)}
                      onClick={handleLinkClick}
                      className="block w-full h-full px-2 py-1 text-inherit hover:underline decoration-transparent"
                    >
                      {issueData.Issue.description}
                    </a>
                  </td>
                )}
                {showAssignee && (
                  <td
                    className={cn(
                      "h-[32px] p-0 align-middle",
                      (isSelected || highlighted?.includes(issueData.Issue.id)) &&
                        "shadow-[inset_0_1px_0_0_var(--personality),inset_-1px_0_0_0_var(--personality),inset_0_-1px_0_0_var(--personality)]",
                    )}
                  >
                    <a
                      href={getIssueUrl(issueData.Issue.number)}
                      onClick={handleLinkClick}
                      className="flex items-center justify-end w-full h-full px-2"
                    >
                      {selectedOrganisation?.Organisation.features.issueAssigneesShownInTable &&
                        issueData.Assignees &&
                        issueData.Assignees.length > 0 && (
                          <div className="flex items-center -space-x-2 pr-1.5">
                            {issueData.Assignees.slice(0, 3).map((assignee) => (
                              <Avatar
                                key={assignee.id}
                                name={assignee.name}
                                username={assignee.username}
                                avatarURL={assignee.avatarURL}
                                textClass="text-xs"
                                className="ring-1 ring-background"
                              />
                            ))}
                            {issueData.Assignees.length > 3 && (
                              <span className="flex items-center justify-center w-6 h-6 text-[10px] font-medium bg-muted text-muted-foreground rounded-full ring-1 ring-background">
                                +{issueData.Assignees.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                    </a>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
