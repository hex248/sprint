import type { OrganisationMemberResponse, OrganisationResponse, UserRecord } from "@issue/shared";
import { Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AddMemberDialog } from "@/components/add-member-dialog";
import { OrganisationSelect } from "@/components/organisation-select";
import { SettingsPageLayout } from "@/components/settings-page-layout";
import SmallUserDisplay from "@/components/small-user-display";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { organisation } from "@/lib/server";

function Organisations() {
    const user = JSON.parse(localStorage.getItem("user") || "{}") as UserRecord;

    const [organisations, setOrganisations] = useState<OrganisationResponse[]>([]);
    const [selectedOrganisation, setSelectedOrganisation] = useState<OrganisationResponse | null>(null);
    const [members, setMembers] = useState<OrganisationMemberResponse[]>([]);
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        memberUserId: number;
        memberName: string;
    }>({ open: false, memberUserId: 0, memberName: "" });

    const refetchOrganisations = useCallback(
        async (options?: { selectOrganisationId?: number }) => {
            try {
                await organisation.byUser({
                    userId: user.id,
                    onSuccess: (data) => {
                        const organisations = data as OrganisationResponse[];
                        setOrganisations(organisations);

                        if (options?.selectOrganisationId) {
                            const created = organisations.find(
                                (o) => o.Organisation.id === options.selectOrganisationId,
                            );
                            if (created) {
                                setSelectedOrganisation(created);
                                return;
                            }
                        }

                        setSelectedOrganisation((prev) => {
                            if (!prev) return organisations[0] || null;
                            const stillExists = organisations.find(
                                (o) => o.Organisation.id === prev.Organisation.id,
                            );
                            return stillExists || organisations[0] || null;
                        });
                    },
                    onError: (error) => {
                        console.error(error);
                        setOrganisations([]);
                        setSelectedOrganisation(null);
                    },
                });
            } catch (err) {
                console.error("error fetching organisations:", err);
                setOrganisations([]);
                setSelectedOrganisation(null);
            }
        },
        [user.id],
    );

    const refetchMembers = useCallback(async () => {
        if (!selectedOrganisation) return;
        try {
            await organisation.members({
                organisationId: selectedOrganisation.Organisation.id,
                onSuccess: (data) => {
                    const members = data as OrganisationMemberResponse[];
                    members.sort((a, b) => {
                        const nameCompare = a.User.name.localeCompare(b.User.name);
                        return nameCompare !== 0
                            ? nameCompare
                            : b.OrganisationMember.role.localeCompare(a.OrganisationMember.role);
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

    const handleRemoveMember = async (memberUserId: number, memberName: string) => {
        setConfirmDialog({ open: true, memberUserId, memberName });
    };

    const confirmRemoveMember = async () => {
        if (!selectedOrganisation) return;

        try {
            await organisation.removeMember({
                organisationId: selectedOrganisation.Organisation.id,
                userId: confirmDialog.memberUserId,
                onSuccess: () => {
                    setConfirmDialog({ open: false, memberUserId: 0, memberName: "" });
                    void refetchMembers();
                },
                onError: (error) => {
                    console.error(error);
                },
            });
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        void refetchOrganisations();
    }, [refetchOrganisations]);

    useEffect(() => {
        setSelectedOrganisation((prev) => prev || organisations[0] || null);
    }, [organisations]);

    useEffect(() => {
        void refetchMembers();
    }, [refetchMembers]);

    return (
        <SettingsPageLayout title="Organisations">
            <div className="flex flex-col gap-2 -m-2">
                <div className="flex gap-2 items-center">
                    <OrganisationSelect
                        organisations={organisations}
                        selectedOrganisation={selectedOrganisation}
                        onSelectedOrganisationChange={setSelectedOrganisation}
                        onCreateOrganisation={async (organisationId) => {
                            await refetchOrganisations({ selectOrganisationId: organisationId });
                        }}
                    />
                </div>

                {selectedOrganisation ? (
                    <div className="flex gap-2 flex-wrap">
                        <div className="w-xs border p-2">
                            <h2 className="text-xl font-600 mb-2">
                                {selectedOrganisation.Organisation.name}
                            </h2>
                            <div className="flex flex-col gap-1">
                                <p className="text-sm text-muted-foreground">
                                    Slug: {selectedOrganisation.Organisation.slug}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Role: {selectedOrganisation.OrganisationMember.role}
                                </p>
                                {selectedOrganisation.Organisation.description ? (
                                    <p className="text-sm">{selectedOrganisation.Organisation.description}</p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No description</p>
                                )}
                            </div>
                        </div>
                        <div className="border p-2">
                            <h2 className="text-xl font-600 mb-2">
                                {members.length} Member{members.length !== 1 ? "s" : ""}
                            </h2>
                            <div className="flex flex-col gap-2 w-sm">
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
                                            {(selectedOrganisation.OrganisationMember.role === "owner" ||
                                                selectedOrganisation.OrganisationMember.role === "admin") &&
                                                member.OrganisationMember.role !== "owner" &&
                                                member.User.id !== user.id && (
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
                                                )}
                                        </div>
                                    ))}
                                </div>
                                {(selectedOrganisation.OrganisationMember.role === "owner" ||
                                    selectedOrganisation.OrganisationMember.role === "admin") && (
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
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No organisations yet.</p>
                )}

                <ConfirmDialog
                    open={confirmDialog.open}
                    onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
                    onConfirm={confirmRemoveMember}
                    title="Remove Member"
                    processingText="Removing..."
                    message={`Are you sure you want to remove ${confirmDialog.memberName} from this organisation?`}
                    confirmText="Remove"
                    variant="destructive"
                />
            </div>
        </SettingsPageLayout>
    );
}

export default Organisations;
