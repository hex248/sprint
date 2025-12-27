import type { IssueResponse, OrganisationResponse, ProjectResponse, UserRecord } from "@issue/shared";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { IssueDetailPane } from "@/components/issue-detail-pane";
import { IssuesTable } from "@/components/issues-table";
import SmallUserDisplay from "@/components/small-user-display";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAuthHeaders } from "@/lib/utils";

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

    useEffect(() => {
        if (organisationsRef.current) return;
        organisationsRef.current = true;

        fetch(`${serverURL}/organisation/by-user?userId=${user.id}`, { headers: getAuthHeaders() })
            .then((res) => res.json())
            .then((data: Array<OrganisationResponse>) => {
                setOrganisations(data);
                setSelectedOrganisation(data[0] || null);
            })
            .catch((err) => {
                console.error("error fetching organisations:", err);
            });
    }, [user.id]);

    // fetch projects when organisation is selected
    useEffect(() => {
        setProjects([]);
        setSelectedProject(null);
        setSelectedIssue(null);
        setIssues([]);
        if (!selectedOrganisation) {
            return;
        }

        fetch(
            `${serverURL}/projects/by-organisation?organisationId=${selectedOrganisation.Organisation.id}`,
            {
                headers: getAuthHeaders(),
            },
        )
            .then((res) => res.json())
            .then((data: ProjectResponse[]) => {
                setProjects(data);
            })
            .catch((err) => {
                console.error("error fetching projects:", err);
                setProjects([]);
            });
    }, [selectedOrganisation]);

    // fetch issues when project is selected
    useEffect(() => {
        if (!selectedProject) return;

        fetch(`${serverURL}/issues/${selectedProject.Project.blob}`, { headers: getAuthHeaders() })
            .then((res) => res.json())
            .then((data: IssueResponse[]) => {
                setIssues(data);
            })
            .catch((err) => {
                console.error("error fetching issues:", err);
            });
    }, [selectedProject]);

    useEffect(() => {
        if (projects.length > 0) {
            setSelectedProject(projects[0]);
        }
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
                            {organisations.length === 0 && <>No organisations</>}
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
                                {projects.length === 0 && <>No projects in this organisation</>}
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
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            {/* main body */}
            <div className="w-full h-full flex items-start justify-between pt-1 gap-1">
                {selectedProject && issues.length > 0 && (
                    <>
                        {/* issues list (table) */}
                        <IssuesTable
                            project={selectedProject}
                            issuesData={issues}
                            columns={{ description: false }}
                            issueSelectAction={setSelectedIssue}
                            className="border w-full flex-shrink"
                        />
                        {/* issue detail pane */}
                        {selectedIssue && (
                            <div className="border w-2xl">
                                <IssueDetailPane
                                    project={selectedProject}
                                    issueData={selectedIssue}
                                    close={() => setSelectedIssue(null)}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* <LogOutButton /> */}
        </main>
    );
}

export default Index;
