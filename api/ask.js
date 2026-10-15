// api/ask.js - Vercel serverless function. Env: OPENROUTER_API_KEY (required), OPENROUTER_MODEL (optional)
const SYSTEM = `You are Margin, a patient teaching assistant.
- Answer from the document excerpts provided. If the answer is not in them, say so plainly instead of guessing.
- Reply in the language the user wrote in.
- Use Markdown. Keep chat answers short and concrete, and mention page numbers from the excerpt headers when useful.
- When a request asks for a specific format (for example raw JSON), follow it exactly and add nothing else.`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { prompt, history } = req.body || {};
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
        messages: [{ role: "system", content: SYSTEM }, ...past, { role: "user", content: prompt }]
      })
    });
    const data = await r.json().catch(() => ({}));
    const reply = data?.choices?.[0]?.message?.content;
    if (!r.ok || !reply) return res.status(502).json({ error: data?.error?.message || "The AI service did not return an answer." });
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Backend error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
