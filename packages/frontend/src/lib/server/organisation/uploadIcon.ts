import { getCsrfToken, getServerURL } from "@/lib/utils";
import { getErrorMessage } from "..";

export async function uploadIcon(file: File, organisationId: number): Promise<string> {
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

    if (file.size > MAX_FILE_SIZE) {
        throw new Error("File size exceeds 5MB limit");
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error("Invalid file type. Allowed types: png, jpg, jpeg, webp, gif");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("organisationId", organisationId.toString());

    const csrfToken = getCsrfToken();
    const headers: HeadersInit = {};
    if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

    const res = await fetch(`${getServerURL()}/organisation/upload-icon`, {
        method: "POST",
        headers,
        body: formData,
        credentials: "include",
    });

    if (!res.ok) {
        const message = await getErrorMessage(res, `Failed to upload icon (${res.status})`);
        throw new Error(message);
    }

    const data = await res.json();
    if (data.iconURL) {
        return data.iconURL;
    }

    throw new Error("Failed to upload icon");
}
