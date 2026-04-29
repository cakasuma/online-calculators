/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADSENSE_CLIENT?: string;
  readonly VITE_ADSENSE_SLOT_TOP?: string;
  readonly VITE_ADSENSE_SLOT_HOME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
