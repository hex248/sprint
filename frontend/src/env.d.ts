/// <reference types="@rsbuild/core/types" />

type PublicString = string | undefined;

interface ImportMetaEnv {
  readonly PUBLIC_SERVER_URL: PublicString;
  readonly PUBLIC_WEBRTC_STUN_URLS: PublicString;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
