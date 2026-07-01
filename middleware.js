import { verifyAccessToken, COOKIE_NAME } from './lib/architecture-auth.js';

export const config = {
  matcher: ['/the-architecture/read/:path*'],
};

export default async function middleware(request) {
  const env = {
    ARCHITECTURE_ACCESS_SECRET: process.env.ARCHITECTURE_ACCESS_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    VERCEL: process.env.VERCEL,
    NODE_ENV: process.env.NODE_ENV,
  };

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const email = await verifyAccessToken(decodeURIComponent(token || ''), env);

  if (email) {
    return;
  }

  const next = encodeURIComponent(request.nextUrl.pathname);
  const url = new URL(`/the-architecture/unlock/?next=${next}`, request.url);
  return Response.redirect(url, 302);
}
