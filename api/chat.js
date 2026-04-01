// api/chat.js  —  Vercel Serverless Function
// The Gemini API key lives ONLY here on the server.
// The browser never sees it — it calls /api/chat, not Google directly.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_KEY not set in Vercel environment variables." });
  }

  const { messages, system } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid request body." });
  }

  const MODEL = "gemini-2.5-flash";
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const upstream = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: messages,
          generationConfig: {
            temperature: 0.95,
            maxOutputTokens: 600,
            topP: 0.9,
            topK: 40,
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
          ],
        }),
      });

      if (upstream.status === 429 || upstream.status === 503) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }

      if (!upstream.ok) {
        const errData = await upstream.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `HTTP ${upstream.status}`);
      }

      const data = await upstream.json();
      const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Tch. Got nothing back. (╬ಠ益ಠ)";

      return res.status(200).json({ reply });

    } catch (err) {
      lastError = err;
      if (attempt < 2) await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
    }
  }

  return res.status(502).json({ error: lastError?.message || "Upstream error after retries" });
}
