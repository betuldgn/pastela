module.exports = async function handler(req, res) {
  // 1. CORS Ayarları (Farklı kaynaklardan gelen istekleri kabul etmesi için)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Tarayıcının ön kontrol (preflight) isteğine olumlu yanıt ver
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Sadece POST isteklerini işle
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
    // 3. Hugging Face API'sine bağlan
    const response = await fetch(
      'https://router.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
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
      const errData = await response.json().catch(() => ({}));
      if (response.status === 503)
        return res.status(503).json({ error: 'Model uyanıyor, lütfen 20-30 saniye bekleyip tekrar deneyin.' });
      if (response.status === 401)
        return res.status(401).json({ error: 'Token hatası. Anahtar geçersiz.' });
      return res.status(response.status).json({ error: errData.error || 'API error' });
    }

    // 4. Görseli arayüze (frontend) gönder
    const imageBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'image/jpeg');
    res.status(200).send(Buffer.from(imageBuffer));

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
