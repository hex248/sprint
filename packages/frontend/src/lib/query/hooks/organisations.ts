import type {
    OrgAddMemberRequest,
    OrganisationMemberRecord,
    OrganisationMemberResponse,
} from "@sprint/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { organisation } from "@/lib/server";

export function useOrganisations() {
    return useQuery({
        queryKey: queryKeys.organisations.byUser(),
        queryFn: organisation.byUser,
    });
}

export function useOrganisationMembers(organisationId?: number | null) {
    return useQuery<OrganisationMemberResponse[]>({
        queryKey: queryKeys.organisations.members(organisationId ?? 0),
        queryFn: () => organisation.members(organisationId ?? 0),
        enabled: Boolean(organisationId),
    });
}

export function useCreateOrganisation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["organisations", "create"],
        mutationFn: organisation.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.organisations.byUser() });
        },
    });
}

export function useUpdateOrganisation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["organisations", "update"],
        mutationFn: organisation.update,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.organisations.byUser() });
        },
    });
}

export function useDeleteOrganisation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["organisations", "delete"],
        mutationFn: organisation.remove,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.organisations.byUser() });
        },
    });
}

export function useAddOrganisationMember() {
    const queryClient = useQueryClient();

    return useMutation<OrganisationMemberRecord, Error, OrgAddMemberRequest>({
        mutationKey: ["organisations", "members", "add"],
        mutationFn: organisation.addMember,
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.organisations.members(variables.organisationId),
            });
        },
    });
}

export function useRemoveOrganisationMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["organisations", "members", "remove"],
        mutationFn: organisation.removeMember,
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.organisations.members(variables.organisationId),
            });
        },
    });
}

export function useUpdateOrganisationMemberRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["organisations", "members", "update-role"],
        mutationFn: organisation.updateMemberRole,
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
        mutationFn: ({ file, organisationId }) => organisation.uploadIcon(file, organisationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.organisations.byUser() });
        },
    });
}
