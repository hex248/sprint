import { DEFAULT_STATUS_COLOUR, ISSUE_STATUS_MAX_LENGTH, type SprintRecord } from "@sprint/shared";
import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AddMemberDialog } from "@/components/add-member-dialog";
import { OrganisationModal } from "@/components/organisation-modal";
import { OrganisationSelect } from "@/components/organisation-select";
import { ProjectModal } from "@/components/project-modal";
import { ProjectSelect } from "@/components/project-select";
import { useSelection } from "@/components/selection-provider";
import { useAuthenticatedSession } from "@/components/session-provider";
import SmallSprintDisplay from "@/components/small-sprint-display";
import SmallUserDisplay from "@/components/small-user-display";
import { SprintModal } from "@/components/sprint-modal";
import StatusTag from "@/components/status-tag";
import { Button } from "@/components/ui/button";
import ColourPicker from "@/components/ui/colour-picker";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Icon from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    useDeleteOrganisation,
    useDeleteProject,
    useDeleteSprint,
    useOrganisationMembers,
    useOrganisations,
    useProjects,
    useRemoveOrganisationMember,
    useReplaceIssueStatus,
    useSprints,
    useUpdateOrganisation,
    useUpdateOrganisationMemberRole,
} from "@/lib/query/hooks";
import { queryKeys } from "@/lib/query/keys";
import { issue } from "@/lib/server";
import { capitalise } from "@/lib/utils";

