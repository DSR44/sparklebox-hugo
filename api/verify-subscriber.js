export const config = {
  runtime: 'edge',
};

import {
  createAccessToken,
  accessCookieHeader,
} from '../lib/architecture-auth.js';

const ARCHITECTURE_SEGMENT_ID =
  process.env.RESEND_ARCHITECTURE_SEGMENT_ID ||
  '3a8cb3e9-805d-4344-b92e-1bfc12c80652';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

async function isArchitectureSubscriber(apiKey, email) {
  const res = await fetch(
    `https://api.resend.com/contacts/${encodeURIComponent(email)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!res.ok) {
    return false;
  }

  const contact = await res.json();
  if (contact.unsubscribed) {
    return false;
  }

  const segRes = await fetch(
    `https://api.resend.com/contacts/${encodeURIComponent(email)}/segments`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!segRes.ok) {
    return contact.audience_id === ARCHITECTURE_SEGMENT_ID;
  }

  const segData = await segRes.json();
  const segments = segData.data || [];
  return segments.some((s) => s.id === ARCHITECTURE_SEGMENT_ID);
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
    const { email } = await req.json();
    const normalized = (email || '').trim().toLowerCase();

    if (!normalized || !normalized.includes('@')) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), {
        status: 400,
        headers: CORS,
      });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Service not configured' }), {
        status: 500,
        headers: CORS,
      });
    }

    const allowed = await isArchitectureSubscriber(apiKey, normalized);
    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: 'not_subscribed',
          message: 'This email is not on The Layered Tree list. Subscribe on the landing page first.',
        }),
        { status: 403, headers: CORS }
      );
    }

    const env = {
      ARCHITECTURE_ACCESS_SECRET: process.env.ARCHITECTURE_ACCESS_SECRET,
      RESEND_API_KEY: apiKey,
      VERCEL: process.env.VERCEL,
    };
    const token = await createAccessToken(normalized, env);

    return new Response(
      JSON.stringify({ status: 'verified', email: normalized }),
      {
        status: 200,
        headers: {
          ...CORS,
          'Set-Cookie': accessCookieHeader(token, env),
        },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: CORS,
    });
  }
}
