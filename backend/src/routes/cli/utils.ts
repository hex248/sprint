const USER_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const CLI_LOGIN_EXPIRES_IN_SECONDS = 10 * 60;
export const CLI_LOGIN_INTERVAL_SECONDS = 5;

export const generateDeviceCode = () => crypto.randomUUID().replace(/-/g, "");

export const generateUserCode = () => {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);

    let output = "";
    for (const byte of bytes) {
        output += USER_CODE_CHARS[byte % USER_CODE_CHARS.length];
    }

    return `${output.slice(0, 4)}-${output.slice(4, 8)}`;
};

export const hashCode = async (value: string) => {
    const encoded = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};
