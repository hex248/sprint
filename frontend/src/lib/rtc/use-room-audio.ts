import {
  type RtcClientToServerMessage,
  type RtcIceCandidate,
  type RtcServerToClientMessage,
  RtcServerToClientMessageSchema,
} from "@sprint/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { createRoomPeerConnection, ensureRecvOnlyAudio } from "@/lib/rtc/peer-connection";
import type { RemoteAudioPeer } from "@/lib/rtc/types";

type UseRoomAudioArgs = {
  socket: WebSocket | null;
  socketOpen: boolean;
  organisationId: number;
  sessionUserId: number;
  roomUserId: number | null;
  participantUserIds: number[];
  iceServers: RTCIceServer[];
};

type MicError = "permission-denied" | "device-error";

const toRtcIceCandidate = (candidate: RTCIceCandidate | RTCIceCandidateInit): RtcIceCandidate | null => {
  const normalizedCandidate = typeof candidate.candidate === "string" ? candidate.candidate : undefined;
  if (!normalizedCandidate || normalizedCandidate.length === 0) {
    return null;
  }

  return {
    candidate: normalizedCandidate,
    sdpMid: candidate.sdpMid ?? null,
    sdpMLineIndex: candidate.sdpMLineIndex ?? null,
    usernameFragment: candidate.usernameFragment ?? null,
  };
};

