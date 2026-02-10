import type { IssueResponse, OrganisationResponse, ProjectResponse } from "@sprint/shared";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

type SelectionContextValue = {
  selectedOrganisationId: number | null;
  selectedProjectId: number | null;
  selectedIssueId: number | null;
  initialParams: {
    orgSlug: string;
    projectKey: string;
    issueNumber: number | null;
  };
  selectOrganisation: (organisation: OrganisationResponse | null, options?: SelectionOptions) => void;
  selectProject: (project: ProjectResponse | null, options?: SelectionOptions) => void;
  selectIssue: (issue: IssueResponse | null, options?: SelectionOptions) => void;
};

type SelectionOptions = {
  skipUrlUpdate?: boolean;
};

const SelectionContext = createContext<SelectionContextValue | null>(null);

const readStoredId = (key: string) => {
  const value = localStorage.getItem(key);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const readStoredString = (key: string) => {
  const value = localStorage.getItem(key);
  if (!value) return null;
  return value.trim() || null;
};

const updateUrlParams = (updates: {
  orgSlug?: string | null;
  projectKey?: string | null;
  issueNumber?: number | null;
  modal?: boolean | null;
}) => {
  const params = new URLSearchParams(window.location.search);

  if (updates.orgSlug !== undefined) {
    if (updates.orgSlug) params.set("o", updates.orgSlug);
    else params.delete("o");
  }

  if (updates.projectKey !== undefined) {
    if (updates.projectKey) params.set("p", updates.projectKey);
    else params.delete("p");
  }

  if (updates.issueNumber !== undefined) {
    if (updates.issueNumber != null) params.set("i", `${updates.issueNumber}`);
    else params.delete("i");
  }

  if (updates.modal !== undefined) {
    if (updates.modal) params.set("modal", "true");
    else params.delete("modal");
  }

  const search = params.toString();
  const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}`;
  window.history.replaceState(null, "", nextUrl);
};

export function SelectionProvider({ children }: { children: ReactNode }) {
  const location = useLocation();

  const initialParams = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const orgSlug = params.get("o")?.trim().toLowerCase() ?? "";
    const projectKey = params.get("p")?.trim().toLowerCase() ?? "";
    const issueParam = params.get("i")?.trim() ?? "";
    const issueNumber = issueParam === "" ? null : Number.parseInt(issueParam, 10);

    return {
      orgSlug,
      projectKey,
      issueNumber: issueNumber != null && Number.isNaN(issueNumber) ? null : issueNumber,
    };
  }, []);

  const [selectedOrganisationId, setSelectedOrganisationId] = useState<number | null>(() =>
    readStoredId("selectedOrganisationId"),
  );
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(() =>
    readStoredId("selectedProjectId"),
  );
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);

  const selectOrganisation = useCallback(
    (organisation: OrganisationResponse | null, options?: SelectionOptions) => {
      const id = organisation?.Organisation.id ?? null;
      setSelectedOrganisationId(id);
      setSelectedProjectId(null);
      setSelectedIssueId(null);
      if (id != null) localStorage.setItem("selectedOrganisationId", `${id}`);
      else localStorage.removeItem("selectedOrganisationId");
      if (organisation) {
        localStorage.setItem("selectedOrganisationSlug", organisation.Organisation.slug.toLowerCase());
      } else {
        localStorage.removeItem("selectedOrganisationSlug");
      }
      localStorage.removeItem("selectedProjectId");
      localStorage.removeItem("selectedProjectKey");
      localStorage.removeItem("selectedIssueNumber");
      if (!options?.skipUrlUpdate) {
        updateUrlParams({
          orgSlug: organisation?.Organisation.slug.toLowerCase() ?? null,
          projectKey: null,
          issueNumber: null,
        });
      }
    },
    [],
  );

  const selectProject = useCallback((project: ProjectResponse | null, options?: SelectionOptions) => {
    const id = project?.Project.id ?? null;
    setSelectedProjectId(id);
    setSelectedIssueId(null);
    if (id != null) localStorage.setItem("selectedProjectId", `${id}`);
    else localStorage.removeItem("selectedProjectId");
    if (project) {
      localStorage.setItem("selectedProjectKey", project.Project.key.toLowerCase());
    } else {
      localStorage.removeItem("selectedProjectKey");
    }
    localStorage.removeItem("selectedIssueNumber");
    if (!options?.skipUrlUpdate) {
      updateUrlParams({
        projectKey: project?.Project.key.toLowerCase() ?? null,
        issueNumber: null,
      });
    }
  }, []);

  const selectIssue = useCallback((issue: IssueResponse | null, options?: SelectionOptions) => {
    const id = issue?.Issue.id ?? null;
    setSelectedIssueId(id);
    if (issue) {
      localStorage.setItem("selectedIssueNumber", `${issue.Issue.number}`);
    } else {
      localStorage.removeItem("selectedIssueNumber");
    }
    if (!options?.skipUrlUpdate) {
      updateUrlParams({ issueNumber: issue?.Issue.number ?? null, modal: null });
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pathname = location.pathname;
    const allowParams = pathname.startsWith("/issues") || pathname.startsWith("/timeline");
    const updates: {
      orgSlug?: string | null;
      projectKey?: string | null;
      issueNumber?: number | null;
    } = {};

    if (allowParams && !params.get("o")) {
      const storedOrgSlug = readStoredString("selectedOrganisationSlug");
      if (storedOrgSlug) updates.orgSlug = storedOrgSlug;
    }

    if (allowParams && !params.get("p")) {
      const storedProjectKey = readStoredString("selectedProjectKey");
      if (storedProjectKey) updates.projectKey = storedProjectKey;
    }

    if (allowParams && !params.get("i")) {
      const storedIssueNumber = readStoredId("selectedIssueNumber");
      if (storedIssueNumber != null) updates.issueNumber = storedIssueNumber;
    }

    if (Object.keys(updates).length > 0) {
      updateUrlParams(updates);
    }
  }, [location.pathname]);

  const value = useMemo<SelectionContextValue>(
    () => ({
      selectedOrganisationId,
      selectedProjectId,
      selectedIssueId,
      initialParams,
      selectOrganisation,
      selectProject,
      selectIssue,
    }),
    [
      selectedOrganisationId,
      selectedProjectId,
      selectedIssueId,
      initialParams,
      selectOrganisation,
      selectProject,
      selectIssue,
    ],
  );

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error("useSelection must be used within SelectionProvider");
  }
  return context;
}
