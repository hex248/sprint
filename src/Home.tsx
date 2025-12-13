import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CloudSync, RefreshCw } from "lucide-react";

function Issue({ issue }: { issue: any }) {
    return (
        <div className="w-sm p-4 border">
            [{issue.id}] {issue.title}
        </div>
    );
}

function Home() {
    const [issues, setIssues] = useState([]);

    const serverURL = import.meta.env.SERVER_URL?.trim() || "http://localhost:3000";

    async function getIssues() {
        const res = await fetch(`${serverURL}/issues/all`);
        const data = await res.json();
        setIssues(data);
    }

    return (
        <main className="w-full h-[100vh] flex flex-col items-center justify-center gap-4 p-4">
            <h1>Issue Project Manager</h1>
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

            {issues.length > 0 && (
                <>
                    {issues.map((issue: any) => (
                        <Issue key={issue.id} issue={issue} />
                    ))}
                    <pre className="w-2xl max-h-96 overflow-auto p-4 border bg-">
                        {JSON.stringify(issues, null, 2)}
                    </pre>
                </>
            )}
        </main>
    );
}

export default Home;
