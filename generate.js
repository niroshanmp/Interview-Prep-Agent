// Serverless function (Vercel Node runtime). Keeps the Anthropic API key
// server-side — it is never sent to the browser. Configure it as an
// environment variable named ANTHROPIC_API_KEY in your hosting provider.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY. Set it in your hosting provider\'s environment variables.' });
    return;
  }

  const { system, prompt, maxTokens } = req.body || {};
  if (!system || !prompt) {
    res.status(400).json({ error: 'Request must include both "system" and "prompt".' });
    return;
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: Math.min(Number(maxTokens) || 1000, 2000),
        system,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      const message = (data && data.error && data.error.message) || 'Upstream API error';
      res.status(upstream.status).json({ error: message });
      return;
    }

    const text = (data.content || [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    res.status(200).json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Unexpected server error' });
  }
};
