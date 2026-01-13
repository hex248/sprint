import { getCsrfToken, getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function uploadAvatar({
    file,
    onSuccess,
    onError,
}: {
    file: File;
} & ServerQueryInput<string>) {
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

    if (file.size > MAX_FILE_SIZE) {
        onError?.("File size exceeds 5MB limit");
        return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        onError?.("Invalid file type. Allowed types: png, jpg, jpeg, webp, gif");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const csrfToken = getCsrfToken();
    const headers: HeadersInit = {};
    if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

    const res = await fetch(`${getServerURL()}/user/upload-avatar`, {
        method: "POST",
        headers,
        body: formData,
        credentials: "include",
    });

    if (!res.ok) {
        const error = await res.json().catch(() => res.text());
        const message =
            typeof error === "string" ? error : error.error || `Failed to upload avatar (${res.status})`;
        onError?.(message);
        return;
    }

    const data = await res.json();
    if (data.avatarURL) {
        onSuccess?.(data.avatarURL, res);
    } else {
        onError?.("Failed to upload avatar");
    }
}
