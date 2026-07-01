/** Subscriber read pages: auth is client-side (architecture-session + unlock). */
export const config = {
  matcher: ['/the-architecture/read/:path*'],
};

export default function middleware() {
  // Pass through — do not block; layout JS verifies session.
}
