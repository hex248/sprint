import { DEFAULT_SPRINT_COLOUR, type SprintRecord } from "@sprint/shared";
import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
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
import { parseError, sprint } from "@/lib/server";
import { cn } from "@/lib/utils";

const SPRINT_NAME_MAX_LENGTH = 64;

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

export function CreateSprint({
    projectId,
    trigger,
    completeAction,
}: {
    projectId?: number;
    trigger?: React.ReactNode;
    completeAction?: (sprint: SprintRecord) => void | Promise<void>;
}) {
    const { user } = useAuthenticatedSession();

    const { start, end } = getDefaultDates();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [colour, setColour] = useState(DEFAULT_SPRINT_COLOUR);
    const [startDate, setStartDate] = useState(start);
    const [endDate, setEndDate] = useState(end);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            setError("you must be logged in to create a sprint");
            return;
        }

        if (!projectId) {
            setError("select a project first");
            return;
        }

        setSubmitting(true);

        try {
            await sprint.create({
                projectId,
                name,
                color: colour, // hm - always unsure which i should use
                startDate,
                endDate,
                onSuccess: async (data) => {
                    setOpen(false);
                    reset();
                    try {
                        await completeAction?.(data);
                    } catch (actionErr) {
                        console.error(actionErr);
                    }
                },
                onError: (err) => {
                    const message = parseError(err);
                    setError(message);
                    setSubmitting(false);

                    toast.error(`Error creating sprint: ${message}`, {
                        dismissible: false,
                    });
                },
            });
        } catch (submitError) {
            console.error(submitError);
            setError("failed to create sprint");
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" disabled={!projectId}>
                        Create Sprint
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className={cn("w-md", (error || dateError) && "border-destructive")}>
                <DialogHeader>
                    <DialogTitle>Create Sprint</DialogTitle>
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
                                            selected={startDate}
                                            onSelect={(value) => {
                                                if (!value) return;
                                                setStartDate(getStartOfDay(value));
                                            }}
                                            autoFocus
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
                                            selected={endDate}
                                            onSelect={(value) => {
                                                if (!value) return;
                                                setEndDate(getEndOfDay(value));
                                            }}
                                            autoFocus
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
                                    ((name.trim() === "" || name.trim().length > SPRINT_NAME_MAX_LENGTH) &&
                                        submitAttempted) ||
                                    (dateError !== "" && submitAttempted)
                                }
                            >
                                {submitting ? "Creating..." : "Create"}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
