import { useEffect, useMemo } from "react";
import Avatar from "@/components/avatar";
import { useSelection } from "@/components/selection-provider";
import StatusTag from "@/components/status-tag";
import Icon, { type IconName } from "@/components/ui/icon";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
}: {
  columns?: { id?: boolean; title?: boolean; description?: boolean; status?: boolean; assignee?: boolean };
  className: string;
  filters?: IssuesTableFilters;
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

  return (
    <Table className={cn("table-fixed", className)}>
      <TableHeader>
        <TableRow hoverEffect={false} className="bg-secondary">
          {(columns.id == null || columns.id === true) && (
            <TableHead className="text-right w-10 border-r text-xs font-medium text-muted-foreground">
              ID
            </TableHead>
          )}
          {(columns.title == null || columns.title === true) && (
            <TableHead className="text-xs font-medium text-muted-foreground">Title</TableHead>
          )}
          {(columns.description == null || columns.description === true) && (
            <TableHead className="text-xs font-medium text-muted-foreground">Description</TableHead>
          )}
          {/* below is kept blank to fill the space, used as the "Assignee" column */}
          {(columns.assignee == null || columns.assignee === true) && (
            <TableHead className="w-[1%]"></TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {issues.map((issueData) => (
          <TableRow
            key={issueData.Issue.id}
            className="cursor-pointer max-w-full"
            onClick={() => {
              if (issueData.Issue.id === selectedIssueId) {
                selectIssue(null);
                return;
              }
              selectIssue(issueData);
            }}
          >
            {(columns.id == null || columns.id === true) && (
              <TableCell className="font-medium border-r text-right p-0">
                <a
                  href={getIssueUrl(issueData.Issue.number)}
                  onClick={handleLinkClick}
                  className="block w-full h-full px-2 py-1 text-inherit hover:underline decoration-transparent"
                >
                  {issueData.Issue.number.toString().padStart(3, "0")}
                </a>
              </TableCell>
            )}
            {(columns.title == null || columns.title === true) && (
              <TableCell className="min-w-0 p-0">
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
                      <StatusTag status={issueData.Issue.status} colour={statuses[issueData.Issue.status]} />
                    )}
                  <span className="truncate">{issueData.Issue.title}</span>
                </a>
              </TableCell>
            )}
            {(columns.description == null || columns.description === true) && (
              <TableCell className="overflow-hidden p-0">
                <a
                  href={getIssueUrl(issueData.Issue.number)}
                  onClick={handleLinkClick}
                  className="block w-full h-full px-2 py-1 text-inherit hover:underline decoration-transparent"
                >
                  {issueData.Issue.description}
                </a>
              </TableCell>
            )}
            {(columns.assignee == null || columns.assignee === true) && (
              <TableCell className="h-[32px] p-0">
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
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
