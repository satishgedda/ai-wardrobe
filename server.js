// ═══════════════════════════════════════════════
//   WARDAI — SERVER.JS
//   All routes + controllers in one file
// ═══════════════════════════════════════════════

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));


// ─────────────────────────────────────────
//   IN-MEMORY WARDROBE STORE
// ─────────────────────────────────────────
let wardrobe = [];

// POST /api/wardrobe
app.post("/api/wardrobe", (req, res) => {
  const item = {
    id:           Date.now(),
    type:         req.body.type,
    originalType: req.body.originalType || req.body.type,
    color:        req.body.color,
    image:        req.body.image,
    occasion:     req.body.occasion
  };
  wardrobe.push(item);
  res.json({ message: "Item added", item });
});

// GET /api/wardrobe
app.get("/api/wardrobe", (req, res) => {
  res.json(wardrobe);
});

// DELETE /api/wardrobe/:id
app.delete("/api/wardrobe/:id", (req, res) => {
  const id = parseInt(req.params.id);
  wardrobe  = wardrobe.filter(item => item.id !== id);
  res.json({ message: "Item deleted" });
});


// ─────────────────────────────────────────
//   WEATHER CLASSIFICATION (server-side)
// ─────────────────────────────────────────

// Keywords that identify warm/heavy clothing — should be EXCLUDED in hot weather
const WARM_KEYWORDS = [
  "jacket", "blazer", "coat", "hoodie", "sweater", "sweatshirt",
  "cardigan", "pullover", "fleece", "windbreaker", "puffer", "overcoat",
  "trench", "leather jacket", "denim jacket", "bomber", "thermal",
  "turtleneck", "wool", "knit", "jumper", "anorak", "vest"
];

// Keywords that identify light/summer clothing — PREFERRED in hot weather
const LIGHT_KEYWORDS = [
  "tshirt", "t-shirt", "tank", "polo", "linen", "cotton", "shorts",
  "sleeveless", "crop", "summer", "light", "breathable", "thin",
  "shirt", "casual"
];

function classifyWeather(temp) {
  if (temp >= 30) return "VERY_HOT";       // 30°C+ → summer, light only
  if (temp >= 22) return "WARM";           // 22-29°C → warm, no heavy jackets
  if (temp >= 15) return "MODERATE";       // 15-21°C → moderate, light layers OK
  if (temp >= 8)  return "COOL";           // 8-14°C → cool, jackets welcome
  return "COLD";                           // <8°C → cold, heavy layers
}

function isWarmClothing(name) {
  const lower = name.toLowerCase();
  return WARM_KEYWORDS.some(k => lower.includes(k));
}

function isLightClothing(name) {
  const lower = name.toLowerCase();
  return LIGHT_KEYWORDS.some(k => lower.includes(k));
}

// Pre-filter wardrobe tops before sending to AI based on weather
function filterTopsByWeather(tops, weatherClass) {
  if (weatherClass === "VERY_HOT" || weatherClass === "WARM") {
    // Remove jackets/heavy tops — only keep light ones
    const lightTops = tops.filter(t => !isWarmClothing(t.name));
    // Only fall back to all tops if literally nothing light exists
    return lightTops.length > 0 ? lightTops : tops;
  }
  if (weatherClass === "COLD") {
    // Prefer warm clothing, but don't exclude light ones (user may layer)
    return tops;
  }
  return tops; // moderate/cool — send all
}


// ─────────────────────────────────────────
//   AI OUTFIT SUGGESTION
// ─────────────────────────────────────────

