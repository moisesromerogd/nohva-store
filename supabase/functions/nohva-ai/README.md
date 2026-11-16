# Nohva AI Edge Function

This function is the authenticated gateway for the Nohva Platform AI providers.

## Secrets required

Set these in Supabase Dashboard → Edge Functions → Secrets:

- `OPENAI_API_KEY`
- `GEMINI_API_KEY`

Do not commit provider keys to GitHub or place them in browser storage.

The Supabase runtime supplies `SUPABASE_URL` and `SUPABASE_ANON_KEY`. The function validates the caller's Supabase access token and checks that their `platform_profiles` row is active.

## Deploy

From the repository root, with the Supabase CLI linked to the Nohva project:

```bash
supabase functions deploy nohva-ai
```

Keep JWT verification enabled for this function. Do not deploy with `--no-verify-jwt`.

## Current scope

- `action: ping`: returns whether OpenAI/Gemini secrets exist, without revealing values.
- `action: chat, mode: design`: sends text and image prompts to OpenAI (GPT-4.1 mini) or Gemini (Gemini 2.5 Flash).
- Grok and Claude return a clear not-available response until their secrets and adapters are configured.
- The business-data assistant is intentionally gated while its tools still read browser localStorage. It must not be enabled for employees until inventory, sales, finance, and client tools are moved behind permission-enforced server-side queries.

## Request contract

Send a POST with the caller's Supabase access token:

```json
{
  "action": "chat",
  "mode": "design",
  "provider": "openai",
  "system": "You are Nohva Store's art director.",
  "messages": [{ "role": "user", "content": "Create a product post..." }]
}
```

The response is normalized to the content shape expected by the legacy Nohva v12 design module.
