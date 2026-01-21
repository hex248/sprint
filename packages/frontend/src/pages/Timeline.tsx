import {
    DEFAULT_SPRINT_COLOUR,
    DEFAULT_STATUS_COLOUR,
    type IssueResponse,
    type SprintRecord,
} from "@sprint/shared";
import { useEffect, useMemo, useState } from "react";
import { IssueModal } from "@/components/issue-modal";
import { useSelection } from "@/components/selection-provider";
import { SprintForm } from "@/components/sprint-form";
import StatusTag from "@/components/status-tag";
import TopBar from "@/components/top-bar";
import { BREATHING_ROOM } from "@/lib/layout";
import {
    useIssues,
    useOrganisations,
    useProjects,
    useSelectedOrganisation,
    useSprints,
} from "@/lib/query/hooks";
import { cn } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;
const TIMELINE_LABEL_WIDTH = "240px";

const addDays = (value: Date, days: number) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate() + days);

const toDate = (value: Date | string) => {
    const parsed = value instanceof Date ? value : new Date(value);
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const formatDate = (value: Date | string) =>
    new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" }).toUpperCase();

const formatWeekLabel = (value: Date) =>
    value.toLocaleDateString(undefined, { month: "short", day: "numeric" }).toUpperCase();

const formatTodayLabel = (value: Date) => {
    const parts = new Intl.DateTimeFormat(undefined, { month: "short", day: "2-digit" }).formatToParts(value);
    const month = parts.find((part) => part.type === "month")?.value ?? "";
    const day = parts.find((part) => part.type === "day")?.value ?? "";
    return `${day} ${month}`.trim().toUpperCase();
};

const getSprintDateRange = (sprint: SprintRecord) => {
    return `${formatDate(sprint.startDate)} - ${formatDate(sprint.endDate)}`;
};

type IssueGroup = {
    issuesBySprint: Map<number, IssueResponse[]>;
    unassigned: IssueResponse[];
};

type TimelineRange = {
    start: Date;
    end: Date;
    durationMs: number;
};

export default function Timeline() {
    const { selectedOrganisationId, selectedProjectId, selectOrganisation, selectProject } = useSelection();

    const { data: organisationsData = [] } = useOrganisations();
    const { data: projectsData = [] } = useProjects(selectedOrganisationId);
    const { data: sprintsData = [] } = useSprints(selectedProjectId);
    const { data: issuesData = [] } = useIssues(selectedProjectId);
    const selectedOrganisation = useSelectedOrganisation();

    const organisations = useMemo(
        () => [...organisationsData].sort((a, b) => a.Organisation.name.localeCompare(b.Organisation.name)),
        [organisationsData],
    );

    const projects = useMemo(
        () => [...projectsData].sort((a, b) => a.Project.name.localeCompare(b.Project.name)),
        [projectsData],
    );

    const sprints = useMemo(
        () =>
            [...sprintsData].sort((a, b) => {
                const aStart = a.startDate ? new Date(a.startDate).getTime() : null;
                const bStart = b.startDate ? new Date(b.startDate).getTime() : null;
                if (aStart != null && bStart != null) return aStart - bStart;
                if (aStart == null && bStart == null) return a.name.localeCompare(b.name);
                return aStart == null ? 1 : -1;
            }),
        [sprintsData],
    );

    const issueGroup = useMemo<IssueGroup>(() => {
        const grouped = new Map<number, IssueResponse[]>();
        const unassigned: IssueResponse[] = [];

        for (const issue of issuesData) {
            const sprintId = issue.Issue.sprintId;
            if (!sprintId) {
                unassigned.push(issue);
                continue;
            }
            const current = grouped.get(sprintId);
            if (current) current.push(issue);
            else grouped.set(sprintId, [issue]);
        }

        for (const [sprintId, issues] of grouped.entries()) {
            grouped.set(
                sprintId,
                [...issues].sort((a, b) => a.Issue.number - b.Issue.number),
            );
        }

        return {
            issuesBySprint: grouped,
            unassigned: [...unassigned].sort((a, b) => a.Issue.number - b.Issue.number),
        };
    }, [issuesData]);

    const timelineRange = useMemo<TimelineRange | null>(() => {
        if (sprints.length === 0) return null;
        const today = toDate(new Date());
        let earliest = toDate(sprints[0].startDate);
        let latest = toDate(sprints[0].endDate);

        for (const sprint of sprints) {
            const start = toDate(sprint.startDate);
            const end = toDate(sprint.endDate);
            if (start < earliest) earliest = start;
            if (end > latest) latest = end;
        }

        const rangeStart = today;
        const rangeEnd = addDays(today, 60);
        const durationMs = rangeEnd.getTime() - rangeStart.getTime() + DAY_MS;

        return { start: rangeStart, end: rangeEnd, durationMs };
    }, [sprints]);

    const weeks = useMemo(() => {
        if (!timelineRange) return [] as Date[];
        const output: Date[] = [];
        let cursor = new Date(timelineRange.start);
        while (cursor <= timelineRange.end) {
            output.push(new Date(cursor));
            cursor = addDays(cursor, 7);
        }
        return output;
    }, [timelineRange]);

    useEffect(() => {
        if (organisations.length === 0) return;
        const selected = organisations.find((org) => org.Organisation.id === selectedOrganisationId) ?? null;
        if (!selected) {
            selectOrganisation(organisations[0]);
        }
    }, [organisations, selectedOrganisationId, selectOrganisation]);

    useEffect(() => {
        if (projects.length === 0) return;
        const selected = projects.find((project) => project.Project.id === selectedProjectId) ?? null;
        if (!selected) {
            selectProject(projects[0]);
        }
    }, [projects, selectedProjectId, selectProject]);

    const statuses = selectedOrganisation?.Organisation.statuses ?? {};

    const gridTemplateColumns = useMemo(() => {
        if (weeks.length === 0) return `${TIMELINE_LABEL_WIDTH} 1fr`;
        return `${TIMELINE_LABEL_WIDTH} repeat(${weeks.length}, minmax(140px, 1fr))`;
    }, [weeks.length]);

    const todayMarker = useMemo(() => {
        if (!timelineRange) return null;
        const today = toDate(new Date());
        if (today < timelineRange.start || today > timelineRange.end) return null;
        const left = ((today.getTime() - timelineRange.start.getTime()) / timelineRange.durationMs) * 100;
        return { left: `${left}%`, label: formatTodayLabel(today) };
    }, [timelineRange]);

    const getSprintBarStyle = (sprint: SprintRecord) => {
        if (!timelineRange) return null;
        const start = toDate(sprint.startDate);
        const end = addDays(toDate(sprint.endDate), 1);
        const left = ((start.getTime() - timelineRange.start.getTime()) / timelineRange.durationMs) * 100;
        const right = ((end.getTime() - timelineRange.start.getTime()) / timelineRange.durationMs) * 100;
        const width = Math.max(right - left, 1);
        return {
            left: `${left}%`,
            width: `${width}%`,
            backgroundColor: sprint.color || DEFAULT_SPRINT_COLOUR,
        };
    };

    return (
        <main className={`w-full h-screen flex flex-col gap-${BREATHING_ROOM} p-${BREATHING_ROOM}`}>
            <TopBar />

            <div className={`flex-1 flex flex-col gap-${BREATHING_ROOM}`}>
                {!selectedOrganisationId && (
                    <div className="text-sm text-muted-foreground text-pretty">
                        Select an organisation to view its sprint schedule.
                    </div>
                )}

                {selectedOrganisationId && !selectedProjectId && (
                    <div className="text-sm text-muted-foreground text-pretty">
                        Pick a project to view its sprint timeline.
                    </div>
                )}

                {selectedOrganisationId && selectedProjectId && sprints.length === 0 && (
                    <div className="text-sm text-muted-foreground text-pretty">
                        No sprints yet. Create a sprint from the organisations menu to start planning work.
                    </div>
                )}

                {selectedOrganisationId && selectedProjectId && sprints.length > 0 && (
                    <div className="border">
                        <div className="overflow-x-auto">
                            <div className="min-w-[720px]">
                                <div className="grid border-b bg-muted/20" style={{ gridTemplateColumns }}>
                                    <div
                                        className={`px-${BREATHING_ROOM} py-${BREATHING_ROOM} text-xs font-medium text-muted-foreground bg-background border-r`}
                                    >
                                        Sprint
                                    </div>
                                    {weeks.map((week) => (
                                        <div
                                            key={week.toISOString()}
                                            className={cn(
                                                `px-${BREATHING_ROOM} py-${BREATHING_ROOM} text-xs text-muted-foreground tabular-nums`,
                                                "border-l",
                                            )}
                                        >
                                            {formatWeekLabel(week)}
                                        </div>
                                    ))}
                                </div>

                                {sprints.map((sprint, sprintIndex) => {
                                    const sprintIssues = issueGroup.issuesBySprint.get(sprint.id) ?? [];
                                    const barStyle = getSprintBarStyle(sprint);
                                    const showTodayLabel = sprintIndex === 0;
                                    return (
                                        <div
                                            key={sprint.id}
                                            className="grid border-b"
                                            style={{ gridTemplateColumns }}
                                        >
                                            <div
                                                className={`px-${BREATHING_ROOM} pt-0.5 py-${BREATHING_ROOM} flex flex-col gap-${BREATHING_ROOM} bg-background relative z-20 border-r`}
                                            >
                                                <div className={`flex items-center justify-between gap-3`}>
                                                    <span
                                                        className="text-sm font-medium"
                                                        style={{
                                                            color: sprint.color || DEFAULT_SPRINT_COLOUR,
                                                        }}
                                                    >
                                                        {sprint.name}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-muted-foreground tabular-nums">
                                                    {getSprintDateRange(sprint)}
                                                </div>
                                                {sprintIssues.length === 0 && (
                                                    <div className="text-xs text-muted-foreground text-pretty">
                                                        No issues assigned.
                                                    </div>
                                                )}
                                                {sprintIssues.length > 0 && (
                                                    <div className={`flex flex-col gap-${BREATHING_ROOM}`}>
                                                        {sprintIssues.map((issue) => (
                                                            <IssueLine
                                                                key={issue.Issue.id}
                                                                issue={issue}
                                                                statusColour={
                                                                    statuses[issue.Issue.status] ??
                                                                    DEFAULT_STATUS_COLOUR
                                                                }
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div
                                                className={cn(
                                                    `py-${BREATHING_ROOM} relative min-h-12`,
                                                    "border-l",
                                                )}
                                                style={{ gridColumn: "2 / -1" }}
                                            >
                                                <div className="absolute inset-0 flex z-10 pointer-events-none">
                                                    {weeks.map((week, index) => (
                                                        <div
                                                            key={`${week.toISOString()}-${sprint.id}`}
                                                            className={cn(
                                                                "flex-1",
                                                                index === 0 ? "" : "border-l",
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                                {todayMarker && (
                                                    <div
                                                        className="absolute inset-y-0 z-20 pointer-events-none"
                                                        style={{ left: todayMarker.left }}
                                                    >
                                                        <div className="absolute inset-y-0 w-px bg-primary" />
                                                        {showTodayLabel && (
                                                            <div className="absolute -top-5.5 -translate-x-1/2">
                                                                <span className="rounded bg-primary px-1 py-0.5 text-[10px] font-semibold text-primary-foreground whitespace-nowrap">
                                                                    {todayMarker.label}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {barStyle && (
                                                    <SprintForm
                                                        mode="edit"
                                                        existingSprint={sprint}
                                                        sprints={sprints}
                                                        trigger={
                                                            <button
                                                                type="button"
                                                                aria-label={`Edit sprint ${sprint.name}`}
                                                                className="absolute top-1/2 z-0 h-4 rounded border border-foreground/10 cursor-pointer"
                                                                style={barStyle}
                                                                title={`${sprint.name}: ${getSprintDateRange(sprint)}`}
                                                            />
                                                        }
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                <div className="grid" style={{ gridTemplateColumns }}>
                                    <div
                                        className={`px-${BREATHING_ROOM} pt-0.5 py-${BREATHING_ROOM} flex flex-col gap-${BREATHING_ROOM} bg-background relative z-20 border-r`}
                                    >
                                        <div className="text-sm font-medium text-muted-foreground">
                                            Backlog
                                        </div>
                                        {issueGroup.unassigned.length === 0 && (
                                            <div className="text-xs text-muted-foreground text-pretty">
                                                No unassigned issues.
                                            </div>
                                        )}
                                        {issueGroup.unassigned.length > 0 && (
                                            <div className={`flex flex-col gap-${BREATHING_ROOM}`}>
                                                {issueGroup.unassigned.map((issue) => (
                                                    <IssueLine
                                                        key={issue.Issue.id}
                                                        issue={issue}
                                                        statusColour={
                                                            statuses[issue.Issue.status] ??
                                                            DEFAULT_STATUS_COLOUR
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div
                                        className={cn(
                                            `px-${BREATHING_ROOM} py-${BREATHING_ROOM} border-l text-xs text-muted-foreground`,
                                        )}
                                        style={{ gridColumn: "2 / -1" }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

function IssueLine({ issue, statusColour }: { issue: IssueResponse; statusColour: string }) {
    const [open, setOpen] = useState(false);

    return (
        <IssueModal
            issueData={issue}
            open={open}
            onOpenChange={setOpen}
            trigger={
                <button
                    type="button"
                    className={cn(
                        `flex items-center gap-${BREATHING_ROOM} text-xs text-muted-foreground`,
                        "hover:text-foreground cursor-pointer",
                    )}
                >
                    <StatusTag status={issue.Issue.status} colour={statusColour} className="text-[10px]" />
                    <span className="tabular-nums">#{issue.Issue.number.toString().padStart(3, "0")}</span>
                    <span className="truncate">{issue.Issue.title}</span>
                </button>
            }
        />
    );
}
