export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt required' });
  }

  const HF_TOKEN = process.env.HF_TOKEN;
  if (!HF_TOKEN) {
    return res.status(500).json({ error: 'API token not configured' });
  }

  try {
    const response = await fetch(
      'https://router.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            width: 700,
            height: 700,
            num_inference_steps: 28,
            guidance_scale: 3.5,
          },
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      if (response.status === 503)
        return res.status(503).json({ error: 'Model loading, please wait 20-30 seconds and try again.' });
      if (response.status === 401)
        return res.status(401).json({ error: 'Invalid token.' });
      if (response.status === 429)
        return res.status(429).json({ error: 'Rate limit exceeded. Please wait a few minutes.' });
      return res.status(response.status).json({ error: errData.error || 'API error' });
    }

    const imageBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(Buffer.from(imageBuffer));

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
