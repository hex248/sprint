import type { UserRecord } from "@sprint/shared";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserSelect } from "@/components/user-select";

export function MultiAssigneeSelect({
    users,
    assigneeIds,
    onChange,
    fallbackUsers = [],
}: {
    users: UserRecord[];
    assigneeIds: string[];
    onChange: (assigneeIds: string[]) => void;
    fallbackUsers?: UserRecord[];
}) {
    const handleAssigneeChange = (index: number, value: string) => {
        // if set to "unassigned" and there are other rows, remove this row
        if (value === "unassigned" && assigneeIds.length > 1) {
            const newAssigneeIds = assigneeIds.filter((_, i) => i !== index);
            onChange(newAssigneeIds);
            return;
        }

        const newAssigneeIds = [...assigneeIds];
        newAssigneeIds[index] = value;
        onChange(newAssigneeIds);
    };

    const handleAddAssignee = () => {
        onChange([...assigneeIds, "unassigned"]);
    };

    const getAvailableUsers = (currentIndex: number) => {
        const selectedIds = assigneeIds
            .filter((_, i) => i !== currentIndex)
            .filter((id) => id !== "unassigned")
            .map((id) => Number(id));
        return users.filter((user) => !selectedIds.includes(user.id));
    };

    const getFallbackUser = (assigneeId: string) => {
        if (assigneeId === "unassigned") return null;
        return fallbackUsers.find((u) => u.id.toString() === assigneeId) || null;
    };

    const selectedCount = assigneeIds.filter((id) => id !== "unassigned").length;
    const lastRowHasSelection = assigneeIds[assigneeIds.length - 1] !== "unassigned";
    const canAddMore = selectedCount < users.length && lastRowHasSelection;

    return (
        <div className="grid grid-cols-2 gap-1">
            {assigneeIds.map((assigneeId, index) => (
                <>
                    <div key={`assignee-${index}-${assigneeId}`} className="flex items-center gap-1">
                        <UserSelect
                            users={getAvailableUsers(index)}
                            value={assigneeId}
                            onChange={(value) => handleAssigneeChange(index, value)}
                            fallbackUser={getFallbackUser(assigneeId)}
                        />
                    </div>
                    {index === assigneeIds.length - 1 && canAddMore && (
                        <Button
                            variant="dummy"
                            size="icon"
                            className="h-7 w-7 shrink-0 h-9"
                            onClick={handleAddAssignee}
                            title="Add assignee"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    )}
                </>
            ))}
        </div>
    );
}
