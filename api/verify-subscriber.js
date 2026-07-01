export const config = {
  runtime: 'edge',
};

import {
  createAccessToken,
  accessCookieHeader,
  sanitizeNextPath,
  isArchitectureSubscriber,
} from '../lib/architecture-auth.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

function unlockErrorUrl(next, code) {
  const url = new URL('https://www.sparklebox.blog/the-architecture/unlock/');
  url.searchParams.set('next', next);
  if (code) url.searchParams.set('error', code);
  return url.toString();
}

async function parseRequest(req) {
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const body = await req.json();
    return {
      email: body.email,
      next: body.next,
      wantsRedirect: false,
    };
  }

  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const form = await req.formData();
    return {
      email: form.get('email'),
      next: form.get('next'),
      wantsRedirect: true,
    };
  }

  return { email: null, next: null, wantsRedirect: false };
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
    const { email, next: rawNext, wantsRedirect } = await parseRequest(req);
    const normalized = (email || '').trim().toLowerCase();
    const next = sanitizeNextPath(rawNext);

    if (!normalized || !normalized.includes('@')) {
      if (wantsRedirect) {
        return Response.redirect(unlockErrorUrl(next, 'invalid'), 302);
      }
      return new Response(JSON.stringify({ error: 'Invalid email' }), {
        status: 400,
        headers: CORS,
      });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      if (wantsRedirect) {
        return Response.redirect(unlockErrorUrl(next, 'config'), 302);
      }
      return new Response(JSON.stringify({ error: 'Service not configured' }), {
        status: 500,
        headers: CORS,
      });
    }

    const env = {
      ARCHITECTURE_ACCESS_SECRET: process.env.ARCHITECTURE_ACCESS_SECRET,
      RESEND_API_KEY: apiKey,
      RESEND_ARCHITECTURE_SEGMENT_ID: process.env.RESEND_ARCHITECTURE_SEGMENT_ID,
      VERCEL: process.env.VERCEL,
    };

    const allowed = await isArchitectureSubscriber(apiKey, normalized, env);
    if (!allowed) {
      if (wantsRedirect) {
        return Response.redirect(unlockErrorUrl(next, 'not_subscribed'), 302);
      }
      return new Response(
        JSON.stringify({
          error: 'not_subscribed',
          message:
            'This email is not on The Layered Tree list. Subscribe on the landing page first.',
        }),
        { status: 403, headers: CORS }
      );
    }

    const token = await createAccessToken(normalized, env);
    const cookie = accessCookieHeader(token, env);

    if (wantsRedirect) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `https://www.sparklebox.blog${next}`,
          'Set-Cookie': cookie,
          'Cache-Control': 'no-store',
        },
      });
    }

    return new Response(
      JSON.stringify({ status: 'verified', email: normalized }),
      {
        status: 200,
        headers: {
          ...CORS,
          'Set-Cookie': cookie,
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
