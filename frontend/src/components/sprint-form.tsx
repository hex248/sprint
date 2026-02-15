import { DEFAULT_SPRINT_COLOUR, type IssueResponse, type SprintRecord } from "@sprint/shared";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CloseSprintDialog } from "@/components/close-sprint";
// import { FreeTierLimit } from "@/components/free-tier-limit";
import { useAuthenticatedSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import ColourPicker from "@/components/ui/colour-picker";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCloseSprint, useCreateSprint, useDeleteSprint, useUpdateSprint } from "@/lib/query/hooks";
import { parseError } from "@/lib/server";
import { cn } from "@/lib/utils";

const SPRINT_NAME_MAX_LENGTH = 64;
// const free_tier_sprint_limit = 5;

const getStartOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const getEndOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(23, 59, 0, 0);
  return next;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getDefaultDates = (sprints: SprintRecord[]) => {
  if (sprints.length === 0) {
    const today = new Date();
    return {
      start: getStartOfDay(today),
      end: getEndOfDay(addDays(today, 6)),
    };
  }

  const baseSprints = sprints.filter((sprint) => !sprint.open);
  const candidateSprints = baseSprints.length > 0 ? baseSprints : sprints;

  const latest = candidateSprints.reduce((current, sprint) => {
    const currentEnd = new Date(current.endDate).getTime();
    const sprintEnd = new Date(sprint.endDate).getTime();
    if (sprintEnd !== currentEnd) {
      return sprintEnd > currentEnd ? sprint : current;
    }
    const currentStart = new Date(current.startDate).getTime();
    const sprintStart = new Date(sprint.startDate).getTime();
    return sprintStart > currentStart ? sprint : current;
  }, candidateSprints[0]);

  const start = getStartOfDay(addDays(new Date(latest.endDate), 1));
  return {
    start,
    end: getEndOfDay(addDays(start, 6)),
  };
};