function OrganisationsDialog({ trigger }: { trigger?: ReactNode }) {
    const { user } = useAuthenticatedSession();
    const queryClient = useQueryClient();
    const { selectedOrganisationId, selectedProjectId } = useSelection();
    const { data: organisationsData = [] } = useOrganisations();
    const { data: projectsData = [] } = useProjects(selectedOrganisationId);
    const { data: sprints = [] } = useSprints(selectedProjectId);
    const { data: membersData = [] } = useOrganisationMembers(selectedOrganisationId);
    const updateOrganisation = useUpdateOrganisation();
    const updateMemberRole = useUpdateOrganisationMemberRole();
    const removeMember = useRemoveOrganisationMember();
    const deleteOrganisation = useDeleteOrganisation();
    const deleteProject = useDeleteProject();
    const deleteSprint = useDeleteSprint();
    const replaceIssueStatus = useReplaceIssueStatus();

    const organisations = useMemo(
        () => [...organisationsData].sort((a, b) => a.Organisation.name.localeCompare(b.Organisation.name)),
        [organisationsData],
    );
    const projects = useMemo(
        () => [...projectsData].sort((a, b) => a.Project.name.localeCompare(b.Project.name)),
        [projectsData],
    );
    const selectedOrganisation = useMemo(
        () => organisations.find((org) => org.Organisation.id === selectedOrganisationId) ?? null,
        [organisations, selectedOrganisationId],
    );
    const selectedProject = useMemo(
        () => projects.find((proj) => proj.Project.id === selectedProjectId) ?? null,
        [projects, selectedProjectId],
    );

    const invalidateOrganisations = () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.organisations.byUser() });
    const invalidateProjects = () =>
        queryClient.invalidateQueries({
            queryKey: queryKeys.projects.byOrganisation(selectedOrganisationId ?? 0),
        });
    const invalidateMembers = useCallback(
        () =>
            queryClient.invalidateQueries({
                queryKey: queryKeys.organisations.members(selectedOrganisationId ?? 0),
            }),
        [queryClient, selectedOrganisationId],
    );
    const invalidateSprints = () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.sprints.byProject(selectedProjectId ?? 0) });
    const members = useMemo(() => {
        const roleOrder: Record<string, number> = { owner: 0, admin: 1, member: 2 };
        return [...membersData].sort((a, b) => {
            const roleA = roleOrder[a.OrganisationMember.role] ?? 3;
            const roleB = roleOrder[b.OrganisationMember.role] ?? 3;
            if (roleA !== roleB) return roleA - roleB;
            return a.User.name.localeCompare(b.User.name);
        });
    }, [membersData]);

    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("info");

    const [statuses, setStatuses] = useState<Record<string, string>>({});
    const [isCreatingStatus, setIsCreatingStatus] = useState(false);
    const [newStatusName, setNewStatusName] = useState("");
    const [newStatusColour, setNewStatusColour] = useState(DEFAULT_STATUS_COLOUR);
    const [statusError, setStatusError] = useState<string | null>(null);
    const [statusToRemove, setStatusToRemove] = useState<string | null>(null);
    const [issuesUsingStatus, setIssuesUsingStatus] = useState<number>(0);
    const [reassignToStatus, setReassignToStatus] = useState<string>("");

    // edit/delete state for organisations, projects, and sprints
    const [editOrgOpen, setEditOrgOpen] = useState(false);
    const [editProjectOpen, setEditProjectOpen] = useState(false);
    const [editSprintOpen, setEditSprintOpen] = useState(false);
    const [editingSprint, setEditingSprint] = useState<SprintRecord | null>(null);

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

    const isAdmin =
        selectedOrganisation?.OrganisationMember.role === "owner" ||
        selectedOrganisation?.OrganisationMember.role === "admin";

    const isOwner = selectedOrganisation?.OrganisationMember.role === "owner";

    const canDeleteProject = isOwner || (selectedProject && selectedProject.Project.creatorId === user?.id);

    const formatDate = (value: Date | string) =>
        new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const getSprintDateRange = (sprint: SprintRecord) => {
        if (!sprint.startDate || !sprint.endDate) return "";
        return `${formatDate(sprint.startDate)} - ${formatDate(sprint.endDate)}`;
    };
    const isCurrentSprint = (sprint: SprintRecord) => {
        if (!sprint.startDate || !sprint.endDate) return false;
        const today = new Date();
        const start = new Date(sprint.startDate);
        const end = new Date(sprint.endDate);
        return start <= today && today <= end;
    };

    const handleRoleChange = (memberUserId: number, memberName: string, currentRole: string) => {
        if (!selectedOrganisation) return;
        const action = currentRole === "admin" ? "demote" : "promote";
        const newRole = currentRole === "admin" ? "member" : "admin";
        setConfirmDialog({
            open: true,
            title: action === "promote" ? "Promote Member" : "Demote Member",
            message: `Are you sure you want to ${action} ${memberName} to ${newRole}?`,
            confirmText: action === "promote" ? "Promote" : "Demote",
            processingText: action === "promote" ? "Promoting..." : "Demoting...",
            variant: action === "demote" ? "destructive" : "default",
            onConfirm: async () => {
                try {
                    await updateMemberRole.mutateAsync({
                        organisationId: selectedOrganisation.Organisation.id,
                        userId: memberUserId,
                        role: newRole,
                    });
                    closeConfirmDialog();
                    toast.success(`${capitalise(action)}d ${memberName} to ${newRole} successfully`, {
                        dismissible: false,
                    });
                } catch (err) {
                    console.error(err);
                    toast.error(
                        `Error ${action.slice(0, -1)}ing ${memberName} to ${newRole}: ${String(err)}`,
                        {
                            dismissible: false,
                        },
                    );
                }
            },
        });
    };

    const closeConfirmDialog = () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
    };

    const handleRemoveMember = (memberUserId: number, memberName: string) => {
        if (!selectedOrganisation) return;
        setConfirmDialog({
            open: true,
            title: "Remove Member",
            message: `Are you sure you want to remove ${memberName} from this organisation?`,
            confirmText: "Remove",
            processingText: "Removing...",
            variant: "destructive",
            onConfirm: async () => {
                try {
                    await removeMember.mutateAsync({
                        organisationId: selectedOrganisation.Organisation.id,
                        userId: memberUserId,
                    });
                    closeConfirmDialog();
                    toast.success(
                        `Removed ${memberName} from ${selectedOrganisation.Organisation.name} successfully`,
                        {
                            dismissible: false,
                        },
                    );
                } catch (err) {
                    console.error(err);
                    toast.error(
                        `Error removing member from ${selectedOrganisation.Organisation.name}: ${String(err)}`,
                        {
                            dismissible: false,
                        },
                    );
                }
            },
        });
    };

    useEffect(() => {
        if (selectedOrganisation) {
            setStatuses(selectedOrganisation.Organisation.statuses);
        }
    }, [selectedOrganisation]);

    const updateStatuses = async (
        newStatuses: Record<string, string>,
        statusRemoved?: { name: string; colour: string },
        statusAdded?: { name: string; colour: string },
        statusMoved?: { name: string; colour: string; currentIndex: number; nextIndex: number },
    ) => {
        if (!selectedOrganisation) return;

        try {
            await updateOrganisation.mutateAsync({
                id: selectedOrganisation.Organisation.id,
                statuses: newStatuses,
            });
            setStatuses(newStatuses);
            if (statusAdded) {
                toast.success(
                    <>
                        Created <StatusTag status={statusAdded.name} colour={statusAdded.colour} /> status
                        successfully
                    </>,
                    {
                        dismissible: false,
                    },
                );
            } else if (statusRemoved) {
                toast.success(
                    <>
                        Removed <StatusTag status={statusRemoved.name} colour={statusRemoved.colour} /> status
                        successfully
                    </>,
                    {
                        dismissible: false,
                    },
                );
            } else if (statusMoved) {
                toast.success(
                    <>
                        Moved <StatusTag status={statusMoved.name} colour={statusMoved.colour} /> from
                        position
                        {statusMoved.currentIndex + 1} to {statusMoved.nextIndex + 1} successfully
                    </>,
                    {
                        dismissible: false,
                    },
                );
            }
            await invalidateOrganisations();
        } catch (err) {
            console.error("error updating statuses:", err);
            if (statusAdded) {
                toast.error(
                    <>
                        Error adding <StatusTag status={statusAdded.name} colour={statusAdded.colour} /> to{" "}
                        {selectedOrganisation.Organisation.name}: {String(err)}
                    </>,
                    {
                        dismissible: false,
                    },
                );
            } else if (statusRemoved) {
                toast.error(
                    <>
                        Error removing <StatusTag status={statusRemoved.name} colour={statusRemoved.colour} />{" "}
                        from {selectedOrganisation.Organisation.name}: {String(err)}
                    </>,
                    {
                        dismissible: false,
                    },
                );
            } else if (statusMoved) {
                toast.error(
                    <>
                        Error moving <StatusTag status={statusMoved.name} colour={statusMoved.colour} /> from
                        position
                        {statusMoved.currentIndex + 1} to {statusMoved.nextIndex + 1}{" "}
                        {selectedOrganisation.Organisation.name}: {String(err)}
                    </>,
                    {
                        dismissible: false,
                    },
                );
            }
        }
    };

    const handleCreateStatus = async () => {
        const trimmed = newStatusName.trim().toUpperCase();
        if (!trimmed) return;

        if (trimmed.length > ISSUE_STATUS_MAX_LENGTH) {
            setStatusError(`status must be <= ${ISSUE_STATUS_MAX_LENGTH} characters`);
            return;
        }

        if (Object.keys(statuses).includes(trimmed)) {
            setNewStatusName("");
            setIsCreatingStatus(false);
            setStatusError(null);
            return;
        }
        const newStatuses = { ...statuses };
        newStatuses[trimmed] = newStatusColour;
        await updateStatuses(newStatuses, undefined, { name: trimmed, colour: newStatusColour });

        setNewStatusName("");
        setNewStatusColour(DEFAULT_STATUS_COLOUR);
        setIsCreatingStatus(false);
        setStatusError(null);
    };

    const handleRemoveStatusClick = async (status: string) => {
        if (Object.keys(statuses).length <= 1 || !selectedOrganisation) return;
        try {
            const data = await issue.statusCount(selectedOrganisation.Organisation.id, status);
            const count = data.find((item) => item.status === status)?.count ?? 0;
            if (count > 0) {
                setStatusToRemove(status);
                setIssuesUsingStatus(count);
                const remaining = Object.keys(statuses).filter((item) => item !== status);
                setReassignToStatus(remaining[0] || "");
                return;
            }

            const nextStatuses = Object.keys(statuses).filter((item) => item !== status);
            await updateStatuses(
                Object.fromEntries(nextStatuses.map((statusKey) => [statusKey, statuses[statusKey]])),
                { name: status, colour: statuses[status] },
            );
        } catch (err) {
            console.error("error checking status usage:", err);
            toast.error(
                <>
                    Error checking status usage for <StatusTag status={status} colour={statuses[status]} />:{" "}
                    {String(err)}
                </>,
                {
                    dismissible: false,
                },
            );
        }
    };

    const moveStatus = async (status: string, direction: "up" | "down") => {
        const currentIndex = Object.keys(statuses).indexOf(status);
        if (currentIndex === -1) return;

        const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
        if (nextIndex < 0 || nextIndex >= Object.keys(statuses).length) return;
        const nextStatuses = [...Object.keys(statuses)];
        [nextStatuses[currentIndex], nextStatuses[nextIndex]] = [
            nextStatuses[nextIndex],
            nextStatuses[currentIndex],
        ];

        await updateStatuses(
            Object.fromEntries(nextStatuses.map((status) => [status, statuses[status]])),
            undefined,
            undefined,
            { name: status, colour: statuses[status], currentIndex, nextIndex },
        );
    };

    const confirmRemoveStatus = async () => {
        if (!statusToRemove || !reassignToStatus || !selectedOrganisation) return;

        try {
            await replaceIssueStatus.mutateAsync({
                organisationId: selectedOrganisation.Organisation.id,
                oldStatus: statusToRemove,
                newStatus: reassignToStatus,
            });
            const newStatuses = Object.keys(statuses).filter((item) => item !== statusToRemove);
            await updateStatuses(
                Object.fromEntries(newStatuses.map((status) => [status, statuses[status]])),
                { name: statusToRemove, colour: statuses[statusToRemove] },
            );
            setStatusToRemove(null);
            setReassignToStatus("");
        } catch (error) {
            console.error("error replacing status:", error);
            toast.error(
                <>
                    Error removing <StatusTag status={statusToRemove} colour={statuses[statusToRemove]} />{" "}
                    from
                    {selectedOrganisation.Organisation.name}: {String(error)}
                </>,
                {
                    dismissible: false,
                },
            );
        }
    };

    useEffect(() => {
        if (!open || !selectedOrganisationId) return;
        void invalidateMembers();
    }, [open, invalidateMembers, selectedOrganisationId]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" className="flex w-full justify-end px-2 py-1 m-0 h-auto">
                        My Organisations
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Organisations</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-2">
                    {selectedOrganisation ? (
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0">
                            <div className="flex flex-wrap gap-2 items-center w-full min-w-0">
                                <OrganisationSelect
                                    contentClass={
                                        "data-[side=bottom]:translate-y-2 data-[side=bottom]:translate-x-0.25"
                                    }
                                />
                                <TabsList>
                                    <TabsTrigger value="info">Info</TabsTrigger>
                                    <TabsTrigger value="users">Users</TabsTrigger>
                                    <TabsTrigger value="projects">Projects</TabsTrigger>
                                    <TabsTrigger value="issues">Issues</TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="info">
                                <div className="border p-2 min-w-0 overflow-hidden">
                                    <h2 className="text-xl font-600 mb-2 break-all">
                                        {selectedOrganisation.Organisation.name}
                                    </h2>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm text-muted-foreground break-all">
                                            Slug: {selectedOrganisation.Organisation.slug}
                                        </p>
                                        <p className="text-sm text-muted-foreground break-all">
                                            Role: {selectedOrganisation.OrganisationMember.role}
                                        </p>
                                        {selectedOrganisation.Organisation.description ? (
                                            <p className="text-sm break-words">
                                                {selectedOrganisation.Organisation.description}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground break-words">
                                                No description
                                            </p>
                                        )}
                                    </div>
                                    {isAdmin && (
                                        <div className="flex gap-2 mt-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setEditOrgOpen(true)}
                                            >
                                                <Icon icon="edit" className="size-4" />
                                                Edit
                                            </Button>
                                            {isOwner && (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => {
                                                        setConfirmDialog({
                                                            open: true,
                                                            title: "Delete Organisation",
                                                            message: `Are you sure you want to delete "${selectedOrganisation.Organisation.name}"? This action cannot be undone and will delete all projects, sprints, and issues.`,
                                                            confirmText: "Delete",
                                                            processingText: "Deleting...",
                                                            variant: "destructive",
                                                            onConfirm: async () => {
                                                                try {
                                                                    await deleteOrganisation.mutateAsync(
                                                                        selectedOrganisation.Organisation.id,
                                                                    );
                                                                    closeConfirmDialog();
                                                                    toast.success(
                                                                        `Deleted organisation "${selectedOrganisation.Organisation.name}"`,
                                                                    );
                                                                    await invalidateOrganisations();
                                                                } catch (error) {
                                                                    console.error(error);
                                                                }
                                                            },
                                                        });
                                                    }}
                                                >
                                                    <Icon icon="trash" className="size-4" />
                                                    Delete
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <OrganisationModal
                                    mode="edit"
                                    existingOrganisation={selectedOrganisation.Organisation}
                                    open={editOrgOpen}
                                    onOpenChange={setEditOrgOpen}
                                    completeAction={async () => {
                                        await invalidateOrganisations();
                                    }}
                                />
                            </TabsContent>

                            <TabsContent value="users">
                                <div className="border p-2 min-w-0 overflow-hidden">
                                    <h2 className="text-xl font-600 mb-2">
                                        {members.length} Member{members.length !== 1 ? "s" : ""}
                                    </h2>
                                    <div className="flex flex-col gap-2 w-full">
                                        <div className="flex flex-col gap-2 max-h-56 overflow-y-scroll">
                                            {members.map((member) => (
                                                <div
                                                    key={member.OrganisationMember.id}
                                                    className="flex items-center justify-between p-2 border"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <SmallUserDisplay user={member.User} />
                                                        <span className="text-sm text-muted-foreground">
                                                            {member.OrganisationMember.role}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {isAdmin &&
                                                            member.OrganisationMember.role !== "owner" &&
                                                            member.User.id !== user.id && (
                                                                <>
                                                                    <IconButton
                                                                        onClick={() =>
                                                                            handleRoleChange(
                                                                                member.User.id,
                                                                                member.User.name,
                                                                                member.OrganisationMember
                                                                                    .role,
                                                                            )
                                                                        }
                                                                        variant={
                                                                            member.OrganisationMember.role ===
                                                                            "admin"
                                                                                ? "yellow"
                                                                                : "green"
                                                                        }
                                                                    >
                                                                        {member.OrganisationMember.role ===
                                                                        "admin" ? (
                                                                            <Icon
                                                                                icon="chevronDown"
                                                                                className="size-5"
                                                                            />
                                                                        ) : (
                                                                            <Icon
                                                                                icon="chevronUp"
                                                                                className="size-5"
                                                                            />
                                                                        )}
                                                                    </IconButton>
                                                                    <IconButton
                                                                        variant="destructive"
                                                                        onClick={() =>
                                                                            handleRemoveMember(
                                                                                member.User.id,
                                                                                member.User.name,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Icon icon="x" className="size-5" />
                                                                    </IconButton>
                                                                </>
                                                            )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {isAdmin && (
                                            <AddMemberDialog
                                                organisationId={selectedOrganisation.Organisation.id}
                                                existingMembers={members.map((m) => m.User.username)}
                                                onSuccess={(user) => {
                                                    toast.success(
                                                        `${user.name} added to ${selectedOrganisation.Organisation.name} successfully`,
                                                        {
                                                            dismissible: false,
                                                        },
                                                    );

                                                    void invalidateMembers();
                                                }}
                                                trigger={
                                                    <Button variant="outline">
                                                        Add user <Icon icon="plus" className="size-4" />
                                                    </Button>
                                                }
                                            />
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="projects">
                                <div className="border p-2 min-w-0 overflow-hidden">
                                    <div className="flex flex-col gap-3">
                                        <ProjectSelect showLabel />
                                        <div className="flex gap-3 flex-col">
                                            <div className="border p-2 min-w-0 overflow-hidden">
                                                {selectedProject ? (
                                                    <>
                                                        <h2 className="text-xl font-600 mb-2 break-all">
                                                            {selectedProject.Project.name}
                                                        </h2>
                                                        <div className="flex flex-col gap-1">
                                                            <p className="text-sm text-muted-foreground break-all">
                                                                Key: {selectedProject.Project.key}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground break-all">
                                                                Creator: {selectedProject.User.name}
                                                            </p>
                                                        </div>
                                                        {isAdmin && (
                                                            <div className="flex gap-2 mt-3">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setEditProjectOpen(true)}
                                                                >
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
                                                                                        await deleteProject.mutateAsync(
                                                                                            selectedProject
                                                                                                .Project.id,
                                                                                        );
                                                                                        closeConfirmDialog();
                                                                                        toast.success(
                                                                                            `Deleted project "${selectedProject.Project.name}"`,
                                                                                        );
                                                                                        await invalidateProjects();
                                                                                        await invalidateSprints();
                                                                                    } catch (error) {
                                                                                        console.error(error);
                                                                                    }
                                                                                },
                                                                            });
                                                                        }}
                                                                    >
                                                                        <Icon
                                                                            icon="trash"
                                                                            className="size-4"
                                                                        />
                                                                        Delete
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">
                                                        Select a project to view details.
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-2 min-w-0 flex-1">
                                                {selectedProject ? (
                                                    <div className="flex flex-col gap-2 max-h-56 overflow-y-scroll">
                                                        {sprints.map((sprintItem) => {
                                                            const dateRange = getSprintDateRange(sprintItem);
                                                            const isCurrent = isCurrentSprint(sprintItem);

                                                            return (
                                                                <div
                                                                    key={sprintItem.id}
                                                                    className={`flex items-center justify-between p-2 border ${
                                                                        isCurrent
                                                                            ? "border-emerald-500/60 bg-emerald-500/10"
                                                                            : ""
                                                                    }`}
                                                                >
                                                                    <SmallSprintDisplay sprint={sprintItem} />
                                                                    <div className="flex items-center gap-2">
                                                                        {dateRange && (
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {dateRange}
                                                                            </span>
                                                                        )}
                                                                        {isAdmin && (
                                                                            <DropdownMenu>
                                                                                <DropdownMenuTrigger
                                                                                    asChild
                                                                                    size={"sm"}
                                                                                    noStyle
                                                                                    className="hover:opacity-80 cursor-pointer"
                                                                                >
                                                                                    <Icon
                                                                                        icon="ellipsisVertical"
                                                                                        className="size-4 text-foreground"
                                                                                    />
                                                                                </DropdownMenuTrigger>
                                                                                <DropdownMenuContent
                                                                                    align="end"
                                                                                    sideOffset={4}
                                                                                    className="bg-background"
                                                                                >
                                                                                    <DropdownMenuItem
                                                                                        onSelect={() => {
                                                                                            setEditingSprint(
                                                                                                sprintItem,
                                                                                            );
                                                                                            setEditSprintOpen(
                                                                                                true,
                                                                                            );
                                                                                        }}
                                                                                        className="hover:bg-primary-foreground"
                                                                                    >
                                                                                        <Icon
                                                                                            icon="edit"
                                                                                            className="size-4 text-muted-foreground"
                                                                                        />
                                                                                        Edit
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuItem
                                                                                        variant="destructive"
                                                                                        onSelect={() => {
                                                                                            setConfirmDialog({
                                                                                                open: true,
                                                                                                title: "Delete Sprint",
                                                                                                message: `Are you sure you want to delete "${sprintItem.name}"? Issues assigned to this sprint will become unassigned.`,
                                                                                                confirmText:
                                                                                                    "Delete",
                                                                                                processingText:
                                                                                                    "Deleting...",
                                                                                                variant:
                                                                                                    "destructive",
                                                                                                onConfirm:
                                                                                                    async () => {
                                                                                                        try {
                                                                                                            await deleteSprint.mutateAsync(
                                                                                                                sprintItem.id,
                                                                                                            );
                                                                                                            closeConfirmDialog();
                                                                                                            toast.success(
                                                                                                                `Deleted sprint "${sprintItem.name}"`,
                                                                                                            );
                                                                                                            await invalidateSprints();
                                                                                                        } catch (error) {
                                                                                                            console.error(
                                                                                                                error,
                                                                                                            );
                                                                                                        }
                                                                                                    },
                                                                                            });
                                                                                        }}
                                                                                        className="hover:bg-destructive/10"
                                                                                    >
                                                                                        <Icon
                                                                                            icon="trash"
                                                                                            className="size-4"
                                                                                        />
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
                                                            <SprintModal
                                                                projectId={selectedProject?.Project.id}
                                                                trigger={
                                                                    <Button variant="outline" size="sm">
                                                                        Create sprint{" "}
                                                                        <Icon
                                                                            icon="plus"
                                                                            className="size-4"
                                                                        />
                                                                    </Button>
                                                                }
                                                                sprints={sprints}
                                                            />
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">
                                                        Select a project to view sprints.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {selectedProject && (
                                    <>
                                        <ProjectModal
                                            mode="edit"
                                            existingProject={selectedProject.Project}
                                            open={editProjectOpen}
                                            onOpenChange={setEditProjectOpen}
                                            completeAction={async () => {
                                                await invalidateProjects();
                                            }}
                                        />
                                        <SprintModal
                                            mode="edit"
                                            existingSprint={editingSprint ?? undefined}
                                            sprints={sprints}
                                            open={editSprintOpen}
                                            onOpenChange={(open) => {
                                                setEditSprintOpen(open);
                                                if (!open) setEditingSprint(null);
                                            }}
                                            completeAction={async () => {
                                                await invalidateSprints();
                                            }}
                                        />
                                    </>
                                )}
                            </TabsContent>

                            <TabsContent value="issues">
                                <div className="border p-2 min-w-0 overflow-hidden">
                                    <h2 className="text-xl font-600 mb-2">Issue Statuses</h2>
                                    <div className="flex flex-col gap-2 w-full">
                                        <div className="flex flex-col gap-2 max-h-86 overflow-y-scroll grid grid-cols-2">
                                            {Object.keys(statuses).map((status, index) => (
                                                <div
                                                    key={status}
                                                    className="flex items-center justify-between p-2 border"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm">{index + 1}</span>
                                                        <StatusTag
                                                            status={status}
                                                            colour={statuses[status]}
                                                        />
                                                    </div>
                                                    {isAdmin && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger
                                                                asChild
                                                                size={"sm"}
                                                                noStyle
                                                                className="hover:opacity-80 cursor-pointer"
                                                            >
                                                                <Icon
                                                                    icon="ellipsisVertical"
                                                                    className="size-4 text-foreground"
                                                                />
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent
                                                                align="end"
                                                                sideOffset={4}
                                                                className="bg-background"
                                                            >
                                                                <DropdownMenuItem
                                                                    disabled={index === 0}
                                                                    onSelect={() =>
                                                                        void moveStatus(status, "up")
                                                                    }
                                                                    className="hover:bg-primary-foreground"
                                                                >
                                                                    <Icon
                                                                        icon="chevronUp"
                                                                        className="size-4 text-muted-foreground"
                                                                    />
                                                                    Move up
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    disabled={
                                                                        index ===
                                                                        Object.keys(statuses).length - 1
                                                                    }
                                                                    onSelect={() =>
                                                                        void moveStatus(status, "down")
                                                                    }
                                                                    className="hover:bg-primary-foreground"
                                                                >
                                                                    <Icon
                                                                        icon="chevronDown"
                                                                        className="size-4 text-muted-foreground"
                                                                    />
                                                                    Move down
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    variant="destructive"
                                                                    disabled={
                                                                        Object.keys(statuses).length <= 1
                                                                    }
                                                                    onSelect={() =>
                                                                        void handleRemoveStatusClick(status)
                                                                    }
                                                                    className="hover:bg-destructive/10"
                                                                >
                                                                    <Icon icon="x" className="size-4" />
                                                                    Remove
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {isAdmin &&
                                            (isCreatingStatus ? (
                                                <>
                                                    <div className="flex gap-2 w-full min-w-0">
                                                        <Input
                                                            value={newStatusName}
                                                            maxLength={ISSUE_STATUS_MAX_LENGTH}
                                                            onChange={(e) => {
                                                                setNewStatusName(e.target.value);
                                                                if (statusError) setStatusError(null);
                                                            }}
                                                            placeholder="Status name"
                                                            className="flex-1 w-0 min-w-0"
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    void handleCreateStatus();
                                                                } else if (e.key === "Escape") {
                                                                    setIsCreatingStatus(false);
                                                                    setNewStatusName("");
                                                                    setStatusError(null);
                                                                }
                                                            }}
                                                            autoFocus
                                                        />

                                                        <ColourPicker
                                                            colour={newStatusColour}
                                                            onChange={setNewStatusColour}
                                                            asChild={false}
                                                            className="w-9 h-9"
                                                        />
                                                        <IconButton
                                                            variant="outline"
                                                            size="md"
                                                            onClick={() => void handleCreateStatus()}
                                                            disabled={
                                                                newStatusName.trim().length >
                                                                ISSUE_STATUS_MAX_LENGTH
                                                            }
                                                        >
                                                            <Icon icon="plus" className="size-4" />
                                                        </IconButton>
                                                    </div>
                                                    {statusError && (
                                                        <p className="text-xs text-destructive">
                                                            {statusError}
                                                        </p>
                                                    )}
                                                </>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setIsCreatingStatus(true);
                                                        setStatusError(null);
                                                    }}
                                                    className="flex gap-2 w-full min-w-0"
                                                >
                                                    Create status <Icon icon="plus" className="size-4" />
                                                </Button>
                                            ))}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    ) : (
                        <div className="flex flex-col gap-2 w-full min-w-0">
                            <OrganisationSelect
                                contentClass={
                                    "data-[side=bottom]:translate-y-2 data-[side=bottom]:translate-x-0.25"
                                }
                            />
                            <p className="text-sm text-muted-foreground">No organisations yet.</p>
                        </div>
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

                    {/* Status removal dialog with reassignment */}
                    <Dialog
                        open={statusToRemove !== null}
                        onOpenChange={(open) => {
                            if (!open) {
                                setStatusToRemove(null);
                                setReassignToStatus("");
                            }
                        }}
                    >
                        <DialogContent className="w-md">
                            <DialogHeader>
                                <DialogTitle>Remove Status</DialogTitle>
                            </DialogHeader>
                            <p className="text-sm text-muted-foreground">
                                Are you sure you want to remove the{" "}
                                {statusToRemove ? (
                                    <StatusTag status={statusToRemove} colour={statuses[statusToRemove]} />
                                ) : null}{" "}
                                status? <span className="font-700 text-foreground">{issuesUsingStatus}</span>{" "}
                                issues are using it. Which status would you like these issues to use instead?
                            </p>
                            <Select value={reassignToStatus} onValueChange={setReassignToStatus}>
                                <SelectTrigger className="w-min">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent side={"bottom"} position="popper" align="start">
                                    {Object.keys(statuses)
                                        .filter((s) => s !== statusToRemove)
                                        .map((status) => (
                                            <SelectItem key={status} value={status}>
                                                <StatusTag status={status} colour={statuses[status]} />
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            <div className="flex gap-2 justify-end mt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setStatusToRemove(null);
                                        setReassignToStatus("");
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => void confirmRemoveStatus()}
                                    disabled={!reassignToStatus}
                                >
                                    Remove
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default OrganisationsDialog;
