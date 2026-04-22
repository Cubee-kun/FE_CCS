const API_TARGETS = {
  local: "http://127.0.0.1:8000/api",
  production: "https://apibeccs.nexcube-digital.com/api",
};

const normalizeApiUrl = (value) => {
  const raw = (value || "").trim();
  if (!raw) return "";
  return raw.replace(/\/+$/, "");
};

const isLocalHost = (hostname) => {
  return hostname === "localhost" || hostname === "127.0.0.1";
};

export const getApiBaseUrl = () => {
  const mode = (import.meta.env.VITE_API_MODE || "auto").trim().toLowerCase();
  const envApiUrl = normalizeApiUrl(import.meta.env.VITE_API_URL);

  if (mode === "local") {
    return normalizeApiUrl(import.meta.env.VITE_API_URL_LOCAL) || API_TARGETS.local;
  }

  if (mode === "production") {
    return normalizeApiUrl(import.meta.env.VITE_API_URL_PRODUCTION) || API_TARGETS.production;
  }

  if (envApiUrl) {
    return envApiUrl;
  }

  if (typeof window !== "undefined" && isLocalHost(window.location.hostname)) {
    return API_TARGETS.local;
  }

  return API_TARGETS.production;
};

export const getApiOrigin = () => {
  const baseUrl = getApiBaseUrl();

  try {
    return new URL(baseUrl).origin;
  } catch {
    return "";
  }
};