export function SprintForm({
  projectId,
  sprints,
  trigger,
  completeAction,
  mode = "create",
  existingSprint,
  statuses = {},
  issues = [],
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  projectId?: number;
  sprints: SprintRecord[];
  trigger?: React.ReactNode;
  completeAction?: (sprint: SprintRecord) => void | Promise<void>;
  mode?: "create" | "edit";
  existingSprint?: SprintRecord;
  statuses?: Record<string, string>;
  issues?: IssueResponse[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { user } = useAuthenticatedSession();
  const createSprint = useCreateSprint();
  const updateSprint = useUpdateSprint();
  const deleteSprint = useDeleteSprint();
  const closeSprint = useCloseSprint();

  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;

  const defaultDates = useMemo(() => getDefaultDates(sprints), [sprints]);
  const [name, setName] = useState("");
  const [colour, setColour] = useState(DEFAULT_SPRINT_COLOUR);
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closeSprintOpen, setCloseSprintOpen] = useState(false);
  const [closingSprint, setClosingSprint] = useState<SprintRecord | null>(null);
  const [handOffStatuses, setHandOffStatuses] = useState<string[]>([]);
  const [handOffSprintId, setHandOffSprintId] = useState<string>("");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmText: string;
    processingText: string;
    variant: "default" | "destructive";
    onConfirm: () => Promise<void>;
  }>({
    open: false,
    title: "",
    message: "",
    confirmText: "",
    processingText: "",
    variant: "default",
    onConfirm: async () => {},
  });

  const isEdit = mode === "edit";

  useEffect(() => {
    if (isEdit && existingSprint && open) {
      setName(existingSprint.name);
      setColour(existingSprint.color);
      setStartDate(new Date(existingSprint.startDate));
      setEndDate(new Date(existingSprint.endDate));
    }
  }, [isEdit, existingSprint, open]);

  const dateError = useMemo(() => {
    if (!submitAttempted) return "";
    if (startDate > endDate) {
      return "End date must be after start date";
    }
    return "";
  }, [endDate, startDate, submitAttempted]);

  const defaultHandOffStatusSet = useMemo(
    () => new Set(["TODO", "TO DO", "IN PROGRESS", "DOING", "BLOCKED"]),
    [],
  );
  const statusOptions = useMemo(() => Object.entries(statuses), [statuses]);
  const openHandOffSprints = useMemo(
    () => sprints.filter((sprint) => sprint.open && sprint.id !== closingSprint?.id),
    [sprints, closingSprint],
  );
  const matchingHandOffIssueCount = useMemo(() => {
    if (!closingSprint || handOffStatuses.length === 0) return 0;
    return issues.filter(
      (issue) => issue.Issue.sprintId === closingSprint.id && handOffStatuses.includes(issue.Issue.status),
    ).length;
  }, [issues, closingSprint, handOffStatuses]);
  const canCloseWithoutHandOff = matchingHandOffIssueCount === 0;

  const reset = () => {
    const defaults = getDefaultDates(sprints);
    setName("");
    setColour(DEFAULT_SPRINT_COLOUR);
    setStartDate(defaults.start);
    setEndDate(defaults.end);
    setSubmitAttempted(false);
    setSubmitting(false);
    setError(null);
  };

  const onOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      reset();
      closeCloseSprintDialog();
      closeConfirmDialog();
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitAttempted(true);

    if (name.trim() === "" || name.trim().length > SPRINT_NAME_MAX_LENGTH) {
      return;
    }

    if (startDate > endDate) {
      return;
    }

    if (!user.id) {
      setError(`you must be logged in to ${isEdit ? "edit" : "create"} a sprint`);
      return;
    }

    if (!isEdit && !projectId) {
      setError("select a project first");
      return;
    }

    setSubmitting(true);

    try {
      if (isEdit && existingSprint) {
        const data = await updateSprint.mutateAsync({
          id: existingSprint.id,
          name,
          color: colour,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });
        setOpen(false);
        reset();
        toast.success("Sprint updated");
        try {
          await completeAction?.(data);
        } catch (actionErr) {
          console.error(actionErr);
        }
      } else {
        if (!projectId) {
          setError("select a project first");
          return;
        }
        const data = await createSprint.mutateAsync({
          projectId,
          name,
          color: colour,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });
        setOpen(false);
        reset();
        toast.success(
          <>
            Created sprint <span style={{ color: data.color }}>{data.name}</span>
          </>,
          {
            dismissible: false,
          },
        );
        try {
          await completeAction?.(data);
        } catch (actionErr) {
          console.error(actionErr);
        }
      }
    } catch (submitError) {
      const message = parseError(submitError as Error);
      console.error(submitError);
      setError(message || `failed to ${isEdit ? "update" : "create"} sprint`);
      setSubmitting(false);
      toast.error(`Error ${isEdit ? "updating" : "creating"} sprint: ${message}`, {
        dismissible: false,
      });
    }
  };

  const openCloseSprintDialog = (sprint: SprintRecord) => {
    const defaults = Object.keys(statuses).filter((status) =>
      defaultHandOffStatusSet.has(status.trim().toUpperCase()),
    );
    setClosingSprint(sprint);
    setHandOffStatuses(defaults);
    setHandOffSprintId("");
    setCloseSprintOpen(true);
  };

  const closeCloseSprintDialog = () => {
    setCloseSprintOpen(false);
    setClosingSprint(null);
    setHandOffStatuses([]);
    setHandOffSprintId("");
  };

  const closeConfirmDialog = () => {
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  };

  const handleCloseSprintSubmit = async () => {
    if (!closingSprint) return;

    const parsedHandOffSprintId = handOffSprintId ? Number(handOffSprintId) : null;
    if (!canCloseWithoutHandOff && !parsedHandOffSprintId) {
      toast.error("Select an open sprint to hand over matching issues.");
      return;
    }

    setError(null);

    try {
      const result = await closeSprint.mutateAsync({
        projectId: projectId ?? closingSprint.projectId,
        sprintId: closingSprint.id,
        statusesToHandOff: handOffStatuses,
        handOffSprintId: parsedHandOffSprintId,
      });

      closeCloseSprintDialog();
      setOpen(false);
      reset();
      toast.success(
        result.movedIssueCount > 0
          ? `Closed "${closingSprint.name}" and moved ${result.movedIssueCount} issue${result.movedIssueCount === 1 ? "" : "s"}.`
          : `Closed "${closingSprint.name}".`,
      );
      try {
        await completeAction?.({ ...closingSprint, open: false });
      } catch (actionErr) {
        console.error(actionErr);
      }
    } catch (submitError) {
      console.error(submitError);
      setError("failed to close sprint");
      toast.error(`Failed to close sprint: ${String(submitError)}`, {
        dismissible: false,
      });
    }
  };

  // filter out current sprint from the calendar display when editing
  const calendarSprints =
    isEdit && existingSprint ? sprints.filter((s) => s.id !== existingSprint.id) : sprints;

  const dialogContent = (
    <DialogContent className={cn("w-sm", (error || dateError) && "border-destructive")}>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Sprint" : "Create Sprint"}</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Field
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            validate={(value) =>
              value.trim() === ""
                ? "Cannot be empty"
                : value.trim().length > SPRINT_NAME_MAX_LENGTH
                  ? `Too long (${SPRINT_NAME_MAX_LENGTH} character limit)`
                  : undefined
            }
            submitAttempted={submitAttempted}
            placeholder="Sprint 1"
            maxLength={SPRINT_NAME_MAX_LENGTH}
          />

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    {startDate.toLocaleDateString()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    currentSprint={{ colour, startDate, endDate }}
                    selected={startDate}
                    onSelect={(value) => {
                      if (!value) return;
                      setStartDate(getStartOfDay(value));
                    }}
                    autoFocus
                    sprints={calendarSprints}
                    showWeekNumber
                    showOutsideDays={false}
                    defaultMonth={startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    {endDate.toLocaleDateString()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    currentSprint={{ colour, startDate, endDate }}
                    selected={endDate}
                    onSelect={(value) => {
                      if (!value) return;
                      setEndDate(getEndOfDay(value));
                    }}
                    autoFocus
                    sprints={calendarSprints}
                    isEnd
                    showWeekNumber
                    showOutsideDays={false}
                    defaultMonth={endDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Label>Colour</Label>
            <ColourPicker colour={colour} onChange={setColour} />
          </div>

          <div className="flex items-end justify-end w-full text-xs -mb-2 -mt-2">
            {error || dateError ? (
              <Label className="text-destructive text-sm">{error ?? dateError}</Label>
            ) : (
              <Label className="opacity-0 text-sm">a</Label>
            )}
          </div>

          {/* {!isEdit && (
            <FreeTierLimit
              current={sprints.length}
              limit={FREE_TIER_SPRINT_LIMIT}
              itemName="sprint"
              isPro={user.plan === "pro"}
              showUpgrade={sprints.length >= FREE_TIER_SPRINT_LIMIT}
            />
          )} */}

          <div className="flex gap-2 w-full justify-between mt-2">
            <div className="flex gap-2">
              {isEdit && existingSprint && (
                <Button
                  variant="destructive"
                  type="button"
                  onClick={() => {
                    setConfirmDialog({
                      open: true,
                      title: "Delete Sprint",
                      message: `Are you sure you want to delete "${existingSprint.name}"? Issues assigned to this sprint will become unassigned.`,
                      confirmText: "Delete",
                      processingText: "Deleting...",
                      variant: "destructive",
                      onConfirm: async () => {
                        try {
                          await deleteSprint.mutateAsync(existingSprint.id);
                          closeConfirmDialog();
                          setOpen(false);
                          reset();
                          toast.success(`Deleted sprint "${existingSprint.name}"`);
                          await completeAction?.(existingSprint);
                        } catch (deleteError) {
                          console.error(deleteError);
                        }
                      },
                    });
                  }}
                  disabled={submitting || closeSprint.isPending || deleteSprint.isPending}
                >
                  {deleteSprint.isPending ? "Deleting..." : "Delete"}
                </Button>
              )}
              {isEdit && existingSprint?.open && (
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => openCloseSprintDialog(existingSprint)}
                  disabled={submitting || closeSprint.isPending || deleteSprint.isPending}
                >
                  {closeSprint.isPending ? "Closing..." : "Close"}
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  type="button"
                  disabled={closeSprint.isPending || deleteSprint.isPending}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={
                  submitting ||
                  closeSprint.isPending ||
                  deleteSprint.isPending ||
                  ((name.trim() === "" || name.trim().length > SPRINT_NAME_MAX_LENGTH) && submitAttempted) ||
                  (dateError !== "" && submitAttempted)
                }
              >
                {submitting ? (isEdit ? "Saving..." : "Creating...") : isEdit ? "Save" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </DialogContent>
  );

  const closeDialogOnOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      closeCloseSprintDialog();
      return;
    }
    setCloseSprintOpen(nextOpen);
  };

  const auxiliaryDialogs = (
    <>
      <CloseSprintDialog
        open={closeSprintOpen}
        onOpenChange={closeDialogOnOpenChange}
        sprintName={closingSprint?.name}
        handOffStatuses={handOffStatuses}
        onHandOffStatusesChange={setHandOffStatuses}
        statusOptions={statusOptions}
        handOffSprintId={handOffSprintId}
        onHandOffSprintIdChange={setHandOffSprintId}
        openHandOffSprints={openHandOffSprints}
        matchingHandOffIssueCount={matchingHandOffIssueCount}
        canCloseWithoutHandOff={canCloseWithoutHandOff}
        isPending={closeSprint.isPending}
        onCancel={closeCloseSprintDialog}
        onSubmit={() => void handleCloseSprintSubmit()}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) closeConfirmDialog();
        }}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        processingText={confirmDialog.processingText}
        variant={confirmDialog.variant}
        onConfirm={() => {
          void confirmDialog.onConfirm();
        }}
      />
    </>
  );

  if (isControlled) {
    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          {dialogContent}
        </Dialog>
        {auxiliaryDialogs}
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" disabled={!projectId}>
              Create Sprint
            </Button>
          )}
        </DialogTrigger>
        {dialogContent}
      </Dialog>
      {auxiliaryDialogs}
    </>
  );
}
