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
<div style="font-family: 'Cormorant Garamond', Georgia, serif; max-width: 600px; margin: 0 auto; background: #0a0118;">
    <div style="background: linear-gradient(135deg, #1a0a2e 0%, #0f0520 100%); padding: 48px 24px; text-align: center; border-bottom: 2px solid rgba(192,132,252,0.3);">
        <h1 style="font-family: 'Cinzel', serif; font-size: 28px; margin: 0; letter-spacing: 3px; background: linear-gradient(135deg, #c084fc 0%, #ec4899 50%, #f9a8d4 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SPARKLEBOX</h1>
        <p style="color: rgba(196,181,253,0.7); font-size: 14px; margin: 12px 0 0 0; letter-spacing: 2px; font-style: italic;">perception is creation</p>
    </div>
    <div style="padding: 40px 24px;">
        <p style="font-size: 20px; color: #f1f5f9; margin-bottom: 20px; font-style: italic;">Welcome, beautiful soul.</p>
        <p style="font-size: 16px; line-height: 1.8; color: #94a3b8; margin-bottom: 16px;">Thank you for joining the Sparklebox Sanctuary. Here, we explore how perception shapes reality — one mindful moment at a time.</p>
        <p style="font-size: 16px; line-height: 1.8; color: #94a3b8; margin-bottom: 16px;">You will receive whispers of wonder when new content arrives. No noise. No algorithms. Just magic.</p>
        <p style="font-size: 16px; line-height: 1.8; color: #94a3b8; margin-bottom: 24px;">If you ever wish to leave the sanctuary, simply reply "unsubscribe" and the doors will gently close.</p>
        <p style="font-size: 18px; background: linear-gradient(135deg, #c084fc, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-style: italic;">With love and light,<br>Elle Vida</p>
    </div>
    <div style="background: rgba(15,5,30,0.8); padding: 24px; text-align: center; border-top: 1px solid rgba(192,132,252,0.15);">
        <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0;"><a href="https://sparklebox.blog" style="color: #c084fc; text-decoration: none;">sparklebox.blog</a> | Perception is Creation</p>
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
