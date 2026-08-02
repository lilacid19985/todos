export const AUTH_COOKIE = "todos_auth";

/**
 * The whole site is open when APP_PASSWORD is unset (localhost default).
 * Set it in the environment and every route goes behind one password.
 */
export function authPassword(): string {
  return (process.env.APP_PASSWORD ?? "").trim();
}

/** Derived so the raw password never sits in a cookie. Works on edge + node. */
export async function sessionToken(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(`todos:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
