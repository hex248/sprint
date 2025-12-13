import { CloudSync, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IssueRecord } from "@issue/shared";

function Issue({ issue }: { issue: IssueRecord }) {
    return (
        <div className="w-sm p-4 border">
            [{issue.id}] {issue.title}
        </div>
    );
}

function Index() {
    const [issues, setIssues] = useState<IssueRecord[]>([]);

    const serverURL = import.meta.env.SERVER_URL?.trim() || "http://localhost:3000";

    async function getIssues() {
        const res = await fetch(`${serverURL}/issues/all`);
        const data = await res.json();
        setIssues(data);
    }

    return (
        <main className="w-full h-[100vh] flex flex-col items-center justify-center gap-4 p-4">
            <h1 className="text-3xl font-bold">Issue Project Manager</h1>

            <div className="flex gap-2">
                <Button onClick={getIssues} className={""}>
                    {issues.length > 0 ? (
                        <>
                            re-fetch issues
                            <RefreshCw />
                        </>
                    ) : (
                        <>
                            fetch issues
                            <CloudSync />
                        </>
                    )}
                </Button>
                <Button variant="outline" linkTo={"/test"}>
                    Go to Test Page
                </Button>
            </div>

            {issues.length > 0 && (
                <pre className="w-2xl max-h-96 overflow-auto p-4 border bg-">
                    {JSON.stringify(issues, null, 2)}
                </pre>
            )}
        </main>
    );
}

export default Index;
