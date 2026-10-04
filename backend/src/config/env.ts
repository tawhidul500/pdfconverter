export type AppEnvironment = {
  nodeEnv: "development" | "test" | "production";
  port: number;
  webOrigin: string;
  apiPublicUrl: string;
  signerPublicUrl: string;
  databaseUrl: string;
  redisHost: string;
  redisPort: number;
  redisPassword?: string;
  sessionCookieName: string;
  sessionTtlHours: number;
  cookieSecure: boolean;
  objectStorageEndpoint: string;
  objectStorageRegion: string;
  objectStorageBucket: string;
  objectStorageAccessKey: string;
  objectStorageSecretKey: string;
  objectStorageForcePathStyle: boolean;
  objectStorageDownloadTtlSeconds: number;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  emailFrom: string;
  emailWebhookSecret: string;
  signerTokenTtlHours: number;
  maxPdfBytes: number;
};

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function integer(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer.`);
  return value;
}

function bool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  if (raw === "true") return true;
  if (raw === "false") return false;
  throw new Error(`${name} must be true or false.`);
}

export function loadEnvironment(): AppEnvironment {
  const nodeEnv = (process.env.NODE_ENV ?? "development") as AppEnvironment["nodeEnv"];
  if (!["development", "test", "production"].includes(nodeEnv)) throw new Error("NODE_ENV is invalid.");
  const env: AppEnvironment = {
    nodeEnv,
    port: integer("PORT", 4000),
    webOrigin: process.env.WEB_ORIGIN?.trim() || "http://localhost:3000",
    apiPublicUrl: process.env.API_PUBLIC_URL?.trim() || "http://localhost:4000",
    signerPublicUrl: process.env.SIGNER_PUBLIC_URL?.trim() || "http://localhost:4000/api/v1/signer",
    databaseUrl: required("DATABASE_URL"),
    redisHost: process.env.REDIS_HOST?.trim() || "localhost",
    redisPort: integer("REDIS_PORT", 6379),
    redisPassword: process.env.REDIS_PASSWORD?.trim() || undefined,
    sessionCookieName: process.env.SESSION_COOKIE_NAME?.trim() || "novapdf_session",
    sessionTtlHours: integer("SESSION_TTL_HOURS", 168),
    cookieSecure: bool("COOKIE_SECURE", nodeEnv === "production"),
    objectStorageEndpoint: required("OBJECT_STORAGE_ENDPOINT"),
    objectStorageRegion: process.env.OBJECT_STORAGE_REGION?.trim() || "us-east-1",
    objectStorageBucket: required("OBJECT_STORAGE_BUCKET"),
    objectStorageAccessKey: required("OBJECT_STORAGE_ACCESS_KEY"),
    objectStorageSecretKey: required("OBJECT_STORAGE_SECRET_KEY"),
    objectStorageForcePathStyle: bool("OBJECT_STORAGE_FORCE_PATH_STYLE", true),
    objectStorageDownloadTtlSeconds: integer("OBJECT_STORAGE_DOWNLOAD_TTL_SECONDS", 900),
    smtpHost: required("SMTP_HOST"),
    smtpPort: integer("SMTP_PORT", 587),
    smtpSecure: bool("SMTP_SECURE", false),
    smtpUser: process.env.SMTP_USER?.trim() || undefined,
    smtpPassword: process.env.SMTP_PASSWORD?.trim() || undefined,
    emailFrom: required("EMAIL_FROM"),
    emailWebhookSecret: required("EMAIL_WEBHOOK_SECRET"),
    signerTokenTtlHours: integer("SIGNER_TOKEN_TTL_HOURS", 168),
    maxPdfBytes: integer("MAX_PDF_BYTES", 50 * 1024 * 1024),
  };
  if (nodeEnv === "production" && env.emailWebhookSecret.length < 32) throw new Error("EMAIL_WEBHOOK_SECRET must be at least 32 characters in production.");
  return env;
}
