import type { RtcIceCandidate } from "@sprint/shared";

export type PeerUserId = number;

export type RemoteAudioPeer = {
  userId: PeerUserId;
  pc: RTCPeerConnection;
  remoteStream: MediaStream;
  polite: boolean;
  makingOffer: boolean;
  ignoreOffer: boolean;
  pendingCandidates: RtcIceCandidate[];
};
