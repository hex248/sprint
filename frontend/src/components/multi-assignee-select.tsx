import type { UserResponse } from "@sprint/shared";
import Icon from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { UserSelect } from "@/components/user-select";

export function MultiAssigneeSelect({
  users,
  assigneeIds,
  onChange,
  fallbackUsers = [],
}: {
  users: UserResponse[];
  assigneeIds: string[];
  onChange: (assigneeIds: string[]) => void;
  fallbackUsers?: UserResponse[];
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
    <div className="flex flex-wrap gap-1">
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
            <IconButton onClick={handleAddAssignee} title={"Add assignee"} className="w-9 h-9">
              <Icon icon="plus" className="h-4 w-4" />
            </IconButton>
          )}
        </>
      ))}
    </div>
  );
}
