const SYSTEM_PROMPT = `You are an onboarding assistant for a B2B trade platform. Businesses use this
platform to decide whether to trade with a new partner on credit. Given messy,
unstructured information about a business, produce a clean, structured trust
profile to help a human reviewer make a faster decision.

IMPORTANT: You do NOT make credit decisions, assign credit scores, or approve/
reject anyone. You organize the information provided and flag what a human should
review. Never invent facts not present in the input. If something important is
missing, list it under "Items to Review" rather than guessing.

Return a JSON object (no markdown, no preamble) with this shape:
{
  "businessIdentity": {
    "name": "...",
    "industry": "...",
    "yearsOperating": "...",
    "type": "..."
  },
  "trustSignals": ["positive indicator 1", "positive indicator 2", ...],
  "itemsToReview": ["gap or inconsistency 1", "missing info 2", ...],
  "suggestedNextSteps": ["what to verify 1", "what to verify 2", ...],
  "summary": "2-3 sentence plain-language overview for the reviewer"
}

Be specific and only use what's in the input. If the input is thin, it's correct
and expected to have more items under itemsToReview.`;

const GATEWAY_URL = "https://api-gateway.merge.dev/v1/responses";
const MODEL = "anthropic/claude-sonnet-4-6";

// The gateway follows the OpenAI Responses API shape, but be defensive about
// exactly where the text lands (and whether stream:false is honored).
function extractText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text;
  }
  if (Array.isArray(data.output)) {
    const parts = [];
    for (const item of data.output) {
      if (typeof item.content === "string") {
        parts.push(item.content);
      } else if (Array.isArray(item.content)) {
        for (const c of item.content) {
          if (typeof c.text === "string") parts.push(c.text);
        }
      }
    }
    if (parts.length) return parts.join("");
  }
  const choice = data.choices?.[0];
  if (choice) {
    const content = choice.message?.content ?? choice.text;
    if (typeof content === "string") return content;
  }
  return null;
}

// If the gateway streams anyway, reassemble the text from SSE events.
function extractTextFromSSE(raw) {
  const parts = [];
  let completed = null;
  for (const line of raw.split("\n")) {
    if (!line.startsWith("data:")) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    let event;
    try {
      event = JSON.parse(payload);
    } catch {
      continue;
    }
    if (typeof event.delta === "string") parts.push(event.delta);
    else if (typeof event.text === "string" && event.type?.includes("delta")) parts.push(event.text);
    if (event.type === "response.completed" && event.response) completed = event.response;
    if (event.response && !completed && event.type?.includes("completed")) completed = event.response;
  }
  if (parts.length) return parts.join("");
  if (completed) return extractText(completed);
  return null;
}

function parseProfile(text) {
  // Strip markdown fences and any preamble/trailing prose around the JSON.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

const asArray = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()) : []);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const input = req.body?.input;
  if (typeof input !== "string" || !input.trim()) {
    return res.status(400).json({ error: "Paste some onboarding notes first." });
  }
  if (input.length > 20000) {
    return res.status(400).json({ error: "Notes are too long — keep them under 20,000 characters." });
  }

  const apiKey = process.env.MERGE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "The server is missing its gateway API key." });
  }

  let gatewayRes;
  try {
    gatewayRes = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        input: [
          { type: "message", role: "system", content: SYSTEM_PROMPT },
          { type: "message", role: "user", content: input },
        ],
      }),
    });
  } catch {
    return res.status(502).json({ error: "Couldn't reach the model gateway. Try again in a moment." });
  }

  const raw = await gatewayRes.text();
  if (!gatewayRes.ok) {
    console.error("Gateway error", gatewayRes.status, raw.slice(0, 500));
    return res.status(502).json({ error: "The model gateway returned an error. Try again in a moment." });
  }

  let text;
  if (raw.trimStart().startsWith("{")) {
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }
    text = data ? extractText(data) : null;
  } else {
    text = extractTextFromSSE(raw);
  }

  const profile = text ? parseProfile(text) : null;
  if (!profile) {
    console.error("Unparseable model output", raw.slice(0, 500));
    return res.status(502).json({ error: "The model returned something unexpected. Try again." });
  }

  const identity = profile.businessIdentity ?? {};
  return res.status(200).json({
    businessIdentity: {
      name: identity.name ?? "Not provided",
      industry: identity.industry ?? "Not provided",
      yearsOperating: identity.yearsOperating ?? "Not provided",
      type: identity.type ?? "Not provided",
    },
    trustSignals: asArray(profile.trustSignals),
    itemsToReview: asArray(profile.itemsToReview),
    suggestedNextSteps: asArray(profile.suggestedNextSteps),
    summary: typeof profile.summary === "string" ? profile.summary : "",
  });
}