app.post("/api/ai/suggest", async (req, res) => {
  const { weather, wardrobe: wb, exclusionNote = "", profileNote = "" } = req.body;

  const weatherClass = classifyWeather(weather);
  const randomSeed   = `Seed: ${Math.random().toString(36).slice(2, 8)}`;

  // ── PRE-FILTER tops by weather BEFORE sending to AI ──
  const filteredTops = filterTopsByWeather(wb.tops || [], weatherClass);

  // Build the filtered wardrobe to send
  const filteredWardrobe = {
    tops:    filteredTops,
    bottoms: wb.bottoms || [],
    shoes:   wb.shoes   || []
  };

  // ── Build weather instruction string (very explicit) ──
  let weatherInstruction = "";
  if (weatherClass === "VERY_HOT") {
    weatherInstruction = `
WEATHER: ${weather}°C — THIS IS VERY HOT SUMMER WEATHER.
MANDATORY RULES FOR THIS TEMPERATURE:
✗ ABSOLUTELY DO NOT suggest: jackets, blazers, coats, hoodies, sweaters, cardigans, pullovers, fleece, windbreakers, puffer jackets, leather jackets, denim jackets, bombers, thermal wear, turtlenecks, or ANY heavy/warm clothing.
✓ You MUST only suggest: t-shirts, shirts, tank tops, polo shirts, linen tops, cotton tops, or any light breathable fabric.
✓ For bottoms: prefer shorts, light trousers, or breathable pants. Avoid thick jeans if lighter options exist.
✓ For shoes: prefer open, light footwear like sandals, sneakers, or loafers. Avoid heavy boots.
If you suggest a jacket or heavy top at ${weather}°C, that is a CRITICAL ERROR.`;
  } else if (weatherClass === "WARM") {
    weatherInstruction = `
WEATHER: ${weather}°C — This is warm weather.
RULES:
✗ Do NOT suggest jackets, coats, heavy sweaters, or any thick outerwear.
✓ Prefer light shirts, t-shirts, polo tops, breathable fabrics.
✓ Shorts or light trousers preferred for bottoms.`;
  } else if (weatherClass === "MODERATE") {
    weatherInstruction = `
WEATHER: ${weather}°C — Moderate/comfortable temperature.
RULES:
✓ Light to medium weight clothing is ideal.
✓ A light shirt or casual top works well.
✗ Avoid heavy winter coats or thick puffer jackets.
✓ Jeans, chinos, or casual trousers are all fine.`;
  } else if (weatherClass === "COOL") {
    weatherInstruction = `
WEATHER: ${weather}°C — Cool weather. Light layers recommended.
RULES:
✓ A light jacket, hoodie, or cardigan is appropriate.
✓ Jeans, chinos, or full-length trousers preferred.
✗ No need for heavy winter coats unless it's below 8°C.`;
  } else {
    weatherInstruction = `
WEATHER: ${weather}°C — Cold weather.
RULES:
✓ Prefer warm clothing: jackets, coats, sweaters, hoodies.
✓ Full-length trousers or warm bottoms are important.
✓ Closed, sturdy footwear preferred.`;
  }

  const prompt = `
You are a strict fashion assistant. Follow all rules exactly.
${profileNote}
${exclusionNote}
${randomSeed}

${weatherInstruction}

Wardrobe available (already pre-filtered for weather appropriateness):
${JSON.stringify(filteredWardrobe, null, 2)}

----------------------------------------
SELECTION RULES:
- Pick EXACTLY 1 top, 1 bottom, 1 pair of shoes.
- Only pick from the IDs listed above.
- Do NOT invent new items.
- Do NOT return items not in the list.
- Pick a DIFFERENT combination from last time if exclusionNote is set.
----------------------------------------
SUMMARY RULES:
- Start with: "At ${weather}°C..."
- State the weather condition clearly (hot/warm/moderate/cool/cold).
- Explain why each chosen item suits the weather and occasion.
- Be friendly and natural. No ID numbers in summary.
----------------------------------------
OUTPUT FORMAT (STRICT — JSON only, no markdown, no explanation outside JSON):
{
  "topId": <number>,
  "bottomId": <number>,
  "shoesId": <number>,
  "summary": "<your explanation>"
}
`;

  try {
    console.log(`Sending outfit request to AI... [${weatherClass}, ${weather}°C]`);

    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3-8b-instruct",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.85
        })
      });

      const data = await response.json();
      if (!data?.choices?.length) continue;

      const text = data.choices[0].message.content;

      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found");
        const result = JSON.parse(jsonMatch[0]);

        if (
          typeof result.topId    === "number" &&
          typeof result.bottomId === "number" &&
          typeof result.shoesId  === "number"
        ) {
          // ── SERVER-SIDE SAFETY VALIDATION ──
          // 1. Ensure topId is actually in the filtered tops list
          const validTopIds    = filteredWardrobe.tops   .map(t => Number(t.id));
          const validBottomIds = filteredWardrobe.bottoms.map(t => Number(t.id));
          const validShoeIds   = filteredWardrobe.shoes  .map(t => Number(t.id));

          if (!validTopIds.includes(Number(result.topId))) {
            // AI returned an ID that was filtered out (e.g. a jacket) — use first valid top
            const fallbackTop = filteredWardrobe.tops[0];
            console.warn(`⚠️  AI returned topId ${result.topId} not in filtered list — overriding with "${fallbackTop.name}" (id:${fallbackTop.id})`);
            result.topId = fallbackTop.id;
          }
          if (!validBottomIds.includes(Number(result.bottomId))) {
            const fallbackBottom = filteredWardrobe.bottoms[0];
            console.warn(`⚠️  AI returned bottomId ${result.bottomId} not in list — overriding`);
            result.bottomId = fallbackBottom.id;
          }
          if (!validShoeIds.includes(Number(result.shoesId))) {
            const fallbackShoe = filteredWardrobe.shoes[0];
            console.warn(`⚠️  AI returned shoesId ${result.shoesId} not in list — overriding`);
            result.shoesId = fallbackShoe.id;
          }

          // 2. Extra hot-weather guard: even if ID was "valid", double-check the name
          if (weatherClass === "VERY_HOT" || weatherClass === "WARM") {
            const chosenTop = filteredWardrobe.tops.find(t => Number(t.id) === Number(result.topId));
            if (chosenTop && isWarmClothing(chosenTop.name)) {
              const lightTop = filteredWardrobe.tops.find(t => !isWarmClothing(t.name)) || filteredWardrobe.tops[0];
              console.warn(`⚠️  Chosen top "${chosenTop.name}" is warm clothing at ${weather}°C — swapping to "${lightTop.name}"`);
              result.topId = lightTop.id;
            }
          }

          return res.json(result);
        }
      } catch (err) {
        console.log(`Retrying AI... attempt ${attempt + 1}`);
      }
    }

    return res.status(500).json({ error: "AI failed after retries" });

  } catch (error) {
    console.error("AI suggestion error:", error);
    res.status(500).json({ error: "AI request failed" });
  }
});


