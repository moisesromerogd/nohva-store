// Nohva Platform AI gateway
// Secrets are stored only in Supabase Edge Function secrets.
// This first release enables authenticated text/image design requests.
// Business-data assistant tools remain gated until their data source is migrated
// from browser localStorage to permission-enforced Supabase queries.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function getProviderStatus() {
  return {
    openai: Boolean(Deno.env.get("OPENAI_API_KEY")),
    gemini: Boolean(Deno.env.get("GEMINI_API_KEY")),
    grok: Boolean(Deno.env.get("XAI_API_KEY")),
    claude: Boolean(Deno.env.get("ANTHROPIC_API_KEY")),
  };
}

function toOpenAIMessages(system: string, messages: any[]) {
  const out: any[] = [{ role: "system", content: system || "Eres el asistente de Nohva Store." }];
  for (const message of messages || []) {
    if (message.role !== "user" && message.role !== "assistant") continue;
    if (typeof message.content === "string") {
      out.push({ role: message.role, content: message.content });
      continue;
    }
    const parts: any[] = [];
    for (const block of message.content || []) {
      if (block.type === "text") parts.push({ type: "text", text: String(block.text || "") });
      if (block.type === "image" && block.source?.type === "base64") {
        parts.push({
          type: "image_url",
          image_url: { url: `data:${block.source.media_type || "image/jpeg"};base64,${block.source.data}` },
        });
      }
    }
    out.push({ role: message.role, content: parts.length ? parts : "" });
  }
  return out;
}

function toGeminiContents(messages: any[]) {
  return (messages || []).filter((m: any) => m.role === "user" || m.role === "assistant").map((m: any) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: typeof m.content === "string"
      ? [{ text: m.content }]
      : (m.content || []).flatMap((b: any) => {
        if (b.type === "text") return [{ text: String(b.text || "") }];
        if (b.type === "image" && b.source?.type === "base64") {
          return [{ inlineData: { mimeType: b.source.media_type || "image/jpeg", data: b.source.data } }];
        }
        return [];
      }),
  }));
}

async function callOpenAI(system: string, messages: any[]) {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("OpenAI todavía no está configurado en Supabase.");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: toOpenAIMessages(system, messages),
      temperature: 0.7,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `OpenAI respondió con estado ${response.status}.`);
  }
  const text = data?.choices?.[0]?.message?.content || "";
  return { content: [{ type: "text", text }], stop_reason: "end_turn", provider: "openai" };
}

async function callGemini(system: string, messages: any[]) {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("Gemini todavía no está configurado en Supabase.");

  const models = [
    { name: "gemini-3.8-flash", attempts: 2 },
    { name: "gemini-3.5-flash-lite", attempts: 2 },
  ];
  let lastError = "Gemini no pudo completar la solicitud."; 

  for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
    const model = models[modelIndex];
    for (let attempt = 1; attempt <= model.attempts; attempt++) {
      let response: Response;
      try {
        response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/" + model.name + ":generateContent",
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": key },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: system || "Eres el asistente de Nohva Store." }] },
              contents: toGeminiContents(messages),
              generationConfig: { temperature: 0.7 },
            }),
          },
        );
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Error de conexión con Gemini."; 
        if (attempt < model.attempts) {
          const delay = 1000 * (2 ** (attempt - 1)) + Math.floor(Math.random() * 500);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        if (modelIndex === 0) break;
        throw new Error("No se pudo conectar con Gemini ni con el modelo alternativo: " + lastError);
      }

      const raw = await response.text();
      let data: any = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch { data = {}; }

      if (response.ok) {
        const text = (data?.candidates?.[0]?.content?.parts || [])
          .filter((p: any) => typeof p.text === "string")
          .map((p: any) => p.text)
          .join("\n");
        if (!text) throw new Error("Gemini respondió, pero no devolvió texto. Intenta con otra instrucción.");
        return { content: [{ type: "text", text }], stop_reason: "end_turn", provider: "gemini", model: model.name };
      }

      lastError = data?.error?.message || ("Gemini respondió con estado " + response.status + ".");
      const transient = response.status === 408 || response.status === 429 || response.status >= 500;
      // Only a 503 capacity outage triggers a different model.
      // Authentication, billing, permission and malformed-request errors are never masked.
      if (response.status === 503 && modelIndex === 0 && attempt === model.attempts) break;
      if (!transient || attempt === model.attempts) {
        if (response.status === 503 && modelIndex === 1) {
          throw new Error("Gemini principal y modelo alternativo están temporalmente saturados. Intenta de nuevo en unos minutos.");
        }
        if (response.status === 429) {
          throw new Error("Gemini alcanzó un límite de uso (429). Revisa los límites y la facturación de tu proyecto de Google AI Studio.");
        }
        throw new Error(lastError);
      }

      const retryAfter = Number(response.headers.get("Retry-After"));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 15000)
        : 1000 * (2 ** (attempt - 1)) + Math.floor(Math.random() * 500);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Gemini no pudo responder: " + lastError);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);

  try {
    const authorization = req.headers.get("Authorization") || "";
    if (!authorization.startsWith("Bearer ")) {
      return json({ error: "Debes iniciar sesión para utilizar la IA." }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !anonKey) {
      return json({ error: "Falta la configuración interna de Supabase." }, 500);
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return json({ error: "La sesión no es válida. Inicia sesión nuevamente." }, 401);
    }

    const { data: profile, error: profileError } = await supabase
      .from("platform_profiles")
      .select("role, active")
      .eq("user_id", userData.user.id)
      .single();
    if (profileError || !profile?.active) {
      return json({ error: "Tu usuario no tiene acceso a Nohva Platform." }, 403);
    }

    const payload = await req.json();
    if (payload.action === "ping") {
      return json({ providers: getProviderStatus(), authenticated: true });
    }
    if (payload.action !== "chat") return json({ error: "Acción no reconocida." }, 400);

    const provider = String(payload.provider || "gemini").toLowerCase();
    const statuses = getProviderStatus();
    if (provider !== "openai" && provider !== "gemini") {
      return json({
        error: provider === "grok" || provider === "claude"
          ? "Este proveedor todavía no está disponible. Estamos preparando su integración."
          : "Proveedor no reconocido.",
      }, 409);
    }
    if (!statuses[provider as "openai" | "gemini"]) {
      return json({ error: `${provider === "openai" ? "OpenAI" : "Gemini"} todavía no está configurado en Supabase.` }, 503);
    }

    // Until the assistant's business tools are migrated to secure server-side
    // queries, do not expose localStorage-backed inventory/financial data.
    if (payload.mode === "assistant" && Array.isArray(payload.tools) && payload.tools.length) {
      return json({
        error: "El asistente conversacional estará disponible en la siguiente fase, cuando conectemos sus herramientas a los datos protegidos de Supabase.",
      }, 409);
    }

    const system = String(payload.system || "");
    const messages = Array.isArray(payload.messages) ? payload.messages : [];
    const result = provider === "openai"
      ? await callOpenAI(system, messages)
      : await callGemini(system, messages);
    return json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno al procesar la solicitud.";
    return json({ error: message }, 500);
  }
});
