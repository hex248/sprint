/// <reference types="vite/client" />

type ViteString = string | undefined;

interface ImportMetaEnv {
    readonly SERVER_URL: ViteString;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