// ─────────────────────────────────────────
//   FASHION CHATBOT
// ─────────────────────────────────────────

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  const systemPrompt = `You are StyleBot, a witty and knowledgeable AI fashion assistant for WardAI.
You ONLY answer questions about:
- Fashion, clothing, style, outfits, and current trends
- Wardrobe organization and management
- Dressing for occasions (casual, formal, party, sports, dates, weddings, etc.)
- Color coordination and outfit combinations
- Seasonal and weather-based clothing advice
- Clothing care, fabric types, and maintenance tips
- Shopping tips for clothes and accessories
- Personal style development and confidence building
- Mens, womens, and gender-neutral fashion

If the user asks ANYTHING outside these fashion/wardrobe topics, respond with exactly:
"I'm StyleBot, your fashion assistant! I can only help with clothing and style questions 👗 Try asking me something like: 'What should I wear to a job interview?' or 'How do I style wide-leg trousers?'"

Keep responses concise (2-4 sentences max), friendly, and practical. Use emojis occasionally for warmth.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-8b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        max_tokens: 350,
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (!data?.choices?.length) return res.status(500).json({ error: "No AI response" });

    return res.json({ reply: data.choices[0].message.content });

  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Chat failed" });
  }
});


// ─────────────────────────────────────────
//   SERVE FRONTEND
// ─────────────────────────────────────────
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


// ─────────────────────────────────────────
//   START
// ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✦ WardAI running → http://localhost:${PORT}`);
});