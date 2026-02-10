import type {
    IssueRecord,
    IssueResponse,
    OrganisationMemberResponse,
    OrganisationResponse,
    ProjectResponse,
} from "@sprint/shared";
import type { CliConfig } from "./config";

type RequestOptions = {
    method?: "GET" | "POST";
    body?: unknown;
    auth?: boolean;
    csrf?: boolean;
};

type ApiResult<T> = {
    status: number;
    body: T;
};

export const buildUrl = (
    config: CliConfig,
    path: string,
    query?: Record<string, string | number | undefined>,
) => {
    const baseUrl = config.apiBaseUrl.endsWith("/") ? config.apiBaseUrl.slice(0, -1) : config.apiBaseUrl;
    const url = new URL(`${baseUrl}${path}`);

    if (query) {
        for (const [key, value] of Object.entries(query)) {
            if (value === undefined) continue;
            url.searchParams.set(key, String(value));
        }
    }

    return url;
};

const parseResponseBody = async (response: Response): Promise<unknown> => {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        return response.json();
    }

    const text = await response.text();
    return { error: text || `request failed (${response.status})` };
};

export const apiRequest = async <T>(
    config: CliConfig,
    path: string,
    options: RequestOptions = {},
    query?: Record<string, string | number | undefined>,
): Promise<ApiResult<T>> => {
    const method = options.method ?? "GET";
    const headers = new Headers({
        Accept: "application/json",
    });

    if (options.body !== undefined) {
        headers.set("Content-Type", "application/json");
    }

    if (options.auth) {
        if (!config.token) {
            throw new Error("Not logged in. Run: sprint login");
        }
        headers.set("Cookie", `token=${config.token}`);
    }

    if (options.csrf) {
        if (!config.csrfToken) {
            throw new Error("Missing CSRF token. Run: sprint login");
        }
        headers.set("X-CSRF-Token", config.csrfToken);
    }

    const response = await fetch(buildUrl(config, path, query), {
        method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    const body = (await parseResponseBody(response)) as T;
    return {
        status: response.status,
        body,
    };
};

export const throwIfError = (status: number, body: unknown) => {
    if (status >= 200 && status < 300) return;

    if (body && typeof body === "object" && "error" in body) {
        throw new Error(String((body as { error: string }).error));
    }

    throw new Error(`request failed (${status})`);
};

export const getOrganisations = async (config: CliConfig) => {
    const response = await apiRequest<OrganisationResponse[]>(config, "/organisations/by-user", {
        auth: true,
    });
    throwIfError(response.status, response.body);
    return response.body;
};

export const getProjectsByOrganisation = async (config: CliConfig, organisationId: number) => {
    const response = await apiRequest<ProjectResponse[]>(
        config,
        "/projects/by-organisation",
        { auth: true },
        { organisationId },
    );
    throwIfError(response.status, response.body);
    return response.body;
};

export const getIssuesByProject = async (config: CliConfig, projectId: number) => {
    const response = await apiRequest<IssueResponse[]>(
        config,
        "/issues/by-project",
        { auth: true },
        { projectId },
    );
    throwIfError(response.status, response.body);
    return response.body;
};

export const getIssueById = async (config: CliConfig, issueId: number) => {
    const response = await apiRequest<IssueResponse>(config, "/issue/by-id", { auth: true }, { issueId });
    throwIfError(response.status, response.body);
    return response.body;
};

export const getOrganisationMembers = async (config: CliConfig, organisationId: number) => {
    const response = await apiRequest<OrganisationMemberResponse[]>(
        config,
        "/organisation/members",
        { auth: true },
        { organisationId },
    );
    throwIfError(response.status, response.body);
    return response.body;
};

export const createIssue = async (
    config: CliConfig,
    input: {
        projectId: number;
        title: string;
        description: string;
        status: string;
        type: string;
        assigneeIds?: number[];
        sprintId?: number | null;
    },
) => {
    const response = await apiRequest<IssueRecord>(config, "/issue/create", {
        method: "POST",
        auth: true,
        csrf: true,
        body: input,
    });
    throwIfError(response.status, response.body);
    return response.body;
};

export const startCliLogin = async (config: CliConfig) => {
    const response = await apiRequest<{
        deviceCode: string;
        userCode: string;
        verificationUri: string;
        expiresInSeconds: number;
        intervalSeconds: number;
    }>(config, "/cli/login/start", {
        method: "POST",
        body: {},
    });
    throwIfError(response.status, response.body);
    return response.body;
};

export const pollCliLogin = async (config: CliConfig, deviceCode: string) => {
    const response = await apiRequest<
        | { status: "pending"; intervalSeconds: number; expiresInSeconds: number }
        | { status: "approved"; token: string; csrfToken: string }
        | { status: "expired" }
        | { status: "denied" }
    >(config, "/cli/login/poll", {
        method: "POST",
        body: { deviceCode },
    });
    throwIfError(response.status, response.body);
    return response.body;
};
