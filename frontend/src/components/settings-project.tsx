import type { SprintRecord } from "@sprint/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ProjectForm } from "@/components/project-form";
import { useSelection } from "@/components/selection-provider";
import { useAuthenticatedSession } from "@/components/session-provider";
import SmallSprintDisplay from "@/components/small-sprint-display";
import { SprintForm } from "@/components/sprint-form";
import StatusTag from "@/components/status-tag";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
import Icon from "@/components/ui/icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCloseSprint,
  useDeleteProject,
  useDeleteSprint,
  useIssues,
  useOrganisations,
  useProjects,
  useSprints,
  useUpdateProject,
} from "@/lib/query/hooks";
import { queryKeys } from "@/lib/query/keys";

const projectTabs = ["info", "sprints"];
type SettingsProjectTab = (typeof projectTabs)[number];

function getValidTab(value: string): SettingsProjectTab {
  return projectTabs.includes(value as SettingsProjectTab) ? (value as SettingsProjectTab) : "info";
}

export function SettingsProject() {
  const { user } = useAuthenticatedSession();
  const queryClient = useQueryClient();
  const { selectedOrganisationId, selectedProjectId } = useSelection();

  const { data: organisationsData = [] } = useOrganisations();
  const { data: projectsData = [] } = useProjects(selectedOrganisationId);
  const { data: sprints = [] } = useSprints(selectedProjectId);
  const { data: issues = [] } = useIssues(selectedProjectId);

  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const deleteSprint = useDeleteSprint();
  const closeSprint = useCloseSprint();

  const [activeTab, setActiveTab] = useState<SettingsProjectTab>("info");
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [editSprintOpen, setEditSprintOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<SprintRecord | null>(null);
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

  const selectedOrganisation = useMemo(
    () => organisationsData.find((org) => org.Organisation.id === selectedOrganisationId) ?? null,
    [organisationsData, selectedOrganisationId],
  );

  const projects = useMemo(
    () => [...projectsData].sort((a, b) => a.Project.name.localeCompare(b.Project.name)),
    [projectsData],
  );

  const selectedProject = useMemo(
    () => projects.find((proj) => proj.Project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const isAdmin =
    selectedOrganisation?.OrganisationMember.role === "owner" ||
    selectedOrganisation?.OrganisationMember.role === "admin";

  const isOwner = selectedOrganisation?.OrganisationMember.role === "owner";
  const canDeleteProject = isOwner || (selectedProject && selectedProject.Project.creatorId === user?.id);

  const invalidateProjects = () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.projects.byOrganisation(selectedOrganisationId ?? 0),
    });

  const invalidateSprints = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.sprints.byProject(selectedProjectId ?? 0) });

  const formatDate = (value: Date | string) =>
    new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  const getSprintDateRange = (sprint: SprintRecord) => {
    if (!sprint.startDate || !sprint.endDate) return "";
    return `${formatDate(sprint.startDate)} - ${formatDate(sprint.endDate)}`;
  };

  const isCurrentSprint = (sprint: SprintRecord) => {
    if (!sprint.open || !sprint.startDate || !sprint.endDate) return false;
    const today = new Date();
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    return start <= today && today <= end;
  };

  const openSprints = useMemo(() => sprints.filter((sprint) => sprint.open), [sprints]);

  const defaultSprintAssignment = selectedProject?.Project.defaultSprintAssignment ?? {
    mode: "none",
    sprintId: null,
  };

  const defaultSpecificSprintId =
    defaultSprintAssignment.mode === "specific" ? defaultSprintAssignment.sprintId : null;

  const DEFAULT_SPRINT_NONE_OPTION = "none";
  const DEFAULT_SPRINT_CURRENT_OPTION = "current";
  const SPECIFIC_SPRINT_OPTION_PREFIX = "sprint:";
  const SPECIFIC_SPRINT_UNAVAILABLE_PREFIX = "specific-unavailable:";

  const toSpecificSprintOptionValue = (sprintId: number) => `${SPECIFIC_SPRINT_OPTION_PREFIX}${sprintId}`;

  const unavailableSpecificSprintOptionValue =
    defaultSpecificSprintId != null
      ? `${SPECIFIC_SPRINT_UNAVAILABLE_PREFIX}${defaultSpecificSprintId}`
      : null;

  const selectedDefaultSprintOptionValue =
    defaultSprintAssignment.mode === "none"
      ? DEFAULT_SPRINT_NONE_OPTION
      : defaultSprintAssignment.mode === "current"
        ? DEFAULT_SPRINT_CURRENT_OPTION
        : defaultSpecificSprintId == null
          ? DEFAULT_SPRINT_NONE_OPTION
          : openSprints.some((sprint) => sprint.id === defaultSpecificSprintId)
            ? toSpecificSprintOptionValue(defaultSpecificSprintId)
            : (unavailableSpecificSprintOptionValue ?? DEFAULT_SPRINT_NONE_OPTION);

  const handleDefaultSprintAssignmentUpdate = async (
    nextDefaultSprintAssignment:
      | { mode: "none"; sprintId: null }
      | { mode: "current"; sprintId: null }
      | { mode: "specific"; sprintId: number },
  ) => {
    if (!selectedProject) return;

    await updateProject.mutateAsync({
      id: selectedProject.Project.id,
      defaultSprintAssignment: nextDefaultSprintAssignment,
    });

    const modeLabel =
      nextDefaultSprintAssignment.mode === "none"
        ? "No sprint"
        : nextDefaultSprintAssignment.mode === "current"
          ? "Current sprint"
          : "Specific sprint";

    toast.success(`Default sprint assignment set to ${modeLabel} for ${selectedProject.Project.name}`);
    await invalidateProjects();
  };

  const handleDefaultSprintOptionChange = async (value: string) => {
    if (value === DEFAULT_SPRINT_NONE_OPTION) {
      await handleDefaultSprintAssignmentUpdate({ mode: "none", sprintId: null });
      return;
    }

    if (value === DEFAULT_SPRINT_CURRENT_OPTION) {
      await handleDefaultSprintAssignmentUpdate({ mode: "current", sprintId: null });
      return;
    }

    if (value.startsWith(SPECIFIC_SPRINT_OPTION_PREFIX)) {
      const parsedSprintId = Number(value.slice(SPECIFIC_SPRINT_OPTION_PREFIX.length));
      if (!Number.isFinite(parsedSprintId)) return;

      const selectedSprint = openSprints.find((sprint) => sprint.id === parsedSprintId);
      if (!selectedSprint) {
        toast.error("Select an open sprint.");
        return;
      }

      await handleDefaultSprintAssignmentUpdate({ mode: "specific", sprintId: selectedSprint.id });
      return;
    }

    if (value.startsWith(SPECIFIC_SPRINT_UNAVAILABLE_PREFIX)) {
      return;
    }
  };

  const defaultHandOffStatusSet = useMemo(
    () => new Set(["TODO", "TO DO", "IN PROGRESS", "DOING", "BLOCKED"]),
    [],
  );

  const statusOptions = useMemo(
    () => Object.entries(selectedOrganisation?.Organisation.statuses ?? {}),
    [selectedOrganisation],
  );

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

  const openCloseSprintDialog = (sprint: SprintRecord) => {
    const defaults = Object.keys(selectedOrganisation?.Organisation.statuses ?? {}).filter((status) =>
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

  const handleCloseSprintSubmit = async () => {
    if (!selectedProject || !closingSprint) return;

    const parsedHandOffSprintId = handOffSprintId ? Number(handOffSprintId) : null;
    if (!canCloseWithoutHandOff && !parsedHandOffSprintId) {
      toast.error("Select an open sprint to hand over matching issues.");
      return;
    }

    try {
      const result = await closeSprint.mutateAsync({
        projectId: selectedProject.Project.id,
        sprintId: closingSprint.id,
        statusesToHandOff: handOffStatuses,
        handOffSprintId: parsedHandOffSprintId,
      });

      closeCloseSprintDialog();
      toast.success(
        result.movedIssueCount > 0
          ? `Closed "${closingSprint.name}" and moved ${result.movedIssueCount} issue${
              result.movedIssueCount === 1 ? "" : "s"
            }.`
          : `Closed "${closingSprint.name}".`,
      );

      await invalidateSprints();
    } catch (error) {
      console.error(error);
      toast.error(`Failed to close sprint: ${String(error)}`);
    }
  };

  const closeConfirmDialog = () => {
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  };

  return (
    <section className="flex flex-1 flex-col gap-3 border p-3 overflow-auto">
      <h2 className="text-xl font-600">Project settings</h2>

      <div className="flex flex-col gap-2 flex-1 min-h-0">
        {selectedOrganisation ? (
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(getValidTab(value))}
            className="w-full min-w-0 flex flex-col flex-1 min-h-0"
          >
            <div className="flex flex-wrap gap-2 items-center w-full min-w-0">
              <TabsList>
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="sprints">Sprints</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="info">
              <div className="border p-2 min-w-0 overflow-hidden">
                {selectedProject ? (
                  <>
                    <h2 className="text-xl font-600 mb-2 break-all">{selectedProject.Project.name}</h2>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-muted-foreground break-all">
                        Key: {selectedProject.Project.key}
                      </p>
                      <p className="text-sm text-muted-foreground break-all">
                        Creator: {selectedProject.User.name}
                      </p>
                      {selectedProject.Project.gitRemote && (
                        <p className="text-sm text-muted-foreground break-all">
                          Git remote: {selectedProject.Project.gitRemote}
                        </p>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" onClick={() => setEditProjectOpen(true)}>
                          <Icon icon="edit" className="size-4" />
                          Edit
                        </Button>
                        {canDeleteProject && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setConfirmDialog({
                                open: true,
                                title: "Delete Project",
                                message: `Are you sure you want to delete "${selectedProject.Project.name}"? This will delete all sprints and issues in this project.`,
                                confirmText: "Delete",
                                processingText: "Deleting...",
                                variant: "destructive",
                                onConfirm: async () => {
                                  try {
                                    await deleteProject.mutateAsync(selectedProject.Project.id);
                                    closeConfirmDialog();
                                    toast.success(`Deleted project "${selectedProject.Project.name}"`);
                                    await invalidateProjects();
                                    await invalidateSprints();
                                  } catch (error) {
                                    console.error(error);
                                  }
                                },
                              });
                            }}
                          >
                            <Icon icon="trash" className="size-4" color="white" />
                            Delete
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select a project in the top bar to view details.
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="sprints">
              <div className="border p-2 min-w-0 overflow-hidden">
                {selectedProject ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm">Default sprint assignment:</span>
                      <Select
                        value={selectedDefaultSprintOptionValue}
                        onValueChange={(value) => void handleDefaultSprintOptionChange(value)}
                        disabled={!isAdmin}
                      >
                        <SelectTrigger className="w-fit">
                          <SelectValue placeholder="Select default" />
                        </SelectTrigger>
                        <SelectContent side="bottom" position="popper" align="start">
                          <SelectItem value={DEFAULT_SPRINT_NONE_OPTION}>None</SelectItem>
                          <SelectItem value={DEFAULT_SPRINT_CURRENT_OPTION}>Current</SelectItem>
                          {openSprints.map((sprint) => (
                            <SelectItem key={sprint.id} value={toSpecificSprintOptionValue(sprint.id)}>
                              <SmallSprintDisplay sprint={sprint} />
                            </SelectItem>
                          ))}
                          {unavailableSpecificSprintOptionValue != null &&
                            selectedDefaultSprintOptionValue === unavailableSpecificSprintOptionValue && (
                              <SelectItem value={unavailableSpecificSprintOptionValue}>
                                Specific sprint (unavailable)
                              </SelectItem>
                            )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-2 min-w-0">
                      <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                        {sprints.map((sprintItem) => {
                          const dateRange = getSprintDateRange(sprintItem);
                          const isCurrent = isCurrentSprint(sprintItem);

                          return (
                            <div
                              key={sprintItem.id}
                              className={`flex items-center justify-between p-2 border ${
                                isCurrent ? "border-emerald-500/60 bg-emerald-500/10" : ""
                              }`}
                            >
                              <SmallSprintDisplay sprint={sprintItem} />
                              <div className="flex items-center gap-2">
                                {dateRange && (
                                  <span className="text-xs text-muted-foreground">{dateRange}</span>
                                )}
                                {isAdmin && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger
                                      asChild
                                      size={"sm"}
                                      noStyle
                                      className="hover:opacity-80 cursor-pointer"
                                    >
                                      <Icon icon="ellipsisVertical" className="size-4 text-foreground" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" sideOffset={4} className="bg-background">
                                      <DropdownMenuItem
                                        onSelect={() => {
                                          setEditingSprint(sprintItem);
                                          setEditSprintOpen(true);
                                        }}
                                        className="hover:bg-primary-foreground"
                                      >
                                        <Icon icon="edit" className="size-4 text-muted-foreground" />
                                        Edit
                                      </DropdownMenuItem>
                                      {sprintItem.open && (
                                        <DropdownMenuItem
                                          onSelect={() => openCloseSprintDialog(sprintItem)}
                                          className="hover:bg-primary-foreground"
                                        >
                                          <Icon icon="check" className="size-4 text-muted-foreground" />
                                          Close
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem
                                        variant="destructive"
                                        onSelect={() => {
                                          setConfirmDialog({
                                            open: true,
                                            title: "Delete Sprint",
                                            message: `Are you sure you want to delete "${sprintItem.name}"? Issues assigned to this sprint will become unassigned.`,
                                            confirmText: "Delete",
                                            processingText: "Deleting...",
                                            variant: "destructive",
                                            onConfirm: async () => {
                                              try {
                                                await deleteSprint.mutateAsync(sprintItem.id);
                                                closeConfirmDialog();
                                                toast.success(`Deleted sprint "${sprintItem.name}"`);
                                                await invalidateSprints();
                                              } catch (error) {
                                                console.error(error);
                                              }
                                            },
                                          });
                                        }}
                                        className="hover:bg-destructive/10"
                                      >
                                        <Icon icon="trash" className="size-4" color="white" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {isAdmin && (
                          <SprintForm
                            projectId={selectedProject.Project.id}
                            trigger={
                              <Button variant="outline" size="sm">
                                Create sprint <Icon icon="plus" className="size-4" />
                              </Button>
                            }
                            sprints={sprints}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select a project in the top bar to manage sprints.
                  </p>
                )}
              </div>
            </TabsContent>

            {selectedProject && (
              <>
                <ProjectForm
                  mode="edit"
                  existingProject={selectedProject.Project}
                  open={editProjectOpen}
                  onOpenChange={setEditProjectOpen}
                  completeAction={async () => {
                    await invalidateProjects();
                  }}
                />
                <SprintForm
                  mode="edit"
                  projectId={selectedProject.Project.id}
                  existingSprint={editingSprint ?? undefined}
                  sprints={sprints}
                  statuses={selectedOrganisation?.Organisation.statuses ?? {}}
                  issues={issues}
                  open={editSprintOpen}
                  onOpenChange={(open) => {
                    setEditSprintOpen(open);
                    if (!open) setEditingSprint(null);
                  }}
                  completeAction={async () => {
                    await invalidateSprints();
                  }}
                />
                <Dialog
                  open={closeSprintOpen}
                  onOpenChange={(nextOpen) => {
                    if (!nextOpen) {
                      closeCloseSprintDialog();
                      return;
                    }
                    setCloseSprintOpen(nextOpen);
                  }}
                >
                  <DialogContent className="w-md max-w-md">
                    <DialogHeader>
                      <DialogTitle>Close sprint</DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col gap-3">
                      <p className="text-sm text-muted-foreground">
                        Close <span className="text-foreground">{closingSprint?.name}</span> and hand over any
                        matching issues.
                      </p>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-sm">Statuses to hand over</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="w-full justify-between" size="default">
                            {handOffStatuses.length > 0
                              ? `${handOffStatuses.length} selected`
                              : "Select statuses"}
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-56">
                            <DropdownMenuLabel>Statuses</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {statusOptions.length === 0 && (
                              <DropdownMenuItem disabled>No statuses</DropdownMenuItem>
                            )}
                            {statusOptions.map(([status, colour]) => (
                              <DropdownMenuCheckboxItem
                                key={status}
                                checked={handOffStatuses.includes(status)}
                                onCheckedChange={(checked) => {
                                  setHandOffStatuses((current) =>
                                    checked
                                      ? Array.from(new Set([...current, status]))
                                      : current.filter((item) => item !== status),
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
                        <Select value={handOffSprintId} onValueChange={setHandOffSprintId}>
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
                        <Button
                          variant="outline"
                          onClick={closeCloseSprintDialog}
                          disabled={closeSprint.isPending}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => void handleCloseSprintSubmit()}
                          disabled={closeSprint.isPending || (!canCloseWithoutHandOff && !handOffSprintId)}
                        >
                          {closeSprint.isPending ? "Closing..." : "Close sprint"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </Tabs>
        ) : (
          <p className="text-sm text-muted-foreground">
            Select an organisation in the top bar to manage settings.
          </p>
        )}

        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          processingText={confirmDialog.processingText}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          variant={confirmDialog.variant}
        />
      </div>
    </section>
  );
}
