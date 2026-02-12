type PeerConnectionConfig = {
  stunUrls: string[];
};

export function createRoomPeerConnection({ stunUrls }: PeerConnectionConfig): RTCPeerConnection {
  const iceServers = stunUrls
    .map((url) => url.trim())
    .filter((url) => url.length > 0)
    .map((url) => ({ urls: url }));

  return new RTCPeerConnection({
    iceServers,
  });
}

export function ensureRecvOnlyAudio(pc: RTCPeerConnection) {
  try {
    pc.addTransceiver("audio", { direction: "recvonly" });
  } catch {
    // ignore: some browsers may throw if transceivers aren't supported
  }
}
