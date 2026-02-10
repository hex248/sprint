import type { SprintRecord } from "@sprint/shared";
import StatusTag from "@/components/status-tag";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CloseSprintDialog({
  open,
  onOpenChange,
  sprintName,
  handOffStatuses,
  onHandOffStatusesChange,
  statusOptions,
  handOffSprintId,
  onHandOffSprintIdChange,
  openHandOffSprints,
  matchingHandOffIssueCount,
  canCloseWithoutHandOff,
  isPending,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprintName?: string;
  handOffStatuses: string[];
  onHandOffStatusesChange: (statuses: string[]) => void;
  statusOptions: [string, string][];
  handOffSprintId: string;
  onHandOffSprintIdChange: (value: string) => void;
  openHandOffSprints: SprintRecord[];
  matchingHandOffIssueCount: number;
  canCloseWithoutHandOff: boolean;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-md max-w-md">
        <DialogHeader>
          <DialogTitle>Close sprint</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Close <span className="text-foreground">{sprintName}</span> and hand over any matching issues.
          </p>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm">Statuses to hand over</span>
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full justify-between" size="default">
                {handOffStatuses.length > 0 ? `${handOffStatuses.length} selected` : "Select statuses"}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Statuses</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {statusOptions.length === 0 && <DropdownMenuItem disabled>No statuses</DropdownMenuItem>}
                {statusOptions.map(([status, colour]) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={handOffStatuses.includes(status)}
                    onCheckedChange={(checked) => {
                      onHandOffStatusesChange(
                        checked
                          ? Array.from(new Set([...handOffStatuses, status]))
                          : handOffStatuses.filter((item) => item !== status),
                      );
                    }}
                  >
                    <StatusTag status={status} colour={colour} />
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm">Handover sprint</span>
            <Select value={handOffSprintId} onValueChange={onHandOffSprintIdChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select open sprint" />
              </SelectTrigger>
              <SelectContent>
                {openHandOffSprints.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No open sprints available
                  </SelectItem>
                ) : (
                  openHandOffSprints.map((sprint) => (
                    <SelectItem key={sprint.id} value={String(sprint.id)}>
                      {sprint.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            {matchingHandOffIssueCount > 0
              ? `${matchingHandOffIssueCount} issue${matchingHandOffIssueCount === 1 ? "" : "s"} match the selected statuses. Select an open sprint to hand over.`
              : "No issues match the selected statuses. You can close without selecting a handover sprint."}
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={isPending || (!canCloseWithoutHandOff && !handOffSprintId)}>
              {isPending ? "Closing..." : "Close sprint"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
