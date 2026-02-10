import type { UserResponse, UserUpdateRequest } from "@sprint/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { apiClient } from "@/lib/server";

export function useUserByUsername(username?: string | null) {
  return useQuery<UserResponse>({
    queryKey: queryKeys.users.byUsername(username ?? ""),
    queryFn: async () => {
      const { data, error } = await apiClient.userByUsername({
        query: { username: username ?? "" },
      });
      if (error) throw new Error(error);
      if (!data) throw new Error("user not found");
      return data as UserResponse;
    },
    enabled: Boolean(username),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation<UserResponse, Error, UserUpdateRequest>({
    mutationKey: ["users", "update"],
    mutationFn: async (input) => {
      const { data, error } = await apiClient.userUpdate({ body: input });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to update user");
      return data as UserResponse;
    },
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, File>({
    mutationKey: ["users", "upload-avatar"],
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      const { data, error } = await apiClient.userUploadAvatar({ body: formData });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to upload avatar");
      return (data as { avatarURL: string }).avatarURL;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
