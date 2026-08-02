import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, authPassword, sessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function signIn(formData: FormData) {
  "use server";

  const password = authPassword();
  if (!password) redirect("/");

  const attempt = formData.get("password");
  if (typeof attempt !== "string" || attempt !== password) {
    redirect("/login?error=1");
  }

  const store = await cookies();
  store.set(AUTH_COOKIE, await sessionToken(password), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // No password configured means no gate — nothing to log in to.
  if (!authPassword()) redirect("/");
  const { error } = await searchParams;

  return (
    <main className="login">
      <span className="wordmark">todos</span>
      <form className="form" action={signIn}>
        <div className="field">
          <label className="label" htmlFor="password">
            Password
          </label>
          <input id="password" name="password" type="password" autoFocus required />
        </div>
        <button className="btn" type="submit">
          Enter
        </button>
        {error && <span className="tag overdue">Wrong password</span>}
      </form>
    </main>
  );
}
