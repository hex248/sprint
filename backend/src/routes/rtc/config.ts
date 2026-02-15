import type { RtcConfigResponse } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";

const DEFAULT_STUN_URLS = ["stun:stun.l.google.com:19302"];

const parseCsv = (value: string | undefined): string[] =>
    (value ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

const parseStunUrls = () => {
    const urls = parseCsv(process.env.WEBRTC_STUN_URLS).filter(
        (url) => url.startsWith("stun:") || url.startsWith("stuns:"),
    );

    return urls.length > 0 ? urls : DEFAULT_STUN_URLS;
};

export default async function rtcConfig(_req: AuthedRequest) {
    const stunUrls = parseStunUrls();
    const turnUrls = parseCsv(
        [process.env.WEBRTC_TURN_UDP_URL, process.env.WEBRTC_TURN_TLS_URL].filter(Boolean).join(","),
    ).filter((url) => url.startsWith("turn:") || url.startsWith("turns:"));
    const turnUsername = process.env.WEBRTC_TURN_USERNAME?.trim();
    const turnCredential = process.env.WEBRTC_TURN_PASSWORD?.trim();

    const iceServers: RtcConfigResponse["iceServers"] = stunUrls.map((url) => ({ urls: url }));

    if (turnUrls.length > 0 && turnUsername && turnCredential) {
        iceServers.push({
            urls: turnUrls,
            username: turnUsername,
            credential: turnCredential,
        });
    }

    return Response.json({ iceServers } satisfies RtcConfigResponse);
}
