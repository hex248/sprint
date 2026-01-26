/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */

import { useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { IssueDetailPane } from "@/components/issue-detail-pane";
import { IssueModal } from "@/components/issue-modal";
import { IssuesTable } from "@/components/issues-table";
import { useSelection } from "@/components/selection-provider";
import TopBar from "@/components/top-bar";
import { ResizablePanel, ResizablePanelGroup, ResizableSeparator } from "@/components/ui/resizable";
import { BREATHING_ROOM } from "@/lib/layout";
import { useIssues, useOrganisations, useProjects, useSelectedIssue } from "@/lib/query/hooks";

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

  const organisations = useMemo(
    () => [...organisationsData].sort((a, b) => a.Organisation.name.localeCompare(b.Organisation.name)),
    [organisationsData],
  );
  const projects = useMemo(
    () => [...projectsData].sort((a, b) => a.Project.name.localeCompare(b.Project.name)),
    [projectsData],
  );

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

  return (
    <main className={`w-full h-screen flex flex-col gap-${BREATHING_ROOM} p-${BREATHING_ROOM}`}>
      <TopBar />

      {selectedOrganisationId && selectedProjectId && issuesData.length > 0 && (
        <ResizablePanelGroup className={`flex-1`}>
          <ResizablePanel id={"left"} minSize={400}>
            <div className="border w-full flex-shrink">
              <IssuesTable columns={{ description: false }} className="w-full" />
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
