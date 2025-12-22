import type { IssueResponse, ProjectResponse, UserRecord } from "@issue/shared";
import { useEffect, useRef, useState } from "react";
import { IssueDetailPane } from "@/components/issue-detail-pane";
import { IssuesTable } from "@/components/issues-table";
import SmallUserDisplay from "@/components/small-user-display";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAuthHeaders } from "@/lib/utils";
import LogOutButton from "./components/log-out-button";

function Index() {
    const serverURL = import.meta.env.VITE_SERVER_URL?.trim() || "http://localhost:3000";

    const user = JSON.parse(localStorage.getItem("user") || "{}") as UserRecord;

    const [selectedProject, setSelectedProject] = useState<ProjectResponse | null>(null);
    const [projects, setProjects] = useState<ProjectResponse[]>([]);
    const projectsRef = useRef(false);

    useEffect(() => {
        if (projectsRef.current) return;
        projectsRef.current = true;

        fetch(`${serverURL}/projects/by-owner?ownerId=${user.id}`, { headers: getAuthHeaders() })
            .then((res) => res.json())
            .then((data: ProjectResponse[]) => {
                setProjects(data);
            })
            .catch((err) => {
                console.error("error fetching projects:", err);
            });
    }, [user.id]);

    const [selectedIssue, setSelectedIssue] = useState<IssueResponse | null>(null);
    const [issuesData, setIssues] = useState<IssueResponse[]>([]);

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

    return (
        <main className="w-full h-full p-1">
            {/* header area */}
            <div className="flex gap-4 items-center justify-between">
                <div className="flex gap-4 items-center">
                    <Select
                        onValueChange={(value) => {
                            if (value === "NONE") {
                                setSelectedProject(null);
                                setSelectedIssue(null);
                                setIssues([]);
                            }
                            const project = projects.find((p) => p.Project.id === Number(value));
                            if (!project) {
                                console.error(`NO PROJECT FOUND FOR ID: ${value}`);
                                return;
                            }
                            setSelectedProject(project);
                            setSelectedIssue(null);
                        }}
                    >
                        <SelectTrigger className="h-8 lg:flex">
                            <SelectValue
                                placeholder={
                                    selectedProject ? `P: ${selectedProject.Project.name}` : "Select Project"
                                }
                            />
                        </SelectTrigger>
                        <SelectContent side="bottom" position="popper">
                            {projects.map((project) => (
                                <SelectItem key={project.Project.id} value={`${project.Project.id}`}>
                                    {project.Project.name}
                                </SelectItem>
                            ))}
                            {projects.length === 0 && <>No projects</>}
                        </SelectContent>
                    </Select>
                    {selectedProject && (
                        <div className="flex items-center gap-2">
                            Owner: <SmallUserDisplay user={selectedProject?.User} />
                        </div>
                    )}
                </div>

                {user && (
                    <div className="flex items-center gap-2">
                        You:
                        <SmallUserDisplay user={user} />
                    </div>
                )}
            </div>
            {/* main body */}
            <div className="w-full h-full flex items-start justify-between pt-1 gap-2">
                {selectedProject && issuesData.length > 0 && (
                    <>
                        {/* issues list (table) */}
                        <IssuesTable
                            project={selectedProject}
                            issuesData={issuesData}
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

            <LogOutButton />
        </main>
    );
}

export default Index;
