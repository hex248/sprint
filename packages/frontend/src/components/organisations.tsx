import {
  DEFAULT_FEATURES,
  DEFAULT_ISSUE_TYPES,
  DEFAULT_STATUS_COLOUR,
  ISSUE_STATUS_MAX_LENGTH,
  ISSUE_TYPE_MAX_LENGTH,
  type SprintRecord,
} from "@sprint/shared";
import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { AddMember } from "@/components/add-member";
import { FreeTierLimit } from "@/components/free-tier-limit";
import OrgIcon from "@/components/org-icon";
import { OrganisationForm } from "@/components/organisation-form";
import { OrganisationSelect } from "@/components/organisation-select";
import { ProjectForm } from "@/components/project-form";
import { ProjectSelect } from "@/components/project-select";
import { useSelection } from "@/components/selection-provider";
import { useAuthenticatedSession } from "@/components/session-provider";
import SmallSprintDisplay from "@/components/small-sprint-display";
import SmallUserDisplay from "@/components/small-user-display";
import { SprintForm } from "@/components/sprint-form";
import StatusTag from "@/components/status-tag";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import ColourPicker from "@/components/ui/colour-picker";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Icon, { type IconName, iconNames } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useDeleteOrganisation,
  useDeleteProject,
  useDeleteSprint,
  useIssues,
  useOrganisationMembers,
  useOrganisationMemberTimeTracking,
  useOrganisations,
  useProjects,
  useRemoveOrganisationMember,
  useReplaceIssueStatus,
  useReplaceIssueType,
  useSprints,
  useUpdateOrganisation,
  useUpdateOrganisationMemberRole,
} from "@/lib/query/hooks";
import { queryKeys } from "@/lib/query/keys";
import { apiClient } from "@/lib/server";
import { capitalise, cn, formatDuration, unCamelCase } from "@/lib/utils";
import { Switch } from "./ui/switch";

const FREE_TIER_LIMITS = {
  organisationsPerUser: 1,
  projectsPerOrganisation: 1,
  issuesPerOrganisation: 100,
  membersPerOrganisation: 5,
} as const;

