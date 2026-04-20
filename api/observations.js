import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://sparklebox.blog');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { slug, page = 0 } = req.query;
    if (!slug) return res.status(400).json({ error: 'slug required' });

    const limit = 20;
    const offset = parseInt(page) * limit;

    const { data, error, count } = await supabase
      .from('observations')
      .select('*', { count: 'exact' })
      .eq('post_slug', slug)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ observations: data, total: count });
  }

  if (req.method === 'POST') {
    const { slug, display_name, body } = req.body;

    if (!slug || !body || body.trim().length === 0) {
      return res.status(400).json({ error: 'slug and body required' });
    }
    if (body.length > 2000) {
      return res.status(400).json({ error: 'Observation too long (2000 char max)' });
    }

    const name = (display_name && display_name.trim()) || 'Anonymous Observer';

    const { data, error } = await supabase
      .from('observations')
      .insert({ post_slug: slug, display_name: name, body: body.trim() })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
