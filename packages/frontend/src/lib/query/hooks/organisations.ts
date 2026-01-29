import type {
  OrgAddMemberRequest,
  OrganisationMemberRecord,
  OrganisationMemberResponse,
  OrganisationRecordType,
  OrganisationResponse,
  OrgCreateRequest,
  OrgRemoveMemberRequest,
  OrgUpdateMemberRoleRequest,
  OrgUpdateRequest,
  SuccessResponse,
} from "@sprint/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { apiClient } from "@/lib/server";

export interface MemberTimeTrackingSession {
  id: number;
  userId: number;
  issueId: number;
  issueNumber: number;
  projectKey: string;
  timestamps: string[];
  endedAt: string | null;
  createdAt: string | null;
  workTimeMs: number;
  breakTimeMs: number;
  isRunning: boolean;
}

export function useOrganisations() {
  return useQuery<OrganisationResponse[]>({
    queryKey: queryKeys.organisations.byUser(),
    queryFn: async () => {
      const { data, error } = await apiClient.organisationsByUser();
      if (error) throw new Error(error);
      return (data ?? []) as OrganisationResponse[];
    },
  });
}

export function useOrganisationMembers(organisationId?: number | null) {
  return useQuery<OrganisationMemberResponse[]>({
    queryKey: queryKeys.organisations.members(organisationId ?? 0),
    queryFn: async () => {
      const { data, error } = await apiClient.organisationMembers({
        query: { organisationId: organisationId ?? 0 },
      });
      if (error) throw new Error(error);
      return (data ?? []) as OrganisationMemberResponse[];
    },
    enabled: Boolean(organisationId),
  });
}

export function useOrganisationMemberTimeTracking(organisationId?: number | null, fromDate?: Date) {
  return useQuery<MemberTimeTrackingSession[]>({
    queryKey: queryKeys.organisations.memberTimeTracking(organisationId ?? 0, fromDate?.toISOString()),
    queryFn: async () => {
      const { data, error } = await apiClient.organisationMemberTimeTracking({
        query: {
          organisationId: organisationId ?? 0,
          fromDate: fromDate,
        },
      });
      if (error) throw new Error(error);
      return (data ?? []) as MemberTimeTrackingSession[];
    },
    enabled: Boolean(organisationId),
  });
}

export function useCreateOrganisation() {
  const queryClient = useQueryClient();

  return useMutation<OrganisationRecordType, Error, OrgCreateRequest>({
    mutationKey: ["organisations", "create"],
    mutationFn: async (input) => {
      const { data, error } = await apiClient.organisationCreate({ body: input });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to create organisation");
      return data as OrganisationRecordType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organisations.byUser() });
    },
  });
}

export function useUpdateOrganisation() {
  const queryClient = useQueryClient();

  return useMutation<OrganisationRecordType, Error, OrgUpdateRequest>({
    mutationKey: ["organisations", "update"],
    mutationFn: async (input) => {
      const { data, error } = await apiClient.organisationUpdate({ body: input });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to update organisation");
      return data as OrganisationRecordType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organisations.byUser() });
    },
  });
}

export function useDeleteOrganisation() {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, Error, number>({
    mutationKey: ["organisations", "delete"],
    mutationFn: async (orgId) => {
      const { data, error } = await apiClient.organisationDelete({ body: { id: orgId } });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to delete organisation");
      return data as SuccessResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organisations.byUser() });
    },
  });
}

export function useAddOrganisationMember() {
  const queryClient = useQueryClient();

  return useMutation<OrganisationMemberRecord, Error, OrgAddMemberRequest>({
    mutationKey: ["organisations", "members", "add"],
    mutationFn: async (input) => {
      const { data, error } = await apiClient.organisationAddMember({ body: input });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to add member");
      return data as OrganisationMemberRecord;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.organisations.members(variables.organisationId),
      });
    },
  });
}

export function useRemoveOrganisationMember() {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, Error, OrgRemoveMemberRequest>({
    mutationKey: ["organisations", "members", "remove"],
    mutationFn: async (input) => {
      const { data, error } = await apiClient.organisationRemoveMember({ body: input });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to remove member");
      return data as SuccessResponse;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.organisations.members(variables.organisationId),
      });
    },
  });
}

export function useUpdateOrganisationMemberRole() {
  const queryClient = useQueryClient();

  return useMutation<OrganisationMemberRecord, Error, OrgUpdateMemberRoleRequest>({
    mutationKey: ["organisations", "members", "update-role"],
    mutationFn: async (input) => {
      const { data, error } = await apiClient.organisationUpdateMemberRole({ body: input });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to update member role");
      return data as OrganisationMemberRecord;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.organisations.members(variables.organisationId),
      });
    },
  });
}

export function useUploadOrganisationIcon() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, { file: File; organisationId: number }>({
    mutationKey: ["organisations", "upload-icon"],
    mutationFn: async ({ file, organisationId }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("organisationId", `${organisationId}`);
      const { data, error } = await apiClient.organisationUploadIcon({ body: formData });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to upload organisation icon");
      return (data as { iconURL: string }).iconURL;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organisations.byUser() });
    },
  });
}
