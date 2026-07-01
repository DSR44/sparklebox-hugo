const COOKIE_NAME = 'sb_arch_access';
const MAX_AGE_SEC = 90 * 24 * 60 * 60;

function getSecret(env) {
  return env.ARCHITECTURE_ACCESS_SECRET || env.RESEND_API_KEY || 'sparklebox-arch-dev-only';
}

function bytesToHex(bytes) {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacSign(message, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return bytesToHex(sig);
}

async function verifyAccessToken(token, env) {
  if (!token) return null;
  try {
    const decoded = decodeURIComponent(token);
    const parts = decoded.split('|');
    if (parts.length !== 3) return null;
    const [email, expStr, sig] = parts;
    const exp = parseInt(expStr, 10);
    if (!email || !exp || Date.now() / 1000 > exp) return null;
    const payload = `${email}|${exp}`;
    const expected = await hmacSign(payload, getSecret(env));
    if (sig !== expected) return null;
    return email;
  } catch {
    return null;
  }
}

export const config = {
  matcher: ['/the-architecture/read/:path*'],
};

export default async function middleware(request) {
  const env = {
    ARCHITECTURE_ACCESS_SECRET: process.env.ARCHITECTURE_ACCESS_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  };

  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const email = await verifyAccessToken(token || '', env);

    if (email) {
      return;
    }

    const next = encodeURIComponent(request.nextUrl.pathname);
    return Response.redirect(
      new URL(`/the-architecture/unlock/?next=${next}`, request.url),
      302
    );
  } catch {
    const next = encodeURIComponent(request.nextUrl.pathname);
    return Response.redirect(
      new URL(`/the-architecture/unlock/?next=${next}`, request.url),
      302
    );
  }
}
