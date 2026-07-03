/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LOOKER_STUDIO_EMBED_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
