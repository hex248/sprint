/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
import type { IssueResponse, OrganisationResponse, ProjectResponse, UserRecord } from "@issue/shared";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CreateOrganisation } from "@/components/create-organisation";
import { CreateProject } from "@/components/create-project";
import { IssueDetailPane } from "@/components/issue-detail-pane";
import { IssuesTable } from "@/components/issues-table";
import LogOutButton from "@/components/log-out-button";
import SmallUserDisplay from "@/components/small-user-display";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getAuthHeaders } from "@/lib/utils";
import { Button } from "./components/ui/button";
import { ResizablePanel, ResizablePanelGroup, ResizableSeparator } from "./components/ui/resizable";

function Index() {
    const serverURL = import.meta.env.VITE_SERVER_URL?.trim() || "http://localhost:3000";

    const user = JSON.parse(localStorage.getItem("user") || "{}") as UserRecord;

    const organisationsRef = useRef(false);
    const [organisations, setOrganisations] = useState<OrganisationResponse[]>([]);
    const [organisationSelectOpen, setOrganisationSelectOpen] = useState(false);
    const [selectedOrganisation, setSelectedOrganisation] = useState<OrganisationResponse | null>(null);

    const [projects, setProjects] = useState<ProjectResponse[]>([]);
    const [projectSelectOpen, setProjectSelectOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<ProjectResponse | null>(null);

    const [issues, setIssues] = useState<IssueResponse[]>([]);
    const [selectedIssue, setSelectedIssue] = useState<IssueResponse | null>(null);

    const refetchOrganisations = async (options?: { selectOrganisationId?: number }) => {
        try {
            const res = await fetch(`${serverURL}/organisation/by-user?userId=${user.id}`, {
                headers: getAuthHeaders(),
            });
            const data = (await res.json()) as Array<OrganisationResponse>;

            setOrganisations(data);

            // select newly created organisation
            if (options?.selectOrganisationId) {
                const created = data.find((o) => o.Organisation.id === options.selectOrganisationId);
                if (created) {
                    setSelectedOrganisation(created);
                    return;
                }
            }

            // preserve previously selected organisation
            setSelectedOrganisation((prev) => {
                if (!prev) return data[0] || null;
                const stillExists = data.find((o) => o.Organisation.id === prev.Organisation.id);
                return stillExists || data[0] || null;
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
            const res = await fetch(
                `${serverURL}/projects/by-organisation?organisationId=${organisationId}`,
                {
                    headers: getAuthHeaders(),
                },
            );

            const data = (await res.json()) as ProjectResponse[];
            setProjects(data);

            // select newly created project
            if (options?.selectProjectId) {
                const created = data.find((p) => p.Project.id === options.selectProjectId);
                if (created) {
                    setSelectedProject(created);
                    return;
                }
            }

            // preserve previously selected project
            setSelectedProject((prev) => {
                if (!prev) return data[0] || null;
                const stillExists = data.find((p) => p.Project.id === prev.Project.id);
                return stillExists || data[0] || null;
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

    // fetch issues when project is selected
    useEffect(() => {
        if (!selectedProject) return;

        fetch(`${serverURL}/issues/${selectedProject.Project.key}`, { headers: getAuthHeaders() })
            .then((res) => res.json())
            .then((data: IssueResponse[]) => {
                setIssues(data);
            })
            .catch((err) => {
                console.error("error fetching issues:", err);
            });
    }, [selectedProject]);

    useEffect(() => {
        setSelectedProject((prev) => prev || projects[0] || null);
    }, [projects]);

    return (
        <main className="w-full h-full p-1">
            {/* header area */}
            <div className="flex gap-12 items-center justify-between">
                <div className="flex gap-1 items-center">
                    {/* organisation selection */}
                    <Select
                        value={`${selectedOrganisation?.Organisation.id}`}
                        onValueChange={(value) => {
                            if (value === "NONE") {
                                setSelectedOrganisation(null);
                                return;
                            }
                            const organisation = organisations.find(
                                (o) => o.Organisation.id === Number(value),
                            );
                            if (!organisation) {
                                console.error(`NO ORGANISATION FOUND FOR ID: ${value}`);
                                return;
                            }
                            setSelectedOrganisation(organisation);
                        }}
                        onOpenChange={setOrganisationSelectOpen}
                    >
                        <SelectTrigger className="text-sm" isOpen={organisationSelectOpen}>
                            <SelectValue
                                placeholder={
                                    selectedOrganisation
                                        ? `O: ${selectedOrganisation.Organisation.name}`
                                        : "Select Organisation"
                                }
                            />
                        </SelectTrigger>
                        <SelectContent side="bottom" position="popper">
                            {organisations.map((organisation) => (
                                <SelectItem
                                    key={organisation.Organisation.id}
                                    value={`${organisation.Organisation.id}`}
                                >
                                    {organisation.Organisation.name}
                                </SelectItem>
                            ))}

                            {organisations.length > 0 && <SelectSeparator />}
                            <CreateOrganisation
                                trigger={
                                    <Button variant="ghost" className={"w-full"} size={"sm"}>
                                        Create Organisation
                                    </Button>
                                }
                                completeAction={async (organisationId) => {
                                    if (!selectedOrganisation) return;
                                    await refetchOrganisations({
                                        selectOrganisationId: organisationId,
                                    });
                                }}
                            />
                        </SelectContent>
                    </Select>

                    {/* project selection - only shown when organisation is selected */}
                    {selectedOrganisation && (
                        <Select
                            value={`${selectedProject?.Project.id}`}
                            onValueChange={(value) => {
                                if (value === "NONE") {
                                    setSelectedProject(null);
                                    setSelectedIssue(null);
                                    setIssues([]);
                                    return;
                                }
                                const project = projects.find((p) => p.Project.id === Number(value));
                                if (!project) {
                                    console.error(`NO PROJECT FOUND FOR ID: ${value}`);
                                    return;
                                }
                                setSelectedProject(project);
                                setSelectedIssue(null);
                            }}
                            onOpenChange={setProjectSelectOpen}
                        >
                            <SelectTrigger className="text-sm" isOpen={projectSelectOpen}>
                                <SelectValue
                                    placeholder={
                                        selectedProject
                                            ? `P: ${selectedProject.Project.name}`
                                            : "Select Project"
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent side="bottom" position="popper" align={"start"}>
                                {projects.map((project) => (
                                    <SelectItem key={project.Project.id} value={`${project.Project.id}`}>
                                        {project.Project.name}
                                    </SelectItem>
                                ))}
                                {projects.length > 0 && <SelectSeparator />}
                                <CreateProject
                                    organisationId={selectedOrganisation?.Organisation.id}
                                    trigger={
                                        <Button
                                            size={"sm"}
                                            variant="ghost"
                                            className={"w-full"}
                                            disabled={!selectedOrganisation?.Organisation.id}
                                        >
                                            Create Project
                                        </Button>
                                    }
                                    completeAction={async (projectId) => {
                                        if (!selectedOrganisation) return;
                                        await refetchProjects(selectedOrganisation.Organisation.id, {
                                            selectProjectId: projectId,
                                        });
                                    }}
                                />
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <div className="flex gap-1 items-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger className="text-sm">
                            <SmallUserDisplay user={user} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={"end"}>
                            <DropdownMenuLabel className="text-end">Settings</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild className="flex items-end justify-end">
                                <Link to="/settings/account" className="p-0 text-end">
                                    My Account
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="flex items-end justify-end">
                                <Link to="/settings/organisations" className="p-0 text-end">
                                    My Organisations
                                </Link>
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
            <div className="w-full h-full flex items-start justify-between pt-1 gap-1">
                {selectedProject && issues.length > 0 && (
                    <ResizablePanelGroup>
                        <ResizablePanel id={"left"} minSize={400}>
                            {/* issues list (table) */}
                            <IssuesTable
                                project={selectedProject}
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
