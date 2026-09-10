/** Minimal PWA helpers so `npm run dev` boots without the full Grok platform tree. */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const DEFAULT_APP_NAME = "RidgeMesh";
export const OG_SITE_REL_PATH = "src/lib/og/site.json";

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&")
    .replaceAll("<", "<")
    .replaceAll(">", ">")
    .replaceAll('"', """)
    .replaceAll("'", "&#39;");
}

export function appNameFromHost() {
  return DEFAULT_APP_NAME;
}

export function isInstallQuery(url) {
  const query = String(url ?? "").split("?", 2)[1] ?? "";
  const params = new URLSearchParams(query);
  const install = params.get("install");
  const platform = (params.get("platform") ?? "").toLowerCase();
  return (install === "1" || install === "true") && platform === "ios";
}

export function isDocumentPath(pathname) {
  const path = String(pathname ?? "");
  return (
    !path.startsWith("/__grok/") &&
    !path.startsWith("/api/") &&
    !path.startsWith("/@") &&
    !path.startsWith("/node_modules") &&
    !/\.[a-z0-9]+$/i.test(path)
  );
}

export function acceptsHtml(accept) {
  const value = String(accept ?? "");
  return value === "" || value.includes("text/html") || value.includes("*/*");
}

export function stripInstallParams(url) {
  const [path = "/", query = ""] = String(url ?? "/").split("?", 2);
  const params = new URLSearchParams(query);
  params.delete("install");
  params.delete("platform");
  const rest = params.toString();
  return rest ? `${path}?${rest}` : path;
}

export function renderInstallPageHtml(template, { host, url } = {}) {
  return String(template)
    .replaceAll("{{APP_NAME}}", escapeHtml(appNameFromHost(host)))
    .replaceAll("{{APP_URL}}", escapeHtml(stripInstallParams(url)));
}

export function renderWebManifest() {
  return JSON.stringify(
    {
      name: DEFAULT_APP_NAME,
      short_name: DEFAULT_APP_NAME,
      id: "/",
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#0e1210",
      theme_color: "#0e1210",
      icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }],
    },
    null,
    2,
  );
}

export function snapshotOgIdentity(cwd = process.cwd()) {
  let site = {};
  try {
    const raw = readFileSync(join(cwd, OG_SITE_REL_PATH), "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) site = parsed;
  } catch {
    /* no site.json */
  }
  if (existsSync(join(cwd, "public/og.jpg"))) site.image = "/og.jpg";
  return { site };
}

export function injectGrokPwaHead(html) {
  return html;
}

export function createHeadInjector() {
  return {
    push(chunk) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      return [buf];
    },
    flush() {
      return [];
    },
  };
}
