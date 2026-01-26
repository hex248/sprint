/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { IssueDetailPane } from "@/components/issue-detail-pane";
import { IssueModal } from "@/components/issue-modal";
import { defaultIssuesTableFilters, IssuesTable, type IssuesTableFilters } from "@/components/issues-table";
import { useSelection } from "@/components/selection-provider";
import SmallUserDisplay from "@/components/small-user-display";
import StatusTag from "@/components/status-tag";
import TopBar from "@/components/top-bar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Icon, { type IconName } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { ResizablePanel, ResizablePanelGroup, ResizableSeparator } from "@/components/ui/resizable";
import { BREATHING_ROOM } from "@/lib/layout";
import {
  useIssues,
  useOrganisationMembers,
  useOrganisations,
  useProjects,
  useSelectedIssue,
  useSelectedOrganisation,
  useSprints,
} from "@/lib/query/hooks";

const parseListParam = (value: string | null) =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const parseIssueFilters = (search: string): IssuesTableFilters => {
  const params = new URLSearchParams(search);
  const query = params.get("q")?.trim() ?? "";
  const statuses = parseListParam(params.get("status"));
  const types = parseListParam(params.get("type"));
  const assignees = parseListParam(params.get("assignee"));
  const sprintParam = params.get("sprint")?.trim().toLowerCase() ?? "";
  const sortParam = params.get("sort")?.trim().toLowerCase() ?? "";

  let sprintId: IssuesTableFilters["sprintId"] = "all";
  if (sprintParam === "none") {
    sprintId = "none";
  } else if (sprintParam !== "") {
    const parsedSprintId = Number.parseInt(sprintParam, 10);
    sprintId = Number.isNaN(parsedSprintId) ? "all" : parsedSprintId;
  }

  const sortValues: IssuesTableFilters["sort"][] = ["newest", "oldest", "title-asc", "title-desc", "status"];
  const sort = sortValues.includes(sortParam as IssuesTableFilters["sort"])
    ? (sortParam as IssuesTableFilters["sort"])
    : "newest";

  return {
    ...defaultIssuesTableFilters,
    query,
    statuses,
    types,
    assignees,
    sprintId,
    sort,
  };
};

const filtersEqual = (left: IssuesTableFilters, right: IssuesTableFilters) => {
  if (left.query !== right.query) return false;
  if (left.sprintId !== right.sprintId) return false;
  if (left.sort !== right.sort) return false;
  if (left.statuses.length !== right.statuses.length) return false;
  if (left.types.length !== right.types.length) return false;
  if (left.assignees.length !== right.assignees.length) return false;
  return (
    left.statuses.every((status) => right.statuses.includes(status)) &&
    left.types.every((type) => right.types.includes(type)) &&
    left.assignees.every((assignee) => right.assignees.includes(assignee))
  );
};

