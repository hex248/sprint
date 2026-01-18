import type { ProjectRecord, ProjectResponse } from "@sprint/shared";
import { useState } from "react";
import { ProjectModal } from "@/components/project-modal";
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

export function ProjectSelect({
    projects,
    selectedProject,
    organisationId,
    onSelectedProjectChange,
    onCreateProject,
    placeholder = "Select Project",
    showLabel = false,
    label = "Project",
    labelPosition = "top",
}: {
    projects: ProjectResponse[];
    selectedProject: ProjectResponse | null;
    organisationId: number | undefined;
    onSelectedProjectChange: (project: ProjectResponse | null) => void;
    onCreateProject?: (project: ProjectRecord) => void | Promise<void>;
    placeholder?: string;
    showLabel?: boolean;
    label?: string;
    labelPosition?: "top" | "bottom";
}) {
    const [open, setOpen] = useState(false);

    return (
        <Select
            value={selectedProject ? `${selectedProject.Project.id}` : undefined}
            onValueChange={(value) => {
                const project = projects.find((p) => p.Project.id === Number(value));
                if (!project) {
                    console.error(`NO PROJECT FOUND FOR ID: ${value}`);
                    return;
                }
                onSelectedProjectChange(project);
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
                <ProjectModal
                    organisationId={organisationId}
                    trigger={
                        <Button size={"sm"} variant="ghost" className={"w-full"} disabled={!organisationId}>
                            Create Project
                        </Button>
                    }
                    completeAction={async (project) => {
                        try {
                            await onCreateProject?.(project);
                        } catch (err) {
                            console.error(err);
                        }
                    }}
                />
            </SelectContent>
        </Select>
    );
}
