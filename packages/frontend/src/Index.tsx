import type { IssueRecord, ProjectRecord } from "@issue/shared";
import { useEffect, useRef, useState } from "react";
import { IssueDetailPane } from "@/components/issue-detail-pane";
import { IssuesTable } from "@/components/issues-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function Index() {
    const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null);
    const [projects, setProjects] = useState<ProjectRecord[]>([]);
    const projectsRef = useRef(false);

    useEffect(() => {
        if (projectsRef.current) return;
        projectsRef.current = true;

        fetch("http://localhost:3000/projects/all")
            .then((res) => res.json())
            .then((data: ProjectRecord[]) => {
                setProjects(data);
            })
            .catch((err) => {
                console.error("error fetching projects:", err);
            });
    }, []);

    const [selectedIssue, setSelectedIssue] = useState<IssueRecord | null>(null);
    const [issues, setIssues] = useState<IssueRecord[]>([]);

    const serverURL = import.meta.env.SERVER_URL?.trim() || "http://localhost:3000";

    useEffect(() => {
        if (!selectedProject) return;

        fetch(`${serverURL}/issues/${selectedProject.blob}`)
            .then((res) => res.json())
            .then((data: IssueRecord[]) => {
                setIssues(data);
            })
            .catch((err) => {
                console.error("error fetching issues:", err);
            });
    }, [selectedProject]);

    return (
        <main className="w-full h-full p-2">
            {/* header area */}
            <div className="flex gap-2">
                <Select
                    onValueChange={(value) => {
                        if (value === "NONE") {
                            setSelectedProject(null);
                            setSelectedIssue(null);
                            setIssues([]);
                        }
                        const project = projects.find((p) => p.id === Number(value));
                        if (!project) {
                            // TODO: toast here
                            console.error(`NO PROJECT FOUND FOR ID: ${value}`);
                            return;
                        }
                        setSelectedProject(project);
                        setSelectedIssue(null);
                    }}
                >
                    <SelectTrigger className="h-8 lg:flex">
                        <SelectValue
                            placeholder={selectedProject ? `P: ${selectedProject.name}` : "Select Project"}
                        />
                    </SelectTrigger>
                    <SelectContent side="bottom" position="popper">
                        {projects.map((project) => (
                            <SelectItem key={project.id} value={`${project.id}`}>
                                {project.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {/* main body */}
            <div className="w-full h-full flex items-start justify-between pt-2 gap-2">
                {/* issues list (table) */}
                <IssuesTable
                    issues={issues}
                    columns={{ description: false }}
                    issueSelectAction={setSelectedIssue}
                    className="border w-full flex-shrink"
                />
                {/* issue detail pane */}
                {selectedIssue && (
                    <div className="border w-2xl">
                        <IssueDetailPane issue={selectedIssue} close={() => setSelectedIssue(null)} />
                    </div>
                )}
            </div>
        </main>
    );
}

export default Index;
