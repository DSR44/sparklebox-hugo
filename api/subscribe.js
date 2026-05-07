export const config = {
  runtime: 'edge',
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
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const { email } = await req.json();
    
    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

    // Add contact to audience
    const contactRes = await fetch('https://api.resend.com/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        audience_id: AUDIENCE_ID,
        unsubscribed: false,
      }),
    });

    const contactData = await contactRes.json();

    // Send welcome email
    const welcomeRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Elle Vida <Elle_Vida@sparklebox.blog>',
        reply_to: 'Elle_Vida@sparklebox.blog',
        to: email,
        subject: 'Welcome to the Sparklebox Sanctuary',
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0118; color: #f1f5f9;">
    <div style="padding: 40px 20px; text-align: center; border-bottom: 2px solid #8b5cf6;">
        <h1 style="color: #f1f5f9; font-size: 24px; margin: 0; letter-spacing: 3px;">SPARKLEBOX</h1>
        <p style="color: #8b5cf6; font-size: 12px; margin: 10px 0 0 0; letter-spacing: 1px;">by Elle Vida</p>
    </div>
    <div style="padding: 32px 24px;">
        <p style="font-size: 18px; color: #f1f5f9; margin-bottom: 16px;">Hey,</p>
        <p style="font-size: 16px; line-height: 1.7; color: #94a3b8; margin-bottom: 16px;">Welcome to Sparklebox. I am glad you are here.</p>
        <p style="font-size: 16px; line-height: 1.7; color: #94a3b8; margin-bottom: 16px;">This is a space where perception becomes creation. Where the way you see shapes what you experience. I share what I have learned about tuning into the rhythms of nature, finding stillness in the noise, and trusting the cycles that carry us.</p>
        <p style="font-size: 16px; line-height: 1.7; color: #94a3b8; margin-bottom: 16px;">No rush. No noise. Just a gentle reminder that reality is not fixed. It begins with you.</p>
        <p style="font-size: 16px; line-height: 1.7; color: #94a3b8; margin-bottom: 16px;">You will hear from me when there is something worth sharing.</p>
        <p style="font-size: 16px; color: #ec4899; font-weight: 600;">Elle Vida</p>
    </div>
    <div style="background: #1a0a2e; padding: 20px 24px; text-align: center;">
        <p style="font-size: 12px; color: #64748b; margin: 0;"><a href="https://sparklebox.blog" style="color: #8b5cf6; text-decoration: none;">sparklebox.blog</a> | Reply to unsubscribe</p>
    </div>
</div>`,
      }),
    });

    return new Response(JSON.stringify({ status: 'subscribed', email }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
