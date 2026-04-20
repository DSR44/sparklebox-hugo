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
    const { observation_id } = req.query;
    if (!observation_id) return res.status(400).json({ error: 'observation_id required' });

    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .eq('observation_id', observation_id)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ responses: data });
  }

  if (req.method === 'POST') {
    const { observation_id, display_name, body } = req.body;

    if (!observation_id || !body || body.trim().length === 0) {
      return res.status(400).json({ error: 'observation_id and body required' });
    }
    if (body.length > 1000) {
      return res.status(400).json({ error: 'Response too long (1000 char max)' });
    }

    const name = (display_name && display_name.trim()) || 'Anonymous Observer';

    const { data, error } = await supabase
      .from('responses')
      .insert({ observation_id, display_name: name, body: body.trim() })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
