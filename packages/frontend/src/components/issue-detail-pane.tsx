import type { IssueRecord } from "@issue/shared";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IssueDetailPane({ issue, close }: { issue: IssueRecord; close: () => void }) {
    return (
        <div className="flex flex-col items-end">
            <Button variant={"dummy"} onClick={close} className="px-0 py-0 w-6 h-6">
                <X />
            </Button>

            <div className="flex flex-col w-full p-2 gap-2">
                <h1 className="text-md">{issue.title}</h1>
                <p className="text-sm">{issue.description}</p>
            </div>
        </div>
    );
}
