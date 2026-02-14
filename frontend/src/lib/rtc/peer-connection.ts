type PeerConnectionConfig = {
  iceServers: RTCIceServer[];
};

function normalizeUrls(urls: string | string[]): string[] {
  const values = Array.isArray(urls) ? urls : [urls];
  return values.map((url) => url.trim()).filter((url) => url.length > 0);
}

function normalizeIceServers(iceServers: RTCIceServer[]): RTCIceServer[] {
  return iceServers
    .map((server) => {
      const urls = normalizeUrls(server.urls);
      if (urls.length === 0) {
        return null;
      }

      const normalized: RTCIceServer = {
        urls: urls.length === 1 ? urls[0] : urls,
      };

      if (server.username) {
        normalized.username = server.username;
      }
      if (server.credential) {
        normalized.credential = server.credential;
      }

      return normalized;
    })
    .filter((server): server is RTCIceServer => server !== null);
}

export function createRoomPeerConnection({ iceServers }: PeerConnectionConfig): RTCPeerConnection {
  const normalizedIceServers = normalizeIceServers(iceServers);

  return new RTCPeerConnection({
    iceServers: normalizedIceServers,
  });
}

export function ensureRecvOnlyAudio(pc: RTCPeerConnection) {
  try {
    pc.addTransceiver("audio", { direction: "recvonly" });
  } catch {
    // ignore: some browsers may throw if transceivers aren't supported
  }
}
