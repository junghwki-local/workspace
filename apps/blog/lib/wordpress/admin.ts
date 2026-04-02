/**
 * WordPress admin API client (requires WP_USER + WP_APP_PASSWORD).
 * Use only in server-side code (API routes, Server Components).
 */

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
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw Object.assign(new Error(err.message ?? "WordPress 오류"), { status: res.status });
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
