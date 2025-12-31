import type { ProjectResponse } from "@issue/shared";
import { useState } from "react";
import { CreateProject } from "@/components/create-project";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
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
}: {
    projects: ProjectResponse[];
    selectedProject: ProjectResponse | null;
    organisationId: number | undefined;
    onSelectedProjectChange: (project: ProjectResponse | null) => void;
    onCreateProject?: (projectId: number) => void | Promise<void>;
    placeholder?: string;
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
            <SelectTrigger className="text-sm" isOpen={open}>
                <SelectValue
                    placeholder={selectedProject ? `P: ${selectedProject.Project.name}` : placeholder}
                />
            </SelectTrigger>
            <SelectContent side="bottom" position="popper" align={"start"}>
                {projects.map((project) => (
                    <SelectItem key={project.Project.id} value={`${project.Project.id}`}>
                        {project.Project.name}
                    </SelectItem>
                ))}
                {projects.length > 0 && <SelectSeparator />}
                <CreateProject
                    organisationId={organisationId}
                    trigger={
                        <Button size={"sm"} variant="ghost" className={"w-full"} disabled={!organisationId}>
                            Create Project
                        </Button>
                    }
                    completeAction={async (projectId) => {
                        try {
                            await onCreateProject?.(projectId);
                        } catch (err) {
                            console.error(err);
                        }
                    }}
                />
            </SelectContent>
        </Select>
    );
}
