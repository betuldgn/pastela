module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
    // 1. DÜZELTME: URL'ye "hf-inference" sağlayıcısını ekledik
    const response = await fetch(
      'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
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
      // 2. DÜZELTME: Hatanın üstünü örtmek yerine, doğrudan HF'nin mesajını yazdıralım
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: `HF Hatası (${response.status}): ${errorText.substring(0, 200)}` 
      });
    }

    const imageBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'image/jpeg');
    res.status(200).send(Buffer.from(imageBuffer));

  } catch (err) {
    res.status(500).json({ error: `Sunucu Hatası: ${err.message}` });
  }
};
