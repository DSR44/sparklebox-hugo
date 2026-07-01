export const config = {
  runtime: 'edge',
};

import { verifyAccessToken, COOKIE_NAME } from '../lib/architecture-auth.js';

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
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
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

  return new Response(
    JSON.stringify({ ok: Boolean(email), email: email || null }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    }
  );
}
