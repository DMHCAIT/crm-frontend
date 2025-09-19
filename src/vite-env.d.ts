/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_BACKEND_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_FACEBOOK_APP_ID?: string;
  readonly VITE_FACEBOOK_APP_SECRET?: string;
  readonly VITE_FACEBOOK_WEBHOOK_VERIFY_TOKEN?: string;
  readonly VITE_WHATSAPP_ACCESS_TOKEN?: string;
  readonly VITE_WHATSAPP_PHONE_NUMBER_ID?: string;
  readonly VITE_WHATSAPP_WEBHOOK_VERIFY_TOKEN?: string;
  // Add other env variables as needed
  readonly NODE_ENV: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}