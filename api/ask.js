// api/ask.js - Vercel serverless function. Env: OPENROUTER_API_KEY (required), OPENROUTER_MODEL (optional)
export const config = { maxDuration: 60 };

const SYSTEM = `You are Margin, a patient teaching assistant.
- Answer from the document excerpts provided. If the answer is not in them, say so plainly instead of guessing.
- Reply in the language the user wrote in.
- Use Markdown. Keep chat answers short and concrete, and mention page numbers from the excerpt headers when useful.
- When a request asks for a specific format (for example raw JSON), follow it exactly and add nothing else.`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { prompt, history, stream } = req.body || {};
  if (typeof prompt !== "string" || !prompt.trim()) return res.status(400).json({ error: "Prompt is required" });
  if (prompt.length > 30000) return res.status(413).json({ error: "That request is too large. Try a shorter document." });

  const past = (Array.isArray(history) ? history : []).slice(-8)
    .filter(m => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string")
    .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }));

  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free",
        stream: !!stream,
        messages: [{ role: "system", content: SYSTEM }, ...past, { role: "user", content: prompt }]
      })
    });

    // Streaming: relay OpenRouter's SSE as plain text chunks
    if (stream && r.ok && r.body) {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" });
      const dec = new TextDecoder(); let buf = "";
      for await (const chunk of r.body) {
        buf += dec.decode(chunk, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop();
        for (const l of lines) {
          if (!l.startsWith("data:")) continue;
          const p = l.slice(5).trim(); if (!p || p === "[DONE]") continue;
          try { const t = JSON.parse(p).choices?.[0]?.delta?.content; if (t) res.write(t); } catch {}
        }
      }
      return res.end();
    }

    const data = await r.json().catch(() => ({}));
    const reply = data?.choices?.[0]?.message?.content;
    if (!r.ok || !reply) return res.status(502).json({ error: data?.error?.message || "The AI service did not return an answer." });
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Backend error:", err);
    if (res.headersSent) return res.end();
    return res.status(500).json({ error: "Internal server error" });
  }
}
