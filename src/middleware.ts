import { NextResponse } from "next/server";
import withAuth from "next-auth/middleware";

export default withAuth(function middleware(req) {
  const token = req.nextauth.token;
  const isLoggedIn = !!token;

  const url = req.nextUrl.clone();
  if (!isLoggedIn) {
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/",
    "/equitment/:path*",
    "/maintenance-type/:path*",
    "/spare-parts/:path*",
    "/activities/:path*",
  ],
};
