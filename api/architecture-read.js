export const config = {
  runtime: 'edge',
};

import { verifyAccessToken, COOKIE_NAME } from '../lib/architecture-auth.js';
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
  const key = (url.searchParams.get('key') || '').trim();
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
    VERCEL: process.env.VERCEL,
  };

  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  const token = match ? decodeURIComponent(match[1]) : '';
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
