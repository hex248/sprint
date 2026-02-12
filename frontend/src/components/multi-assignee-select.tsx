import { ISSUE_ASSIGNEE_NOTE_MAX_LENGTH, type UserResponse } from "@sprint/shared";
import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { UserSelect } from "@/components/user-select";

export type AssigneeSelectValue = {
  userId: string;
  note: string;
};

export function MultiAssigneeSelect({
  users,
  assignees,
  onChange,
  fallbackUsers = [],
}: {
  users: UserResponse[];
  assignees: AssigneeSelectValue[];
  onChange: (assignees: AssigneeSelectValue[]) => void;
  fallbackUsers?: UserResponse[];
}) {
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const nextDrafts: Record<string, string> = {};
    for (const [index, assignee] of assignees.entries()) {
      nextDrafts[`${index}-${assignee.userId}`] = assignee.note;
    }
    setNoteDrafts(nextDrafts);
  }, [assignees]);

  const handleAssigneeChange = (index: number, value: string) => {
    // if set to "unassigned" and there are other rows, remove this row
    if (value === "unassigned" && assignees.length > 1) {
      const newAssignees = assignees.filter((_, i) => i !== index);
      onChange(newAssignees);
      return;
    }

    const newAssignees = [...assignees];
    newAssignees[index] = {
      ...newAssignees[index],
      userId: value,
      note: value === "unassigned" ? "" : (newAssignees[index]?.note ?? ""),
    };
    onChange(newAssignees);
  };

  const handleNoteBlur = (index: number, note: string) => {
    if (assignees[index]?.note === note) {
      return;
    }

    const newAssignees = [...assignees];
    newAssignees[index] = {
      ...newAssignees[index],
      note,
    };
    onChange(newAssignees);
  };

  const handleAddAssignee = () => {
    onChange([...assignees, { userId: "unassigned", note: "" }]);
  };

  const getAvailableUsers = (currentIndex: number) => {
    const selectedIds = assignees
      .filter((_, i) => i !== currentIndex)
      .map((assignee) => assignee.userId)
      .filter((id) => id !== "unassigned")
      .map((id) => Number(id));
    return users.filter((user) => !selectedIds.includes(user.id));
  };

  const getFallbackUser = (userId: string) => {
    if (userId === "unassigned") return null;
    return fallbackUsers.find((u) => u.id.toString() === userId) || null;
  };

  const selectedCount = assignees.filter((assignee) => assignee.userId !== "unassigned").length;
  const lastRowHasSelection = assignees[assignees.length - 1]?.userId !== "unassigned";
  const canAddMore = selectedCount < users.length && lastRowHasSelection;

  return (
    <div className="flex flex-wrap items-end gap-1">
      {assignees.map((assignee, index) => (
        <div key={`assignee-${index}-${assignee.userId}`} className="flex flex-col gap-1">
          <Input
            type="text"
            value={noteDrafts[`${index}-${assignee.userId}`] ?? assignee.note}
            onChange={(event) => {
              const key = `${index}-${assignee.userId}`;
              setNoteDrafts((previous) => ({ ...previous, [key]: event.target.value }));
            }}
            onBlur={(event) => handleNoteBlur(index, event.target.value)}
            placeholder="assignee note"
            maxLength={ISSUE_ASSIGNEE_NOTE_MAX_LENGTH}
            showCounter={false}
            disabled={assignee.userId === "unassigned"}
            className="h-7 w-48"
            inputClassName="text-xs px-2"
          />
          <div className="flex items-center gap-1">
            <UserSelect
              users={getAvailableUsers(index)}
              value={assignee.userId}
              onChange={(value) => handleAssigneeChange(index, value)}
              fallbackUser={getFallbackUser(assignee.userId)}
            />
          </div>
        </div>
      ))}
      {canAddMore && (
        <IconButton onClick={handleAddAssignee} title={"Add assignee"} className="w-9 h-9">
          <Icon icon="plus" className="h-4 w-4" />
        </IconButton>
      )}
    </div>
  );
}
