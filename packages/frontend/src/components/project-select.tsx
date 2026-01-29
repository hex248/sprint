import { useEffect, useMemo, useState } from "react";
import { FreeTierLimit } from "@/components/free-tier-limit";
import { ProjectForm } from "@/components/project-form";
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
import { useProjects } from "@/lib/query/hooks";

const FREE_TIER_PROJECT_LIMIT = 1;

export function ProjectSelect({
  placeholder = "Select Project",
  showLabel = false,
  label = "Project",
  labelPosition = "top",
}: {
  placeholder?: string;
  showLabel?: boolean;
  label?: string;
  labelPosition?: "top" | "bottom";
}) {
  const [open, setOpen] = useState(false);
  const [pendingProjectId, setPendingProjectId] = useState<number | null>(null);
  const { selectedOrganisationId, selectedProjectId, selectProject } = useSelection();
  const { data: projectsData = [] } = useProjects(selectedOrganisationId);
  const { user } = useAuthenticatedSession();

  const isPro = user.plan === "pro";
  const projectCount = projectsData.length;
  const isAtProjectLimit = !isPro && projectCount >= FREE_TIER_PROJECT_LIMIT;

  const projects = useMemo(
    () => [...projectsData].sort((a, b) => a.Project.name.localeCompare(b.Project.name)),
    [projectsData],
  );

  const selectedProject = useMemo(
    () => projects.find((proj) => proj.Project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  useEffect(() => {
    if (!pendingProjectId) return;
    const project = projects.find((proj) => proj.Project.id === pendingProjectId);
    if (project) {
      selectProject(project);
      setPendingProjectId(null);
    }
  }, [pendingProjectId, projects, selectProject]);

  return (
    <Select
      value={selectedProject ? `${selectedProject.Project.id}` : undefined}
      onValueChange={(value) => {
        const project = projects.find((p) => p.Project.id === Number(value));
        if (!project) {
          console.error(`NO PROJECT FOUND FOR ID: ${value}`);
          return;
        }
        selectProject(project);
      }}
      onOpenChange={setOpen}
    >
      <SelectTrigger
        className="text-sm"
        isOpen={open}
        label={showLabel ? label : undefined}
        hasValue={!!selectedProject}
        labelPosition={labelPosition}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent side="bottom" position="popper" align={"start"}>
        <SelectGroup>
          <SelectLabel>Projects</SelectLabel>
          {projects.map((project) => (
            <SelectItem key={project.Project.id} value={`${project.Project.id}`}>
              {project.Project.name}
            </SelectItem>
          ))}
          {projects.length > 0 && <SelectSeparator />}
        </SelectGroup>

        {!isPro && selectedOrganisationId && (
          <div className="px-2 py-2">
            <FreeTierLimit
              current={projectCount}
              limit={FREE_TIER_PROJECT_LIMIT}
              itemName="project"
              isPro={isPro}
              showUpgrade={isAtProjectLimit}
            />
          </div>
        )}

        <ProjectForm
          organisationId={selectedOrganisationId ?? undefined}
          trigger={
            <Button
              size={"sm"}
              variant="ghost"
              className={"w-full"}
              disabled={!selectedOrganisationId || isAtProjectLimit}
              title={
                isAtProjectLimit
                  ? "Free tier limited to 1 project per organisation. Upgrade to Pro for unlimited."
                  : !selectedOrganisationId
                    ? "Select an organisation first"
                    : undefined
              }
            >
              Create Project
            </Button>
          }
          completeAction={async (project) => {
            try {
              setPendingProjectId(project.id);
            } catch (err) {
              console.error(err);
            }
          }}
        />
      </SelectContent>
    </Select>
  );
}
