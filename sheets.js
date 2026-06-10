// api/intercom.js — Vercel Serverless Function
// Proxies Intercom Conversations Search API to avoid CORS + protect token

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.INTERCOM_TOKEN;
  if (!token) return res.status(500).json({ error: 'INTERCOM_TOKEN not set in environment variables' });

  const { source_type, created_at_gte, per_page = 150 } = req.body || {};

  const queryValues = [
    { field: 'created_at', operator: '>=', value: Number(created_at_gte) }
  ];
  if (source_type) {
    queryValues.push({ field: 'source.type', operator: '=', value: source_type });
  }

  try {
    const response = await fetch('https://api.intercom.io/conversations/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Intercom-Version': '2.11'
      },
      body: JSON.stringify({
        query: { operator: 'AND', value: queryValues },
        pagination: { per_page }
      })
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
