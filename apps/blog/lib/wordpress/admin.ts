/**
 * WordPress admin API client (requires WP_USER + WP_APP_PASSWORD).
 * Use only in server-side code (API routes, Server Components).
 */

export class WPAdminError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "WPAdminError";
    this.status = status;
  }
}

interface WPAdminConfig {
  url: string;
  credentials: string;
}

function getAdminConfig(): WPAdminConfig {
  const url = process.env.NEXT_PUBLIC_WORDPRESS_URL;
  const user = process.env.WP_USER;
  const pass = process.env.WP_APP_PASSWORD;

  if (!url || !user || !pass) {
    throw new Error("WordPress 설정이 누락됐습니다.");
  }

  return {
    url,
    credentials: Buffer.from(`${user}:${pass}`).toString("base64"),
  };
}

export async function wpAdminFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const { url, credentials } = getAdminConfig();

  const res = await fetch(`${url}/wp-json/wp/v2${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${credentials}`,
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body: unknown = await res.json().catch(() => ({}));
    const message = typeof body === "object" && body !== null && "message" in body && typeof (body as Record<string, unknown>).message === "string"
      ? (body as Record<string, unknown>).message as string
      : "WordPress 오류";
    throw new WPAdminError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
