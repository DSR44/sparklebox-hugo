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

async function createAccessToken(email, env) {
  const normalized = email.trim().toLowerCase();
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const payload = `${normalized}|${exp}`;
  const sig = await hmacSign(payload, getSecret(env));
  return `${payload}|${sig}`;
}

async function verifyAccessToken(token, env) {
  if (!token) return null;
  try {
    const parts = token.split('|');
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

function accessCookieHeader(token, env) {
  const secure = env.VERCEL || env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SEC}${secure}`;
}

export {
  COOKIE_NAME,
  createAccessToken,
  verifyAccessToken,
  accessCookieHeader,
};