function Organisations({ trigger }: { trigger?: ReactNode }) {
  const { user } = useAuthenticatedSession();
  const queryClient = useQueryClient();
  const { selectedOrganisationId, selectedProjectId } = useSelection();
  const { data: organisationsData = [] } = useOrganisations();
  const { data: projectsData = [] } = useProjects(selectedOrganisationId);
  const { data: sprints = [] } = useSprints(selectedProjectId);
  const { data: membersData = [] } = useOrganisationMembers(selectedOrganisationId);
  const { data: issues = [] } = useIssues(selectedProjectId);
  const updateOrganisation = useUpdateOrganisation();
  const updateMemberRole = useUpdateOrganisationMemberRole();
  const removeMember = useRemoveOrganisationMember();
  const deleteOrganisation = useDeleteOrganisation();
  const deleteProject = useDeleteProject();
  const deleteSprint = useDeleteSprint();
  const replaceIssueStatus = useReplaceIssueStatus();
  const replaceIssueType = useReplaceIssueType();

  const isPro = user.plan === "pro";
  const orgCount = organisationsData.length;
  const projectCount = projectsData.length;
  const issueCount = issues.length;
  const memberCount = membersData.length;

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
  // time tracking state - must be before membersWithTimeTracking useMemo
  const [fromDate, setFromDate] = useState<Date>(() => {
    // default to same day of previous month
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    return prevMonth;
  });
  const { data: timeTrackingData = [] } = useOrganisationMemberTimeTracking(selectedOrganisationId, fromDate);

  const members = useMemo(() => {
    const roleOrder: Record<string, number> = { owner: 0, admin: 1, member: 2 };
    return [...membersData].sort((a, b) => {
      const roleA = roleOrder[a.OrganisationMember.role] ?? 3;
      const roleB = roleOrder[b.OrganisationMember.role] ?? 3;
      if (roleA !== roleB) return roleA - roleB;
      return a.User.name.localeCompare(b.User.name);
    });
  }, [membersData]);

  const membersWithTimeTracking = useMemo(() => {
    const timePerUser = new Map<number, number>();
    for (const session of timeTrackingData) {
      const current = timePerUser.get(session.userId) ?? 0;
      timePerUser.set(session.userId, current + (session.workTimeMs ?? 0));
    }

    const membersWithTime = members.map((member) => ({
      ...member,
      totalTimeMs: timePerUser.get(member.User.id) ?? 0,
    }));

    const roleOrder: Record<string, number> = { owner: 0, admin: 1, member: 2 };
    return membersWithTime.sort((a, b) => {
      if (b.totalTimeMs !== a.totalTimeMs) {
        return b.totalTimeMs - a.totalTimeMs;
      }
      const roleA = roleOrder[a.OrganisationMember.role] ?? 3;
      const roleB = roleOrder[b.OrganisationMember.role] ?? 3;
      if (roleA !== roleB) return roleA - roleB;
      return a.User.name.localeCompare(b.User.name);
    });
  }, [members, timeTrackingData]);

  const downloadTimeTrackingData = (format: "csv" | "json") => {
    if (!selectedOrganisation) return;

    const userData = new Map<
      number,
      {
        userId: number;
        name: string;
        username: string;
        totalTimeMs: number;
        sessions: typeof timeTrackingData;
      }
    >();

    for (const member of members) {
      userData.set(member.User.id, {
        userId: member.User.id,
        name: member.User.name,
        username: member.User.username,
        totalTimeMs: 0,
        sessions: [],
      });
    }

    for (const session of timeTrackingData) {
      const user = userData.get(session.userId);
      if (user) {
        user.totalTimeMs += session.workTimeMs;
        user.sessions.push(session);
      }
    }

    const data = Array.from(userData.values()).sort((a, b) => b.totalTimeMs - a.totalTimeMs);

    // generate CSV or JSON
    if (format === "csv") {
      const headers = ["User ID", "Name", "Username", "Total Time (ms)", "Total Time (formatted)"];
      const rows = data.map((user) => [
        user.userId,
        user.name,
        user.username,
        user.totalTimeMs,
        formatDuration(user.totalTimeMs),
      ]);
      const csv = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join(
        "\n",
      );

      // download
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedOrganisation.Organisation.slug}-time-tracking-${fromDate.toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const json = JSON.stringify(
        {
          organisation: selectedOrganisation.Organisation.name,
          fromDate: fromDate.toISOString(),
          generatedAt: new Date().toISOString(),
          members: data.map((user) => ({
            ...user,
            totalTimeFormatted: formatDuration(user.totalTimeMs),
          })),
        },
        null,
        2,
      );

      // download
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedOrganisation.Organisation.slug}-time-tracking-${fromDate.toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    toast.success(`Downloaded time tracking data as ${format.toUpperCase()}`);
  };

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

  // issue types state
  type IssueTypeConfig = { icon: string; color: string };
  const [issueTypes, setIssueTypes] = useState<Record<string, IssueTypeConfig>>({});
  const [isCreatingType, setIsCreatingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeIcon, setNewTypeIcon] = useState<IconName>("checkBox");
  const [newTypeColour, setNewTypeColour] = useState(DEFAULT_ISSUE_TYPES.Task.color);
  const [typeError, setTypeError] = useState<string | null>(null);
  const [typeToRemove, setTypeToRemove] = useState<string | null>(null);
  const [issuesUsingType, setIssuesUsingType] = useState<number>(0);
  const [reassignToType, setReassignToType] = useState<string>("");

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
          toast.error(`Error ${action.slice(0, -1)}ing ${memberName} to ${newRole}: ${String(err)}`, {
            dismissible: false,
          });
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
          toast.success(`Removed ${memberName} from ${selectedOrganisation.Organisation.name} successfully`, {
            dismissible: false,
          });
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
      const orgIssueTypes = selectedOrganisation.Organisation.issueTypes as Record<string, IssueTypeConfig>;
      setIssueTypes(orgIssueTypes ?? {});
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
            Created <StatusTag status={statusAdded.name} colour={statusAdded.colour} /> status successfully
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
            Moved <StatusTag status={statusMoved.name} colour={statusMoved.colour} /> from position
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
            Error removing <StatusTag status={statusRemoved.name} colour={statusRemoved.colour} /> from{" "}
            {selectedOrganisation.Organisation.name}: {String(err)}
          </>,
          {
            dismissible: false,
          },
        );
      } else if (statusMoved) {
        toast.error(
          <>
            Error moving <StatusTag status={statusMoved.name} colour={statusMoved.colour} /> from position
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
      const { data, error } = await apiClient.issuesStatusCount({
        query: { organisationId: selectedOrganisation.Organisation.id, status },
      });
      if (error) throw new Error(error);
      const statusCounts = (data ?? []) as { status: string; count: number }[];
      const count = statusCounts.find((item) => item.status === status)?.count ?? 0;
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
      await updateStatuses(Object.fromEntries(newStatuses.map((status) => [status, statuses[status]])), {
        name: statusToRemove,
        colour: statuses[statusToRemove],
      });
      setStatusToRemove(null);
      setReassignToStatus("");
    } catch (error) {
      console.error("error replacing status:", error);
      toast.error(
        <>
          Error removing <StatusTag status={statusToRemove} colour={statuses[statusToRemove]} /> from
          {selectedOrganisation.Organisation.name}: {String(error)}
        </>,
        {
          dismissible: false,
        },
      );
    }
  };

  // issue types functions
  const updateIssueTypes = async (
    newIssueTypes: Record<string, IssueTypeConfig>,
    typeRemoved?: { name: string; icon: string; color: string },
    typeAdded?: { name: string; icon: string; color: string },
    typeMoved?: { name: string; icon: string; color: string; currentIndex: number; nextIndex: number },
  ) => {
    if (!selectedOrganisation) return;

    try {
      await updateOrganisation.mutateAsync({
        id: selectedOrganisation.Organisation.id,
        issueTypes: newIssueTypes,
      });
      setIssueTypes(newIssueTypes);
      if (typeAdded) {
        toast.success(
          <span className="inline-flex items-center gap-1.5">
            Created <Icon icon={typeAdded.icon as IconName} size={14} color={typeAdded.color} />
            {typeAdded.name} type successfully
          </span>,
          { dismissible: false },
        );
      } else if (typeRemoved) {
        toast.success(
          <span className="inline-flex items-center gap-1.5">
            Removed <Icon icon={typeRemoved.icon as IconName} size={14} color={typeRemoved.color} />
            {typeRemoved.name} type successfully
          </span>,
          { dismissible: false },
        );
      } else if (typeMoved) {
        toast.success(
          <span className="inline-flex items-center gap-1.5">
            Moved <Icon icon={typeMoved.icon as IconName} size={14} color={typeMoved.color} />
            {typeMoved.name} from position {typeMoved.currentIndex + 1} to {typeMoved.nextIndex + 1}
          </span>,
          { dismissible: false },
        );
      }
      await invalidateOrganisations();
    } catch (err) {
      console.error("error updating issue types:", err);
      if (typeAdded) {
        toast.error(
          <span className="inline-flex items-center gap-1.5">
            Error adding <Icon icon={typeAdded.icon as IconName} size={14} color={typeAdded.color} />
            {typeAdded.name} to {selectedOrganisation.Organisation.name}: {String(err)}
          </span>,
          { dismissible: false },
        );
      } else if (typeRemoved) {
        toast.error(
          <span className="inline-flex items-center gap-1.5">
            Error removing <Icon icon={typeRemoved.icon as IconName} size={14} color={typeRemoved.color} />
            {typeRemoved.name} from {selectedOrganisation.Organisation.name}: {String(err)}
          </span>,
          { dismissible: false },
        );
      }
    }
  };

  const handleCreateType = async () => {
    const trimmed = newTypeName.trim();
    if (!trimmed) return;

    if (trimmed.length > ISSUE_TYPE_MAX_LENGTH) {
      setTypeError(`type name must be <= ${ISSUE_TYPE_MAX_LENGTH} characters`);
      return;
    }

    if (Object.keys(issueTypes).includes(trimmed)) {
      setNewTypeName("");
      setIsCreatingType(false);
      setTypeError(null);
      return;
    }

    const newIssueTypes = { ...issueTypes };
    newIssueTypes[trimmed] = { icon: newTypeIcon, color: newTypeColour };
    await updateIssueTypes(newIssueTypes, undefined, {
      name: trimmed,
      icon: newTypeIcon,
      color: newTypeColour,
    });

    setNewTypeName("");
    setNewTypeIcon("checkBox");
    setNewTypeColour(DEFAULT_ISSUE_TYPES.Task.color);
    setIsCreatingType(false);
    setTypeError(null);
  };

  const handleRemoveTypeClick = async (typeName: string) => {
    if (Object.keys(issueTypes).length <= 1 || !selectedOrganisation) return;
    try {
      const { data, error } = await apiClient.issuesTypeCount({
        query: { organisationId: selectedOrganisation.Organisation.id, type: typeName },
      });
      if (error) throw new Error(error);
      const typeCount = (data ?? { count: 0 }) as { count: number };
      const count = typeCount.count ?? 0;
      if (count > 0) {
        setTypeToRemove(typeName);
        setIssuesUsingType(count);
        const remaining = Object.keys(issueTypes).filter((t) => t !== typeName);
        setReassignToType(remaining[0] || "");
        return;
      }

      const nextTypes = Object.keys(issueTypes).filter((t) => t !== typeName);
      await updateIssueTypes(Object.fromEntries(nextTypes.map((t) => [t, issueTypes[t]])), {
        name: typeName,
        ...issueTypes[typeName],
      });
    } catch (err) {
      console.error("error checking type usage:", err);
      toast.error(
        <span className="inline-flex items-center gap-1.5">
          Error checking type usage for{" "}
          <Icon icon={issueTypes[typeName].icon as IconName} size={14} color={issueTypes[typeName].color} />
          {typeName}: {String(err)}
        </span>,
        { dismissible: false },
      );
    }
  };

  const moveType = async (typeName: string, direction: "up" | "down") => {
    const keys = Object.keys(issueTypes);
    const currentIndex = keys.indexOf(typeName);
    if (currentIndex === -1) return;

    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= keys.length) return;

    const nextKeys = [...keys];
    [nextKeys[currentIndex], nextKeys[nextIndex]] = [nextKeys[nextIndex], nextKeys[currentIndex]];

    await updateIssueTypes(
      Object.fromEntries(nextKeys.map((t) => [t, issueTypes[t]])),
      undefined,
      undefined,
      { name: typeName, ...issueTypes[typeName], currentIndex, nextIndex },
    );
  };

  const confirmRemoveType = async () => {
    if (!typeToRemove || !reassignToType || !selectedOrganisation) return;

    try {
      await replaceIssueType.mutateAsync({
        organisationId: selectedOrganisation.Organisation.id,
        oldType: typeToRemove,
        newType: reassignToType,
      });
      const nextTypes = Object.keys(issueTypes).filter((t) => t !== typeToRemove);
      await updateIssueTypes(Object.fromEntries(nextTypes.map((t) => [t, issueTypes[t]])), {
        name: typeToRemove,
        ...issueTypes[typeToRemove],
      });
      setTypeToRemove(null);
      setReassignToType("");
    } catch (error) {
      console.error("error replacing type:", error);
      toast.error(
        <span className="inline-flex items-center gap-1.5">
          Error removing{" "}
          <Icon
            icon={issueTypes[typeToRemove].icon as IconName}
            size={14}
            color={issueTypes[typeToRemove].color}
          />
          {typeToRemove} from {selectedOrganisation.Organisation.name}: {String(error)}
        </span>,
        { dismissible: false },
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

      <DialogContent className="w-md max-w-md">
        <DialogHeader>
          <DialogTitle>Organisations</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {selectedOrganisation ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0">
              <div className="flex flex-wrap gap-2 items-center w-full min-w-0">
                <OrganisationSelect
                  contentClass={"data-[side=bottom]:translate-y-2 data-[side=bottom]:translate-x-0.25"}
                />
                <TabsList>
                  <TabsTrigger value="info">Info</TabsTrigger>
                  <TabsTrigger value="users">Users</TabsTrigger>
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                  <TabsTrigger value="issues">Issues</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="info">
                <div className="border p-2 min-w-0 overflow-hidden">
                  <div className="flex justify-between">
                    <div className="flex flex-col gap-0 mb-2">
                      {" "}
                      <h2 className="text-xl font-600 break-all">{selectedOrganisation.Organisation.name}</h2>
                      <p className="text-sm text-muted-foreground break-all">
                        Slug: {selectedOrganisation.Organisation.slug}
                      </p>
                      <p className="text-sm text-muted-foreground break-all">
                        Role: {selectedOrganisation.OrganisationMember.role}
                      </p>
                    </div>
                    <OrgIcon
                      name={selectedOrganisation.Organisation.name}
                      slug={selectedOrganisation.Organisation.slug}
                      iconURL={selectedOrganisation.Organisation.iconURL}
                      size={16}
                      textClass="text-2xl"
                      className="rounded-lg"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    {selectedOrganisation.Organisation.description ? (
                      <p className="text-sm break-words">{selectedOrganisation.Organisation.description}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground break-words">No description</p>
                    )}
                  </div>

                  {/* Free tier limits section */}
                  {!isPro && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-600">Plan Limits</h3>
                        <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
                          <Link to="/plans">Upgrade to Pro</Link>
                        </Button>
                      </div>
                      <div className="flex flex-col gap-3">
                        <FreeTierLimit
                          current={orgCount}
                          limit={FREE_TIER_LIMITS.organisationsPerUser}
                          itemName="organisation"
                          isPro={isPro}
                          showUpgrade={false}
                        />
                        <FreeTierLimit
                          current={projectCount}
                          limit={FREE_TIER_LIMITS.projectsPerOrganisation}
                          itemName="project"
                          isPro={isPro}
                          showUpgrade={false}
                        />
                        <FreeTierLimit
                          current={issueCount}
                          limit={FREE_TIER_LIMITS.issuesPerOrganisation}
                          itemName="issue"
                          isPro={isPro}
                          showUpgrade={false}
                        />
                        <FreeTierLimit
                          current={memberCount}
                          limit={FREE_TIER_LIMITS.membersPerOrganisation}
                          itemName="member"
                          isPro={isPro}
                          showUpgrade={false}
                        />
                      </div>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" onClick={() => setEditOrgOpen(true)}>
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
                                  await deleteOrganisation.mutateAsync(selectedOrganisation.Organisation.id);
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
                          <Icon icon="trash" className="size-4" color="white" />
                          Delete
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <OrganisationForm
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
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-600">
                      {members.length} Member{members.length !== 1 ? "s" : ""}
                    </h2>
                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        {isPro && (
                          <>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm">
                                  From: {fromDate.toLocaleDateString()}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                  mode="single"
                                  selected={fromDate}
                                  onSelect={(date) => date && setFromDate(date)}
                                  autoFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Export
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => downloadTimeTrackingData("csv")}>
                                  Download CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => downloadTimeTrackingData("json")}>
                                  Download JSON
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex flex-col gap-2 max-h-56 overflow-y-scroll">
                      {membersWithTimeTracking.map((member) => (
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
                            {isAdmin && isPro && (
                              <span className="text-sm font-mono text-muted-foreground mr-2">
                                {formatDuration(member.totalTimeMs)}
                              </span>
                            )}
                            {isAdmin &&
                              member.OrganisationMember.role !== "owner" &&
                              member.User.id !== user.id && (
                                <>
                                  <IconButton
                                    onClick={() =>
                                      handleRoleChange(
                                        member.User.id,
                                        member.User.name,
                                        member.OrganisationMember.role,
                                      )
                                    }
                                    variant={member.OrganisationMember.role === "admin" ? "yellow" : "green"}
                                  >
                                    {member.OrganisationMember.role === "admin" ? (
                                      <Icon icon="chevronDown" className="size-5" />
                                    ) : (
                                      <Icon icon="chevronUp" className="size-5" />
                                    )}
                                  </IconButton>
                                  <IconButton
                                    variant="destructive"
                                    onClick={() => handleRemoveMember(member.User.id, member.User.name)}
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
                      <>
                        {!isPro && (
                          <div className="px-1">
                            <FreeTierLimit
                              current={memberCount}
                              limit={FREE_TIER_LIMITS.membersPerOrganisation}
                              itemName="member"
                              isPro={isPro}
                              showUpgrade={memberCount >= FREE_TIER_LIMITS.membersPerOrganisation}
                            />
                          </div>
                        )}
                        <AddMember
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
                            <Button
                              variant="outline"
                              disabled={!isPro && memberCount >= FREE_TIER_LIMITS.membersPerOrganisation}
                              title={
                                !isPro && memberCount >= FREE_TIER_LIMITS.membersPerOrganisation
                                  ? "Free tier limited to 5 members per organisation. Upgrade to Pro for unlimited."
                                  : undefined
                              }
                            >
                              Add user <Icon icon="plus" className="size-4" />
                            </Button>
                          }
                        />
                      </>
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
                                    <Icon icon="trash" className="size-4" color="white" />
                                    Delete
                                  </Button>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">Select a project to view details.</p>
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
                                        <DropdownMenuContent
                                          align="end"
                                          sideOffset={4}
                                          className="bg-background"
                                        >
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
                                projectId={selectedProject?.Project.id}
                                trigger={
                                  <Button variant="outline" size="sm">
                                    Create sprint <Icon icon="plus" className="size-4" />
                                  </Button>
                                }
                                sprints={sprints}
                              />
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Select a project to view sprints.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

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
                {/* Issue Types section */}
                <div className="border p-2 min-w-0 overflow-hidden mb-2">
                  <h2 className="text-xl font-600 mb-2">Issue Types</h2>
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex flex-col gap-2 max-h-86 overflow-y-scroll grid grid-cols-2">
                      {Object.keys(issueTypes).map((typeName, index) => {
                        const typeConfig = issueTypes[typeName];
                        return (
                          <div key={typeName} className="flex items-center justify-between p-2 border">
                            <div className="flex items-center gap-2">
                              <span className="text-sm tabular-nums">{index + 1}</span>
                              <Icon icon={typeConfig.icon as IconName} size={16} color={typeConfig.color} />
                              <span className="text-sm">{typeName}</span>
                            </div>
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
                                    disabled={index === 0}
                                    onSelect={() => void moveType(typeName, "up")}
                                    className="hover:bg-primary-foreground"
                                  >
                                    <Icon icon="chevronUp" className="size-4 text-muted-foreground" />
                                    Move up
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    disabled={index === Object.keys(issueTypes).length - 1}
                                    onSelect={() => void moveType(typeName, "down")}
                                    className="hover:bg-primary-foreground"
                                  >
                                    <Icon icon="chevronDown" className="size-4 text-muted-foreground" />
                                    Move down
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    variant="destructive"
                                    disabled={Object.keys(issueTypes).length <= 1}
                                    onSelect={() => void handleRemoveTypeClick(typeName)}
                                    className="hover:bg-destructive/10"
                                  >
                                    <Icon icon="x" className="size-4" />
                                    Remove
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {isAdmin &&
                      (isCreatingType ? (
                        <>
                          <div className="flex gap-2 w-full min-w-0">
                            <Input
                              value={newTypeName}
                              maxLength={ISSUE_TYPE_MAX_LENGTH}
                              onChange={(e) => {
                                setNewTypeName(e.target.value);
                                if (typeError) setTypeError(null);
                              }}
                              placeholder="Type name"
                              className="flex-1 w-0 min-w-0"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  void handleCreateType();
                                } else if (e.key === "Escape") {
                                  setIsCreatingType(false);
                                  setNewTypeName("");
                                  setTypeError(null);
                                }
                              }}
                              autoFocus
                            />

                            <Select value={newTypeIcon} onValueChange={(v) => setNewTypeIcon(v as IconName)}>
                              <SelectTrigger
                                className="group flex items-center w-min"
                                variant="default"
                                chevronClassName="hidden"
                              >
                                <Icon icon={newTypeIcon} size={20} color={newTypeColour} />
                              </SelectTrigger>
                              <SelectContent
                                side="bottom"
                                position="popper"
                                align="start"
                                className="max-h-64"
                              >
                                {iconNames.map((iconName) => (
                                  <SelectItem key={iconName} value={iconName}>
                                    <div className="flex items-center gap-2">
                                      <Icon icon={iconName} size={16} color={newTypeColour} />
                                      <span className="text-xs">
                                        {unCamelCase(iconName).replace(" Icon", "").replace("2Icon", " 2")}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <ColourPicker
                              colour={newTypeColour}
                              onChange={setNewTypeColour}
                              asChild={false}
                              className="w-9 h-9"
                            />
                            <IconButton
                              variant="outline"
                              size="md"
                              onClick={() => void handleCreateType()}
                              disabled={newTypeName.trim().length > ISSUE_TYPE_MAX_LENGTH}
                            >
                              <Icon icon="plus" className="size-4" />
                            </IconButton>
                          </div>
                          {typeError && <p className="text-xs text-destructive">{typeError}</p>}
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsCreatingType(true);
                            setTypeError(null);
                          }}
                          className="flex gap-2 w-full min-w-0"
                        >
                          Create type <Icon icon="plus" className="size-4" />
                        </Button>
                      ))}
                  </div>
                </div>

                {/* Issue Statuses section */}
                <div className="border p-2 min-w-0 overflow-hidden">
                  <h2 className="text-xl font-600 mb-2">Issue Statuses</h2>
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex flex-col gap-2 max-h-86 overflow-y-scroll grid grid-cols-2">
                      {Object.keys(statuses).map((status, index) => (
                        <div key={status} className="flex items-center justify-between p-2 border">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{index + 1}</span>
                            <StatusTag status={status} colour={statuses[status]} />
                          </div>
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
                                  disabled={index === 0}
                                  onSelect={() => void moveStatus(status, "up")}
                                  className="hover:bg-primary-foreground"
                                >
                                  <Icon icon="chevronUp" className="size-4 text-muted-foreground" />
                                  Move up
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={index === Object.keys(statuses).length - 1}
                                  onSelect={() => void moveStatus(status, "down")}
                                  className="hover:bg-primary-foreground"
                                >
                                  <Icon icon="chevronDown" className="size-4 text-muted-foreground" />
                                  Move down
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  disabled={Object.keys(statuses).length <= 1}
                                  onSelect={() => void handleRemoveStatusClick(status)}
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
                              disabled={newStatusName.trim().length > ISSUE_STATUS_MAX_LENGTH}
                            >
                              <Icon icon="plus" className="size-4" />
                            </IconButton>
                          </div>
                          {statusError && <p className="text-xs text-destructive">{statusError}</p>}
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
              <TabsContent value="features">
                <div className="border p-2 min-w-0 overflow-hidden">
                  <h2 className="text-xl font-600 mb-2">Features</h2>
                  {!isPro && (
                    <div className="mb-3 p-2 bg-muted/50 rounded text-sm text-muted-foreground">
                      Feature toggling is only available on Pro.{" "}
                      <Link to="/plans" className="text-personality hover:underline">
                        Upgrade to customize features.
                      </Link>
                    </div>
                  )}
                  <div className="flex flex-col gap-2 w-full">
                    {Object.keys(DEFAULT_FEATURES).map((feature) => (
                      <div key={feature} className="flex items-center gap-2 p-1">
                        <Switch
                          checked={Boolean(selectedOrganisation?.Organisation.features[feature])}
                          onCheckedChange={async (checked) => {
                            if (!selectedOrganisation) return;
                            const newFeatures = selectedOrganisation.Organisation.features;
                            newFeatures[feature] = checked;

                            await updateOrganisation.mutateAsync({
                              id: selectedOrganisation.Organisation.id,
                              features: newFeatures,
                            });
                            toast.success(
                              `${capitalise(unCamelCase(feature))} ${
                                checked ? "enabled" : "disabled"
                              } for ${selectedOrganisation.Organisation.name}`,
                            );
                            await invalidateOrganisations();
                          }}
                          disabled={!isPro}
                          color={"#ff0000"}
                        />
                        <span className={cn("text-sm", !isPro && "text-muted-foreground")}>
                          {unCamelCase(feature)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex flex-col gap-2 w-full min-w-0">
              <OrganisationSelect
                contentClass={"data-[side=bottom]:translate-y-2 data-[side=bottom]:translate-x-0.25"}
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
                status? <span className="font-700 text-foreground">{issuesUsingStatus}</span> issues are using
                it. Which status would you like these issues to use instead?
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

          {/* Type removal dialog with reassignment */}
          <Dialog
            open={typeToRemove !== null}
            onOpenChange={(open) => {
              if (!open) {
                setTypeToRemove(null);
                setReassignToType("");
              }
            }}
          >
            <DialogContent className="w-md">
              <DialogHeader>
                <DialogTitle>Remove Type</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to remove the{" "}
                {typeToRemove && issueTypes[typeToRemove] ? (
                  <span className="inline-flex items-center gap-1">
                    <Icon
                      icon={issueTypes[typeToRemove].icon as IconName}
                      size={14}
                      color={issueTypes[typeToRemove].color}
                    />
                    {typeToRemove}
                  </span>
                ) : null}{" "}
                type? <span className="font-700 text-foreground">{issuesUsingType}</span> issues are using it.
                Which type would you like these issues to use instead?
              </p>
              <Select value={reassignToType} onValueChange={setReassignToType}>
                <SelectTrigger className="w-min">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent side={"bottom"} position="popper" align="start">
                  {Object.keys(issueTypes)
                    .filter((t) => t !== typeToRemove)
                    .map((typeName) => (
                      <SelectItem key={typeName} value={typeName}>
                        <span className="inline-flex items-center gap-2">
                          <Icon
                            icon={issueTypes[typeName].icon as IconName}
                            size={14}
                            color={issueTypes[typeName].color}
                          />
                          {typeName}
                        </span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2 justify-end mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTypeToRemove(null);
                    setReassignToType("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => void confirmRemoveType()}
                  disabled={!reassignToType}
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

export default Organisations;
