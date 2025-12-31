import type { OrganisationResponse } from "@issue/shared";
import { useState } from "react";
import { CreateOrganisation } from "@/components/create-organisation";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function OrganisationSelect({
    organisations,
    selectedOrganisation,
    onSelectedOrganisationChange,
    onCreateOrganisation,
    placeholder = "Select Organisation",
}: {
    organisations: OrganisationResponse[];
    selectedOrganisation: OrganisationResponse | null;
    onSelectedOrganisationChange: (organisation: OrganisationResponse | null) => void;
    onCreateOrganisation?: (organisationId: number) => void | Promise<void>;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);

    return (
        <Select
            value={selectedOrganisation ? `${selectedOrganisation.Organisation.id}` : undefined}
            onValueChange={(value) => {
                const organisation = organisations.find((o) => o.Organisation.id === Number(value));
                if (!organisation) {
                    console.error(`NO ORGANISATION FOUND FOR ID: ${value}`);
                    return;
                }
                onSelectedOrganisationChange(organisation);
            }}
            onOpenChange={setOpen}
        >
            <SelectTrigger className="text-sm" isOpen={open}>
                <SelectValue
                    placeholder={
                        selectedOrganisation ? `O: ${selectedOrganisation.Organisation.name}` : placeholder
                    }
                />
            </SelectTrigger>
            <SelectContent side="bottom" position="popper">
                {organisations.map((organisation) => (
                    <SelectItem key={organisation.Organisation.id} value={`${organisation.Organisation.id}`}>
                        {organisation.Organisation.name}
                    </SelectItem>
                ))}

                {organisations.length > 0 && <SelectSeparator />}
                <CreateOrganisation
                    trigger={
                        <Button variant="ghost" className={"w-full"} size={"sm"}>
                            Create Organisation
                        </Button>
                    }
                    completeAction={async (organisationId) => {
                        try {
                            await onCreateOrganisation?.(organisationId);
                        } catch (err) {
                            console.error(err);
                        }
                    }}
                />
            </SelectContent>
        </Select>
    );
}
