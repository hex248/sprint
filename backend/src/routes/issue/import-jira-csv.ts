import {
    ISSUE_DESCRIPTION_MAX_LENGTH,
    ISSUE_TITLE_MAX_LENGTH,
    type IssueImportJiraCsvResult,
    type IssueImportJiraCsvRowError,
} from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import {
    createIssue,
    getOrganisationById,
    getOrganisationMemberRole,
    getProjectByID,
} from "../../db/queries";
import { broadcastIssueChanged } from "../../realtime";
import { errorResponse } from "../../validation";

const MAX_IMPORT_FILE_SIZE = 5 * 1024 * 1024;

function parseCsv(text: string) {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = "";
    let inQuotes = false;

    for (let index = 0; index < text.length; index += 1) {
        const character = text[index];

        if (inQuotes) {
            if (character === '"') {
                if (text[index + 1] === '"') {
                    cell += '"';
                    index += 1;
                } else {
                    inQuotes = false;
                }
            } else {
                cell += character;
            }
            continue;
        }

        if (character === '"') {
            inQuotes = true;
            continue;
        }

        if (character === ",") {
            row.push(cell);
            cell = "";
            continue;
        }

        if (character === "\n") {
            row.push(cell);
            rows.push(row);
            row = [];
            cell = "";
            continue;
        }

        if (character === "\r") {
            continue;
        }

        cell += character;
    }

    if (cell.length > 0 || row.length > 0) {
        row.push(cell);
        rows.push(row);
    }

    return rows;
}

function findCaseInsensitiveMatch(value: string, options: string[]) {
    const normalizedValue = value.trim().toLowerCase();
    if (!normalizedValue) {
        return null;
    }

    const match = options.find((option) => option.toLowerCase() === normalizedValue);
    return match ?? null;
}

export default async function issueImportJiraCsv(req: AuthedRequest) {
    if (req.method !== "POST") {
        return new Response("method not allowed", { status: 405 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const projectIdRaw = formData.get("projectId") as string | null;

    if (!file) {
        return errorResponse("file is required", "FILE_REQUIRED", 400);
    }

    if (!projectIdRaw) {
        return errorResponse("projectId is required", "PROJECT_ID_REQUIRED", 400);
    }

    const projectId = Number.parseInt(projectIdRaw, 10);
    if (!Number.isInteger(projectId) || projectId <= 0) {
        return errorResponse("projectId must be a positive integer", "INVALID_PROJECT_ID", 400);
    }

    if (file.size <= 0) {
        return errorResponse("file is empty", "EMPTY_FILE", 400);
    }

    if (file.size > MAX_IMPORT_FILE_SIZE) {
        return errorResponse("file size exceeds 5MB", "FILE_TOO_LARGE", 400);
    }

    if (
        !(
            file.type === "text/csv" ||
            file.type === "application/csv" ||
            file.name.toLowerCase().endsWith(".csv")
        )
    ) {
        return errorResponse("file must be a csv", "INVALID_FILE_TYPE", 400);
    }

    const project = await getProjectByID(projectId);
    if (!project) {
        return errorResponse(`project not found: ${projectId}`, "PROJECT_NOT_FOUND", 404);
    }

    const requesterMember = await getOrganisationMemberRole(project.organisationId, req.userId);
    if (!requesterMember) {
        return errorResponse("you are not a member of this organisation", "NOT_MEMBER", 403);
    }
    if (requesterMember.role !== "owner" && requesterMember.role !== "admin") {
        return errorResponse(
            "only organisation owners and admins can import issues",
            "PERMISSION_DENIED",
            403,
        );
    }

    const organisation = await getOrganisationById(project.organisationId);
    if (!organisation) {
        return errorResponse("organisation not found", "ORGANISATION_NOT_FOUND", 404);
    }

    const statusOptions = Object.keys(organisation.statuses ?? {});
    const typeOptions = Object.keys(organisation.issueTypes ?? {});
    const defaultStatus = statusOptions[0] ?? "";
    const defaultType = typeOptions[0] ?? "";

    if (!defaultStatus || !defaultType) {
        return errorResponse(
            "organisation must have at least one status and one issue type",
            "INVALID_ORG_CONFIG",
            400,
        );
    }

    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length === 0) {
        return errorResponse("csv has no rows", "EMPTY_FILE", 400);
    }

    const [headerRow = [], ...dataRows] = rows;
    const headers = headerRow.map((header) => header.trim().toLowerCase());

    const summaryIndex = headers.indexOf("summary");
    if (summaryIndex === -1) {
        return errorResponse("csv must include 'Summary' column", "INVALID_CSV_HEADERS", 400);
    }

    const descriptionIndex = headers.indexOf("description");
    const statusIndex = headers.indexOf("status");
    const issueTypeIndex = headers.indexOf("issue type");

    const errors: IssueImportJiraCsvRowError[] = [];
    let importedCount = 0;
    let totalRows = 0;

    for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex += 1) {
        const row = dataRows[rowIndex] ?? [];
        const csvRowNumber = rowIndex + 2;
        const isEmptyRow = row.every((value) => value.trim() === "");
        if (isEmptyRow) {
            continue;
        }

        totalRows += 1;

        const title = (row[summaryIndex] ?? "").trim();
        if (!title) {
            errors.push({ row: csvRowNumber, field: "summary", message: "summary is required" });
            continue;
        }
        if (title.length > ISSUE_TITLE_MAX_LENGTH) {
            errors.push({
                row: csvRowNumber,
                field: "summary",
                message: `summary exceeds ${ISSUE_TITLE_MAX_LENGTH} characters`,
            });
            continue;
        }

        const description = (descriptionIndex >= 0 ? (row[descriptionIndex] ?? "") : "").trim();
        if (description.length > ISSUE_DESCRIPTION_MAX_LENGTH) {
            errors.push({
                row: csvRowNumber,
                field: "description",
                message: `description exceeds ${ISSUE_DESCRIPTION_MAX_LENGTH} characters`,
            });
            continue;
        }

        const rawStatus = (statusIndex >= 0 ? (row[statusIndex] ?? "") : "").trim();
        const rawType = (issueTypeIndex >= 0 ? (row[issueTypeIndex] ?? "") : "").trim();
        const resolvedStatus = findCaseInsensitiveMatch(rawStatus, statusOptions) ?? defaultStatus;
        const resolvedType = findCaseInsensitiveMatch(rawType, typeOptions) ?? defaultType;

        try {
            const issue = await createIssue({
                projectId: project.id,
                title,
                description,
                creatorId: req.userId,
                status: resolvedStatus,
                type: resolvedType,
                assignees: [],
                attachmentIds: [],
            });

            broadcastIssueChanged({
                organisationId: project.organisationId,
                projectId: project.id,
                issueId: issue.id,
                action: "created",
                actorUserId: req.userId,
            });

            importedCount += 1;
        } catch (error) {
            console.error("failed to import jira row", { row: csvRowNumber, error });
            errors.push({ row: csvRowNumber, field: "general", message: "failed to create issue for row" });
        }
    }

    const result: IssueImportJiraCsvResult = {
        importedCount,
        skippedCount: totalRows - importedCount,
        totalRows,
        errors,
    };

    return Response.json(result);
}
