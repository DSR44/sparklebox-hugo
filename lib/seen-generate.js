function truncate(str, max) {
  const s = (str || '').trim();
  if (!s) return '';
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trim() + '…';
}

function buildParagraphLocal(archetype, answers) {
  const q1bit = truncate(answers.q1, 90) || 'it has been a while';
  const q4bit = truncate(answers.q4, 110) || 'something is asking to be heard';
  const bridges = {
    'quiet-architect':
      'Your system has been drafting blueprints in silence — perception running ahead of what you show.',
    'signal-keeper':
      'You have been holding frequency for everyone else while your own signal went quiet.',
    'fracture-point':
      'The pressure you are carrying is not weakness — it is compressed light looking for an exit.',
    ghost: 'Feeling overlooked is data, not destiny — your perception is registering absence where attention should be.',
    'mirror-walker':
      'When identity is built through reflection, the self gets distorted — that is perception architecture, not personality.',
    anchor: 'Stability can become a cage when growth gets mistaken for chaos.',
    echo: 'The pattern repeating is not failure — it is your nervous system pointing at the verse you keep skipping.',
    'edge-walker':
      'You have been hovering at the threshold — the gap between almost and actually is where perception shifts.',
    spark: 'High voltage without direction reads as scattered — but it is raw creative frequency waiting for a channel.',
    witness:
      'Observation kept you safe — but witnessing from the outside has a cost the body eventually invoices.',
  };
  const bridge = bridges[archetype.id] || 'Your answers are showing you something precise about how you perceive.';
  return (
    `You said ${q1bit} — that's not a flaw, that's data. Your nervous system said: "${q4bit}." ${bridge} The layers go deeper than this.`
  );
}

async function generateParagraphWithLLM(archetype, answers, env) {
  const apiKey = env.OPENAI_API_KEY || env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const gap = Math.abs((answers.q2a || 5) - (answers.q2b || 5));
  const systemPrompt = `You are Elle Vida, the voice of Sparklebox — a consciousness architecture blog.
Tone: grounded, direct, warm but not soft. Contemporary language. A friend who sees clearly.
Do NOT use: "Based on your answers", "You are a...", therapist voice, LinkedIn voice, guru voice.
Speak TO the user, not AT them. 2-4 sentences only.`;

  const userPrompt = `A user completed the "Seen" perception experience.

Q1 (last time felt seen): ${answers.q1 || '(empty)'}
Q2 gap (what they appear vs what they are): ${gap}
Q3 (where they go for attention): ${answers.q3 || '(empty)'} ${answers.q3other || ''}
Q4 (nervous system speaking): ${answers.q4 || '(empty)'}
Q5 (what would change if seen by self): ${answers.q5 || '(empty)'}

Archetype: ${archetype.name}
One-liner: ${archetype.oneLiner}

Write a personalized paragraph that references Q1 specifically, acknowledges Q4, connects to perception/frequency/layers, and ends forward-looking. Plain text only.`;

  if (env.OPENAI_API_KEY) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 220,
        temperature: 0.75,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  }

  return null;
}

function perceptionMirrorEmailHtml(archetype, paragraph, cta) {
  const ctaUrl = cta.url.startsWith('http') ? cta.url : `https://www.sparklebox.blog${cta.url}`;
  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;margin:0 auto;background:#0a0118;color:#f1f5f9;">
  <div style="padding:36px 24px 20px;text-align:center;border-bottom:2px solid #8b5cf6;">
    <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8b5cf6;">SEEN</p>
    <h1 style="color:#f1f5f9;font-size:22px;margin:0;letter-spacing:1px;">Your Perception Mirror</h1>
    <p style="color:#ec4899;font-size:12px;margin:10px 0 0 0;letter-spacing:1px;">by Elle Vida · Sparklebox</p>
  </div>
  <div style="padding:32px 24px;">
    <p style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin:0 0 8px 0;">Archetype</p>
    <h2 style="font-size:22px;margin:0 0 16px 0;background:linear-gradient(135deg,#8b5cf6,#ec4899);-webkit-background-clip:text;color:#f1f5f9;">${archetype.name}</h2>
    <p style="font-size:17px;line-height:1.65;color:#f1f5f9;margin:0 0 20px 0;font-weight:500;">${archetype.oneLiner}</p>
    <p style="font-size:15px;line-height:1.75;color:#94a3b8;margin:0 0 24px 0;">${paragraph}</p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff;text-decoration:none;padding:14px 26px;border-radius:8px;font-weight:600;font-size:15px;">${cta.text} →</a>
    </p>
    <p style="font-size:14px;line-height:1.65;color:#64748b;margin:0;">Save this email. Your mirror is yours.</p>
    <p style="font-size:16px;color:#ec4899;font-weight:600;margin:20px 0 0;">Elle Vida</p>
  </div>
  <div style="background:#1a0a2e;padding:20px 24px;text-align:center;">
    <p style="font-size:12px;color:#64748b;margin:0;"><a href="https://www.sparklebox.blog/seen/" style="color:#8b5cf6;text-decoration:none;">SEEN</a> · <a href="https://www.sparklebox.blog" style="color:#8b5cf6;text-decoration:none;">sparklebox.blog</a></p>
  </div>
</div>`;
}

function pickCta(archetypeId) {
  if (['quiet-architect', 'witness', 'ghost', 'mirror-walker'].includes(archetypeId)) {
    return { text: 'This is Layer 1. There are six more.', url: '/the-architecture/' };
  }
  if (['fracture-point', 'edge-walker', 'echo', 'anchor'].includes(archetypeId)) {
    return {
      text: 'The Map shows you where you operate. The Reset shows you why you got stuck.',
      url: '/the-path/',
    };
  }
  return { text: 'This is Layer 1. There are six more.', url: '/the-architecture/' };
}

export {
  buildParagraphLocal,
  generateParagraphWithLLM,
  perceptionMirrorEmailHtml,
  pickCta,
};