export function useRoomAudio({
  socket,
  socketOpen,
  organisationId,
  sessionUserId,
  roomUserId,
  participantUserIds,
  iceServers,
}: UseRoomAudioArgs) {
  const [localMuted, setLocalMuted] = useState(true);
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [micError, setMicError] = useState<MicError | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteMuted, setRemoteMuted] = useState<Map<number, boolean>>(() => new Map());
  const [remoteSpeaking, setRemoteSpeaking] = useState<Map<number, boolean>>(() => new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<number, MediaStream>>(() => new Map());

  const hasUserToggledRef = useRef(false);
  const lastRoomKeyRef = useRef<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<number, RemoteAudioPeer>>(new Map());
  const organisationIdRef = useRef(organisationId);
  const sessionUserIdRef = useRef(sessionUserId);
  const roomUserIdRef = useRef(roomUserId);
  const socketRef = useRef<WebSocket | null>(socket);
  const localMutedRef = useRef(localMuted);
  const localSpeakingRef = useRef(localSpeaking);

  useEffect(() => {
    organisationIdRef.current = organisationId;
    sessionUserIdRef.current = sessionUserId;
    roomUserIdRef.current = roomUserId;
    socketRef.current = socket;
  }, [organisationId, roomUserId, sessionUserId, socket]);

  useEffect(() => {
    localMutedRef.current = localMuted;
  }, [localMuted]);

  useEffect(() => {
    localSpeakingRef.current = localSpeaking;
  }, [localSpeaking]);

  const sendRtc = useCallback((message: RtcClientToServerMessage) => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }
    ws.send(JSON.stringify(message));
  }, []);

  const stopLocalStream = useCallback(() => {
    const stream = localStreamRef.current;
    localStreamRef.current = null;
    setLocalStream(null);
    if (!stream) {
      return;
    }
    for (const track of stream.getTracks()) {
      try {
        track.stop();
      } catch {
        // ignore
      }
    }
  }, []);

  const closeAllPeers = useCallback(() => {
    for (const peer of peersRef.current.values()) {
      try {
        peer.pc.close();
      } catch {
        // ignore
      }
    }
    peersRef.current.clear();
    setRemoteMuted(new Map());
    setRemoteSpeaking(new Map());
    setRemoteStreams(new Map());
  }, []);

  const sendPeerState = useCallback(
    (muted: boolean, speaking: boolean) => {
      const currentRoomUserId = roomUserIdRef.current;
      if (!currentRoomUserId) {
        return;
      }

      sendRtc({
        type: "webrtc-peer-state",
        roomUserId: currentRoomUserId,
        muted,
        speaking,
      });
    },
    [sendRtc],
  );

  useEffect(() => {
    const nextKey = roomUserId ? `${organisationId}:${roomUserId}` : null;
    if (nextKey === lastRoomKeyRef.current) {
      return;
    }

    lastRoomKeyRef.current = nextKey;
    hasUserToggledRef.current = false;
    setMicError(null);
    closeAllPeers();
    stopLocalStream();
  }, [closeAllPeers, organisationId, roomUserId, stopLocalStream]);

  const ensureLocalStream = useCallback(async (): Promise<MediaStream | null> => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setMicError(null);
      return stream;
    } catch (e) {
      const err = e as { name?: string };
      if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
        setMicError("permission-denied");
      } else {
        setMicError("device-error");
      }
      return null;
    }
  }, []);

  const setMutedAndBroadcast = useCallback(
    (nextMuted: boolean) => {
      setLocalMuted(nextMuted);
      localMutedRef.current = nextMuted;

      const nextSpeaking = nextMuted ? false : localSpeakingRef.current;
      if (nextMuted) {
        localSpeakingRef.current = false;
        setLocalSpeaking(false);
      }

      sendPeerState(nextMuted, nextSpeaking);
    },
    [sendPeerState],
  );

  const toggleMuted = useCallback(async () => {
    hasUserToggledRef.current = true;
    const nextMuted = !localMuted;

    if (!nextMuted) {
      const stream = await ensureLocalStream();
      if (!stream) {
        setMutedAndBroadcast(true);
        return;
      }

      for (const track of stream.getAudioTracks()) {
        track.enabled = true;
      }

      for (const peer of peersRef.current.values()) {
        const alreadySending = peer.pc.getSenders().some((s) => s.track?.kind === "audio");
        if (alreadySending) {
          continue;
        }
        const audioTrack = stream.getAudioTracks()[0];
        if (!audioTrack) {
          continue;
        }
        try {
          peer.pc.addTrack(audioTrack, stream);
        } catch {
          // ignore
        }
      }
    } else {
      const stream = localStreamRef.current;
      if (stream) {
        for (const track of stream.getAudioTracks()) {
          track.enabled = false;
        }
      }
    }

    setMutedAndBroadcast(nextMuted);
  }, [ensureLocalStream, localMuted, setMutedAndBroadcast]);

  const retryMic = useCallback(async () => {
    hasUserToggledRef.current = true;
    const stream = await ensureLocalStream();
    if (!stream) {
      setMutedAndBroadcast(true);
      return;
    }

    for (const track of stream.getAudioTracks()) {
      track.enabled = true;
    }
    setMutedAndBroadcast(false);
  }, [ensureLocalStream, setMutedAndBroadcast]);

  const createPeer = useCallback(
    (remoteUserId: number): RemoteAudioPeer => {
      const pc = createRoomPeerConnection({ iceServers });
      ensureRecvOnlyAudio(pc);

      const remoteStream = new MediaStream();
      const polite = sessionUserIdRef.current > remoteUserId;

      const peer: RemoteAudioPeer = {
        userId: remoteUserId,
        pc,
        remoteStream,
        polite,
        makingOffer: false,
        ignoreOffer: false,
        pendingCandidates: [],
      };

      pc.ontrack = (event) => {
        const track = event.track;
        if (!track) {
          return;
        }
        const alreadyAdded = remoteStream.getTracks().some((t) => t.id === track.id);
        if (alreadyAdded) {
          return;
        }
        try {
          remoteStream.addTrack(track);
          setRemoteStreams((prev) => new Map(prev));
        } catch {
          // ignore
        }
      };

      pc.onicecandidate = (event) => {
        const currentRoomUserId = roomUserIdRef.current;
        if (!currentRoomUserId) {
          return;
        }

        if (!event.candidate) {
          return;
        }

        const candidate = toRtcIceCandidate(event.candidate);
        if (!candidate) {
          return;
        }

        sendRtc({
          type: "webrtc-ice-candidate",
          roomUserId: currentRoomUserId,
          targetUserId: remoteUserId,
          candidate,
        });
      };

      pc.onnegotiationneeded = async () => {
        const currentRoomUserId = roomUserIdRef.current;
        if (!currentRoomUserId) {
          return;
        }

        // Avoid the "receiver" side sending an initial offer just because we added a recvonly transceiver.
        // We still allow renegotiation if we have local audio to send.
        const isDeterministicOfferer = sessionUserIdRef.current < remoteUserId;
        const hasLocalAudioSender = pc.getSenders().some((s) => s.track?.kind === "audio");
        if (!isDeterministicOfferer && !hasLocalAudioSender) {
          return;
        }

        try {
          peer.makingOffer = true;
          await pc.setLocalDescription();
          const sdp = pc.localDescription?.sdp;
          if (!sdp) {
            return;
          }
          sendRtc({
            type: "webrtc-offer",
            roomUserId: currentRoomUserId,
            targetUserId: remoteUserId,
            sdp,
          });
        } catch {
          return;
        } finally {
          peer.makingOffer = false;
        }
      };

      peersRef.current.set(remoteUserId, peer);
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.set(remoteUserId, remoteStream);
        return next;
      });
      setRemoteMuted((prev) => {
        const next = new Map(prev);
        if (!next.has(remoteUserId)) {
          next.set(remoteUserId, false);
        }
        return next;
      });

      return peer;
    },
    [iceServers, sendRtc],
  );

  const ensurePeer = useCallback(
    (remoteUserId: number) => peersRef.current.get(remoteUserId) ?? createPeer(remoteUserId),
    [createPeer],
  );

  const flushPendingCandidates = useCallback(async (peer: RemoteAudioPeer) => {
    if (!peer.pc.remoteDescription) {
      return;
    }
    const pending = peer.pendingCandidates.splice(0, peer.pendingCandidates.length);
    for (const cand of pending) {
      try {
        await peer.pc.addIceCandidate(cand);
      } catch {
        // ignore
      }
    }
  }, []);

  const handleRtcMessage = useCallback(
    async (message: RtcServerToClientMessage) => {
      if (message.organisationId !== organisationIdRef.current) {
        return;
      }
      if (message.roomUserId !== roomUserIdRef.current) {
        return;
      }
      if (message.fromUserId === sessionUserIdRef.current) {
        return;
      }

      if (message.type === "webrtc-peer-state") {
        setRemoteMuted((prev) => {
          const next = new Map(prev);
          next.set(message.fromUserId, message.muted);
          return next;
        });
        setRemoteSpeaking((prev) => {
          const next = new Map(prev);
          next.set(message.fromUserId, message.speaking ?? false);
          return next;
        });
        return;
      }

      const peer = ensurePeer(message.fromUserId);
      const pc = peer.pc;

      if (message.type === "webrtc-ice-candidate") {
        if (!pc.remoteDescription) {
          peer.pendingCandidates.push(message.candidate);
          return;
        }
        try {
          await pc.addIceCandidate(message.candidate);
        } catch {
          // ignore
        }
        return;
      }

      if (message.type === "webrtc-answer") {
        try {
          await pc.setRemoteDescription({ type: "answer", sdp: message.sdp });
          await flushPendingCandidates(peer);
        } catch {
          return;
        }
        return;
      }

      // offer
      const offer = { type: "offer" as const, sdp: message.sdp };
      const offerCollision = peer.makingOffer || pc.signalingState !== "stable";
      peer.ignoreOffer = !peer.polite && offerCollision;
      if (peer.ignoreOffer) {
        return;
      }

      try {
        await pc.setRemoteDescription(offer);
        await flushPendingCandidates(peer);
        await pc.setLocalDescription(await pc.createAnswer());
        const sdp = pc.localDescription?.sdp;
        if (!sdp) {
          return;
        }

        sendRtc({
          type: "webrtc-answer",
          roomUserId: message.roomUserId,
          targetUserId: message.fromUserId,
          sdp,
        });
      } catch {
        return;
      }
    },
    [ensurePeer, flushPendingCandidates, sendRtc],
  );

  const handleWsMessage = useCallback(
    (unknownMessage: unknown) => {
      const parsed = RtcServerToClientMessageSchema.safeParse(unknownMessage);
      if (!parsed.success) {
        return;
      }
      void handleRtcMessage(parsed.data);
    },
    [handleRtcMessage],
  );

  // Apply default mute rule per room-session: everyone starts muted.
  useEffect(() => {
    if (!roomUserId || participantUserIds.length < 2) {
      hasUserToggledRef.current = false;
      setLocalMuted(true);
      setMicError(null);
      return;
    }

    if (hasUserToggledRef.current) {
      return;
    }

    setMutedAndBroadcast(true);
  }, [participantUserIds.length, roomUserId, setMutedAndBroadcast]);

  // Build/teardown peers as the participant roster changes.
  useEffect(() => {
    if (!socketOpen || !roomUserId || participantUserIds.length < 2) {
      closeAllPeers();
      stopLocalStream();
      return;
    }

    const remoteUserIds = participantUserIds.filter((id) => id !== sessionUserId);
    const remoteSet = new Set(remoteUserIds);

    // remove peers that left
    for (const [peerUserId, peer] of peersRef.current.entries()) {
      if (remoteSet.has(peerUserId)) {
        continue;
      }
      try {
        peer.pc.close();
      } catch {
        // ignore
      }
      peersRef.current.delete(peerUserId);
      setRemoteMuted((prev) => {
        const next = new Map(prev);
        next.delete(peerUserId);
        return next;
      });
      setRemoteSpeaking((prev) => {
        const next = new Map(prev);
        next.delete(peerUserId);
        return next;
      });
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(peerUserId);
        return next;
      });
    }

    // ensure peers
    for (const remoteUserId of remoteUserIds) {
      const peer = ensurePeer(remoteUserId);

      // If we already have a local stream, wire audio sender in (mute may keep it disabled).
      const localStream = localStreamRef.current;
      if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        const alreadySending = peer.pc.getSenders().some((s) => s.track?.kind === "audio");
        if (audioTrack && !alreadySending) {
          try {
            peer.pc.addTrack(audioTrack, localStream);
          } catch {
            // ignore
          }
        }
      }

      // initial negotiation is driven by each peer's onnegotiationneeded.
    }
  }, [closeAllPeers, ensurePeer, participantUserIds, roomUserId, sessionUserId, socketOpen, stopLocalStream]);

  // Keep track enablement aligned with local mute state.
  useEffect(() => {
    const stream = localStreamRef.current;
    if (!stream) {
      return;
    }
    for (const track of stream.getAudioTracks()) {
      track.enabled = !localMuted;
    }
  }, [localMuted]);

  // detect local speaking and broadcast it so remote overlays can render reliably.
  useEffect(() => {
    if (!roomUserId || !socketOpen || !localStream || localMuted) {
      if (localSpeakingRef.current) {
        localSpeakingRef.current = false;
        setLocalSpeaking(false);
        sendPeerState(true, false);
      }
      return;
    }

    const webAudioWindow = window as Window & {
      webkitAudioContext?: typeof AudioContext;
    };
    const AudioContextConstructor = window.AudioContext ?? webAudioWindow.webkitAudioContext;
    if (!AudioContextConstructor) {
      return;
    }

    const audioContext = new AudioContextConstructor();
    void audioContext.resume().catch(() => undefined);

    const source = audioContext.createMediaStreamSource(localStream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const buffer = new Uint8Array(analyser.fftSize);

    const speakingThreshold = 0.02;
    let rafId = 0;
    let disposed = false;

    const updateSpeaking = () => {
      if (disposed) {
        return;
      }

      analyser.getByteTimeDomainData(buffer);
      let sum = 0;
      for (const value of buffer) {
        const normalized = (value - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / buffer.length);
      const nextSpeaking = rms >= speakingThreshold;

      if (nextSpeaking !== localSpeakingRef.current) {
        localSpeakingRef.current = nextSpeaking;
        setLocalSpeaking(nextSpeaking);
        sendPeerState(localMutedRef.current, nextSpeaking);
      }

      rafId = window.requestAnimationFrame(updateSpeaking);
    };

    updateSpeaking();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      source.disconnect();
      void audioContext.close().catch(() => undefined);

      if (localSpeakingRef.current) {
        localSpeakingRef.current = false;
        setLocalSpeaking(false);
        sendPeerState(localMutedRef.current, false);
      }
    };
  }, [localMuted, localStream, roomUserId, sendPeerState, socketOpen]);

  return {
    localMuted,
    localSpeaking,
    micError,
    localStream,
    remoteMuted,
    remoteSpeaking,
    remoteStreams,
    toggleMuted,
    retryMic,
    handleWsMessage,
  };
}
