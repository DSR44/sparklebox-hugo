export const config = {
  runtime: 'edge',
};

import {
  createAccessToken,
  accessCookieHeader,
} from '../lib/architecture-auth.js';

const SANCTUARY_SEGMENT_ID =
  process.env.RESEND_AUDIENCE_ID ||
  process.env.RESEND_SEGMENT_ID ||
  '4d762c64-084a-4cf1-9ad9-697e91226ec9';

const ARCHITECTURE_SEGMENT_ID =
  process.env.RESEND_ARCHITECTURE_SEGMENT_ID ||
  '3a8cb3e9-805d-4344-b92e-1bfc12c80652';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

async function resendFetch(apiKey, path, options = {}) {
  return fetch(`https://api.resend.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
}

async function addContactToSegment(apiKey, email, segmentId) {
  const contactRes = await resendFetch(apiKey, '/contacts', {
    method: 'POST',
    body: JSON.stringify({
      email,
      unsubscribed: false,
      segments: [{ id: segmentId }],
    }),
  });

  await contactRes.json();

  await resendFetch(
    apiKey,
    `/contacts/${encodeURIComponent(email)}/segments/${segmentId}`,
    { method: 'POST' }
  );
}

function sanctuaryWelcomeHtml() {
  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;margin:0 auto;background:#0a0118;color:#f1f5f9;">
  <div style="padding:40px 20px;text-align:center;border-bottom:2px solid #8b5cf6;">
    <h1 style="color:#f1f5f9;font-size:24px;margin:0;letter-spacing:3px;">SPARKLEBOX</h1>
    <p style="color:#8b5cf6;font-size:12px;margin:10px 0 0 0;letter-spacing:1px;">by Elle Vida</p>
  </div>
  <div style="padding:32px 24px;">
    <p style="font-size:18px;color:#f1f5f9;margin-bottom:16px;">Hey,</p>
    <p style="font-size:16px;line-height:1.7;color:#94a3b8;margin-bottom:16px;">Welcome to Sparklebox. I am glad you are here.</p>
    <p style="font-size:16px;line-height:1.7;color:#94a3b8;margin-bottom:16px;">This is a space where perception becomes creation — where the way you see shapes what you experience. I share what I have learned about frequency, nervous system calibration, and the upgrade path.</p>
    <p style="font-size:16px;line-height:1.7;color:#94a3b8;margin-bottom:16px;">You will hear from me when there is something worth sharing — new posts, campaign transmissions, and tools as they arrive.</p>
    <p style="font-size:16px;color:#ec4899;font-weight:600;">Elle Vida</p>
  </div>
  <div style="background:#1a0a2e;padding:20px 24px;text-align:center;">
    <p style="font-size:12px;color:#64748b;margin:0;"><a href="https://www.sparklebox.blog" style="color:#8b5cf6;text-decoration:none;">sparklebox.blog</a> · Reply to unsubscribe</p>
  </div>
</div>`;
}

function architectureWelcomeHtml(readUrl) {
  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;margin:0 auto;background:#0a0118;color:#f1f5f9;">
  <div style="padding:36px 24px 20px;text-align:center;border-bottom:2px solid #22d3ee;">
    <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#22d3ee;">The Architecture</p>
    <h1 style="color:#f1f5f9;font-size:24px;margin:0;letter-spacing:2px;">You're in · The Layered Tree</h1>
    <p style="color:#818cf8;font-size:12px;margin:10px 0 0 0;letter-spacing:1px;">by Elle Vida · Sparklebox</p>
  </div>
  <div style="padding:32px 24px;">
    <p style="font-size:16px;line-height:1.75;color:#94a3b8;margin:0 0 16px 0;">Thank you for going deeper. You already know what Sparklebox shares openly — this is the architecture beneath it. The full series lives on Sparklebox: one introduction, then six layers, read here as they arrive.</p>
    <p style="font-size:16px;line-height:1.75;color:#94a3b8;margin:0 0 16px 0;">Start with the introduction — a short letter before Layer One. Then six layers: the map behind <em>Perception is Creation</em>.</p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${readUrl}" style="display:inline-block;background:linear-gradient(135deg,#22d3ee,#6366f1);color:#fff;text-decoration:none;padding:14px 26px;border-radius:8px;font-weight:600;font-size:16px;">Read the introduction →</a>
    </p>
    <p style="font-size:14px;line-height:1.65;color:#64748b;margin:0;">You will also receive Sparklebox post alerts — new transmissions by email with a link to read here.</p>
    <p style="font-size:16px;color:#ec4899;font-weight:600;margin:20px 0 0;">Elle Vida</p>
  </div>
  <div style="background:#1a0a2e;padding:20px 24px;text-align:center;">
    <p style="font-size:12px;color:#64748b;margin:0;"><a href="https://www.sparklebox.blog/the-architecture/" style="color:#22d3ee;text-decoration:none;">The Layered Tree</a> · <a href="https://www.sparklebox.blog" style="color:#8b5cf6;text-decoration:none;">sparklebox.blog</a></p>
  </div>
</div>`;
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: CORS,
    });
  }

  try {
    const body = await req.json();
    const email = (body.email || '').trim().toLowerCase();
    const source =
      body.source === 'architecture'
        ? 'architecture'
        : body.source === 'seen'
          ? 'seen'
          : 'sanctuary';

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), {
        status: 400,
        headers: CORS,
      });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: CORS,
      });
    }

    if (source === 'architecture') {
      await addContactToSegment(RESEND_API_KEY, email, ARCHITECTURE_SEGMENT_ID);
      await addContactToSegment(RESEND_API_KEY, email, SANCTUARY_SEGMENT_ID);

      const env = {
        ARCHITECTURE_ACCESS_SECRET: process.env.ARCHITECTURE_ACCESS_SECRET,
        RESEND_API_KEY,
        VERCEL: process.env.VERCEL,
      };
      const token = await createAccessToken(email, env);
      const readPath = '/the-architecture/read/intro/';
      const readUrl = `https://www.sparklebox.blog/the-architecture/unlock/?next=${encodeURIComponent(readPath)}`;

      await resendFetch(RESEND_API_KEY, '/emails', {
        method: 'POST',
        body: JSON.stringify({
          from: 'Elle Vida <Elle_Vida@sparklebox.blog>',
          reply_to: 'Elle_Vida@sparklebox.blog',
          to: email,
          subject: "You're in · The Layered Tree begins",
          html: architectureWelcomeHtml(readUrl),
        }),
      });

      return new Response(
        JSON.stringify({
          status: 'subscribed',
          email,
          series: 'architecture',
          blog_alerts: true,
          redirect: readUrl,
        }),
        {
          status: 200,
          headers: {
            ...CORS,
            'Set-Cookie': accessCookieHeader(token, env),
          },
        }
      );
    }

    if (source === 'seen') {
      await addContactToSegment(RESEND_API_KEY, email, SANCTUARY_SEGMENT_ID);
      return new Response(
        JSON.stringify({ status: 'subscribed', email, series: 'seen' }),
        { status: 200, headers: CORS }
      );
    }

    await addContactToSegment(RESEND_API_KEY, email, SANCTUARY_SEGMENT_ID);

    await resendFetch(RESEND_API_KEY, '/emails', {
      method: 'POST',
      body: JSON.stringify({
        from: 'Elle Vida <Elle_Vida@sparklebox.blog>',
        reply_to: 'Elle_Vida@sparklebox.blog',
        to: email,
        subject: 'Welcome to the Sparklebox Sanctuary',
        html: sanctuaryWelcomeHtml(),
      }),
    });

    return new Response(JSON.stringify({ status: 'subscribed', email, series: 'sanctuary' }), {
      status: 200,
      headers: CORS,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: CORS,
    });
  }
}
