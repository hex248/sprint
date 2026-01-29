import { DEFAULT_SPRINT_COLOUR, type SprintRecord } from "@sprint/shared";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FreeTierLimit } from "@/components/free-tier-limit";
import { useAuthenticatedSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import ColourPicker from "@/components/ui/colour-picker";
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
import { useCreateSprint, useUpdateSprint } from "@/lib/query/hooks";
import { parseError } from "@/lib/server";
import { cn } from "@/lib/utils";

const SPRINT_NAME_MAX_LENGTH = 64;
const FREE_TIER_SPRINT_LIMIT = 5;

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

const getDefaultDates = () => {
  const today = new Date();
  return {
    start: getStartOfDay(today),
    end: getEndOfDay(addDays(today, 14)),
  };
};

export function SprintForm({
  projectId,
  sprints,
  trigger,
  completeAction,
  mode = "create",
  existingSprint,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  projectId?: number;
  sprints: SprintRecord[];
  trigger?: React.ReactNode;
  completeAction?: (sprint: SprintRecord) => void | Promise<void>;
  mode?: "create" | "edit";
  existingSprint?: SprintRecord;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { user } = useAuthenticatedSession();
  const createSprint = useCreateSprint();
  const updateSprint = useUpdateSprint();

  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;

  const { start, end } = getDefaultDates();
  const [name, setName] = useState("");
  const [colour, setColour] = useState(DEFAULT_SPRINT_COLOUR);
  const [startDate, setStartDate] = useState(start);
  const [endDate, setEndDate] = useState(end);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const reset = () => {
    const defaults = getDefaultDates();
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

          {!isEdit && (
            <FreeTierLimit
              current={sprints.length}
              limit={FREE_TIER_SPRINT_LIMIT}
              itemName="sprint"
              isPro={user.plan === "pro"}
              showUpgrade={sprints.length >= FREE_TIER_SPRINT_LIMIT}
            />
          )}

          <div className="flex gap-2 w-full justify-end mt-2">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={
                submitting ||
                ((name.trim() === "" || name.trim().length > SPRINT_NAME_MAX_LENGTH) && submitAttempted) ||
                (dateError !== "" && submitAttempted) ||
                (!isEdit && user.plan !== "pro" && sprints.length >= FREE_TIER_SPRINT_LIMIT)
              }
              title={
                !isEdit && user.plan !== "pro" && sprints.length >= FREE_TIER_SPRINT_LIMIT
                  ? `Free tier limited to ${FREE_TIER_SPRINT_LIMIT} sprints per project. Upgrade to Pro for unlimited sprints.`
                  : undefined
              }
            >
              {submitting ? (isEdit ? "Saving..." : "Creating...") : isEdit ? "Save" : "Create"}
            </Button>
          </div>
        </div>
      </form>
    </DialogContent>
  );

  if (isControlled) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {dialogContent}
      </Dialog>
    );
  }

  return (
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
  );
}
