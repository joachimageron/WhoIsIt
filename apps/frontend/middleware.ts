import type { NextRequest } from "next/server";

import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { NextResponse } from "next/server";

const locales = ["en", "fr"];
const defaultLocale = "en";

// Routes that require authentication or guest session
const protectedGameRoutes = ["/game"];

function getLocale(request: NextRequest): string {
  // Get locale from Accept-Language header
  const negotiatorHeaders: Record<string, string> = {};

  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();

  try {
    return match(languages, locales, defaultLocale);
  } catch {
    return defaultLocale;
  }
}

/**
 * Check if the user has a valid authentication cookie
 */
function hasAuthCookie(request: NextRequest): boolean {
  return request.cookies.has("access_token");
}

/**
 * Check if the pathname matches any protected game route
 */
function isProtectedGameRoute(pathname: string): boolean {
  // Remove locale prefix for checking
  const pathWithoutLocale = pathname.replace(/^\/(en|fr)/, "");

  return protectedGameRoutes.some(
    (route) =>
      pathWithoutLocale.startsWith(route) || pathWithoutLocale === route,
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if there is any supported locale in the pathname
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  // Get the locale for the request
  const locale = pathnameHasLocale
    ? pathname.split("/")[1]
    : getLocale(request);

  // Handle locale redirect if needed
  if (!pathnameHasLocale) {
    request.nextUrl.pathname = `/${locale}${pathname}`;

    return NextResponse.redirect(request.nextUrl);
  }

  // Check if this is a protected game route
  if (isProtectedGameRoute(pathname)) {
    const hasAuth = hasAuthCookie(request);
    const hasGuestSession =
      request.cookies.has("guest_session") ||
      // Check for localStorage-based guest session marker cookie
      request.headers.get("cookie")?.includes("whoisit_has_guest_session=true");

    // Allow access if user is authenticated OR has a guest session
    if (!hasAuth && !hasGuestSession) {
      // Redirect to login with return URL
      const loginUrl = new URL(`/${locale}/auth/login`, request.url);

      loginUrl.searchParams.set("returnUrl", pathname);

      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, static files)
    "/((?!_next|api|.*\\..*).*)",
  ],
};
