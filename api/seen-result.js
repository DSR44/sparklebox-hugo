export const config = {
  runtime: 'edge',
};

import {
  buildParagraphLocal,
  generateParagraphWithLLM,
  perceptionMirrorEmailHtml,
  pickCta,
} from '../lib/seen-generate.js';

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
    const answers = body.answers || {};
    const archetype = body.archetype || {};
    const preview = Boolean(body.preview);
    const email = (body.email || '').trim().toLowerCase();

    if (!archetype.id || !archetype.name) {
      return new Response(JSON.stringify({ error: 'Missing archetype' }), {
        status: 400,
        headers: CORS,
      });
    }

    const env = {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      OPENAI_MODEL: process.env.OPENAI_MODEL,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
    };

    let paragraph = await generateParagraphWithLLM(archetype, answers, env);
    if (!paragraph) {
      paragraph = buildParagraphLocal(archetype, answers);
    }

    const cta = pickCta(archetype.id);

    if (preview) {
      return new Response(JSON.stringify({ paragraph, cta }), {
        status: 200,
        headers: CORS,
      });
    }

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), {
        status: 400,
        headers: CORS,
      });
    }

    if (env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Elle Vida <Elle_Vida@sparklebox.blog>',
          reply_to: 'Elle_Vida@sparklebox.blog',
          to: email,
          subject: `Your Perception Mirror · ${archetype.name}`,
          html: perceptionMirrorEmailHtml(archetype, paragraph, cta),
        }),
      });
    }

    return new Response(
      JSON.stringify({ ok: true, paragraph, cta, archetype: archetype.name }),
      { status: 200, headers: CORS }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: CORS,
    });
  }
}
