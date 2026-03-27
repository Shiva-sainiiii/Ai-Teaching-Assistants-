// File: api/ask.js

export default async function handler(req, res) {
  // Sirf POST requests allow karenge (Security ke liye)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    // Check agar frontend ne prompt bheja hai ya nahi
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const SYSTEM_PROMPT = `
    You are Duke AI, a professional document assistant.
    Rules:
    - Use the provided PDF context to answer questions.
    - If the answer isn't in the context, politely say you don't know.
    - Use Markdown for formatting (bold, lists, etc.).
    - Keep answers concise and helpful.
    `;

    // OpenRouter API call
    // Note: Hum yahan process.env use kar rahe hain jo Vercel se key uthayega
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-super-120b-a12b:free",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();
    
    // AI ka reply nikal kar frontend ko wapas bhej rahe hain
    const reply = data?.choices?.[0]?.message?.content || "AI response error.";
    
    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
