export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { meal } = req.body;

    if (!meal) {
        return res.status(400).json({ error: "Geen maaltijd opgegeven." });
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "openrouter/free",
                messages: [
                    {
                        role: "user",
                        content: `
Geef een duidelijk, realistisch en correct recept voor: ${meal}.

Gebruik dit formaat:
- Titel
- Ingrediënten (met hoeveelheden)
- Stappen (genummerd)

Gebruik correct Nederlands.
Geen vreemde woorden of onzin.
`
                    }
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(500).json({
                error: data?.error?.message || "OpenRouter fout"
            });
        }

        const recipe = data?.choices?.[0]?.message?.content;

        res.status(200).json({ recipe });

    } catch (err) {
        res.status(500).json({ error: "Serverfout" });
    }
}