/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
import type { IssueResponse, OrganisationResponse, ProjectResponse, UserRecord } from "@issue/shared";
import { useEffect, useRef, useState } from "react";
import AccountDialog from "@/components/account-dialog";
import { CreateIssue } from "@/components/create-issue";
import { IssueDetailPane } from "@/components/issue-detail-pane";
import { IssuesTable } from "@/components/issues-table";
import LogOutButton from "@/components/log-out-button";
import { OrganisationSelect } from "@/components/organisation-select";
import OrganisationsDialog from "@/components/organisations-dialog";
import { ProjectSelect } from "@/components/project-select";
import { ServerConfigurationDialog } from "@/components/server-configuration-dialog";
import SmallUserDisplay from "@/components/small-user-display";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResizablePanel, ResizablePanelGroup, ResizableSeparator } from "@/components/ui/resizable";
import { issue, organisation, project } from "@/lib/server";

function Index() {
    const userData = JSON.parse(localStorage.getItem("user") || "{}") as UserRecord;

    const [user, setUser] = useState<UserRecord>(userData);

    const organisationsRef = useRef(false);
    const [organisations, setOrganisations] = useState<OrganisationResponse[]>([]);
    const [selectedOrganisation, setSelectedOrganisation] = useState<OrganisationResponse | null>(null);

    const [projects, setProjects] = useState<ProjectResponse[]>([]);
    const [selectedProject, setSelectedProject] = useState<ProjectResponse | null>(null);

    const [issues, setIssues] = useState<IssueResponse[]>([]);
    const [selectedIssue, setSelectedIssue] = useState<IssueResponse | null>(null);

    const refetchUser = async () => {
        const userData = JSON.parse(localStorage.getItem("user") || "{}") as UserRecord;
        setUser(userData);
    };

    const refetchOrganisations = async (options?: { selectOrganisationId?: number }) => {
        try {
            await organisation.byUser({
                userId: user.id,
                onSuccess: (data) => {
                    const organisations = data as OrganisationResponse[];
                    organisations.sort((a, b) => a.Organisation.name.localeCompare(b.Organisation.name));
                    setOrganisations(organisations);

                    let selected: OrganisationResponse | null = null;

                    if (options?.selectOrganisationId) {
                        const created = organisations.find(
                            (o) => o.Organisation.id === options.selectOrganisationId,
                        );
                        if (created) {
                            selected = created;
                        }
                    } else {
                        const savedId = localStorage.getItem("selectedOrganisationId");
                        if (savedId) {
                            const saved = organisations.find((o) => o.Organisation.id === Number(savedId));
                            if (saved) {
                                selected = saved;
                            }
                        }
                    }

                    if (!selected) {
                        selected = organisations[0] || null;
                    }

                    setSelectedOrganisation(selected);
                },
                onError: (error) => {
                    console.error("error fetching organisations:", error);
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
                        const savedId = localStorage.getItem("selectedProjectId");
                        if (savedId) {
                            const saved = projects.find((p) => p.Project.id === Number(savedId));
                            if (saved) {
                                selected = saved;
                            }
                        }
                    }

                    if (!selected) {
                        selected = projects[0] || null;
                    }

                    setSelectedProject(selected);
                },
                onError: (error) => {
                    console.error("error fetching projects:", error);
                },
            });
        } catch (err) {
            console.error("error fetching projects:", err);
            setProjects([]);
        }
    };

    // fetch projects when organisation is selected
    useEffect(() => {
        setProjects([]);
        setSelectedProject(null);
        setSelectedIssue(null);
        setIssues([]);
        if (!selectedOrganisation) {
            return;
        }

        void refetchProjects(selectedOrganisation.Organisation.id);
    }, [selectedOrganisation]);

    const refetchIssues = async () => {
        try {
            await issue.byProject({
                projectId: selectedProject?.Project.id || 0,
                onSuccess: (data) => {
                    const issues = data as IssueResponse[];
                    issues.reverse(); // newest at the bottom, but if the order has been rearranged, respect that
                    setIssues(issues);
                },
                onError: (error) => {
                    console.error("error fetching issues:", error);
                    setIssues([]);
                },
            });
        } catch (err) {
            console.error("error fetching issues:", err);
            setIssues([]);
        }
    };

    // fetch issues when project is selected
    useEffect(() => {
        if (!selectedProject) return;

        void refetchIssues();
    }, [selectedProject]);

    return (
        <main className="w-full h-screen flex flex-col">
            {/* header area */}
            <div className="flex gap-12 items-center justify-between p-1">
                <div className="flex gap-1 items-center">
                    {/* organisation selection */}
                    <OrganisationSelect
                        organisations={organisations}
                        selectedOrganisation={selectedOrganisation}
                        onSelectedOrganisationChange={(org) => {
                            setSelectedOrganisation(org);
                            localStorage.setItem("selectedOrganisationId", `${org?.Organisation.id}`);
                        }}
                        onCreateOrganisation={async (organisationId) => {
                            await refetchOrganisations({ selectOrganisationId: organisationId });
                        }}
                    />

                    {/* project selection - only shown when organisation is selected */}
                    {selectedOrganisation && (
                        <ProjectSelect
                            projects={projects}
                            selectedProject={selectedProject}
                            organisationId={selectedOrganisation?.Organisation.id}
                            onSelectedProjectChange={(project) => {
                                setSelectedProject(project);
                                localStorage.setItem("selectedProjectId", `${project?.Project.id}`);
                                setSelectedIssue(null);
                            }}
                            onCreateProject={async (projectId) => {
                                if (!selectedOrganisation) return;
                                await refetchProjects(selectedOrganisation.Organisation.id, {
                                    selectProjectId: projectId,
                                });
                            }}
                        />
                    )}
                    {selectedOrganisation && selectedProject && (
                        <CreateIssue
                            projectId={selectedProject?.Project.id}
                            completeAction={async () => {
                                if (!selectedProject) return;
                                await refetchIssues();
                            }}
                        />
                    )}
                </div>
                <div className="flex gap-1 items-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger className="text-sm">
                            <SmallUserDisplay user={user} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={"end"}>
                            <DropdownMenuItem asChild className="flex items-end justify-end">
                                <AccountDialog
                                    onUpdate={async () => {
                                        refetchUser();
                                    }}
                                />
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="flex items-end justify-end">
                                <OrganisationsDialog
                                    organisations={organisations}
                                    selectedOrganisation={selectedOrganisation}
                                    setSelectedOrganisation={setSelectedOrganisation}
                                    refetchOrganisations={refetchOrganisations}
                                />
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="flex items-end justify-end">
                                <ServerConfigurationDialog
                                    trigger={
                                        <Button
                                            variant="ghost"
                                            className="flex w-full gap-2 items-center justify-end text-end px-2 py-1 m-0 h-auto"
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
            <div className="w-full h-full flex items-start justify-between p-1 gap-1">
                {selectedProject && issues.length > 0 && (
                    <ResizablePanelGroup>
                        <ResizablePanel id={"left"} minSize={400}>
                            {/* issues list (table) */}
                            <IssuesTable
                                issuesData={issues}
                                columns={{ description: false }}
                                issueSelectAction={setSelectedIssue}
                                className="border w-full flex-shrink"
                            />
                        </ResizablePanel>

                        {/* issue detail pane */}
                        {selectedIssue && (
                            <>
                                <ResizableSeparator />
                                <ResizablePanel
                                    id={"right"}
                                    defaultSize={"30%"}
                                    minSize={360}
                                    maxSize={"60%"}
                                >
                                    <div className="border">
                                        <IssueDetailPane
                                            project={selectedProject}
                                            issueData={selectedIssue}
                                            close={() => setSelectedIssue(null)}
                                        />
                                    </div>
                                </ResizablePanel>
                            </>
                        )}
                    </ResizablePanelGroup>
                )}
            </div>

            {/* <LogOutButton /> */}
        </main>
    );
}

export default Index;
