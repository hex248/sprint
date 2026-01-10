import {
    ISSUE_STATUS_MAX_LENGTH,
    type OrganisationMemberResponse,
    type OrganisationResponse,
} from "@issue/shared";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { AddMemberDialog } from "@/components/add-member-dialog";
import { OrganisationSelect } from "@/components/organisation-select";
import { useAuthenticatedSession } from "@/components/session-provider";
import SmallUserDisplay from "@/components/small-user-display";
import StatusTag from "@/components/status-tag";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { issue, organisation } from "@/lib/server";

function OrganisationsDialog({
    trigger,
    organisations,
    selectedOrganisation,
    setSelectedOrganisation,
    refetchOrganisations,
}: {
    trigger?: ReactNode;
    organisations: OrganisationResponse[];
    selectedOrganisation: OrganisationResponse | null;
    setSelectedOrganisation: (organisation: OrganisationResponse | null) => void;
    refetchOrganisations: (options?: { selectOrganisationId?: number }) => Promise<void>;
}) {
    const { user } = useAuthenticatedSession();

    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("info");
    const [members, setMembers] = useState<OrganisationMemberResponse[]>([]);

    const [statuses, setStatuses] = useState<string[]>([]);
    const [isCreatingStatus, setIsCreatingStatus] = useState(false);
    const [newStatusName, setNewStatusName] = useState("");
    const [statusError, setStatusError] = useState<string | null>(null);
    const [statusToRemove, setStatusToRemove] = useState<string | null>(null);
    const [reassignToStatus, setReassignToStatus] = useState<string>("");

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

    const refetchMembers = useCallback(async () => {
        if (!selectedOrganisation) return;
        try {
            await organisation.members({
                organisationId: selectedOrganisation.Organisation.id,
                onSuccess: (data) => {
                    const members = data as OrganisationMemberResponse[];
                    const roleOrder: Record<string, number> = { owner: 0, admin: 1, member: 2 };
                    members.sort((a, b) => {
                        const roleA = roleOrder[a.OrganisationMember.role] ?? 3;
                        const roleB = roleOrder[b.OrganisationMember.role] ?? 3;
                        if (roleA !== roleB) return roleA - roleB;
                        return a.User.name.localeCompare(b.User.name);
                    });
                    setMembers(members);
                },
                onError: (error) => {
                    console.error(error);
                    setMembers([]);
                },
            });
        } catch (err) {
            console.error("error fetching members:", err);
            setMembers([]);
        }
    }, [selectedOrganisation]);

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
                    await organisation.updateMemberRole({
                        organisationId: selectedOrganisation.Organisation.id,
                        userId: memberUserId,
                        role: newRole,
                        onSuccess: () => {
                            closeConfirmDialog();
                            void refetchMembers();
                        },
                        onError: (error) => {
                            console.error(error);
                        },
                    });
                } catch (err) {
                    console.error(err);
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
                    await organisation.removeMember({
                        organisationId: selectedOrganisation.Organisation.id,
                        userId: memberUserId,
                        onSuccess: () => {
                            closeConfirmDialog();
                            void refetchMembers();
                        },
                        onError: (error) => {
                            console.error(error);
                        },
                    });
                } catch (err) {
                    console.error(err);
                }
            },
        });
    };

    useEffect(() => {
        if (selectedOrganisation) {
            const orgStatuses = (selectedOrganisation.Organisation as unknown as { statuses: string[] })
                .statuses;
            setStatuses(
                Array.isArray(orgStatuses) ? orgStatuses : ["TO DO", "IN PROGRESS", "REVIEW", "DONE"],
            );
        }
    }, [selectedOrganisation]);

    const updateStatuses = async (newStatuses: string[]) => {
        if (!selectedOrganisation) return;
        try {
            await organisation.update({
                organisationId: selectedOrganisation.Organisation.id,
                statuses: newStatuses,
                onSuccess: () => {
                    setStatuses(newStatuses);
                    void refetchOrganisations();
                },
                onError: (error) => {
                    console.error("error updating statuses:", error);
                },
            });
        } catch (err) {
            console.error("error updating statuses:", err);
        }
    };

    const handleCreateStatus = async () => {
        const trimmed = newStatusName.trim().toUpperCase();
        if (!trimmed) return;

        if (trimmed.length > ISSUE_STATUS_MAX_LENGTH) {
            setStatusError(`status must be <= ${ISSUE_STATUS_MAX_LENGTH} characters`);
            return;
        }

        if (statuses.includes(trimmed)) {
            setNewStatusName("");
            setIsCreatingStatus(false);
            setStatusError(null);
            return;
        }

        const newStatuses = [...statuses, trimmed];
        await updateStatuses(newStatuses);
        setNewStatusName("");
        setIsCreatingStatus(false);
        setStatusError(null);
    };

    const handleRemoveStatusClick = (status: string) => {
        if (statuses.length <= 1) return;
        setStatusToRemove(status);
        const remaining = statuses.filter((s) => s !== status);
        setReassignToStatus(remaining[0] || "");
    };

    const moveStatus = async (status: string, direction: "up" | "down") => {
        const currentIndex = statuses.indexOf(status);
        if (currentIndex === -1) return;

        const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
        if (nextIndex < 0 || nextIndex >= statuses.length) return;

        const nextStatuses = [...statuses];
        [nextStatuses[currentIndex], nextStatuses[nextIndex]] = [
            nextStatuses[nextIndex],
            nextStatuses[currentIndex],
        ];

        await updateStatuses(nextStatuses);
    };

    const confirmRemoveStatus = async () => {
        if (!statusToRemove || !reassignToStatus || !selectedOrganisation) return;

        await issue.replaceStatus({
            organisationId: selectedOrganisation.Organisation.id,
            oldStatus: statusToRemove,
            newStatus: reassignToStatus,
            onSuccess: async () => {
                const newStatuses = statuses.filter((s) => s !== statusToRemove);
                await updateStatuses(newStatuses);
                setStatusToRemove(null);
                setReassignToStatus("");
            },
            onError: (error) => {
                console.error("error replacing status:", error);
            },
        });
    };

    useEffect(() => {
        if (!open) return;
        void refetchMembers();
    }, [open, refetchMembers]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" className="flex w-full justify-end px-2 py-1 m-0 h-auto">
                        My Organisations
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-md w-full max-w-[calc(100vw-2rem)]">
                <DialogHeader>
                    <DialogTitle>Organisations</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-2">
                    {selectedOrganisation ? (
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <div className="flex gap-2 items-center">
                                <OrganisationSelect
                                    organisations={organisations}
                                    selectedOrganisation={selectedOrganisation}
                                    onSelectedOrganisationChange={(org) => {
                                        setSelectedOrganisation(org);
                                        localStorage.setItem(
                                            "selectedOrganisationId",
                                            `${org?.Organisation.id}`,
                                        );
                                    }}
                                    onCreateOrganisation={async (organisationId) => {
                                        await refetchOrganisations({ selectOrganisationId: organisationId });
                                    }}
                                    contentClass={
                                        "data-[side=bottom]:translate-y-2 data-[side=bottom]:translate-x-0.25"
                                    }
                                />
                                <TabsList>
                                    <TabsTrigger value="info">Info</TabsTrigger>
                                    <TabsTrigger value="users">Users</TabsTrigger>
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
                                </div>
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
                                                                    <Button
                                                                        variant="dummy"
                                                                        size="none"
                                                                        onClick={() =>
                                                                            handleRoleChange(
                                                                                member.User.id,
                                                                                member.User.name,
                                                                                member.OrganisationMember
                                                                                    .role,
                                                                            )
                                                                        }
                                                                    >
                                                                        {member.OrganisationMember.role ===
                                                                        "admin" ? (
                                                                            <ChevronDown className="size-5 text-yellow-500" />
                                                                        ) : (
                                                                            <ChevronUp className="size-5 text-green-500" />
                                                                        )}
                                                                    </Button>
                                                                    <Button
                                                                        variant="dummy"
                                                                        size="none"
                                                                        onClick={() =>
                                                                            handleRemoveMember(
                                                                                member.User.id,
                                                                                member.User.name,
                                                                            )
                                                                        }
                                                                    >
                                                                        <X className="size-5 text-destructive" />
                                                                    </Button>
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
                                                onSuccess={refetchMembers}
                                                trigger={
                                                    <Button variant="outline">
                                                        Add user <Plus className="size-4" />
                                                    </Button>
                                                }
                                            />
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="issues">
                                <div className="border p-2 min-w-0 overflow-hidden">
                                    <h2 className="text-xl font-600 mb-2">Issue Statuses</h2>
                                    <div className="flex flex-col gap-2 w-full">
                                        <div className="flex flex-col gap-2 max-h-56 overflow-y-scroll">
                                            {statuses.map((status, index) => (
                                                <div
                                                    key={status}
                                                    className="flex items-center justify-between p-2 border"
                                                >
                                                    <StatusTag status={status} />
                                                    {isAdmin && (
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="dummy"
                                                                size="none"
                                                                disabled={index === 0}
                                                                onClick={() => void moveStatus(status, "up")}
                                                                aria-label="Move status up"
                                                            >
                                                                <ChevronUp className="size-5 text-muted-foreground" />
                                                            </Button>
                                                            <Button
                                                                variant="dummy"
                                                                size="none"
                                                                disabled={index === statuses.length - 1}
                                                                onClick={() =>
                                                                    void moveStatus(status, "down")
                                                                }
                                                                aria-label="Move status down"
                                                            >
                                                                <ChevronDown className="size-5 text-muted-foreground" />
                                                            </Button>
                                                            {statuses.length > 1 && (
                                                                <Button
                                                                    variant="dummy"
                                                                    size="none"
                                                                    onClick={() =>
                                                                        handleRemoveStatusClick(status)
                                                                    }
                                                                    aria-label="Remove status"
                                                                >
                                                                    <X className="size-5 text-destructive" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {isAdmin &&
                                            (isCreatingStatus ? (
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex gap-2">
                                                        <Input
                                                            value={newStatusName}
                                                            maxLength={ISSUE_STATUS_MAX_LENGTH}
                                                            onChange={(e) => {
                                                                setNewStatusName(e.target.value);
                                                                if (statusError) setStatusError(null);
                                                            }}
                                                            placeholder="Status name"
                                                            className="flex-1"
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
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => void handleCreateStatus()}
                                                            disabled={
                                                                newStatusName.trim().length >
                                                                ISSUE_STATUS_MAX_LENGTH
                                                            }
                                                        >
                                                            <Plus className="size-4" />
                                                        </Button>
                                                    </div>
                                                    {statusError && (
                                                        <p className="text-xs text-destructive">
                                                            {statusError}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setIsCreatingStatus(true);
                                                        setStatusError(null);
                                                    }}
                                                >
                                                    Create status <Plus className="size-4" />
                                                </Button>
                                            ))}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <OrganisationSelect
                                organisations={organisations}
                                selectedOrganisation={selectedOrganisation}
                                onSelectedOrganisationChange={(org) => {
                                    setSelectedOrganisation(org);
                                    localStorage.setItem("selectedOrganisationId", `${org?.Organisation.id}`);
                                }}
                                onCreateOrganisation={async (organisationId) => {
                                    await refetchOrganisations({ selectOrganisationId: organisationId });
                                }}
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
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Remove Status</DialogTitle>
                            </DialogHeader>
                            <p className="text-sm text-muted-foreground">
                                Are you sure you want to remove the "{statusToRemove}" status? Which status
                                would you like issues with this status to be set to?
                            </p>
                            <Select value={reassignToStatus} onValueChange={setReassignToStatus}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses
                                        .filter((s) => s !== statusToRemove)
                                        .map((status) => (
                                            <SelectItem key={status} value={status}>
                                                {status}
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
