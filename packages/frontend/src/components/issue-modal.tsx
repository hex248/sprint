import type { IssueResponse } from "@sprint/shared";
import { type ReactNode, useMemo } from "react";
import { IssueDetails } from "@/components/issue-details";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
    useOrganisationMembers,
    useSelectedOrganisation,
    useSelectedProject,
    useSprints,
} from "@/lib/query/hooks";
import { issueID } from "@/lib/utils";

export function IssueModal({
    issueData,
    open,
    onOpenChange,
    trigger,
}: {
    issueData: IssueResponse | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger: ReactNode;
}) {
    const selectedOrganisation = useSelectedOrganisation();
    const selectedProject = useSelectedProject();
    const { data: sprints = [] } = useSprints(selectedProject?.Project.id);
    const { data: membersData = [] } = useOrganisationMembers(selectedOrganisation?.Organisation.id);

    const members = useMemo(() => membersData.map((member) => member.User), [membersData]);
    const statuses = selectedOrganisation?.Organisation.statuses ?? {};

    if (!issueData || !selectedProject || !selectedOrganisation) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="w-lg p-0" showCloseButton={false}>
                <DialogTitle className="sr-only">
                    {issueID(selectedProject.Project.key, issueData.Issue.number)}
                </DialogTitle>
                <IssueDetails
                    issueData={issueData}
                    projectKey={selectedProject.Project.key}
                    sprints={sprints}
                    members={members}
                    statuses={statuses}
                    onClose={() => onOpenChange(false)}
                    onDelete={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
