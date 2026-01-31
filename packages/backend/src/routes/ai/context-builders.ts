import fs from "node:fs";
import path from "node:path";
import type { UserRecord } from "@sprint/shared";
import {
    getIssuesWithUsersByProject,
    getOrganisationById,
    getProjectByID,
    getProjectsByOrganisationId,
    getSprintsByProject,
} from "../../db/queries";

export const SYSTEM_PROMPT = fs.readFileSync(path.join(import.meta.dir, "system-prompt.xml"), "utf-8");

export const buildContext = async (orgId: number, projectId: number, user: UserRecord) => {
    // fetch organisation, projects, sprints, issues, and issue assignees
    // db queries
    const organisation = await getOrganisationById(orgId);
    if (!organisation) {
        return "<current_context></current_context>";
    }
    const projects = await getProjectsByOrganisationId(orgId);
    const project = await getProjectByID(projectId);
    if (!project) {
        return "<current_context></current_context>";
    }
    const issues = await getIssuesWithUsersByProject(projectId);
    const sprints = await getSprintsByProject(projectId);

    const assignedIssues = issues.filter((i) => i.Assignees.some((a) => a.id === user.id));

    const byStatus = (status: string) => assignedIssues.filter((i) => i.Issue.status === status);

    return `
<current_context>
  <user id="${user.id}" name="${user.name}" username="${user.username}"  />
  
  <organisation name="${organisation.name}" slug="${organisation.slug}">
    <statuses>
${Object.entries(organisation.statuses)
    .map(([name, color]) => `      <status name="${name}" color="${color}" />`)
    .join("\n")}
    </statuses>
  </organisation>

  <projects>
${projects.map((p) => `    <project key="${p.Project.key}" name="${p.Project.name}" />`).join("\n")}
  </projects>

  <sprints>
${sprints.map((s) => `    <sprint id="${s.id}" name="${s.name}" start="${s.startDate.toUTCString()?.split("T")[0]}" end="${s.endDate?.toUTCString().split("T")[0]}" />`).join("\n")}
  </sprints>

  <all_issues count="${issues.length}">
${issues.map((i) => `    <issue id="${i.Issue.id}" number="${i.Issue.number}" type="${i.Issue.type}" status="${i.Issue.status}" title="${i.Issue.title.replace(/"/g, "&quot;")}" sprint="${sprints.find((s) => s.id === i.Issue.sprintId)?.name || "Unassigned"}" />`).join("\n")}
  </all_issues>


  <my_issues count="${assignedIssues.length}">
${assignedIssues.map((i) => `    <issue id="${i.Issue.id}" number="${i.Issue.number}" type="${i.Issue.type}" status="${i.Issue.status}" title="${i.Issue.title.replace(/"/g, "&quot;")}" sprint="${sprints.find((s) => s.id === i.Issue.sprintId)?.name || "Unassigned"}" />`).join("\n")}
  </my_issues>

  <issues_by_status>
    <status name="TO DO" count="${byStatus("TO DO").length}">
${byStatus("TO DO")
    .map(
        (i) =>
            `      <issue id="${i.Issue.id}" number="${i.Issue.number}" title="${i.Issue.title.replace(/"/g, "&quot;")}" />`,
    )
    .join("\n")}
    </status>
    <status name="IN PROGRESS" count="${byStatus("IN PROGRESS").length}">
${byStatus("IN PROGRESS")
    .map(
        (i) =>
            `      <issue id="${i.Issue.id}" number="${i.Issue.number}" title="${i.Issue.title.replace(/"/g, "&quot;")}" />`,
    )
    .join("\n")}
    </status>
    <status name="DONE" count="${byStatus("DONE").length}">
${byStatus("DONE")
    .map(
        (i) =>
            `      <issue id="${i.Issue.id}" number="${i.Issue.number}" title="${i.Issue.title.replace(/"/g, "&quot;")}" />`,
    )
    .join("\n")}
    </status>
  </issues_by_status>

  <issue_details>
${assignedIssues
    .map(
        (i) => `    <issue id="${i.Issue.id}" number="${i.Issue.number}">
      <title>${i.Issue.title.replace(/"/g, "&quot;")}</title>
      <description>${(i.Issue.description || "").replace(/"/g, "&quot;")}</description>
      <status>${i.Issue.status}</status>
      <type>${i.Issue.type}</type>
      <sprint>${sprints.find((s) => s.id === i.Issue.sprintId)?.name || "None"}</sprint>
    </issue>`,
    )
    .join("\n")}
  </issue_details>
</current_context>`;
};
