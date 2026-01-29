import { useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Account from "@/components/account";
import { IssueForm } from "@/components/issue-form";
import LogOutButton from "@/components/log-out-button";
import OrgIcon from "@/components/org-icon";
import { OrganisationSelect } from "@/components/organisation-select";
import Organisations from "@/components/organisations";
import { ProjectSelect } from "@/components/project-select";
import { useSelection } from "@/components/selection-provider";
import { useAuthenticatedSession } from "@/components/session-provider";
import SmallUserDisplay from "@/components/small-user-display";
import { SprintForm } from "@/components/sprint-form";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Icon from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BREATHING_ROOM } from "@/lib/layout";
import { useOrganisations, useSprints } from "@/lib/query/hooks";

export default function TopBar({ showIssueForm = true }: { showIssueForm?: boolean }) {
  const { user } = useAuthenticatedSession();
  const { selectedOrganisationId, selectedProjectId, selectIssue } = useSelection();
  const { data: organisationsData = [] } = useOrganisations();
  const { data: sprintsData = [] } = useSprints(selectedProjectId);
  const location = useLocation();
  const navigate = useNavigate();
  const activeView = location.pathname.startsWith("/timeline") ? "timeline" : "issues";

  const selectedOrganisation = useMemo(
    () => organisationsData.find((org) => org.Organisation.id === selectedOrganisationId) ?? null,
    [organisationsData, selectedOrganisationId],
  );

  useEffect(() => {
    if (selectedOrganisation?.Organisation.features.sprints === false && activeView === "timeline") {
      navigate("/issues");
    }
  }, [selectedOrganisation, activeView, navigate]);
  return (
    <div className="flex gap-12 items-center justify-between">
      <div className={`flex gap-${BREATHING_ROOM} items-center`}>
        <OrganisationSelect
          noDecoration
          triggerClassName="w-8 h-8 ml-1 mr-1 rounded-full hover:bg-transparent dark:hover:bg-transparent"
          trigger={
            <OrgIcon
              name={selectedOrganisation?.Organisation.name ?? ""}
              slug={selectedOrganisation?.Organisation.slug ?? ""}
              iconURL={selectedOrganisation?.Organisation.iconURL || undefined}
              size={8}
            />
          }
        />

        {selectedOrganisationId && <ProjectSelect showLabel />}
        {selectedOrganisation?.Organisation.features.sprints && selectedOrganisationId && (
          <Tabs
            value={activeView}
            onValueChange={(value) => {
              const orgSlug = localStorage.getItem("selectedOrganisationSlug")?.trim() ?? "";
              const projectKey = localStorage.getItem("selectedProjectKey")?.trim() ?? "";
              const issueNumber = localStorage.getItem("selectedIssueNumber")?.trim() ?? "";
              const params = new URLSearchParams();
              if (orgSlug) params.set("o", orgSlug.toLowerCase());
              if (projectKey) params.set("p", projectKey.toLowerCase());

              if (value === "issues" && issueNumber) {
                params.set("i", issueNumber);
              }

              if (value === "timeline") {
                localStorage.removeItem("selectedIssueNumber");
                selectIssue(null, { skipUrlUpdate: true });
              }

              const search = params.toString();
              navigate(`/${value}${search ? `?${search}` : ""}`);
            }}
          >
            <TabsList>
              <TabsTrigger value="issues">Issues</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        {selectedOrganisationId && selectedProjectId && showIssueForm && activeView === "issues" && (
          <IssueForm
            trigger={
              <IconButton
                variant="outline"
                className="w-9 h-9"
                title="Create Issue"
                aria-label="Create issue"
              >
                <Icon icon="plus" />
              </IconButton>
            }
          />
        )}
        {selectedOrganisationId && selectedProjectId && showIssueForm && activeView === "timeline" && (
          <SprintForm
            projectId={selectedProjectId}
            sprints={sprintsData}
            trigger={
              <IconButton
                variant="outline"
                className="w-9 h-9"
                title="Create Sprint"
                aria-label="Create sprint"
              >
                <Icon icon="plus" />
              </IconButton>
            }
          />
        )}
      </div>
      <div className={`flex gap-${BREATHING_ROOM} items-center`}>
        {user.plan !== "pro" && (
          <Button asChild className="bg-personality hover:bg-personality/90 text-background font-600">
            <Link to="/plans">Upgrade</Link>
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger className="text-sm">
            <SmallUserDisplay user={user} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild className="flex items-end justify-end">
              <Account />
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="flex items-end justify-end">
              <Organisations />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-end justify-end p-0 m-0">
              <LogOutButton noStyle className="flex w-full justify-end" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
