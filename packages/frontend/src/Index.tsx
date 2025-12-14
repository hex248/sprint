import type { IssueRecord, ProjectRecord } from "@issue/shared";
import { useEffect, useRef, useState } from "react";
import { IssuesTable } from "@/components/issues-table";
import { IssueDetailPane } from "./components/issue-detail-pane";

function Index() {
    const [projects, setProjects] = useState<ProjectRecord[]>([]);
    const projectsRef = useRef(false);

    useEffect(() => {
        if (projectsRef.current) return;
        projectsRef.current = true;

        fetch("http://localhost:3000/projects/all")
            .then((res) => res.json())
            .then((data: ProjectRecord[]) => {
                setProjects(data);
                console.log("fetched projects:", data);
            })
            .catch((err) => {
                console.error("error fetching projects:", err);
            });
    }, []);

    const [selectedIssue, setSelectedIssue] = useState<IssueRecord | null>(null);
    const [issues, setIssues] = useState<IssueRecord[]>([]);
    const issuesRef = useRef(false);

    const serverURL = import.meta.env.SERVER_URL?.trim() || "http://localhost:3000";

    useEffect(() => {
        if (issuesRef.current) return;
        issuesRef.current = true;

        fetch(`${serverURL}/issues/all`)
            .then((res) => res.json())
            .then((data: IssueRecord[]) => {
                setIssues(data);
                console.log("fetched issues:", data);
            })
            .catch((err) => {
                console.error("error fetching issues:", err);
            });
    }, []);

    return (
        <main className="w-full h-full p-2">
            {/* header area */}
            <div className="flex gap-2">
                <span className="border-1 px-2 py-1">project selection</span>
                <span className="border-1 px-2 py-1">filters</span>
            </div>
            {/* main body */}
            <div className="w-full h-full flex items-start justify-between pt-2 gap-2">
                {/* issues list (table) */}
                <div id={"issues-table"} className="border w-full flex-shrink">
                    <IssuesTable
                        issues={issues}
                        columns={{ description: false }}
                        issueSelectAction={setSelectedIssue}
                    />
                </div>
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
