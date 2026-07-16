export const config = {
  runtime: 'edge',
};

import { verifyAccessToken, parseCookieToken } from '../lib/architecture-auth.js';
import { ARCHITECTURE_PAGES } from '../lib/architecture-pages.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: CORS,
    });
  }

  const url = new URL(req.url);
  // Strip accidental surrounding quotes from minified/escaped page shells.
  let key = (url.searchParams.get('key') || '').trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }
  const html = ARCHITECTURE_PAGES[key];

  if (!html) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: CORS,
    });
  }

  const env = {
    ARCHITECTURE_ACCESS_SECRET: process.env.ARCHITECTURE_ACCESS_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_ARCHITECTURE_SEGMENT_ID: process.env.RESEND_ARCHITECTURE_SEGMENT_ID,
    VERCEL: process.env.VERCEL,
  };

  const token = parseCookieToken(req.headers.get('cookie') || '');
  const email = await verifyAccessToken(token, env);

  if (!email) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: CORS,
    });
  }

  return new Response(JSON.stringify({ ok: true, html }), {
    status: 200,
    headers: CORS,
  });
}
