import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FreeTierLimit } from "@/components/free-tier-limit";
import { OrganisationForm } from "@/components/organisation-form";
import { useSelection } from "@/components/selection-provider";
import { useAuthenticatedSession } from "@/components/session-provider";
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
import { useOrganisations } from "@/lib/query/hooks";
import { cn } from "@/lib/utils";
import OrgIcon from "./org-icon";

const FREE_TIER_ORG_LIMIT = 1;

export function OrganisationSelect({
  placeholder = "Select Organisation",
  contentClass,
  showLabel = false,
  label = "Organisation",
  labelPosition = "top",
  triggerClassName,
  noDecoration,
  trigger,
}: {
  placeholder?: string;
  contentClass?: string;
  showLabel?: boolean;
  label?: string;
  labelPosition?: "top" | "bottom";
  triggerClassName?: string;
  noDecoration?: boolean;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pendingOrganisationId, setPendingOrganisationId] = useState<number | null>(null);
  const { data: organisationsData = [] } = useOrganisations();
  const { selectedOrganisationId, selectOrganisation } = useSelection();
  const { user } = useAuthenticatedSession();

  const isPro = user.plan === "pro";
  const orgCount = organisationsData.length;
  const isAtOrgLimit = !isPro && orgCount >= FREE_TIER_ORG_LIMIT;

  const organisations = useMemo(
    () => [...organisationsData].sort((a, b) => a.Organisation.name.localeCompare(b.Organisation.name)),
    [organisationsData],
  );

  const selectedOrganisation = useMemo(
    () => organisations.find((org) => org.Organisation.id === selectedOrganisationId) ?? null,
    [organisations, selectedOrganisationId],
  );

  useEffect(() => {
    if (!pendingOrganisationId) return;
    const organisation = organisations.find((org) => org.Organisation.id === pendingOrganisationId);
    if (organisation) {
      selectOrganisation(organisation);
      setPendingOrganisationId(null);
    }
  }, [organisations, pendingOrganisationId, selectOrganisation]);

  return (
    <Select
      value={selectedOrganisation ? `${selectedOrganisation.Organisation.id}` : undefined}
      onValueChange={(value) => {
        const organisation = organisations.find((o) => o.Organisation.id === Number(value));
        if (!organisation) {
          console.error(`NO ORGANISATION FOUND FOR ID: ${value}`);
          return;
        }
        selectOrganisation(organisation);
      }}
      onOpenChange={setOpen}
    >
      <SelectTrigger
        className={cn(
          "text-sm",
          noDecoration &&
            "bg-transparent border-0 px-0 focus:ring-0 hover:bg-transparent px-0 py-0 w-min h-min",
          triggerClassName,
        )}
        isOpen={open}
        label={showLabel ? label : undefined}
        hasValue={!!selectedOrganisation}
        labelPosition={labelPosition}
        chevronClassName={cn(noDecoration && "hidden")}
      >
        {trigger ? trigger : <SelectValue placeholder={placeholder} />}
      </SelectTrigger>
      <SelectContent side="bottom" position="popper" className={contentClass}>
        <SelectGroup>
          <SelectLabel>Organisations</SelectLabel>
          {organisations.map((organisation) => (
            <SelectItem key={organisation.Organisation.id} value={`${organisation.Organisation.id}`}>
              <OrgIcon
                name={organisation.Organisation.name}
                slug={organisation.Organisation.slug}
                iconURL={organisation.Organisation.iconURL}
                size={6}
                textClass="text-sm"
              />
              {organisation.Organisation.name}
            </SelectItem>
          ))}

          {organisations.length > 0 && <SelectSeparator />}
        </SelectGroup>

        {!isPro && (
          <div className="px-2 py-2">
            <FreeTierLimit
              current={orgCount}
              limit={FREE_TIER_ORG_LIMIT}
              itemName="organisation"
              isPro={isPro}
              showUpgrade={isAtOrgLimit}
            />
          </div>
        )}

        <OrganisationForm
          trigger={
            <Button
              variant="ghost"
              className={"w-full"}
              size={"sm"}
              disabled={isAtOrgLimit}
              title={
                isAtOrgLimit
                  ? "Free tier limited to 1 organisation. Upgrade to Pro for unlimited."
                  : undefined
              }
            >
              Create Organisation
            </Button>
          }
          completeAction={async (org) => {
            try {
              setPendingOrganisationId(org.id);
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
