import type { OrganisationRecord, OrganisationResponse } from "@sprint/shared";
import { useState } from "react";
import { toast } from "sonner";
import { CreateOrganisation } from "@/components/create-organisation";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
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
    contentClass,
    showLabel = false,
    label = "Organisation",
    labelPosition = "top",
}: {
    organisations: OrganisationResponse[];
    selectedOrganisation: OrganisationResponse | null;
    onSelectedOrganisationChange: (organisation: OrganisationResponse | null) => void;
    onCreateOrganisation?: (org: OrganisationRecord) => void | Promise<void>;
    placeholder?: string;
    contentClass?: string;
    showLabel?: boolean;
    label?: string;
    labelPosition?: "top" | "bottom";
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
            <SelectTrigger
                className="text-sm"
                isOpen={open}
                label={showLabel ? label : undefined}
                hasValue={!!selectedOrganisation}
                labelPosition={labelPosition}
            >
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent side="bottom" position="popper" className={contentClass}>
                <SelectGroup>
                    <SelectLabel>Organisations</SelectLabel>
                    {organisations.map((organisation) => (
                        <SelectItem
                            key={organisation.Organisation.id}
                            value={`${organisation.Organisation.id}`}
                        >
                            {organisation.Organisation.name}
                        </SelectItem>
                    ))}

                    {organisations.length > 0 && <SelectSeparator />}
                </SelectGroup>

                <CreateOrganisation
                    trigger={
                        <Button variant="ghost" className={"w-full"} size={"sm"}>
                            Create Organisation
                        </Button>
                    }
                    completeAction={async (org) => {
                        try {
                            await onCreateOrganisation?.(org);
                        } catch (err) {
                            console.error(err);
                        }
                    }}
                    errorAction={async (errorMessage) => {
                        toast.error(`Error creating organisation: ${errorMessage}`, {
                            dismissible: false,
                        });
                    }}
                />
            </SelectContent>
        </Select>
    );
}
