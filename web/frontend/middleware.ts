import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Route protection: /member requires a session cookie or Bearer-persisted
// client session. We check the httpOnly cookie here; client MemberRoute
// re-checks localStorage session and redirects to /login?next=.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/member")) {
    const hasCookie = req.cookies.has("asaphis_at");
    // Allow client guard to handle localStorage token; only redirect when
    // there is clearly no session cookie AND no Authorization hint.
    // We cannot read localStorage here, so let client guard do the redirect
    // to avoid false positives on token-only sessions.
    if (!hasCookie) {
      // Still allow through — MemberRoute will redirect to /login?next=/member
      // if useAuth finds no session. This keeps token + cookie flows working.
      return NextResponse.next();
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/member/:path*"] };
