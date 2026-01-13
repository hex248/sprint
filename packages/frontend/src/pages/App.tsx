/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */

import type {
    IssueResponse,
    OrganisationResponse,
    ProjectRecord,
    ProjectResponse,
    SprintRecord,
    UserRecord,
} from "@issue/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import AccountDialog from "@/components/account-dialog";
import { CreateIssue } from "@/components/create-issue";
import { IssueDetailPane } from "@/components/issue-detail-pane";
import { IssuesTable } from "@/components/issues-table";
import LogOutButton from "@/components/log-out-button";
import { OrganisationSelect } from "@/components/organisation-select";
import OrganisationsDialog from "@/components/organisations-dialog";
import { ProjectSelect } from "@/components/project-select";
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
import { ResizablePanel, ResizablePanelGroup, ResizableSeparator } from "@/components/ui/resizable";
import { issue, organisation, project, sprint } from "@/lib/server";
import { issueID } from "@/lib/utils";

const BREATHING_ROOM = 1;

export default function App() {
    const { user } = useAuthenticatedSession();

    const organisationsRef = useRef(false);
    const [organisations, setOrganisations] = useState<OrganisationResponse[]>([]);
    const [selectedOrganisation, setSelectedOrganisation] = useState<OrganisationResponse | null>(null);

    const [projects, setProjects] = useState<ProjectResponse[]>([]);
    const [selectedProject, setSelectedProject] = useState<ProjectResponse | null>(null);

    const [issues, setIssues] = useState<IssueResponse[]>([]);
    const [selectedIssue, setSelectedIssue] = useState<IssueResponse | null>(null);

    const [members, setMembers] = useState<UserRecord[]>([]);
    const [sprints, setSprints] = useState<SprintRecord[]>([]);

    const deepLinkParams = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        const orgSlug = params.get("o")?.trim().toLowerCase() ?? "";
        const projectKey = params.get("p")?.trim().toLowerCase() ?? "";
        const issueParam = params.get("i")?.trim() ?? "";
        const issueNumber = issueParam === "" ? null : Number.parseInt(issueParam, 10);

        return {
            orgSlug,
            projectKey,
            issueNumber: issueNumber != null && Number.isNaN(issueNumber) ? null : issueNumber,
        };
    }, []);

    const deepLinkStateRef = useRef({
        appliedOrg: false,
        appliedProject: false,
        appliedIssue: false,
        orgMatched: false,
        projectMatched: false,
    });

    const initialUrlSyncRef = useRef(false);

    const updateUrlParams = (updates: {
        orgSlug?: string | null;
        projectKey?: string | null;
        issueNumber?: number | null;
    }) => {
        const params = new URLSearchParams(window.location.search);

        if (updates.orgSlug !== undefined) {
            if (updates.orgSlug) params.set("o", updates.orgSlug);
            else params.delete("o");
        }

        if (updates.projectKey !== undefined) {
            if (updates.projectKey) params.set("p", updates.projectKey);
            else params.delete("p");
        }

        if (updates.issueNumber !== undefined) {
            if (updates.issueNumber != null) params.set("i", `${updates.issueNumber}`);
            else params.delete("i");
        }

        const search = params.toString();
        const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}`;
        window.history.replaceState(null, "", nextUrl);
    };

    const refetchOrganisations = async (options?: { selectOrganisationId?: number }) => {
        try {
            await organisation.byUser({
                onSuccess: (data) => {
                    data.sort((a, b) => a.Organisation.name.localeCompare(b.Organisation.name));
                    setOrganisations(data);

                    let selected: OrganisationResponse | null = null;

                    if (options?.selectOrganisationId) {
                        const created = data.find((o) => o.Organisation.id === options.selectOrganisationId);
                        if (created) {
                            selected = created;
                        }
                    } else {
                        const deepLinkState = deepLinkStateRef.current;
                        if (deepLinkParams.orgSlug && !deepLinkState.appliedOrg) {
                            const match = data.find(
                                (org) => org.Organisation.slug.toLowerCase() === deepLinkParams.orgSlug,
                            );
                            deepLinkState.appliedOrg = true;
                            deepLinkState.orgMatched = Boolean(match);
                            if (match) {
                                selected = match;
                                localStorage.setItem("selectedOrganisationId", `${match.Organisation.id}`);
                            }
                        }

                        if (!selected) {
                            const savedId = localStorage.getItem("selectedOrganisationId");
                            if (savedId) {
                                const saved = data.find((o) => o.Organisation.id === Number(savedId));
                                if (saved) {
                                    selected = saved;
                                }
                            }
                        }
                    }

                    if (!selected) {
                        selected = data[0] || null;
                    }

                    setSelectedOrganisation(selected);
                    if (selected) {
                        updateUrlParams({
                            orgSlug: selected.Organisation.slug.toLowerCase(),
                            projectKey: null,
                            issueNumber: null,
                        });
                    }
                },
                onError: (error) => {
                    console.error("error fetching organisations:", error);
                    setOrganisations([]);
                    setSelectedOrganisation(null);

                    toast.error(`Error fetching organisations: ${error}`, {
                        dismissible: false,
                    });
                },
            });
        } catch (err) {
            console.error("error fetching organisations:", err);
        }
    };

    useEffect(() => {
        if (organisationsRef.current) return;
        organisationsRef.current = true;
        void refetchOrganisations();
    }, [user.id]);

    const refetchProjects = async (organisationId: number, options?: { selectProjectId?: number }) => {
        try {
            await project.byOrganisation({
                organisationId,
                onSuccess: (data) => {
                    const projects = data as ProjectResponse[];
                    projects.sort((a, b) => a.Project.name.localeCompare(b.Project.name));
                    setProjects(projects);

                    let selected: ProjectResponse | null = null;

                    if (options?.selectProjectId) {
                        const created = projects.find((p) => p.Project.id === options.selectProjectId);
                        if (created) {
                            selected = created;
                        }
                    } else {
                        const deepLinkState = deepLinkStateRef.current;
                        if (
                            deepLinkParams.projectKey &&
                            deepLinkState.orgMatched &&
                            !deepLinkState.appliedProject
                        ) {
                            const match = projects.find(
                                (proj) => proj.Project.key.toLowerCase() === deepLinkParams.projectKey,
                            );
                            deepLinkState.appliedProject = true;
                            deepLinkState.projectMatched = Boolean(match);
                            if (match) {
                                selected = match;
                                localStorage.setItem("selectedProjectId", `${match.Project.id}`);
                            }
                        }

                        if (!selected) {
                            const savedId = localStorage.getItem("selectedProjectId");
                            if (savedId) {
                                const saved = projects.find((p) => p.Project.id === Number(savedId));
                                if (saved) {
                                    selected = saved;
                                }
                            }
                        }
                    }

                    if (!selected) {
                        selected = projects[0] || null;
                    }

                    setSelectedProject(selected);
                    if (selected) {
                        updateUrlParams({
                            projectKey: selected.Project.key.toLowerCase(),
                            issueNumber: null,
                        });
                    }
                },
                onError: (error) => {
                    console.error("error fetching projects:", error);
                    setProjects([]);
                    setSelectedProject(null);

                    toast.error(`Error fetching projects: ${error}`, {
                        dismissible: false,
                    });
                },
            });
        } catch (err) {
            console.error("error fetching projects:", err);
            setProjects([]);
        }
    };

    const refetchMembers = async (organisationId: number) => {
        try {
            await organisation.members({
                organisationId,
                onSuccess: (data) => {
                    setMembers(data.map((m) => m.User));
                },
                onError: (error) => {
                    console.error("error fetching members:", error);
                    setMembers([]);

                    toast.error(`Error fetching members: ${error}`, {
                        dismissible: false,
                    });
                },
            });
        } catch (err) {
            console.error("error fetching members:", err);
            setMembers([]);
        }
    };

    const refetchSprints = async (projectId: number) => {
        try {
            await sprint.byProject({
                projectId,
                onSuccess: (data) => {
                    setSprints(data);
                },
                onError: (error) => {
                    console.error("error fetching sprints:", error);
                    setSprints([]);

                    toast.error(`Error fetching sprints: ${error}`, {
                        dismissible: false,
                    });
                },
            });
        } catch (err) {
            console.error("error fetching sprints:", err);
            setSprints([]);
        }
    };

    // fetch projects when organisation is selected
    useEffect(() => {
        setProjects([]);
        setSelectedProject(null);
        setSelectedIssue(null);
        setIssues([]);
        setMembers([]);
        if (!selectedOrganisation) {
            return;
        }

        void refetchProjects(selectedOrganisation.Organisation.id);
        void refetchMembers(selectedOrganisation.Organisation.id);
    }, [selectedOrganisation]);

    const refetchIssues = async () => {
        try {
            await issue.byProject({
                projectId: selectedProject?.Project.id || 0,
                onSuccess: (data) => {
                    const issues = data as IssueResponse[];
                    issues.reverse(); // newest at the bottom, but if the order has been rearranged, respect that
                    setIssues(issues);

                    const deepLinkState = deepLinkStateRef.current;
                    if (
                        deepLinkParams.issueNumber != null &&
                        deepLinkState.projectMatched &&
                        !deepLinkState.appliedIssue
                    ) {
                        const match = issues.find(
                            (issue) => issue.Issue.number === deepLinkParams.issueNumber,
                        );
                        deepLinkState.appliedIssue = true;
                        setSelectedIssue(match ?? null);
                    }
                },
                onError: (error) => {
                    console.error("error fetching issues:", error);
                    setIssues([]);
                    setSelectedIssue(null);

                    toast.error(`Error fetching issues: ${error}`, {
                        dismissible: false,
                    });
                },
            });
        } catch (err) {
            console.error("error fetching issues:", err);
            setIssues([]);
        }
    };

    const handleIssueDelete = async (issueId: number) => {
        setSelectedIssue(null);
        setIssues((prev) => prev.filter((issue) => issue.Issue.id !== issueId));
        await refetchIssues();
    };

    // fetch issues when project is selected
    useEffect(() => {
        if (!selectedProject) return;

        void refetchIssues();
        void refetchSprints(selectedProject.Project.id);
    }, [selectedProject]);

    useEffect(() => {
        if (initialUrlSyncRef.current) return;

        if (deepLinkParams.orgSlug || deepLinkParams.projectKey || deepLinkParams.issueNumber != null) {
            initialUrlSyncRef.current = true;
            return;
        }

        if (new URLSearchParams(window.location.search).toString() !== "") {
            initialUrlSyncRef.current = true;
            return;
        }

        if (selectedOrganisation && selectedProject) {
            updateUrlParams({
                orgSlug: selectedOrganisation.Organisation.slug.toLowerCase(),
                projectKey: selectedProject.Project.key.toLowerCase(),
                issueNumber: null,
            });
            initialUrlSyncRef.current = true;
        }
    }, [deepLinkParams, selectedOrganisation, selectedProject]);

    const handleProjectChange = (project: ProjectResponse | null) => {
        setSelectedProject(project);
        localStorage.setItem("selectedProjectId", `${project?.Project.id}`);
        setSelectedIssue(null);
        updateUrlParams({
            projectKey: project?.Project.key.toLowerCase() ?? null,
            issueNumber: null,
        });
    };

    const handleProjectCreate = async (project: ProjectRecord) => {
        if (!selectedOrganisation) return;

        toast.success(`Created Project ${project.name}`, {
            dismissible: false,
        });

        await refetchProjects(selectedOrganisation.Organisation.id, {
            selectProjectId: project.id,
        });
    };

    const handleSprintCreate = async (sprint: SprintRecord) => {
        if (!selectedProject) return;

        toast.success(
            <>
                Created sprint <span style={{ color: sprint.color }}>{sprint.name}</span>
            </>,
            {
                dismissible: false,
            },
        );

        await refetchSprints(selectedProject.Project.id);
    };

    return (
        <main className={`w-full h-screen flex flex-col gap-${BREATHING_ROOM} p-${BREATHING_ROOM}`}>
            {/* header area */}
            <div className="flex gap-12 items-center justify-between">
                <div className={`flex gap-${BREATHING_ROOM} items-center`}>
                    {/* organisation selection */}
                    <OrganisationSelect
                        organisations={organisations}
                        selectedOrganisation={selectedOrganisation}
                        onSelectedOrganisationChange={(org) => {
                            setSelectedOrganisation(org);
                            localStorage.setItem("selectedOrganisationId", `${org?.Organisation.id}`);
                            updateUrlParams({
                                orgSlug: org?.Organisation.slug.toLowerCase() ?? null,
                                projectKey: null,
                                issueNumber: null,
                            });
                        }}
                        onCreateOrganisation={async (org) => {
                            toast.success(`Created Organisation ${org.name}`, {
                                dismissible: false,
                            });
                            await refetchOrganisations({ selectOrganisationId: org.id });
                        }}
                        showLabel
                    />

                    {/* project selection - only shown when organisation is selected */}
                    {selectedOrganisation && (
                        <ProjectSelect
                            projects={projects}
                            selectedProject={selectedProject}
                            organisationId={selectedOrganisation?.Organisation.id}
                            onSelectedProjectChange={handleProjectChange}
                            onCreateProject={handleProjectCreate}
                            showLabel
                        />
                    )}
                    {selectedOrganisation && selectedProject && (
                        <CreateIssue
                            projectId={selectedProject?.Project.id}
                            sprints={sprints}
                            members={members}
                            statuses={selectedOrganisation.Organisation.statuses}
                            completeAction={async (issueNumber) => {
                                if (!selectedProject) return;
                                toast.success(
                                    `Created ${issueID(selectedProject.Project.key, issueNumber)}`,
                                    {
                                        dismissible: false,
                                    },
                                );
                                await refetchIssues();
                            }}
                            errorAction={async (errorMessage) => {
                                toast.error(`Error creating issue: ${errorMessage}`, {
                                    dismissible: false,
                                });
                            }}
                        />
                    )}
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
                                <OrganisationsDialog
                                    organisations={organisations}
                                    selectedOrganisation={selectedOrganisation}
                                    setSelectedOrganisation={setSelectedOrganisation}
                                    refetchOrganisations={refetchOrganisations}
                                    projects={projects}
                                    selectedProject={selectedProject}
                                    sprints={sprints}
                                    onSelectedProjectChange={handleProjectChange}
                                    onCreateProject={handleProjectCreate}
                                    onCreateSprint={handleSprintCreate}
                                />
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

            {/* main body */}
            {selectedOrganisation && selectedProject && issues.length > 0 && (
                <ResizablePanelGroup className={`flex-1`}>
                    <ResizablePanel id={"left"} minSize={400}>
                        {/* issues list (table) */}
                        <IssuesTable
                            issuesData={issues}
                            columns={{ description: false }}
                            statuses={selectedOrganisation.Organisation.statuses}
                            issueSelectAction={(issue) => {
                                if (issue.Issue.id === selectedIssue?.Issue.id) {
                                    setSelectedIssue(null);
                                    updateUrlParams({ issueNumber: null });
                                } else {
                                    setSelectedIssue(issue);
                                    updateUrlParams({ issueNumber: issue.Issue.number });
                                }
                            }}
                            className="border w-full flex-shrink"
                        />
                    </ResizablePanel>

                    {/* issue detail pane */}
                    {selectedIssue && selectedOrganisation && (
                        <>
                            <ResizableSeparator />
                            <ResizablePanel id={"right"} defaultSize={"30%"} minSize={360} maxSize={"60%"}>
                                <div className="border">
                                    <IssueDetailPane
                                        project={selectedProject}
                                        sprints={sprints}
                                        issueData={selectedIssue}
                                        members={members}
                                        statuses={selectedOrganisation.Organisation.statuses}
                                        close={() => {
                                            setSelectedIssue(null);
                                            updateUrlParams({ issueNumber: null });
                                        }}
                                        onIssueUpdate={refetchIssues}
                                        onIssueDelete={handleIssueDelete}
                                    />
                                </div>
                            </ResizablePanel>
                        </>
                    )}
                </ResizablePanelGroup>
            )}
        </main>
    );
}
