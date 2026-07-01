const COOKIE_NAME = 'sb_arch_access';
const MAX_AGE_SEC = 90 * 24 * 60 * 60;

const DEFAULT_ARCHITECTURE_SEGMENT_ID = '3a8cb3e9-805d-4344-b92e-1bfc12c80652';

function getSecret(env) {
  return env.ARCHITECTURE_ACCESS_SECRET || env.RESEND_API_KEY || 'sparklebox-arch-dev-only';
}

function getArchitectureSegmentId(env) {
  return env.RESEND_ARCHITECTURE_SEGMENT_ID || DEFAULT_ARCHITECTURE_SEGMENT_ID;
}

/** Only allow internal read paths after unlock. */
function sanitizeNextPath(next) {
  const raw = (next || '/the-architecture/read/intro/').trim();
  if (!raw.startsWith('/the-architecture/read/')) {
    return '/the-architecture/read/intro/';
  }
  return raw.endsWith('/') ? raw : `${raw}/`;
}

function parseCookieToken(cookieHeader) {
  if (!cookieHeader) return '';
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return '';
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

async function isArchitectureSubscriber(apiKey, email, env = {}) {
  const segmentId = getArchitectureSegmentId(env);
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    return false;
  }

  const contactRes = await fetch(
    `https://api.resend.com/contacts/${encodeURIComponent(normalized)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (contactRes.status === 404) {
    return false;
  }

  if (!contactRes.ok) {
    return false;
  }

  const contact = await contactRes.json();
  if (contact.unsubscribed) {
    return false;
  }

  const segRes = await fetch(
    `https://api.resend.com/contacts/${encodeURIComponent(normalized)}/segments`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (segRes.ok) {
    const segData = await segRes.json();
    const segments = segData.data || [];
    return segments.some((s) => s.id === segmentId);
  }

  // Segment list on contact object (when present)
  const embedded = contact.segments || contact.segment_ids || [];
  if (Array.isArray(embedded) && embedded.some((s) => (s.id || s) === segmentId)) {
    return true;
  }

  return false;
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
    let decoded = token;
    try {
      decoded = decodeURIComponent(token);
    } catch {
      decoded = token;
    }
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

function accessCookieHeader(token, env) {
  const secure = env.VERCEL || env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SEC}${secure}`;
}

export {
  COOKIE_NAME,
  MAX_AGE_SEC,
  createAccessToken,
  verifyAccessToken,
  accessCookieHeader,
  sanitizeNextPath,
  parseCookieToken,
  isArchitectureSubscriber,
  getArchitectureSegmentId,
};
