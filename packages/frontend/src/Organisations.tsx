import type { OrganisationResponse, UserRecord } from "@issue/shared";
import { useCallback, useEffect, useState } from "react";
import { OrganisationSelect } from "@/components/organisation-select";
import { SettingsPageLayout } from "@/components/settings-page-layout";
import { organisation } from "@/lib/server";
import { getAuthHeaders, getServerURL } from "@/lib/utils";

function Organisations() {
    const user = JSON.parse(localStorage.getItem("user") || "{}") as UserRecord;

    const [organisations, setOrganisations] = useState<OrganisationResponse[]>([]);
    const [selectedOrganisation, setSelectedOrganisation] = useState<OrganisationResponse | null>(null);

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

    useEffect(() => {
        void refetchOrganisations();
    }, [refetchOrganisations]);

    useEffect(() => {
        setSelectedOrganisation((prev) => prev || organisations[0] || null);
    }, [organisations]);

    return (
        <SettingsPageLayout title="Organisations">
            <div className="flex flex-col gap-4">
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
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-600">{selectedOrganisation.Organisation.name}</h2>
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
                ) : (
                    <p className="text-sm text-muted-foreground">No organisations yet.</p>
                )}
            </div>
        </SettingsPageLayout>
    );
}

export default Organisations;
