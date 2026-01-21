/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */

import { useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import AccountDialog from "@/components/account-dialog";
import { IssueDetailPane } from "@/components/issue-detail-pane";
import { IssueModal } from "@/components/issue-modal";
import { IssuesTable } from "@/components/issues-table";
import LogOutButton from "@/components/log-out-button";
import OrgIcon from "@/components/org-icon";
import { OrganisationSelect } from "@/components/organisation-select";
import OrganisationsDialog from "@/components/organisations-dialog";
import { ProjectSelect } from "@/components/project-select";
import { useSelection } from "@/components/selection-provider";
import { ServerConfigurationDialog } from "@/components/server-configuration-dialog";
import { useAuthenticatedSession } from "@/components/session-provider";
import SmallUserDisplay from "@/components/small-user-display";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Icon from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { ResizablePanel, ResizablePanelGroup, ResizableSeparator } from "@/components/ui/resizable";
import { useIssues, useOrganisations, useProjects, useSelectedIssue } from "@/lib/query/hooks";

const BREATHING_ROOM = 1;

export default function App() {
    const { user } = useAuthenticatedSession();
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
            <div className="flex gap-12 items-center justify-between">
                <div className={`flex gap-${BREATHING_ROOM} items-center`}>
                    <OrganisationSelect
                        noDecoration
                        triggerClassName="px-1 rounded-full hover:bg-transparent dark:hover:bg-transparent"
                        trigger={
                            <OrgIcon
                                name={
                                    organisations.find(
                                        (org) => org.Organisation.id === selectedOrganisationId,
                                    )?.Organisation.name || ""
                                }
                                slug={
                                    organisations.find(
                                        (org) => org.Organisation.id === selectedOrganisationId,
                                    )?.Organisation.slug || ""
                                }
                                size={7}
                                className="hover:border hover:border-foreground/30"
                            />
                        }
                    />

                    {selectedOrganisationId && <ProjectSelect showLabel />}
                    {selectedOrganisationId && selectedProjectId && <IssueModal />}
                </div>
                <div className={`flex gap-${BREATHING_ROOM} items-center`}>
                    <ThemeToggle />
                    <DropdownMenu>
                        <DropdownMenuTrigger className="text-sm">
                            <SmallUserDisplay user={user} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={"end"}>
                            <DropdownMenuItem asChild className="flex items-end justify-end">
                                <AccountDialog />
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="flex items-end justify-end">
                                <OrganisationsDialog />
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="flex items-end justify-end">
                                <ServerConfigurationDialog
                                    trigger={
                                        <Button
                                            variant="ghost"
                                            className="flex w-full items-center justify-end text-end px-2 py-1 m-0 h-auto"
                                            title="Server Configuration"
                                        >
                                            Server Configuration
                                        </Button>
                                    }
                                />
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="flex items-end justify-end p-0 m-0">
                                <LogOutButton noStyle className={"flex w-full justify-end"} />
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {selectedOrganisationId && selectedProjectId && issuesData.length > 0 && (
                <ResizablePanelGroup className={`flex-1`}>
                    <ResizablePanel id={"left"} minSize={400}>
                        <IssuesTable columns={{ description: false }} className="border w-full flex-shrink" />
                    </ResizablePanel>

                    {selectedIssue && (
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
        </main>
    );
}
