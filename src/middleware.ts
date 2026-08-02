import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, authPassword, sessionToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const password = authPassword();
  if (!password) return NextResponse.next();
  if (request.nextUrl.pathname === "/login") return NextResponse.next();

  const cookie = request.cookies.get(AUTH_COOKIE)?.value;
  if (cookie && cookie === (await sessionToken(password))) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
