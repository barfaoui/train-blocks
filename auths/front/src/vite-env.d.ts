/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SAME_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