export default function Issues() {
  const {
    selectedOrganisationId,
    selectedProjectId,
    selectedIssueId,
    selectOrganisation,
    selectProject,
    selectIssue,
  } = useSelection();
  const location = useLocation();

  const deepLinkParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const orgSlug = params.get("o")?.trim().toLowerCase() ?? "";
    const projectKey = params.get("p")?.trim().toLowerCase() ?? "";
    const issueParam = params.get("i")?.trim() ?? "";
    const issueNumber = issueParam === "" ? null : Number.parseInt(issueParam, 10);

    return {
      orgSlug,
      projectKey,
      issueNumber: issueNumber != null && Number.isNaN(issueNumber) ? null : issueNumber,
    };
  }, [location.search]);

  const showIssueModal =
    new URLSearchParams(window.location.search).get("modal")?.trim().toLowerCase() === "true";

  const { data: organisationsData = [] } = useOrganisations();
  const { data: projectsData = [] } = useProjects(selectedOrganisationId);
  const { data: issuesData = [], isFetched: issuesFetched } = useIssues(selectedProjectId);
  const selectedIssue = useSelectedIssue();
  const selectedOrganisation = useSelectedOrganisation();
  const { data: membersData = [] } = useOrganisationMembers(selectedOrganisationId);
  const { data: sprintsData = [] } = useSprints(selectedProjectId);
  const parsedFilters = useMemo(() => parseIssueFilters(location.search), [location.search]);
  const [issueFilters, setIssueFilters] = useState<IssuesTableFilters>(() => parsedFilters);

  const organisations = useMemo(
    () => [...organisationsData].sort((a, b) => a.Organisation.name.localeCompare(b.Organisation.name)),
    [organisationsData],
  );
  const projects = useMemo(
    () => [...projectsData].sort((a, b) => a.Project.name.localeCompare(b.Project.name)),
    [projectsData],
  );

  useEffect(() => {
    setIssueFilters((current) => (filtersEqual(current, parsedFilters) ? current : parsedFilters));
  }, [parsedFilters]);

  useEffect(() => {
    const currentParams = new URLSearchParams(location.search);
    const nextParams = new URLSearchParams(location.search);

    if (issueFilters.query) nextParams.set("q", issueFilters.query);
    else nextParams.delete("q");

    if (issueFilters.statuses.length > 0) nextParams.set("status", issueFilters.statuses.join(","));
    else nextParams.delete("status");

    if (issueFilters.types.length > 0) nextParams.set("type", issueFilters.types.join(","));
    else nextParams.delete("type");

    if (issueFilters.assignees.length > 0) nextParams.set("assignee", issueFilters.assignees.join(","));
    else nextParams.delete("assignee");

    if (issueFilters.sprintId === "none") nextParams.set("sprint", "none");
    else if (issueFilters.sprintId !== "all") nextParams.set("sprint", String(issueFilters.sprintId));
    else nextParams.delete("sprint");

    if (issueFilters.sort !== defaultIssuesTableFilters.sort) nextParams.set("sort", issueFilters.sort);
    else nextParams.delete("sort");

    if (currentParams.toString() === nextParams.toString()) return;

    const search = nextParams.toString();
    const nextUrl = `${location.pathname}${search ? `?${search}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [issueFilters, location.pathname, location.search]);

  const findById = <T,>(items: T[], id: number | null | undefined, getId: (item: T) => number) =>
    id == null ? null : (items.find((item) => getId(item) === id) ?? null);
  const selectFallback = <T,>(items: T[], selected: T | null) => selected ?? items[0] ?? null;
  const findOrgBySlug = (slug: string) =>
    organisations.find((org) => org.Organisation.slug.toLowerCase() === slug) ?? null;
  const findProjectByKey = (key: string) =>
    projects.find((project) => project.Project.key.toLowerCase() === key) ?? null;

  const deepLinkActive = deepLinkParams.projectKey !== "" || deepLinkParams.issueNumber != null;
  const deepLinkFlowRef = useRef({
    stage: "idle" as "idle" | "org" | "project" | "issue" | "done",
    orgSlug: "",
    projectKey: "",
    issueNumber: null as number | null,
    targetOrgId: null as number | null,
    targetProjectId: null as number | null,
  });

  useEffect(() => {
    deepLinkFlowRef.current = {
      stage: deepLinkActive ? "org" : "idle",
      orgSlug: deepLinkParams.orgSlug,
      projectKey: deepLinkParams.projectKey,
      issueNumber: deepLinkParams.issueNumber,
      targetOrgId: null,
      targetProjectId: null,
    };
  }, [deepLinkActive, deepLinkParams.orgSlug, deepLinkParams.projectKey, deepLinkParams.issueNumber]);

  useEffect(() => {
    if (organisations.length === 0) return;

    if (deepLinkActive && deepLinkFlowRef.current.stage !== "org") {
      return;
    }

    let selected = findById(organisations, selectedOrganisationId, (org) => org.Organisation.id);
    if (deepLinkActive && deepLinkFlowRef.current.orgSlug) {
      selected = findOrgBySlug(deepLinkFlowRef.current.orgSlug) ?? selected;
    }
    selected = selectFallback(organisations, selected);

    if (!selected) return;

    if (deepLinkActive) {
      deepLinkFlowRef.current.targetOrgId = selected.Organisation.id;
      deepLinkFlowRef.current.stage = "project";
      if (selected.Organisation.id !== selectedOrganisationId) {
        selectOrganisation(selected, { skipUrlUpdate: true });
      }
      return;
    }

    if (selected.Organisation.id !== selectedOrganisationId) {
      selectOrganisation(selected);
    }
  }, [organisations, selectedOrganisationId, deepLinkActive, selectOrganisation]);

  useEffect(() => {
    if (projects.length === 0) return;
    if (!deepLinkActive && selectedProjectId == null) {
      selectProject(projects[0]);
      return;
    }

    if (deepLinkActive) {
      const flow = deepLinkFlowRef.current;
      if (flow.stage !== "project") return;
      if (flow.targetOrgId != null && selectedOrganisationId !== flow.targetOrgId) {
        return;
      }
      let selected = findById(projects, selectedProjectId, (project) => project.Project.id);
      if (flow.projectKey) {
        selected = findProjectByKey(flow.projectKey) ?? selected;
      }
      selected = selectFallback(projects, selected);
      if (!selected) return;
      flow.targetProjectId = selected.Project.id;
      flow.stage = "issue";
      if (selected.Project.id !== selectedProjectId) {
        selectProject(selected, { skipUrlUpdate: true });
      }
      return;
    }

    let selected = findById(projects, selectedProjectId, (project) => project.Project.id);
    selected = selectFallback(projects, selected);
    if (selected && selected.Project.id !== selectedProjectId) {
      selectProject(selected);
    }
  }, [projects, selectedProjectId, selectedOrganisationId, deepLinkActive, selectProject]);

  useEffect(() => {
    if (!deepLinkActive) return;
    const flow = deepLinkFlowRef.current;
    if (flow.stage !== "issue") return;
    if (flow.targetProjectId != null && selectedProjectId !== flow.targetProjectId) {
      return;
    }
    if (!issuesFetched) return;
    if (flow.issueNumber != null) {
      const match = issuesData.find((issue) => issue.Issue.number === flow.issueNumber);
      if (match && match.Issue.id !== selectedIssueId) {
        selectIssue(match, { skipUrlUpdate: true });
      }
    }
    flow.stage = "done";
  }, [deepLinkActive, issuesData, issuesFetched, selectedIssueId, selectedProjectId, selectIssue]);

  const handleIssueFiltersChange = (
    next: IssuesTableFilters | ((current: IssuesTableFilters) => IssuesTableFilters),
  ) => {
    setIssueFilters((current) => (typeof next === "function" ? next(current) : next));
  };

  const statuses = (selectedOrganisation?.Organisation.statuses ?? {}) as Record<string, string>;
  const issueTypes = (selectedOrganisation?.Organisation.issueTypes ?? {}) as Record<
    string,
    { icon: IconName; color: string }
  >;
  const members = useMemo(
    () => [...membersData].map((member) => member.User).sort((a, b) => a.name.localeCompare(b.name)),
    [membersData],
  );
  const sortLabels: Record<IssuesTableFilters["sort"], string> = {
    newest: "Newest",
    oldest: "Oldest",
    "title-asc": "Title A-Z",
    "title-desc": "Title Z-A",
    status: "Status",
  };
  const sprintLabel = useMemo(() => {
    if (issueFilters.sprintId === "all") return "Sprint";
    if (issueFilters.sprintId === "none") return "No sprint";
    const sprintMatch = sprintsData.find((sprint) => sprint.id === issueFilters.sprintId);
    return sprintMatch?.name ?? "Sprint";
  }, [issueFilters.sprintId, sprintsData]);

  return (
    <main className={`w-full h-screen flex flex-col gap-${BREATHING_ROOM} p-${BREATHING_ROOM}`}>
      <TopBar />

      {selectedOrganisationId && selectedProjectId && (
        <div className={`flex flex-wrap gap-${BREATHING_ROOM} items-center`}>
          <div className="w-64">
            <Input
              type="search"
              value={issueFilters.query}
              onChange={(event) => {
                const nextQuery = event.target.value;
                handleIssueFiltersChange((current) => ({
                  ...current,
                  query: nextQuery,
                }));
              }}
              placeholder="Search issues"
              showCounter={false}
            />
          </div>
          {selectedOrganisation?.Organisation.features.issueStatus && (
            <DropdownMenu>
              <DropdownMenuTrigger size="default" className="h-9">
                Status
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.keys(statuses).length === 0 && (
                  <DropdownMenuItem disabled>No statuses</DropdownMenuItem>
                )}
                {Object.entries(statuses).map(([status, colour]) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={issueFilters.statuses.includes(status)}
                    onCheckedChange={(checked) => {
                      handleIssueFiltersChange((current) => ({
                        ...current,
                        statuses: checked
                          ? Array.from(new Set([...current.statuses, status]))
                          : current.statuses.filter((item) => item !== status),
                      }));
                    }}
                  >
                    <StatusTag status={status} colour={colour} />
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {selectedOrganisation?.Organisation.features.issueTypes && (
            <DropdownMenu>
              <DropdownMenuTrigger size="default" className="h-9">
                Type
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.keys(issueTypes).length === 0 && (
                  <DropdownMenuItem disabled>No types</DropdownMenuItem>
                )}
                {Object.entries(issueTypes).map(([type, definition]) => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={issueFilters.types.includes(type)}
                    onCheckedChange={(checked) => {
                      handleIssueFiltersChange((current) => ({
                        ...current,
                        types: checked
                          ? Array.from(new Set([...current.types, type]))
                          : current.types.filter((item) => item !== type),
                      }));
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Icon icon={definition.icon} size={14} color={definition.color} />
                      <span>{type}</span>
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger size="default" className="h-9">
              Assignee
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Assignee</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={issueFilters.assignees.includes("unassigned")}
                onCheckedChange={(checked) => {
                  handleIssueFiltersChange((current) => ({
                    ...current,
                    assignees: checked
                      ? Array.from(new Set([...current.assignees, "unassigned"]))
                      : current.assignees.filter((item) => item !== "unassigned"),
                  }));
                }}
              >
                Unassigned
              </DropdownMenuCheckboxItem>
              {members.length === 0 && <DropdownMenuItem disabled>No members</DropdownMenuItem>}
              {members.map((member) => (
                <DropdownMenuCheckboxItem
                  key={member.id}
                  checked={issueFilters.assignees.includes(String(member.id))}
                  onCheckedChange={(checked) => {
                    handleIssueFiltersChange((current) => ({
                      ...current,
                      assignees: checked
                        ? Array.from(new Set([...current.assignees, String(member.id)]))
                        : current.assignees.filter((item) => item !== String(member.id)),
                    }));
                  }}
                >
                  <SmallUserDisplay user={member} />
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {selectedOrganisation?.Organisation.features.sprints && (
            <DropdownMenu>
              <DropdownMenuTrigger size="default" className="h-9">
                {sprintLabel}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Sprint</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={String(issueFilters.sprintId)}
                  onValueChange={(value) => {
                    handleIssueFiltersChange((current) => ({
                      ...current,
                      sprintId:
                        value === "all" ? "all" : value === "none" ? "none" : Number.parseInt(value, 10),
                    }));
                  }}
                >
                  <DropdownMenuRadioItem value="all">All sprints</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="none">No sprint</DropdownMenuRadioItem>
                  {sprintsData.map((sprint) => (
                    <DropdownMenuRadioItem key={sprint.id} value={String(sprint.id)}>
                      {sprint.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger size="default" className="h-9">
              Sort: {sortLabels[issueFilters.sort]}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Sort</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={issueFilters.sort}
                onValueChange={(value) => {
                  handleIssueFiltersChange((current) => ({
                    ...current,
                    sort: value as IssuesTableFilters["sort"],
                  }));
                }}
              >
                <DropdownMenuRadioItem value="newest">Newest</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="oldest">Oldest</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="title-asc">Title A-Z</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="title-desc">Title Z-A</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="status">Status</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <IconButton
            variant="outline"
            className="w-9 h-9"
            disabled={
              !issueFilters.query &&
              issueFilters.statuses.length === 0 &&
              issueFilters.types.length === 0 &&
              issueFilters.assignees.length === 0 &&
              issueFilters.sprintId === defaultIssuesTableFilters.sprintId &&
              issueFilters.sort === defaultIssuesTableFilters.sort
            }
            aria-label="Clear filters"
            title="Clear filters"
            onClick={() => {
              handleIssueFiltersChange({ ...defaultIssuesTableFilters });
            }}
          >
            <Icon icon="undo" />
          </IconButton>
        </div>
      )}

      {selectedOrganisationId && selectedProjectId && issuesData.length > 0 && (
        <ResizablePanelGroup className={`flex-1`}>
          <ResizablePanel id={"left"} minSize={400}>
            <div className="border w-full flex-shrink">
              <IssuesTable columns={{ description: false }} className="w-full" filters={issueFilters} />
            </div>
          </ResizablePanel>

          {selectedIssue && !showIssueModal && (
            <>
              <ResizableSeparator />
              <ResizablePanel id={"right"} defaultSize={"30%"} minSize={363} maxSize={"60%"}>
                <div className="border">
                  <IssueDetailPane />
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      )}

      {selectedIssue && showIssueModal && (
        <IssueModal
          issueData={selectedIssue}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              selectIssue(null);
            }
          }}
        />
      )}
    </main>
  );
}
