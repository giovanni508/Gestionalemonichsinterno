import Anthropic from "@anthropic-ai/sdk";

// Rate limiting state
let aiCallCount = 0;
let aiCallResetTime = Date.now();
const AI_RATE_LIMIT = 30; // max calls per minute
const AI_RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(): boolean {
  const now = Date.now();
  if (now - aiCallResetTime > AI_RATE_WINDOW) {
    aiCallCount = 0;
    aiCallResetTime = now;
  }
  if (aiCallCount >= AI_RATE_LIMIT) {
    return false;
  }
  aiCallCount++;
  return true;
}

// AI call logging
function logAICall(model: string, inputTokens: number, outputTokens: number) {
  // Estimated costs per 1M tokens (Claude Sonnet 4)
  const inputCostPer1M = 3.0;
  const outputCostPer1M = 15.0;
  const estimatedCost =
    (inputTokens / 1_000_000) * inputCostPer1M +
    (outputTokens / 1_000_000) * outputCostPer1M;

  console.log(
    `[AI Call] Model: ${model} | Input: ${inputTokens} tokens | Output: ${outputTokens} tokens | Est. cost: $${estimatedCost.toFixed(4)}`
  );
}

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 4096
): Promise<string> {
  if (!checkRateLimit()) {
    throw new Error("Limite chiamate AI raggiunto. Riprova tra qualche secondo.");
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY non configurata");
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock ? textBlock.text : "";

    logAICall(
      "claude-sonnet-4-20250514",
      response.usage.input_tokens,
      response.usage.output_tokens
    );

    return text;
  } catch (error: any) {
    console.error("[AI Error]", error.message);
    throw new Error(
      "Errore nella comunicazione con l'AI. Riprova più tardi."
    );
  }
}

export async function callClaudeChat(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  maxTokens: number = 4096
): Promise<string> {
  if (!checkRateLimit()) {
    throw new Error("Limite chiamate AI raggiunto. Riprova tra qualche secondo.");
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY non configurata");
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: messages,
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock ? textBlock.text : "";

    logAICall(
      "claude-sonnet-4-20250514",
      response.usage.input_tokens,
      response.usage.output_tokens
    );

    return text;
  } catch (error: any) {
    console.error("[AI Error]", error.message);
    throw new Error(
      "Errore nella comunicazione con l'AI. Riprova più tardi."
    );
  }
}

export async function transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY non configurata");
  }

  try {
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: "audio/webm" });
    formData.append("file", blob, filename);
    formData.append("model", "whisper-1");
    formData.append("language", "it");

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[Whisper] Transcription completed for ${filename}`);
    return data.text;
  } catch (error: any) {
    console.error("[Whisper Error]", error.message);
    throw new Error(
      "Errore nella trascrizione dell'audio. Riprova più tardi."
    );
  }
}
